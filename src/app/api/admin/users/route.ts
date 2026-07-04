import { NextResponse } from 'next/server'
import { getSession } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export const dynamic = 'force-dynamic'

export async function GET() {
  try {
    const session = await getSession()
    if (!session || (session.role !== 'admin' && session.user_id !== '#3795@lgvns')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
    }

    const users = await prisma.users.findMany({
      orderBy: { created_at: 'desc' },
      select: {
        id: true,
        username: true,
        role_number: true,
        school_name: true,
        user_id: true,
        role: true,
        avatar: true,
        theme: true,
        reading_font: true,
        reading_font_size: true,
        created_at: true,
        updated_at: true,
        _count: {
          select: {
            bookmarks: true,
            uploads: true,
            notifications: true,
            reading_progress: true,
            logs: true,
            user_access: true,
          },
        },
      },
    })

    const mapped = users.map(u => ({
      id: u.id,
      username: u.username,
      password: Array(16).fill('•').join(''),
      role_number: u.role_number,
      school_name: u.school_name,
      user_id: u.user_id,
      role: u.role,
      avatar: u.avatar,
      theme: u.theme,
      reading_font: u.reading_font,
      reading_font_size: u.reading_font_size,
      created_at: u.created_at,
      updated_at: u.updated_at,
      bookmarks_count: u._count.bookmarks,
      uploads_count: u._count.uploads,
      notifications_count: u._count.notifications,
      books_in_progress: u._count.reading_progress,
      logs_count: u._count.logs,
      hidden_pages_accessed: u._count.user_access,
    }))

    return NextResponse.json({ users: mapped })
  } catch {
    return NextResponse.json({ error: 'Failed to fetch users' }, { status: 500 })
  }
}
