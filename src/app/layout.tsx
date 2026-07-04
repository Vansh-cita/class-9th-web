import type { Metadata } from 'next'
import { Outfit, Inter } from 'next/font/google'
import './globals.css'
import Navbar from '@/components/Navbar'
import Footer from '@/components/Footer'

const outfit = Outfit({
  subsets: ['latin'],
  variable: '--font-outfit',
  display: 'swap',
})

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-inter',
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

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" className={`${outfit.variable} ${inter.variable}`}>
      <body className="min-h-screen w-full flex flex-col bg-neutral-950">
        <Navbar />
        <main className="flex-1 flex flex-col">
          {children}
        </main>
        <Footer />
      </body>
    </html>
  )
}
