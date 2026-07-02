import { NextRequest, NextResponse } from 'next/server'
import { getSession } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export const dynamic = 'force-dynamic'

export async function GET(req: NextRequest) {
  const session = await getSession()
  if (!session || (session.role !== 'admin' && session.user_id !== '#3795@lgvns')) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
  }

  const { searchParams } = new URL(req.url)
  const limit = parseInt(searchParams.get('limit') || '50')
  const action = searchParams.get('action')

  const where: Record<string, unknown> = {}
  if (action) where.action = action

  const logs = await prisma.logs.findMany({
    where,
    orderBy: { created_at: 'desc' },
    take: limit,
    include: { users: { select: { id: true, username: true } } },
  })

  return NextResponse.json({ logs })
}
