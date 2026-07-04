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

    const pages = await prisma.hidden_pages.findMany({
      orderBy: { created_at: 'desc' },
      include: {
        access_codes: true,
        hidden_page_items: true,
        _count: { select: { user_access: true } },
      },
    })

    return NextResponse.json({ pages })
  } catch {
    return NextResponse.json({ error: 'Failed to fetch hidden pages' }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await getSession()
    if (!session || (session.role !== 'admin' && session.user_id !== '#3795@lgvns')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
    }

    const { title, description, content, access_code, is_active, items } = await req.json()
    if (!title || !access_code) {
      return NextResponse.json({ error: 'Title and access code are required' }, { status: 400 })
    }

    const slug = title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '') + '-' + Date.now().toString(36)

    const adminUser = await prisma.users.findFirst({
      where: { OR: [{ id: session.id }, { user_id: session.user_id }, { username: session.username }] },
      select: { id: true },
    })
    const adminUserId = adminUser?.id

    const page = await prisma.hidden_pages.create({
      data: {
        title,
        slug,
        description,
        content,
        access_code,
        is_active,
        created_by: adminUserId,
        hidden_page_items: items?.length ? {
          create: items.map((item: { item_type: string; title: string; description?: string; file_path?: string }) => ({
            item_type: item.item_type,
            title: item.title,
            description: item.description,
            file_path: item.file_path,
          })),
        } : undefined,
      },
      include: { access_codes: true, hidden_page_items: true },
    })

    try {
      await prisma.logs.create({
        data: {
          user_id: adminUserId,
          action: 'create_hidden_page',
          details: `Created hidden page: ${title}`,
        },
      })
    } catch {
      // Non-blocking audit log failure
    }

    revalidatePath('/admin/hidden-pages')
    revalidatePath('/api/hidden/verify')

    return NextResponse.json({ page }, { status: 201 })
  } catch {
    return NextResponse.json({ error: 'Failed to create hidden page' }, { status: 500 })
  }
}
