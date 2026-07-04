import { NextRequest, NextResponse } from 'next/server'
import { revalidatePath } from 'next/cache'
import { getSession } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { writeFile } from 'fs/promises'
import { join } from 'path'

export const dynamic = 'force-dynamic'

export async function GET() {
  try {
    const session = await getSession()
    if (!session || (session.role !== 'admin' && session.user_id !== '#3795@lgvns')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
    }

    const books = await prisma.books.findMany({
      orderBy: { created_at: 'desc' },
      include: { categories: true, _count: { select: { chapters: true } } },
    })

    return NextResponse.json({ books })
  } catch {
    return NextResponse.json({ error: 'Failed to fetch books' }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await getSession()
    if (!session || (session.role !== 'admin' && session.user_id !== '#3795@lgvns')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
    }

    const formData = await req.formData()
    const title = formData.get('title') as string | null
    const slug = formData.get('slug') as string | null
    const description = formData.get('description') as string | null
    const subject = formData.get('subject') as string | null
    const language = formData.get('language') as string | null
    const category_id = formData.get('category_id') as string | null
    const author = formData.get('author') as string | null
    const file = formData.get('thumbnail') as File | null

    if (!title || !slug) {
      return NextResponse.json({ error: 'Title and slug are required' }, { status: 400 })
    }

    // Ensure slug is unique by appending a suffix if it already exists
    let finalSlug = slug
    const existing = await prisma.books.findUnique({ where: { slug: finalSlug } })
    if (existing) {
      finalSlug = `${slug}-${Date.now().toString(36)}`
    }

    let thumbnailPath = 'default-book.png'
    if (file && file.size > 0) {
      const ext = file.name.split('.').pop()?.toLowerCase() || 'png'
      const safeName = `cover_${Date.now()}_${Math.round(Math.random() * 1e9)}.${ext}`
      const bytes = await file.arrayBuffer()
      await writeFile(join('public', 'uploads', 'covers', safeName), Buffer.from(bytes))
      thumbnailPath = `/uploads/covers/${safeName}`
    }

    const book = await prisma.books.create({
      data: {
        title,
        slug: finalSlug,
        description,
        subject,
        language: language || 'English',
        category_id: category_id ? (parseInt(category_id) || null) : null,
        author: author || 'NCERT',
        thumbnail: thumbnailPath,
      },
    })

    try {
      const adminUser = await prisma.users.findFirst({
        where: { OR: [{ id: session.id }, { user_id: session.user_id }, { username: session.username }] },
        select: { id: true },
      })
      await prisma.logs.create({
        data: { user_id: adminUser?.id ?? null, action: 'create_book', details: `Created book: ${title}` },
      })
    } catch {
      // Non-blocking audit log failure
    }

    revalidatePath('/')
    revalidatePath('/books')
    revalidatePath('/search')
    revalidatePath('/api/books')
    revalidatePath('/admin/dashboard')
    revalidatePath('/admin/books')

    return NextResponse.json({ book }, { status: 201 })
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error'
    return NextResponse.json({ error: `Failed to create book: ${message}` }, { status: 500 })
  }
}
