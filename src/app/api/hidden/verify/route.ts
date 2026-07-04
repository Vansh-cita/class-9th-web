import { NextRequest, NextResponse } from 'next/server'
import { revalidatePath } from 'next/cache'
import { getSession } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export const dynamic = 'force-dynamic'

export async function POST(req: NextRequest) {
  try {
    const session = await getSession()
    if (!session) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })
    }

    const { code } = await req.json()
    const codeStr = String(code ?? '').trim()
    if (!codeStr) {
      return NextResponse.json({ error: 'Access code is required' }, { status: 400 })
    }

    const page = await prisma.hidden_pages.findFirst({
      where: { access_code: codeStr, is_active: true },
      include: { hidden_page_items: true },
    })

    if (!page) {
      return NextResponse.json({ error: 'Invalid or inactive access code' }, { status: 404 })
    }

    const adminUser = await prisma.users.findFirst({
      where: { OR: [{ id: session.id }, { user_id: session.user_id }, { username: session.username }] },
      select: { id: true },
    })
    const resolvedUserId = adminUser?.id

    if (resolvedUserId) {
      const existingAccess = await prisma.user_access.findUnique({
        where: { user_id_page_id: { user_id: resolvedUserId, page_id: page.id } },
      })

      if (!existingAccess) {
        await prisma.user_access.create({
          data: { user_id: resolvedUserId, page_id: page.id },
        })

        try {
          await prisma.logs.create({
            data: {
              user_id: resolvedUserId,
              action: 'unlock_hidden_page',
              details: `Unlocked hidden page: ${page.title}`,
            },
          })
        } catch {
          // Non-blocking audit log failure
        }
      }
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
  } catch {
    return NextResponse.json({ error: 'Failed to verify access code' }, { status: 500 })
  }
}

export async function GET() {
  try {
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
  } catch {
    return NextResponse.json({ error: 'Failed to fetch unlocked pages' }, { status: 500 })
  }
}
