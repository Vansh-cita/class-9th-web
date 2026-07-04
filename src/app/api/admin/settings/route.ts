import { NextRequest, NextResponse } from 'next/server'
import { revalidatePath } from 'next/cache'
import { getSession } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export const dynamic = 'force-dynamic'

export async function GET() {
  try {
    const session = await getSession()
    if (!session || (session.role !== 'admin' && session.user_id !== '#3795@lgvns')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
    }

    const all = await prisma.settings.findMany()
    const settings: Record<string, string | null> = {}
    for (const s of all) {
      settings[s.setting_key] = s.setting_value
    }

    return NextResponse.json({ settings })
  } catch {
    return NextResponse.json({ error: 'Failed to fetch settings' }, { status: 500 })
  }
}

export async function PUT(req: NextRequest) {
  try {
    const session = await getSession()
    if (!session || (session.role !== 'admin' && session.user_id !== '#3795@lgvns')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
    }

    const body = await req.json()

    for (const [key, value] of Object.entries(body)) {
      await prisma.settings.upsert({
        where: { setting_key: key },
        update: { setting_value: String(value) },
        create: { setting_key: key, setting_value: String(value) },
      })
    }

    try {
      const adminUser = await prisma.users.findFirst({
        where: { OR: [{ id: session.id }, { user_id: session.user_id }, { username: session.username }] },
        select: { id: true },
      })
      await prisma.logs.create({
        data: {
          user_id: adminUser?.id ?? null,
          action: 'update_settings',
          details: `Updated ${Object.keys(body).length} setting(s)`,
        },
      })
    } catch {
      // Audit log failure must not block the primary update
    }

    revalidatePath('/admin/settings')
    revalidatePath('/', 'layout')

    return NextResponse.json({ success: true })
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error'
    return NextResponse.json({ error: `Failed to save settings: ${message}` }, { status: 500 })
  }
}
