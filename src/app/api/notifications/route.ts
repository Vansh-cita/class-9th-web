import { NextResponse } from 'next/server'
import { revalidatePath } from 'next/cache'
import { getSession } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export const dynamic = 'force-dynamic'

export async function GET() {
  try {
    const session = await getSession()
    if (!session) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })
    }

    const notifications = await prisma.notifications.findMany({
      where: { user_id: session.id },
      orderBy: { created_at: 'desc' },
      take: 20,
    })

    const unreadCount = await prisma.notifications.count({
      where: { user_id: session.id, is_read: false },
    })

    return NextResponse.json({ notifications, unreadCount })
  } catch {
    return NextResponse.json({ error: 'Failed to fetch notifications' }, { status: 500 })
  }
}

export async function POST(req: Request) {
  try {
    const session = await getSession()
    if (!session) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })
    }

    const { id, markAll } = await req.json()

    if (markAll) {
      await prisma.notifications.updateMany({
      where: { user_id: session.id, is_read: false },
        data: { is_read: true },
      })
    } else if (id) {
      await prisma.notifications.updateMany({
        where: { id, user_id: session.id },
        data: { is_read: true },
      })
    }

    revalidatePath('/api/notifications')

    return NextResponse.json({ success: true })
  } catch {
    return NextResponse.json({ error: 'Failed to update notifications' }, { status: 500 })
  }
}
