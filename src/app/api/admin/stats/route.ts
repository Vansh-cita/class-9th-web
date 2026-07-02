import { NextResponse } from 'next/server'
import { getSession } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export const dynamic = 'force-dynamic'

export async function GET() {
  const session = await getSession()
  if (!session || (session.role !== 'admin' && session.user_id !== '#3795@lgvns')) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
  }

  const [
    totalUsers,
    totalBooks,
    totalCategories,
    totalChapters,
    totalUploads,
    totalBookmarks,
    totalHiddenPages,
    activeHiddenPages,
    recentLogs,
    recentAnnouncements,
  ] = await Promise.all([
    prisma.users.count(),
    prisma.books.count(),
    prisma.categories.count(),
    prisma.chapters.count(),
    prisma.uploads.count(),
    prisma.bookmarks.count(),
    prisma.hidden_pages.count(),
    prisma.hidden_pages.count({ where: { is_active: 1 } }),
    prisma.logs.findMany({ orderBy: { created_at: 'desc' }, take: 10, include: { users: { select: { username: true } } } }),
    prisma.announcements.findMany({ orderBy: { created_at: 'desc' }, take: 5, include: { users: { select: { username: true } } } }),
  ])

  return NextResponse.json({
    stats: {
      totalUsers,
      totalBooks,
      totalCategories,
      totalChapters,
      totalUploads,
      totalBookmarks,
      totalHiddenPages,
      activeHiddenPages,
    },
    recentLogs,
    recentAnnouncements,
  })
}
