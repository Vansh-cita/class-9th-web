import { NextResponse } from 'next/server'
import { getSession } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export const dynamic = 'force-dynamic'

export async function GET() {
  try {
    const session = await getSession()
    if (!session || (session.role !== 'admin' && session.user_id !== '#3795@lgvns')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
    }

    const uploads = await prisma.uploads.findMany({
      orderBy: { created_at: 'desc' },
      include: {
        users: { select: { username: true } },
        books: { select: { title: true } },
      },
    })

    return NextResponse.json({ uploads })
  } catch {
    return NextResponse.json({ error: 'Failed to fetch uploads' }, { status: 500 })
  }
}
