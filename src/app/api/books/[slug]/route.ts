import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export const dynamic = 'force-dynamic'

export async function GET(_req: NextRequest, { params }: { params: { slug: string } }) {
  try {
    const book = await prisma.books.findUnique({
      where: { slug: params.slug },
      include: {
        categories: true,
        chapters: { orderBy: { chapter_number: 'asc' } },
      },
    })

    if (!book) {
      return NextResponse.json({ error: 'Book not found' }, { status: 404 })
    }

    return NextResponse.json({ book })
  } catch {
    return NextResponse.json({ error: 'Failed to fetch book' }, { status: 500 })
  }
}
