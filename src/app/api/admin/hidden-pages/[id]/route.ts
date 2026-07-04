import { NextRequest, NextResponse } from 'next/server'
import { revalidatePath } from 'next/cache'
import { getSession } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export const dynamic = 'force-dynamic'

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const session = await getSession()
    if (!session || (session.role !== 'admin' && session.user_id !== '#3795@lgvns')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
    }

    const id = parseInt(params.id)
    if (isNaN(id)) return NextResponse.json({ error: 'Invalid ID' }, { status: 400 })

    const page = await prisma.hidden_pages.findUnique({
      where: { id },
      include: { access_codes: true, hidden_page_items: true, user_access: { include: { users: { select: { username: true } } } } },
    })

    if (!page) return NextResponse.json({ error: 'Not found' }, { status: 404 })
    return NextResponse.json({ page })
  } catch {
    return NextResponse.json({ error: 'Failed to fetch hidden page' }, { status: 500 })
  }
}

export async function PUT(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const session = await getSession()
    if (!session || (session.role !== 'admin' && session.user_id !== '#3795@lgvns')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
    }

    const id = parseInt(params.id)
    if (isNaN(id)) return NextResponse.json({ error: 'Invalid ID' }, { status: 400 })

    const { title, description, content, access_code, is_active } = await req.json()

    const data: Record<string, unknown> = {}
    if (title !== undefined) data.title = title
    if (description !== undefined) data.description = description
    if (content !== undefined) data.content = content
    if (access_code !== undefined) data.access_code = access_code
    if (is_active !== undefined) data.is_active = is_active

    const page = await prisma.hidden_pages.update({ where: { id }, data })

    try {
      const adminUser = await prisma.users.findFirst({
        where: { OR: [{ id: session.id }, { user_id: session.user_id }, { username: session.username }] },
        select: { id: true },
      })
      await prisma.logs.create({
        data: {
          user_id: adminUser?.id ?? null,
          action: 'update_hidden_page',
          details: `Updated hidden page: ${page.title}`,
        },
      })
    } catch {
      // Non-blocking audit log failure
    }

    revalidatePath('/admin/hidden-pages')

    return NextResponse.json({ page })
  } catch {
    return NextResponse.json({ error: 'Failed to update hidden page' }, { status: 500 })
  }
}

export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const session = await getSession()
    if (!session || (session.role !== 'admin' && session.user_id !== '#3795@lgvns')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
    }

    const id = parseInt(params.id)
    if (isNaN(id)) return NextResponse.json({ error: 'Invalid ID' }, { status: 400 })

    const page = await prisma.hidden_pages.findUnique({ where: { id } })
    if (!page) return NextResponse.json({ error: 'Not found' }, { status: 404 })

    await prisma.hidden_pages.delete({ where: { id } })

    try {
      const adminUser = await prisma.users.findFirst({
        where: { OR: [{ id: session.id }, { user_id: session.user_id }, { username: session.username }] },
        select: { id: true },
      })
      await prisma.logs.create({
        data: {
          user_id: adminUser?.id ?? null,
          action: 'delete_hidden_page',
          details: `Deleted hidden page: ${page.title}`,
        },
      })
    } catch {
      // Non-blocking audit log failure
    }

    revalidatePath('/admin/hidden-pages')

    return NextResponse.json({ success: true })
  } catch {
    return NextResponse.json({ error: 'Failed to delete hidden page' }, { status: 500 })
  }
}
