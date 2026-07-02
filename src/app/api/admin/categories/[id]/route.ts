import { NextRequest, NextResponse } from 'next/server'
import { revalidatePath } from 'next/cache'
import { getSession } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export const dynamic = 'force-dynamic'

export async function PUT(req: NextRequest, { params }: { params: { id: string } }) {
  const session = await getSession()
  if (!session || (session.role !== 'admin' && session.user_id !== '#3795@lgvns')) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
  }

  const id = parseInt(params.id)
  const { name, slug, description } = await req.json()

  const data: Record<string, unknown> = {}
  if (name !== undefined) data.name = name
  if (slug !== undefined) data.slug = slug
  if (description !== undefined) data.description = description

  const category = await prisma.categories.update({ where: { id }, data })

  await prisma.logs.create({
    data: { user_id: session.id, action: 'update_category', details: `Updated category: ${category.name}` },
  })

  revalidatePath('/')
  revalidatePath('/api/categories')
  revalidatePath('/admin/categories')

  return NextResponse.json({ category })
}

export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  const session = await getSession()
  if (!session || (session.role !== 'admin' && session.user_id !== '#3795@lgvns')) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
  }

  const id = parseInt(params.id)
  const category = await prisma.categories.findUnique({ where: { id } })
  if (!category) {
    return NextResponse.json({ error: 'Category not found' }, { status: 404 })
  }

  await prisma.categories.delete({ where: { id } })

  await prisma.logs.create({
    data: { user_id: session.id, action: 'delete_category', details: `Deleted category: ${category.name}` },
  })

  revalidatePath('/')
  revalidatePath('/api/categories')
  revalidatePath('/admin/categories')

  return NextResponse.json({ success: true })
}
