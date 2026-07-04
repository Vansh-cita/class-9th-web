import { NextRequest, NextResponse } from 'next/server'
import { revalidatePath } from 'next/cache'
import { getSession } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export const dynamic = 'force-dynamic'

export async function GET() {
  try {
    const session = await getSession()
    if (!session || (session.role !== 'admin' && session.user_id !== '#3795@lgvns')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
    }

    const announcements = await prisma.announcements.findMany({
      orderBy: { created_at: 'desc' },
      include: { users: { select: { username: true } } },
    })

    return NextResponse.json({ announcements })
  } catch {
    return NextResponse.json({ error: 'Failed to fetch announcements' }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await getSession()
    if (!session || (session.role !== 'admin' && session.user_id !== '#3795@lgvns')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
    }

    const { title, content, type, is_pinned } = await req.json()
    if (!title || !content) {
      return NextResponse.json({ error: 'Title and content are required' }, { status: 400 })
    }

    const adminUser = await prisma.users.findFirst({
      where: { OR: [{ id: session.id }, { user_id: session.user_id }, { username: session.username }] },
      select: { id: true },
    })
    const adminUserId = adminUser?.id

    const announcement = await prisma.announcements.create({
      data: {
        title,
        content,
        type: type || 'general',
        is_pinned,
        created_by: adminUserId,
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

    try {
      await prisma.logs.create({
        data: { user_id: adminUserId, action: 'create_announcement', details: `Created announcement: ${title}` },
      })
    } catch {
      // Non-blocking audit log failure
    }

    revalidatePath('/')
    revalidatePath('/api/announcements')
    revalidatePath('/api/dashboard')
    revalidatePath('/api/notifications')
    revalidatePath('/admin/dashboard')
    revalidatePath('/admin/announcements')

    return NextResponse.json({ announcement }, { status: 201 })
  } catch {
    return NextResponse.json({ error: 'Failed to create announcement' }, { status: 500 })
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
      return NextResponse.json({ error: 'Valid announcement ID is required' }, { status: 400 })
    }

    const announcement = await prisma.announcements.findUnique({ where: { id } })
    if (!announcement) {
      return NextResponse.json({ error: 'Announcement not found' }, { status: 404 })
    }

    await prisma.notifications.deleteMany({
      where: { title: { startsWith: `New announcement: ${announcement.title}` } },
    })

    await prisma.announcements.delete({ where: { id } })

    try {
      const adminUser = await prisma.users.findFirst({
        where: { OR: [{ id: session.id }, { user_id: session.user_id }, { username: session.username }] },
        select: { id: true },
      })
      await prisma.logs.create({
        data: { user_id: adminUser?.id ?? null, action: 'delete_announcement', details: `Deleted announcement: ${announcement.title}` },
      })
    } catch {
      // Non-blocking audit log failure
    }

    revalidatePath('/')
    revalidatePath('/api/announcements')
    revalidatePath('/api/dashboard')
    revalidatePath('/api/notifications')
    revalidatePath('/admin/dashboard')
    revalidatePath('/admin/announcements')

    return NextResponse.json({ success: true })
  } catch {
    return NextResponse.json({ error: 'Failed to delete announcement' }, { status: 500 })
  }
}
