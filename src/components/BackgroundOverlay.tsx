'use client'

import { usePathname } from 'next/navigation'
import { useMemo } from 'react'

interface BackgroundOverlayProps {
  globalBgUrl: string
  defaultBgUrl: string
  bgOpacity: number
  pageSpecificBgs: string
}

export default function BackgroundOverlay({
  globalBgUrl,
  defaultBgUrl,
  bgOpacity,
  pageSpecificBgs,
}: BackgroundOverlayProps) {
  const pathname = usePathname()

  const activeBgUrl = useMemo(() => {
    try {
      const parsed: Record<string, string> = JSON.parse(pageSpecificBgs || '{}')
      for (const [route, url] of Object.entries(parsed)) {
        if (route && url && pathname?.startsWith(route)) {
          return url
        }
      }
    } catch {
      // Invalid JSON — fall through to global
    }
    return globalBgUrl || defaultBgUrl || ''
  }, [pathname, globalBgUrl, defaultBgUrl, pageSpecificBgs])

  if (!activeBgUrl) return null

  return (
    <div
      className="has-custom-bg fixed inset-0 z-0 bg-cover bg-center bg-no-repeat transition-all duration-300 pointer-events-none"
      style={{
        backgroundImage: `url(${activeBgUrl})`,
        opacity: bgOpacity,
      }}
    />
  )
}
