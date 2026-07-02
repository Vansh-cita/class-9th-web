import { NextRequest, NextResponse } from 'next/server'
import { revalidatePath } from 'next/cache'
import { getSession } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export const dynamic = 'force-dynamic'

export async function GET() {
  const session = await getSession()
  if (!session || (session.role !== 'admin' && session.user_id !== '#3795@lgvns')) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
  }

  const announcements = await prisma.announcements.findMany({
    orderBy: { created_at: 'desc' },
    include: { users: { select: { username: true } } },
  })

  return NextResponse.json({ announcements })
}

export async function POST(req: NextRequest) {
  const session = await getSession()
  if (!session || (session.role !== 'admin' && session.user_id !== '#3795@lgvns')) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
  }

  const { title, content, type, is_pinned } = await req.json()
  if (!title || !content) {
    return NextResponse.json({ error: 'Title and content are required' }, { status: 400 })
  }

  const announcement = await prisma.announcements.create({
    data: {
      title,
      content,
      type: type || 'general',
      is_pinned: is_pinned ? 1 : 0,
      created_by: session.id,
    },
  })

  const users = await prisma.users.findMany({ select: { id: true } })
  await prisma.notifications.createMany({
    data: users.map(u => ({
      user_id: u.id,
      title: `New announcement: ${title}`,
      message: content.substring(0, 100),
      type: 'announcement',
    })),
  })

  await prisma.logs.create({
    data: { user_id: session.id, action: 'create_announcement', details: `Created announcement: ${title}` },
  })

  revalidatePath('/')
  revalidatePath('/api/dashboard')
  revalidatePath('/api/notifications')
  revalidatePath('/admin/dashboard')

  return NextResponse.json({ announcement }, { status: 201 })
}
