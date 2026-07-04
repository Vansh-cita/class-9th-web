'use client'

import Link from 'next/link'
import { useState, useEffect } from 'react'
import { usePathname, useRouter } from 'next/navigation'
import AnnouncementModal from './AnnouncementModal'
import ReferralCodeModal from './ReferralCodeModal'

export default function Navbar() {
  const [scrolled, setScrolled] = useState(false)
  const [menuOpen, setMenuOpen] = useState(false)
  const [user, setUser] = useState<{ username: string; role: string } | null>(null)
  const [announcementsOpen, setAnnouncementsOpen] = useState(false)
  const [referralOpen, setReferralOpen] = useState(false)
  const [unreadCount, setUnreadCount] = useState(0)
  const [siteName, setSiteName] = useState('CBSE Class 9')
  const pathname = usePathname() ?? ''
  const isHome = pathname === '/'
  const router = useRouter()

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 20)
    window.addEventListener('scroll', handleScroll)
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  useEffect(() => {
    fetch('/api/auth/me')
      .then(r => r.json())
      .then(d => { if (d.user) setUser(d.user) })
      .catch(() => {})
  }, [pathname])

  useEffect(() => {
    fetch('/api/settings')
      .then(r => r.json())
      .then(d => { if (d.settings?.site_name) setSiteName(d.settings.site_name) })
      .catch(() => {})
  }, [pathname])

  useEffect(() => {
    if (!user) { setUnreadCount(0); return }
    fetch('/api/notifications')
      .then(r => r.json())
      .then(d => { if (typeof d.unreadCount === 'number') setUnreadCount(d.unreadCount) })
      .catch(() => {})
  }, [user, announcementsOpen])

  const handleLogout = async () => {
    await fetch('/api/auth/logout', { method: 'POST' })
    setUser(null)
    setMenuOpen(false)
    router.push('/')
    router.refresh()
  }

  const dashboardHref = user?.role === 'admin' ? '/admin/dashboard' : '/dashboard'

  return (
    <>
      <nav
        className={`sticky top-0 z-50 backdrop-blur-md bg-black/70 border-b border-neutral-800 transition-all duration-300 ${
          scrolled ? 'shadow-lg shadow-black/20' : ''
        }`}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <Link href="/" className="flex items-center gap-2">
              <span className="text-xl font-bold neon-text">{siteName}</span>
            </Link>

            <div className="hidden md:flex items-center gap-6">
              <Link
                href="/"
                className={`text-sm transition-colors ${
                  pathname === '/' ? 'text-[#FF0F7B]' : 'text-gray-400 hover:text-white'
                }`}
              >
                Home
              </Link>
              <Link
                href="/books"
                className={`text-sm transition-colors ${
                  pathname.startsWith('/books') ? 'text-[#FF0F7B]' : 'text-gray-400 hover:text-white'
                }`}
              >
                Books
              </Link>
              <Link
                href="/search"
                className={`text-sm transition-colors ${
                  pathname === '/search' ? 'text-[#FF0F7B]' : 'text-gray-400 hover:text-white'
                }`}
              >
                Search
              </Link>
              <Link
                href="/faq"
                className={`text-sm transition-colors ${
                  pathname === '/faq' ? 'text-[#FF0F7B]' : 'text-gray-400 hover:text-white'
                }`}
              >
                FAQ
              </Link>

              <div className="flex items-center gap-1.5 ml-4">
                <button
                  onClick={() => setAnnouncementsOpen(true)}
                  className="relative p-2 rounded-xl text-gray-400 hover:text-white hover:bg-white/5 transition-all active:scale-95"
                  title="Announcements"
                >
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M14.857 17.082a23.848 23.848 0 005.454-1.31A8.967 8.967 0 0118 9.75v-.7V9A6 6 0 006 9v.75a8.967 8.967 0 01-2.312 6.022c1.733.64 3.56 1.085 5.455 1.31m5.714 0a24.255 24.255 0 01-5.714 0m5.714 0a3 3 0 11-5.714 0" />
                  </svg>
                  {unreadCount > 0 && (
                    <span className="absolute -top-0.5 -right-0.5 w-4 h-4 rounded-full bg-[#FF0F7B] text-[9px] font-bold text-white flex items-center justify-center shadow-lg shadow-[#FF0F7B]/30">
                      {unreadCount > 9 ? '9+' : unreadCount}
                    </span>
                  )}
                </button>
                <button
                  onClick={() => setReferralOpen(true)}
                  className="p-2 rounded-xl text-gray-400 hover:text-white hover:bg-white/5 transition-all active:scale-95"
                  title="Secret Access"
                >
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M6 6l6 6-6 6M12 18h6" />
                  </svg>
                </button>
              </div>

              {user ? (
                <div className="flex items-center gap-3">
                  <Link href={dashboardHref} className="btn-outline text-sm !py-2 !px-5">
                    Dashboard
                  </Link>
                  <button onClick={handleLogout} className="btn-primary text-sm !py-2 !px-5">
                    Logout
                  </button>
                </div>
              ) : (
                <div className="flex items-center gap-3">
                  <Link href="/login" className="btn-outline text-sm !py-2 !px-5">
                    Login
                  </Link>
                  <Link href="/register" className="btn-primary text-sm !py-2 !px-5">
                    Register
                  </Link>
                </div>
              )}
            </div>

            <button
              className="md:hidden text-white p-3 -mr-1"
              onClick={() => setMenuOpen(!menuOpen)}
            >
              <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                {menuOpen ? (
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                ) : (
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                )}
              </svg>
            </button>
          </div>
        </div>

          {menuOpen && (
            <div className="md:hidden glass border-t border-white/5">
              <div className="px-4 py-4 space-y-1">
                <Link href="/" className="block text-gray-400 hover:text-white py-3.5 px-3 rounded-xl hover:bg-white/5 transition-colors" onClick={() => setMenuOpen(false)}>
                  Home
                </Link>
                <Link href="/books" className="block text-gray-400 hover:text-white py-3.5 px-3 rounded-xl hover:bg-white/5 transition-colors" onClick={() => setMenuOpen(false)}>
                  Books
                </Link>
                <Link href="/search" className="block text-gray-400 hover:text-white py-3.5 px-3 rounded-xl hover:bg-white/5 transition-colors" onClick={() => setMenuOpen(false)}>
                  Search
                </Link>
                <Link href="/faq" className="block text-gray-400 hover:text-white py-3.5 px-3 rounded-xl hover:bg-white/5 transition-colors" onClick={() => setMenuOpen(false)}>
                  FAQ
                </Link>

              <div className="flex items-center gap-2 pt-2 pb-1 border-t border-white/5">
                <button
                  onClick={() => { setAnnouncementsOpen(true); setMenuOpen(false) }}
                  className="relative flex items-center gap-2 text-sm text-gray-400 hover:text-white py-3 flex-1 justify-center rounded-xl hover:bg-white/5 transition-colors"
                >
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M14.857 17.082a23.848 23.848 0 005.454-1.31A8.967 8.967 0 0118 9.75v-.7V9A6 6 0 006 9v.75a8.967 8.967 0 01-2.312 6.022c1.733.64 3.56 1.085 5.455 1.31m5.714 0a24.255 24.255 0 01-5.714 0m5.714 0a3 3 0 11-5.714 0" />
                  </svg>
                  Announcements
                  {unreadCount > 0 && (
                    <span className="w-3.5 h-3.5 rounded-full bg-[#FF0F7B] text-[8px] font-bold text-white flex items-center justify-center">
                      {unreadCount > 9 ? '9+' : unreadCount}
                    </span>
                  )}
                </button>
                <button
                  onClick={() => { setReferralOpen(true); setMenuOpen(false) }}
                  className="flex items-center gap-2 text-sm text-gray-400 hover:text-white py-3 flex-1 justify-center rounded-xl hover:bg-white/5 transition-colors"
                >
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M6 6l6 6-6 6M12 18h6" />
                  </svg>
                  Secret Access
                </button>
              </div>

              {user ? (
                <div className="flex flex-col gap-2 pt-2 border-t border-white/5">
                  <Link href={dashboardHref} className="btn-outline text-sm !py-2 !px-5 text-center" onClick={() => setMenuOpen(false)}>
                    Dashboard
                  </Link>
                  <button onClick={handleLogout} className="btn-primary text-sm !py-2 !px-5 text-center">
                    Logout
                  </button>
                </div>
              ) : (
                <div className="flex gap-3 pt-2 border-t border-white/5">
                  <Link href="/login" className="btn-outline text-sm !py-2 !px-5 flex-1 text-center" onClick={() => setMenuOpen(false)}>
                    Login
                  </Link>
                  <Link href="/register" className="btn-primary text-sm !py-2 !px-5 flex-1 text-center" onClick={() => setMenuOpen(false)}>
                    Register
                  </Link>
                </div>
              )}
            </div>
          </div>
        )}
      </nav>

      <AnnouncementModal open={announcementsOpen} onClose={() => setAnnouncementsOpen(false)} />
      <ReferralCodeModal open={referralOpen} onClose={() => setReferralOpen(false)} />
    </>
  )
}
