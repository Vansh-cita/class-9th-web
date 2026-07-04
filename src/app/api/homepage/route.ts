import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export const dynamic = 'force-dynamic'

export async function GET() {
  try {
    let config = await prisma.homepage_config.findFirst()
    if (!config) {
      config = await prisma.homepage_config.create({ data: { id: 1 } })
    }
    return NextResponse.json({ config })
  } catch {
    return NextResponse.json({ error: 'Failed to fetch config' }, { status: 500 })
  }
}
