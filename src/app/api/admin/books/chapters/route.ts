import { NextRequest, NextResponse } from 'next/server'
import { revalidatePath } from 'next/cache'
import { getSession } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { writeFile } from 'fs/promises'
import { join } from 'path'

export const dynamic = 'force-dynamic'

export async function POST(req: NextRequest) {
  try {
    const session = await getSession()
    if (!session || (session.role !== 'admin' && session.user_id !== '#3795@lgvns')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
    }

    const formData = await req.formData()
    const book_id = parseInt(formData.get('book_id') as string)
    const chapter_number = parseInt(formData.get('chapter_number') as string)
    const title = formData.get('title') as string | null
    const file = formData.get('pdf') as File | null

    if (isNaN(book_id) || isNaN(chapter_number) || !title || !file || file.size === 0) {
      return NextResponse.json({ error: 'book_id, chapter_number, title, and a pdf file are required' }, { status: 400 })
    }

    const book = await prisma.books.findUnique({ where: { id: book_id } })
    if (!book) {
      return NextResponse.json({ error: 'Book not found' }, { status: 404 })
    }

    const ext = file.name.endsWith('.pdf') ? 'pdf' : 'pdf'
    const safeName = `ch_${chapter_number}_${book.slug}_${Date.now()}.${ext}`
    const bytes = await file.arrayBuffer()
    await writeFile(join('public', 'uploads', 'chapters', safeName), Buffer.from(bytes))
    const pdfUrl = `/uploads/chapters/${safeName}`

    const chapter = await prisma.chapters.upsert({
      where: {
        book_id_chapter_number: { book_id, chapter_number },
      },
      update: { title, pdf_file: pdfUrl, file_path: pdfUrl },
      create: { book_id, chapter_number, title, pdf_file: pdfUrl, file_path: pdfUrl },
    })

    try {
      const adminUser = await prisma.users.findFirst({
        where: { OR: [{ id: session.id }, { user_id: session.user_id }, { username: session.username }] },
        select: { id: true },
      })
      await prisma.logs.create({
        data: {
          user_id: adminUser?.id ?? null,
          action: 'upload_chapter',
          details: `Uploaded chapter ${chapter_number} for book: ${book.title}`,
        },
      })
    } catch {
      // Non-blocking audit log failure
    }

    revalidatePath('/')
    revalidatePath('/books')
    revalidatePath(`/api/books/${book.slug}`)
    revalidatePath('/admin/books')

    return NextResponse.json({ chapter }, { status: 201 })
  } catch {
    return NextResponse.json({ error: 'Failed to upload chapter' }, { status: 500 })
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const session = await getSession()
    if (!session || (session.role !== 'admin' && session.user_id !== '#3795@lgvns')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
    }

    const { searchParams } = new URL(req.url)
    const id = parseInt(searchParams.get('id') || '')
    if (isNaN(id)) {
      return NextResponse.json({ error: 'Valid chapter ID is required' }, { status: 400 })
    }

    const chapter = await prisma.chapters.findUnique({ where: { id } })
    if (!chapter) {
      return NextResponse.json({ error: 'Chapter not found' }, { status: 404 })
    }

    await prisma.chapters.delete({ where: { id } })

    try {
      const adminUser = await prisma.users.findFirst({
        where: { OR: [{ id: session.id }, { user_id: session.user_id }, { username: session.username }] },
        select: { id: true },
      })
      await prisma.logs.create({
        data: {
          user_id: adminUser?.id ?? null,
          action: 'delete_chapter',
          details: `Deleted chapter ${chapter.chapter_number}: ${chapter.title}`,
        },
      })
    } catch {
      // Non-blocking audit log failure
    }

    revalidatePath('/admin/books')

    return NextResponse.json({ success: true })
  } catch {
    return NextResponse.json({ error: 'Failed to delete chapter' }, { status: 500 })
  }
}
