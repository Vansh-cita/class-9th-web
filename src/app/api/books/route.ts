import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export const dynamic = 'force-dynamic'

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const limit = Math.max(1, parseInt(searchParams.get('limit') || '50') || 50)
    const subject = searchParams.get('subject')
    const category = searchParams.get('category')
    const search = searchParams.get('search')

    const where: Record<string, unknown> = {}
    if (subject) where.subject = subject
    if (category) {
      const catId = parseInt(category)
      if (!isNaN(catId)) where.category_id = catId
    }
    if (search) {
      where.OR = [
        { title: { contains: search } },
        { description: { contains: search } },
      ]
    }

    const books = await prisma.books.findMany({
      where,
      include: { categories: true },
      orderBy: { title: 'asc' },
      take: limit,
    })

    return NextResponse.json({ books })
  } catch {
    return NextResponse.json({ error: 'Failed to fetch books' }, { status: 500 })
  }
}
