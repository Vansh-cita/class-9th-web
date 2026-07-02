import { NextRequest, NextResponse } from 'next/server'
import { revalidatePath } from 'next/cache'
import { getSession } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export const dynamic = 'force-dynamic'

export async function POST(req: NextRequest) {
  const session = await getSession()
  if (!session) {
    return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })
  }

  const { code } = await req.json()
  if (!code) {
    return NextResponse.json({ error: 'Access code is required' }, { status: 400 })
  }

  const page = await prisma.hidden_pages.findFirst({
    where: { access_code: code, is_active: 1 },
    include: { hidden_page_items: true },
  })

  if (!page) {
    return NextResponse.json({ error: 'Invalid or inactive access code' }, { status: 404 })
  }

  const existingAccess = await prisma.user_access.findUnique({
    where: { user_id_page_id: { user_id: session.id, page_id: page.id } },
  })

  if (!existingAccess) {
    await prisma.user_access.create({
      data: { user_id: session.id, page_id: page.id },
    })

    await prisma.logs.create({
      data: {
        user_id: session.id,
        action: 'unlock_hidden_page',
        details: `Unlocked hidden page: ${page.title}`,
      },
    })
  }

  revalidatePath('/api/hidden/verify')
  revalidatePath('/admin/hidden-pages')

  return NextResponse.json({
    success: true,
    page: {
      id: page.id,
      title: page.title,
      description: page.description,
      content: page.content,
      slug: page.slug,
      items: page.hidden_page_items,
    },
  })
}

export async function GET(req: NextRequest) {
  const session = await getSession()
  if (!session) {
    return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })
  }

  const unlocked = await prisma.user_access.findMany({
    where: { user_id: session.id },
    include: {
      hidden_pages: {
        include: { hidden_page_items: true },
      },
    },
  })

  revalidatePath('/hidden/[code]')

  return NextResponse.json({
    pages: unlocked.map(u => ({
      id: u.hidden_pages.id,
      title: u.hidden_pages.title,
      description: u.hidden_pages.description,
      slug: u.hidden_pages.slug,
      items: u.hidden_pages.hidden_page_items,
      granted_at: u.granted_at,
    })),
  })
}
