import { NextResponse } from 'next/server'
import { hashPassword } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

const ADMIN_USER_ID = '#3795@lgvns'

export async function POST(req: Request) {
  try {
    const { username, password, role_number, school_name, user_id } = await req.json()
    if (!username || !password || !role_number || !school_name) {
      return NextResponse.json({ error: 'All fields are required' }, { status: 400 })
    }

    const existing = await prisma.users.findFirst({
      where: {
        OR: [
          { username },
          ...(user_id ? [{ user_id }] : []),
        ],
      },
    })
    if (existing) {
      return NextResponse.json({ error: 'Username or User ID already exists' }, { status: 409 })
    }

    const hashedPassword = await hashPassword(password)
    const uid = user_id || `STU-${Date.now().toString(36).toUpperCase()}`

    const user = await prisma.users.create({
      data: {
        username,
        password: hashedPassword,
        role_number,
        school_name,
        user_id: uid,
        role: uid === ADMIN_USER_ID ? 'admin' : 'student',
        avatar: 'default.png',
      },
    })

    await prisma.logs.create({
      data: {
        user_id: user.id,
        action: 'register',
        details: 'New user registered',
        ip_address: req.headers.get('x-forwarded-for') || 'unknown',
      },
    })

    return NextResponse.json({
      success: true,
      message: 'Registration successful. Please login.',
    }, { status: 201 })
  } catch (error) {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
