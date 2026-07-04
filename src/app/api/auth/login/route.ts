import { NextResponse } from 'next/server'
import { authenticateUser } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function POST(req: Request) {
  try {
    const { user_id, password } = await req.json()
    if (!user_id || !password) {
      return NextResponse.json({ error: 'User ID and password are required' }, { status: 400 })
    }

    const result = await authenticateUser(user_id, password)
    if (!result) {
      return NextResponse.json({ error: 'Invalid User ID or password' }, { status: 401 })
    }

    const { token, user } = result

    // Virtual admin (bypass login) uses id=-1; skip DB log for that case
    if (user.id !== -1) {
      try {
        await prisma.logs.create({
          data: {
            user_id: user.id,
            action: 'login',
            details: 'User logged in',
            ip_address: req.headers.get('x-forwarded-for') || req.headers.get('x-real-ip') || 'unknown',
            user_agent: req.headers.get('user-agent') || undefined,
          },
        })
      } catch {
        // Non-blocking audit log failure
      }
    }

    const isAdmin = user.role === 'admin'

    const response = NextResponse.json({
      success: true,
      user: {
        id: user.id,
        username: user.username,
        role: user.role,
        user_id: user.user_id,
        avatar: user.avatar,
        school_name: user.school_name,
        role_number: user.role_number,
      },
      redirect: isAdmin ? '/admin/dashboard' : '/dashboard',
    })

    response.cookies.set('token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: 7 * 24 * 60 * 60,
    })

    return response
  } catch (error) {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
