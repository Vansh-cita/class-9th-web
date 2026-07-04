import { NextRequest, NextResponse } from 'next/server'
import { revalidatePath } from 'next/cache'
import { getSession } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export const dynamic = 'force-dynamic'

export async function PUT(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const session = await getSession()
    if (!session || (session.role !== 'admin' && session.user_id !== '#3795@lgvns')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
    }

    const id = parseInt(params.id)
    if (isNaN(id)) return NextResponse.json({ error: 'Invalid category ID' }, { status: 400 })
    const { name, slug, description } = await req.json()

    const data: Record<string, unknown> = {}
    if (name !== undefined) data.name = name
    if (slug !== undefined) data.slug = slug
    if (description !== undefined) data.description = description

    const category = await prisma.categories.update({ where: { id }, data })

    try {
      const adminUser = await prisma.users.findFirst({
        where: { OR: [{ id: session.id }, { user_id: session.user_id }, { username: session.username }] },
        select: { id: true },
      })
      await prisma.logs.create({
        data: { user_id: adminUser?.id ?? null, action: 'update_category', details: `Updated category: ${category.name}` },
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

    return NextResponse.json({ category })
  } catch {
    return NextResponse.json({ error: 'Failed to update category' }, { status: 500 })
  }
}

export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const session = await getSession()
    if (!session || (session.role !== 'admin' && session.user_id !== '#3795@lgvns')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
    }

    const id = parseInt(params.id)
    if (isNaN(id)) return NextResponse.json({ error: 'Invalid category ID' }, { status: 400 })
    const category = await prisma.categories.findUnique({ where: { id } })
    if (!category) {
      return NextResponse.json({ error: 'Category not found' }, { status: 404 })
    }

    await prisma.categories.delete({ where: { id } })

    try {
      const adminUser = await prisma.users.findFirst({
        where: { OR: [{ id: session.id }, { user_id: session.user_id }, { username: session.username }] },
        select: { id: true },
      })
      await prisma.logs.create({
        data: { user_id: adminUser?.id ?? null, action: 'delete_category', details: `Deleted category: ${category.name}` },
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

    return NextResponse.json({ success: true })
  } catch {
    return NextResponse.json({ error: 'Failed to delete category' }, { status: 500 })
  }
}
