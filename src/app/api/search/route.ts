import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export const dynamic = 'force-dynamic'

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const q = searchParams.get('q') || ''

    if (!q.trim()) {
      return NextResponse.json({ books: [], categories: [], announcements: [] })
    }

    const [books, categories, announcements] = await Promise.all([
      prisma.books.findMany({
        where: {
          OR: [
            { title: { contains: q } },
            { description: { contains: q } },
            { subject: { contains: q } },
            { author: { contains: q } },
          ],
        },
        include: { categories: true },
        orderBy: { title: 'asc' },
        take: 20,
      }),
      prisma.categories.findMany({
        where: {
          OR: [
            { name: { contains: q } },
            { description: { contains: q } },
          ],
        },
        orderBy: { name: 'asc' },
        take: 10,
      }),
      prisma.announcements.findMany({
        where: {
          OR: [
            { title: { contains: q } },
            { content: { contains: q } },
          ],
        },
        include: { users: { select: { username: true } } },
        orderBy: { created_at: 'desc' },
        take: 10,
      }),
    ])

    return NextResponse.json({ books, categories, announcements })
  } catch {
    return NextResponse.json({ error: 'Search failed' }, { status: 500 })
  }
}
