import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export const dynamic = 'force-dynamic'

export async function GET() {
  try {
    const announcements = await prisma.announcements.findMany({
      orderBy: [{ is_pinned: 'desc' }, { created_at: 'desc' }],
      include: { users: { select: { username: true } } },
      take: 50,
    })
    return NextResponse.json({ announcements })
  } catch {
    return NextResponse.json({ error: 'Failed to fetch announcements' }, { status: 500 })
  }
}
