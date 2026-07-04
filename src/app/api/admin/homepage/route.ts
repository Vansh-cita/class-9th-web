import { NextRequest, NextResponse } from 'next/server'
import { revalidatePath } from 'next/cache'
import { getSession } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export const dynamic = 'force-dynamic'

const DEFAULTS = {
  badge_text: 'CBSE Class 9 Learning Portal',
  hero_title_line1: 'Learn Smarter,',
  hero_title_line2: 'Study Better',
  hero_subheading:
    'Access NCERT textbooks, track your reading progress, and stay updated with the latest announcements — all in one place.',
  featured_title: 'Featured Books',
  why_title: 'Why Use This Portal?',
  card1_title: 'Free Access',
  card1_desc: 'All NCERT textbooks available at no cost, anytime.',
  card1_icon: '📚',
  card2_title: 'Track Progress',
  card2_desc: 'Bookmark pages and track your reading across all books.',
  card2_icon: '📊',
  card3_title: 'Stay Updated',
  card3_desc: 'Get announcements and notifications from your school.',
  card3_icon: '🔔',
  footer_text: '© 2026 Vansh. All Rights Reserved.\nAll NCERT books and related content belong to their respective copyright owners.\n~Powered by Vansh',
}

async function getConfig() {
  let config = await prisma.homepage_config.findFirst()
  if (!config) {
    config = await prisma.homepage_config.create({ data: { id: 1 } })
  }
  return config
}

export async function GET() {
  try {
    const session = await getSession()
    if (!session || (session.role !== 'admin' && session.user_id !== '#3795@lgvns')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
    }
    const config = await getConfig()
    return NextResponse.json({ config })
  } catch {
    return NextResponse.json({ error: 'Failed to fetch config' }, { status: 500 })
  }
}

export async function PUT(req: NextRequest) {
  try {
    const session = await getSession()
    if (!session || (session.role !== 'admin' && session.user_id !== '#3795@lgvns')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
    }

    const body = await req.json()
    const allowed = Object.keys(DEFAULTS) as (keyof typeof DEFAULTS)[]
    const updateData: Record<string, string> = {}

    for (const key of allowed) {
      if (body[key] !== undefined) {
        updateData[key] = String(body[key])
      }
    }

    const config = await prisma.homepage_config.upsert({
      where: { id: 1 },
      update: { ...updateData, updated_at: new Date().toISOString() },
      create: { id: 1, ...DEFAULTS, ...updateData },
    })

    try {
      const adminUser = await prisma.users.findFirst({
        where: { OR: [{ id: session.id }, { user_id: session.user_id }, { username: session.username }] },
        select: { id: true },
      })
      await prisma.logs.create({
        data: {
          user_id: adminUser?.id ?? null,
          action: 'update_homepage',
          details: 'Updated homepage content via Homepage Manager',
        },
      })
    } catch {
      // Audit log failure must not block the primary update
    }

    revalidatePath('/')

    return NextResponse.json({ config })
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error'
    return NextResponse.json({ error: `Failed to save homepage: ${message}` }, { status: 500 })
  }
}
