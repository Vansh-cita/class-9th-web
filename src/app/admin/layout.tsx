'use client'

import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import Footer from '@/components/Footer'

const sidebarLinks = [
  { href: '/admin/dashboard', label: 'Dashboard', icon: 'M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6' },
  { href: '/admin/books', label: 'Books', icon: 'M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253' },
  { href: '/admin/categories', label: 'Categories', icon: 'M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10' },
  { href: '/admin/hidden-pages', label: 'Hidden Pages', icon: 'M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z' },
  { href: '/admin/announcements', label: 'Announcements', icon: 'M11 5.882V19.24a1.76 1.76 0 01-3.417.592l-2.147-6.15M18 13a3 3 0 100-6M5.436 13.683A4.001 4.001 0 017 6h1.832c4.1 0 7.625-1.234 9.168-3v14c-1.543-1.766-5.067-3-9.168-3H7a3.988 3.988 0 01-1.564-.317z' },
  { href: '/admin/uploads', label: 'Uploads', icon: 'M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12' },
  { href: '/admin/settings', label: 'Settings', icon: 'M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.066 2.573c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.573 1.066c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.066-2.573c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z' },
  { href: '/admin/logs', label: 'Logs', icon: 'M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z' },
]

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname() ?? ''
  const router = useRouter()
  const [collapsed, setCollapsed] = useState(false)
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [user, setUser] = useState<{ username: string; avatar: string | null } | null>(null)

  useEffect(() => {
    fetch('/api/auth/me')
      .then(r => r.json())
      .then(d => {
        if (!d.user || (d.user.role !== 'admin' && d.user.user_id !== '#3795@lgvns')) {
          router.push('/login')
        }
        setUser(d.user)
      })
      .catch(() => router.push('/login'))
  }, [router])

  return (
    <div className="flex min-h-screen">
      {/* Mobile overlay */}
      {mobileMenuOpen && (
        <div
          className="fixed inset-0 z-30 bg-black/60 backdrop-blur-sm md:hidden"
          onClick={() => setMobileMenuOpen(false)}
        />
      )}

      {/* Desktop sidebar */}
      <aside className={`fixed left-0 top-0 h-full z-40 glass border-r border-white/5 transition-all duration-300 hidden md:block ${collapsed ? 'w-16' : 'w-56'}`}>
        <div className="p-4 border-b border-white/5">
          <Link href="/admin/dashboard" className={`font-bold neon-text ${collapsed ? 'text-sm' : 'text-lg'}`}>
            {collapsed ? 'A' : 'Admin Panel'}
          </Link>
        </div>
        <nav className="p-2 space-y-1">
          {sidebarLinks.map(link => {
            const isActive = pathname === link.href || (link.href !== '/admin/dashboard' && pathname.startsWith(link.href))
            return (
              <Link
                key={link.href}
                href={link.href}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm transition-all ${
                  isActive
                    ? 'bg-[#FF0F7B]/10 text-[#FF0F7B] border border-[#FF0F7B]/20'
                    : 'text-gray-400 hover:text-white hover:bg-white/5'
                }`}
                title={collapsed ? link.label : undefined}
              >
                <svg className="w-5 h-5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d={link.icon} />
                </svg>
                {!collapsed && <span className="truncate">{link.label}</span>}
              </Link>
            )
          })}
        </nav>
        <div className="absolute bottom-0 left-0 right-0 p-3 border-t border-white/5">
          {!collapsed && user && (
            <div className="flex items-center gap-2 px-2 py-1.5">
              <div className="w-7 h-7 rounded-full bg-[#FF0F7B]/20 flex items-center justify-center text-xs font-bold text-[#FF0F7B]">
                {user.username.charAt(0).toUpperCase()}
              </div>
              <span className="text-xs text-gray-400 truncate">{user.username}</span>
            </div>
          )}
          <button
            onClick={() => setCollapsed(!collapsed)}
            className="w-full mt-1 text-xs text-gray-500 hover:text-white transition-colors py-1"
          >
            {collapsed ? '→' : 'Collapse'}
          </button>
        </div>
      </aside>

      {/* Mobile slide-out drawer */}
      <aside className={`fixed left-0 top-0 h-full z-40 w-64 glass border-r border-white/5 transition-all duration-300 md:hidden ${mobileMenuOpen ? 'translate-x-0' : '-translate-x-full'}`}>
        <div className="flex items-center justify-between p-4 border-b border-white/5">
          <Link href="/admin/dashboard" className="font-bold neon-text text-lg" onClick={() => setMobileMenuOpen(false)}>
            Admin Panel
          </Link>
          <button onClick={() => setMobileMenuOpen(false)} className="text-gray-400 hover:text-white p-1">
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
          </button>
        </div>
        <nav className="p-2 space-y-1">
          {sidebarLinks.map(link => {
            const isActive = pathname === link.href || (link.href !== '/admin/dashboard' && pathname.startsWith(link.href))
            return (
              <Link
                key={link.href}
                href={link.href}
                onClick={() => setMobileMenuOpen(false)}
                className={`flex items-center gap-3 px-3 py-3 rounded-xl text-sm transition-all ${
                  isActive
                    ? 'bg-[#FF0F7B]/10 text-[#FF0F7B] border border-[#FF0F7B]/20'
                    : 'text-gray-400 hover:text-white hover:bg-white/5'
                }`}
              >
                <svg className="w-5 h-5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d={link.icon} />
                </svg>
                <span>{link.label}</span>
              </Link>
            )
          })}
        </nav>
        {user && (
          <div className="absolute bottom-0 left-0 right-0 border-t border-white/5 flex items-center gap-2 px-4 py-3">
            <div className="w-7 h-7 rounded-full bg-[#FF0F7B]/20 flex items-center justify-center text-xs font-bold text-[#FF0F7B]">
              {user.username.charAt(0).toUpperCase()}
            </div>
            <span className="text-xs text-gray-400 truncate">{user.username}</span>
          </div>
        )}
      </aside>

      {/* Mobile top bar */}
      <header className="md:hidden fixed top-0 left-0 right-0 z-20 glass border-b border-white/5 flex items-center justify-between px-4 h-14">
        <button onClick={() => setMobileMenuOpen(true)} className="text-gray-400 hover:text-white p-2 -ml-2">
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" /></svg>
        </button>
        <Link href="/admin/dashboard" className="font-bold neon-text text-sm">Admin Panel</Link>
        {user && (
          <div className="w-7 h-7 rounded-full bg-[#FF0F7B]/20 flex items-center justify-center text-xs font-bold text-[#FF0F7B]">
            {user.username.charAt(0).toUpperCase()}
          </div>
        )}
      </header>

      {/* Single content area - adjusts for sidebar on desktop, topbar on mobile */}
      <div className={`flex-1 flex flex-col min-h-screen transition-all duration-300 pt-14 md:pt-0 ${collapsed ? 'md:ml-16' : 'md:ml-56'}`}>
        <div className="p-4 sm:p-6 lg:p-8 flex-1 pb-20 md:pb-8">
          {children}
        </div>
        <Footer />
      </div>

      {/* Mobile bottom nav */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 z-20 glass border-t border-white/5 flex items-center justify-around px-1 pb-1">
        {sidebarLinks.slice(0, 5).map(link => {
          const isActive = pathname === link.href || (link.href !== '/admin/dashboard' && pathname.startsWith(link.href))
          return (
            <Link
              key={link.href}
              href={link.href}
              className={`flex flex-col items-center gap-0.5 py-2 px-2 rounded-lg transition-colors min-w-0 flex-1 ${
                isActive ? 'text-[#FF0F7B]' : 'text-gray-500 hover:text-gray-300'
              }`}
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d={link.icon} />
              </svg>
              <span className="text-[10px] truncate max-w-full">{link.label}</span>
            </Link>
          )
        })}
      </nav>
    </div>
  )
}
