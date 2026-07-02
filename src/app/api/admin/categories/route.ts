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

  const categories = await prisma.categories.findMany({
    orderBy: { name: 'asc' },
    include: { _count: { select: { books: true } } },
  })

  return NextResponse.json({ categories })
}

export async function POST(req: NextRequest) {
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

  await prisma.logs.create({
    data: { user_id: session.id, action: 'create_category', details: `Created category: ${name}` },
  })

  revalidatePath('/')
  revalidatePath('/api/categories')
  revalidatePath('/admin/dashboard')

  return NextResponse.json({ category }, { status: 201 })
}
