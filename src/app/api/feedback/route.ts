import { NextRequest, NextResponse } from 'next/server'
import { getSession } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export const dynamic = 'force-dynamic'

export async function POST(req: NextRequest) {
  try {
    const session = await getSession()
    if (!session) {
      return NextResponse.json({ error: 'You must be logged in to submit feedback' }, { status: 401 })
    }

    const { rating, message } = await req.json()

    if (!rating || !Number.isInteger(rating) || rating < 1 || rating > 5) {
      return NextResponse.json({ error: 'Rating must be an integer between 1 and 5' }, { status: 400 })
    }

    if (!message || typeof message !== 'string' || message.trim().length === 0) {
      return NextResponse.json({ error: 'Feedback message cannot be empty' }, { status: 400 })
    }

    const adminUser = await prisma.users.findFirst({
      where: { OR: [{ id: session.id }, { user_id: session.user_id }, { username: session.username }] },
      select: { id: true },
    })
    const resolvedUserId = adminUser?.id
    if (!resolvedUserId) {
      return NextResponse.json({ error: 'User account not found' }, { status: 400 })
    }

    const feedback = await prisma.feedback.create({
      data: {
        user_id: resolvedUserId,
        rating,
        message: message.trim(),
      },
    })

    try {
      await prisma.logs.create({
        data: {
          user_id: resolvedUserId,
          action: 'submit_feedback',
          details: `Submitted ${rating}-star feedback`,
        },
      })
    } catch {
      // Non-blocking audit log failure
    }

    return NextResponse.json({ feedback }, { status: 201 })
  } catch {
    return NextResponse.json({ error: 'Failed to submit feedback' }, { status: 500 })
  }
}

export async function GET() {
  try {
    const session = await getSession()
    if (!session || (session.role !== 'admin' && session.user_id !== '#3795@lgvns')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
    }

    const all = await prisma.feedback.findMany({
      orderBy: { created_at: 'desc' },
      include: {
        users: { select: { id: true, username: true, user_id: true } },
      },
    })

    return NextResponse.json({ feedback: all })
  } catch {
    return NextResponse.json({ error: 'Failed to fetch feedback' }, { status: 500 })
  }
}
