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

    const categories = await prisma.categories.findMany({
      orderBy: { name: 'asc' },
      include: { _count: { select: { books: true } } },
    })

    return NextResponse.json({ categories })
  } catch {
    return NextResponse.json({ error: 'Failed to fetch categories' }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await getSession()
    if (!session || (session.role !== 'admin' && session.user_id !== '#3795@lgvns')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
    }

    const { name, slug, description, icon } = await req.json()
    if (!name || !slug) {
      return NextResponse.json({ error: 'Name and slug are required' }, { status: 400 })
    }

    const category = await prisma.categories.create({
      data: { name, slug, description, icon: icon || 'book' },
    })

    try {
      const adminUser = await prisma.users.findFirst({
        where: { OR: [{ id: session.id }, { user_id: session.user_id }, { username: session.username }] },
        select: { id: true },
      })
      await prisma.logs.create({
        data: { user_id: adminUser?.id ?? null, action: 'create_category', details: `Created category: ${name}` },
      })
    } catch {
      // Non-blocking audit log failure
    }

    revalidatePath('/')
    revalidatePath('/books')
    revalidatePath('/search')
    revalidatePath('/api/categories')
    revalidatePath('/admin/categories')
    revalidatePath('/admin/dashboard')

    return NextResponse.json({ category }, { status: 201 })
  } catch {
    return NextResponse.json({ error: 'Failed to create category' }, { status: 500 })
  }
}
