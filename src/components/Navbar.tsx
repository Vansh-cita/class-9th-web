'use client'

import Link from 'next/link'
import { useState, useEffect } from 'react'
import { usePathname, useRouter } from 'next/navigation'

export default function Navbar() {
  const [scrolled, setScrolled] = useState(false)
  const [menuOpen, setMenuOpen] = useState(false)
  const [user, setUser] = useState<{ username: string; role: string } | null>(null)
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

  const handleLogout = async () => {
    await fetch('/api/auth/logout', { method: 'POST' })
    setUser(null)
    setMenuOpen(false)
    router.push('/')
    router.refresh()
  }

  const dashboardHref = user?.role === 'admin' ? '/admin/dashboard' : '/dashboard'

  return (
    <nav
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
        scrolled || !isHome
          ? 'glass shadow-lg shadow-black/20'
          : 'bg-transparent'
      }`}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <Link href="/" className="flex items-center gap-2">
            <span className="text-xl font-bold neon-text">CBSE Class 9</span>
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
            {user ? (
              <div className="flex items-center gap-3 ml-4">
                <Link href={dashboardHref} className="btn-outline text-sm !py-2 !px-5">
                  Dashboard
                </Link>
                <button onClick={handleLogout} className="btn-primary text-sm !py-2 !px-5">
                  Logout
                </button>
              </div>
            ) : (
              <div className="flex items-center gap-3 ml-4">
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
            className="md:hidden text-white p-2"
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
          <div className="px-4 py-4 space-y-3">
            <Link href="/" className="block text-gray-400 hover:text-white py-2" onClick={() => setMenuOpen(false)}>
              Home
            </Link>
            <Link href="/books" className="block text-gray-400 hover:text-white py-2" onClick={() => setMenuOpen(false)}>
              Books
            </Link>
            <Link href="/search" className="block text-gray-400 hover:text-white py-2" onClick={() => setMenuOpen(false)}>
              Search
            </Link>
            <Link href="/faq" className="block text-gray-400 hover:text-white py-2" onClick={() => setMenuOpen(false)}>
              FAQ
            </Link>
            {user ? (
              <div className="flex flex-col gap-2 pt-2">
                <Link href={dashboardHref} className="btn-outline text-sm !py-2 !px-5 text-center" onClick={() => setMenuOpen(false)}>
                  Dashboard
                </Link>
                <button onClick={handleLogout} className="btn-primary text-sm !py-2 !px-5 text-center">
                  Logout
                </button>
              </div>
            ) : (
              <div className="flex gap-3 pt-2">
                <Link href="/login" className="btn-outline text-sm !py-2 !px-5" onClick={() => setMenuOpen(false)}>
                  Login
                </Link>
                <Link href="/register" className="btn-primary text-sm !py-2 !px-5" onClick={() => setMenuOpen(false)}>
                  Register
                </Link>
              </div>
            )}
          </div>
        </div>
      )}
    </nav>
  )
}
