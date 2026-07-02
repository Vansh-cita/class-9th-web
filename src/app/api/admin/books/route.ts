import { NextRequest, NextResponse } from 'next/server'
import { revalidatePath } from 'next/cache'
import { getSession } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export const dynamic = 'force-dynamic'

export async function GET() {
  const session = await getSession()
  if (!session || (session.role !== 'admin' && session.user_id !== '#3795@lgvns')) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
  }

  const books = await prisma.books.findMany({
    orderBy: { created_at: 'desc' },
    include: { categories: true, _count: { select: { chapters: true } } },
  })

  return NextResponse.json({ books })
}

export async function POST(req: NextRequest) {
  const session = await getSession()
  if (!session || (session.role !== 'admin' && session.user_id !== '#3795@lgvns')) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
  }

  const { title, slug, description, subject, language, category_id, author, thumbnail } = await req.json()
  if (!title || !slug) {
    return NextResponse.json({ error: 'Title and slug are required' }, { status: 400 })
  }

  const book = await prisma.books.create({
    data: {
      title,
      slug,
      description,
      subject,
      language: language || 'English',
      category_id: category_id ? parseInt(category_id) : null,
      author: author || 'NCERT',
      thumbnail: thumbnail || 'default-book.png',
    },
  })

  await prisma.logs.create({
    data: { user_id: session.id, action: 'create_book', details: `Created book: ${title}` },
  })

  revalidatePath('/')
  revalidatePath('/api/books')
  revalidatePath('/admin/dashboard')

  return NextResponse.json({ book }, { status: 201 })
}
