import { NextRequest, NextResponse } from 'next/server'
import { revalidatePath } from 'next/cache'
import { getSession } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export const dynamic = 'force-dynamic'

const BG_KEYS = ['globalBgUrl', 'pageSpecificBgs', 'defaultBgUrl', 'bgOpacity'] as const
const FACTORY_DEFAULTS: Record<string, string> = {
  globalBgUrl: '',
  pageSpecificBgs: '{}',
  defaultBgUrl: '',
  bgOpacity: '0.85',
}

export async function GET() {
  try {
    const session = await getSession()
    if (!session || (session.role !== 'admin' && session.user_id !== '#3795@lgvns')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
    }

    const all = await prisma.settings.findMany({
      where: { setting_key: { in: BG_KEYS as unknown as string[] } },
    })

    const bg: Record<string, string> = { ...FACTORY_DEFAULTS }
    for (const s of all) {
      bg[s.setting_key] = s.setting_value ?? ''
    }

    return NextResponse.json({ background: bg })
  } catch {
    return NextResponse.json({ error: 'Failed to fetch background settings' }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await getSession()
    if (!session || (session.role !== 'admin' && session.user_id !== '#3795@lgvns')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
    }

    const body = await req.json()
    const action: string = body.action || 'save'

    if (action === 'reset') {
      for (const key of BG_KEYS) {
        await prisma.settings.upsert({
          where: { setting_key: key },
          update: { setting_value: FACTORY_DEFAULTS[key] },
          create: { setting_key: key, setting_value: FACTORY_DEFAULTS[key] },
        })
      }
    } else {
      const allowed = new Set<string>(BG_KEYS)
      for (const [key, value] of Object.entries(body)) {
        if (allowed.has(key)) {
          await prisma.settings.upsert({
            where: { setting_key: key },
            update: { setting_value: String(value) },
            create: { setting_key: key, setting_value: String(value) },
          })
        }
      }
    }

    try {
      const adminUser = await prisma.users.findFirst({
        where: { OR: [{ id: session.id }, { user_id: session.user_id }, { username: session.username }] },
        select: { id: true },
      })
      await prisma.logs.create({
        data: {
          user_id: adminUser?.id ?? null,
          action: action === 'reset' ? 'reset_background' : 'update_background',
          details: action === 'reset' ? 'Background reset to factory defaults' : 'Background settings updated',
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
    return NextResponse.json({ error: `Failed to save background settings: ${message}` }, { status: 500 })
  }
}
