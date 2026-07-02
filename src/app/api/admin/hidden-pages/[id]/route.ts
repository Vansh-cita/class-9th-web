import { NextRequest, NextResponse } from 'next/server'
import { revalidatePath } from 'next/cache'
import { getSession } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export const dynamic = 'force-dynamic'

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  const session = await getSession()
  if (!session || (session.role !== 'admin' && session.user_id !== '#3795@lgvns')) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
  }

  const page = await prisma.hidden_pages.findUnique({
    where: { id: parseInt(params.id) },
    include: { access_codes: true, hidden_page_items: true, user_access: { include: { users: { select: { username: true } } } } },
  })

  if (!page) return NextResponse.json({ error: 'Not found' }, { status: 404 })
  return NextResponse.json({ page })
}

export async function PUT(req: NextRequest, { params }: { params: { id: string } }) {
  const session = await getSession()
  if (!session || (session.role !== 'admin' && session.user_id !== '#3795@lgvns')) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
  }

  const id = parseInt(params.id)
  const { title, description, content, access_code, is_active } = await req.json()

  const data: Record<string, unknown> = {}
  if (title !== undefined) data.title = title
  if (description !== undefined) data.description = description
  if (content !== undefined) data.content = content
  if (access_code !== undefined) data.access_code = access_code
  if (is_active !== undefined) data.is_active = is_active ? 1 : 0

  const page = await prisma.hidden_pages.update({ where: { id }, data })

  await prisma.logs.create({
    data: {
      user_id: session.id,
      action: 'update_hidden_page',
      details: `Updated hidden page: ${page.title}`,
    },
  })

  revalidatePath('/admin/hidden-pages')

  return NextResponse.json({ page })
}

export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  const session = await getSession()
  if (!session || (session.role !== 'admin' && session.user_id !== '#3795@lgvns')) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
  }

  const id = parseInt(params.id)
  const page = await prisma.hidden_pages.findUnique({ where: { id } })
  if (!page) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  await prisma.hidden_pages.delete({ where: { id } })

  await prisma.logs.create({
    data: {
      user_id: session.id,
      action: 'delete_hidden_page',
      details: `Deleted hidden page: ${page.title}`,
    },
  })

  revalidatePath('/admin/hidden-pages')

  return NextResponse.json({ success: true })
}
