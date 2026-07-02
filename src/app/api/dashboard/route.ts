import { NextResponse } from 'next/server'
import { getSession } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export const dynamic = 'force-dynamic'

export async function GET() {
  const session = await getSession()
  if (!session) {
    return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })
  }

  const userId = session.id

  const [progress, bookmarks, notifications, recentBooks, categories] = await Promise.all([
    prisma.reading_progress.findMany({
      where: { user_id: userId },
      include: {
        books: true,
        chapters: { select: { id: true, title: true, chapter_number: true } },
      },
      orderBy: { last_read_at: 'desc' },
      take: 5,
    }),

    prisma.bookmarks.findMany({
      where: { user_id: userId },
      include: {
        books: { select: { id: true, title: true, slug: true } },
        chapters: { select: { id: true, title: true, chapter_number: true } },
      },
      orderBy: { created_at: 'desc' },
      take: 10,
    }),

    prisma.notifications.findMany({
      where: { user_id: userId },
      orderBy: { created_at: 'desc' },
      take: 10,
    }),

    prisma.books.findMany({
      include: { categories: true },
      orderBy: { created_at: 'desc' },
      take: 6,
    }),

    prisma.categories.findMany({
      orderBy: { name: 'asc' },
    }),
  ])

  return NextResponse.json({
    progress,
    bookmarks,
    notifications,
    recentBooks,
    categories,
  })
}
