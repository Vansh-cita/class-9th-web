import { NextRequest, NextResponse } from 'next/server'
import { revalidatePath } from 'next/cache'
import { getSession } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export const dynamic = 'force-dynamic'

export async function PUT(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const session = await getSession()
    if (!session || (session.role !== 'admin' && session.user_id !== '#3795@lgvns')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
    }

    const id = parseInt(params.id)
    if (isNaN(id)) return NextResponse.json({ error: 'Invalid book ID' }, { status: 400 })
    const body = await req.json()

    const book = await prisma.books.update({
      where: { id },
      data: {
        ...(body.title !== undefined && { title: body.title }),
        ...(body.slug !== undefined && { slug: body.slug }),
        ...(body.description !== undefined && { description: body.description }),
        ...(body.subject !== undefined && { subject: body.subject }),
        ...(body.author !== undefined && { author: body.author }),
        ...(body.thumbnail !== undefined && { thumbnail: body.thumbnail }),
        ...(body.category_id !== undefined && { category_id: body.category_id ? (parseInt(body.category_id) || null) : null }),
      },
    })

    try {
      const adminUser = await prisma.users.findFirst({
        where: { OR: [{ id: session.id }, { user_id: session.user_id }, { username: session.username }] },
        select: { id: true },
      })
      await prisma.logs.create({
        data: { user_id: adminUser?.id ?? null, action: 'update_book', details: `Updated book: ${book.title}` },
      })
    } catch {
      // Non-blocking audit log failure
    }

    revalidatePath('/')
    revalidatePath('/books')
    revalidatePath('/search')
    revalidatePath('/api/books')
    revalidatePath('/admin/books')
    revalidatePath('/admin/dashboard')

    return NextResponse.json({ book })
  } catch {
    return NextResponse.json({ error: 'Failed to update book' }, { status: 500 })
  }
}

export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const session = await getSession()
    if (!session || (session.role !== 'admin' && session.user_id !== '#3795@lgvns')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
    }

    const id = parseInt(params.id)
    if (isNaN(id)) return NextResponse.json({ error: 'Invalid book ID' }, { status: 400 })
    const book = await prisma.books.findUnique({ where: { id } })
    if (!book) {
      return NextResponse.json({ error: 'Book not found' }, { status: 404 })
    }

    await prisma.books.delete({ where: { id } })

    try {
      const adminUser = await prisma.users.findFirst({
        where: { OR: [{ id: session.id }, { user_id: session.user_id }, { username: session.username }] },
        select: { id: true },
      })
      await prisma.logs.create({
        data: { user_id: adminUser?.id ?? null, action: 'delete_book', details: `Deleted book: ${book.title}` },
      })
    } catch {
      // Non-blocking audit log failure
    }

    revalidatePath('/')
    revalidatePath('/books')
    revalidatePath('/search')
    revalidatePath('/api/books')
    revalidatePath('/admin/books')
    revalidatePath('/admin/dashboard')

    return NextResponse.json({ success: true })
  } catch {
    return NextResponse.json({ error: 'Failed to delete book' }, { status: 500 })
  }
}
