import { NextRequest, NextResponse } from 'next/server'
import { revalidatePath } from 'next/cache'
import { getSession } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export const dynamic = 'force-dynamic'

export async function PUT(req: NextRequest, { params }: { params: { id: string } }) {
  const session = await getSession()
  if (!session || (session.role !== 'admin')) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
  }

  const id = parseInt(params.id)
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
      ...(body.category_id !== undefined && { category_id: body.category_id ? parseInt(body.category_id) : null }),
    },
  })

  await prisma.logs.create({
    data: { user_id: session.id, action: 'update_book', details: `Updated book: ${book.title}` },
  })

  revalidatePath('/')
  revalidatePath('/api/books')
  revalidatePath('/admin/books')

  return NextResponse.json({ book })
}

export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  const session = await getSession()
  if (!session || (session.role !== 'admin')) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
  }

  const id = parseInt(params.id)
  const book = await prisma.books.findUnique({ where: { id } })
  if (!book) {
    return NextResponse.json({ error: 'Book not found' }, { status: 404 })
  }

  await prisma.books.delete({ where: { id } })

  await prisma.logs.create({
    data: { user_id: session.id, action: 'delete_book', details: `Deleted book: ${book.title}` },
  })

  revalidatePath('/')
  revalidatePath('/api/books')
  revalidatePath('/admin/books')

  return NextResponse.json({ success: true })
}
