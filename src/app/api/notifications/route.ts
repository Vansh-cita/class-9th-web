import { NextResponse } from 'next/server'
import { revalidatePath } from 'next/cache'
import { getSession } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export const dynamic = 'force-dynamic'

export async function GET() {
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
    where: { user_id: session.id, is_read: 0 },
  })

  return NextResponse.json({ notifications, unreadCount })
}

export async function POST(req: Request) {
  const session = await getSession()
  if (!session) {
    return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })
  }

  const { id, markAll } = await req.json()

  if (markAll) {
    await prisma.notifications.updateMany({
      where: { user_id: session.id, is_read: 0 },
      data: { is_read: 1 },
    })
  } else if (id) {
    await prisma.notifications.updateMany({
      where: { id, user_id: session.id },
      data: { is_read: 1 },
    })
  }

  revalidatePath('/api/notifications')

  return NextResponse.json({ success: true })
}
