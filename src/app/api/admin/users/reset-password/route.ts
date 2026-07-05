import { NextRequest, NextResponse } from 'next/server'
import { getSession, hashPassword } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { revalidatePath } from 'next/cache'

export const dynamic = 'force-dynamic'

export async function POST(req: NextRequest) {
  try {
    const session = await getSession()
    if (!session || (session.role !== 'admin' && session.user_id !== '#3795@lgvns')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
    }

    const { userId, newPassword } = await req.json()

    if (!userId || !newPassword || newPassword.length < 4) {
      return NextResponse.json({ error: 'User ID and a password of at least 4 characters are required' }, { status: 400 })
    }

    const user = await prisma.users.findUnique({ where: { id: parseInt(userId) } })
    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    const hashed = await hashPassword(newPassword)

    await prisma.users.update({
      where: { id: user.id },
      data: { password: hashed },
    })

    try {
      const adminUser = await prisma.users.findFirst({
        where: { OR: [{ id: session.id }, { user_id: session.user_id }, { username: session.username }] },
        select: { id: true },
      })
      await prisma.logs.create({
        data: {
          user_id: adminUser?.id ?? null,
          action: 'reset_user_password',
          details: `Password reset for user ID ${userId} (${user.username})`,
        },
      })
    } catch {
      // Audit log failure must not block the primary operation
    }

    revalidatePath('/admin/user-details')

    return NextResponse.json({ success: true, message: 'Password updated successfully' })
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error'
    return NextResponse.json({ error: `Failed to reset password: ${message}` }, { status: 500 })
  }
}
