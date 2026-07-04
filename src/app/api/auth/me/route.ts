import { NextResponse } from 'next/server'
import { getSession } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function GET() {
  try {
    const session = await getSession()
    if (!session) {
      return NextResponse.json({ user: null }, { status: 401 })
    }

    const dbUser = await prisma.users.findUnique({
      where: { id: session.id },
      select: {
        id: true,
        username: true,
        role: true,
        user_id: true,
        avatar: true,
        school_name: true,
        role_number: true,
      },
    })

    // If user exists in DB return it; otherwise return session data from JWT
    // (covers the admin bypass login where id=-1 is not a real DB record)
    if (dbUser) {
      return NextResponse.json({ user: dbUser })
    }

    return NextResponse.json({
      user: {
        id: session.id,
        username: session.username,
        role: session.role,
        user_id: session.user_id,
        avatar: null,
        school_name: null,
        role_number: null,
      },
    })
  } catch {
    return NextResponse.json({ user: null, error: 'Failed to fetch user data' }, { status: 500 })
  }
}
