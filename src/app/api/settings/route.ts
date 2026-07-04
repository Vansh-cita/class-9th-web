import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export const dynamic = 'force-dynamic'

export async function GET() {
  try {
    const all = await prisma.settings.findMany()
    const settings: Record<string, string | null> = {}
    for (const s of all) {
      settings[s.setting_key] = s.setting_value
    }
    return NextResponse.json({ settings })
  } catch {
    return NextResponse.json({ settings: {} })
  }
}
