import type { Metadata } from 'next'
import { Plus_Jakarta_Sans } from 'next/font/google'
import './globals.css'
import Navbar from '@/components/Navbar'
import Footer from '@/components/Footer'
import BackgroundOverlay from '@/components/BackgroundOverlay'
import { prisma } from '@/lib/prisma'

const plusJakartaSans = Plus_Jakarta_Sans({
  subsets: ['latin'],
  variable: '--font-plus-jakarta',
  display: 'swap',
})

export const metadata: Metadata = {
  metadataBase: new URL('https://9th.tvnxh.xyz'),
  title: {
    default: 'CBSE Class 9 Learning Portal | Notes, Syllabus & Prep',
    template: '%s | CBSE Class 9 Portal',
  },
  description: 'The ultimate study resource for CBSE Class 9 students. Access comprehensive study notes, latest syllabus updates, chapter-wise solutions, and interactive preparation materials.',
  keywords: ['CBSE Class 9', 'Class 9 notes', 'Class 9 syllabus', '9th class study material', 'CBSE exam prep'],
  authors: [{ name: 'Class 9th Web Team' }],
  creator: 'Class 9th Web Team',
  openGraph: {
    type: 'website',
    locale: 'en_IN',
    url: 'https://9th.tvnxh.xyz',
    title: 'CBSE Class 9 Learning Portal - Notes & Syllabus',
    description: 'Access comprehensive study notes, latest syllabus updates, and interactive preparation materials for CBSE Class 9.',
    siteName: 'CBSE Class 9 Portal',
    images: [
      {
        url: '/icon.png?v=4',
        width: 512,
        height: 512,
        alt: 'CBSE Class 9 Portal Logo',
      },
    ],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
  icons: {
    icon: '/icon.png?v=4',
  },
}

async function getBgSettings() {
  try {
    const keys = ['globalBgUrl', 'defaultBgUrl', 'bgOpacity', 'pageSpecificBgs']
    const rows = await prisma.settings.findMany({
      where: { setting_key: { in: keys } },
    })
    const map: Record<string, string> = {}
    for (const r of rows) {
      map[r.setting_key] = r.setting_value ?? ''
    }
    return map
  } catch {
    return {}
  }
}

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const bg = await getBgSettings()

  return (
    <html lang="en" className={`${plusJakartaSans.variable} w-full max-w-full overflow-x-hidden relative`}>
      <body className="min-h-screen w-full max-w-full overflow-x-hidden relative flex flex-col">
        <BackgroundOverlay
          globalBgUrl={bg.globalBgUrl || ''}
          defaultBgUrl={bg.defaultBgUrl || ''}
          bgOpacity={Math.min(1, Math.max(0, parseFloat(bg.bgOpacity || '0.85')))}
          pageSpecificBgs={bg.pageSpecificBgs || '{}'}
        />
        <Navbar />
        <main className="flex-1 flex flex-col w-full max-w-full overflow-x-hidden relative">
          {children}
        </main>
        <Footer />
      </body>
    </html>
  )
}
