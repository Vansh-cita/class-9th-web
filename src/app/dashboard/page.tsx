'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { motion } from 'framer-motion'

interface BookData {
  id: number
  title: string
  slug: string
  description: string | null
  subject: string | null
  thumbnail: string | null
  categories: { id: number; name: string; slug: string } | null
}

interface ChapterData {
  id: number
  title: string
  chapter_number: number
}

interface ProgressData {
  id: number
  book_id: number
  chapter_id: number | null
  last_page: number | null
  total_pages: number | null
  progress_percent: number | null
  last_read_at: string | null
  books: BookData
  chapters: ChapterData | null
}

interface BookmarkData {
  id: number
  book_id: number
  chapter_id: number | null
  page: number | null
  note: string | null
  created_at: string | null
  books: { id: number; title: string; slug: string }
  chapters: { id: number; title: string; chapter_number: number } | null
}

interface NotificationData {
  id: number
  title: string
  message: string | null
  type: string | null
  is_read: boolean | null
  created_at: string | null
}

interface CategoryData {
  id: number
  name: string
  slug: string
  icon: string | null
}

interface DashboardData {
  progress: ProgressData[]
  bookmarks: BookmarkData[]
  notifications: NotificationData[]
  recentBooks: BookData[]
  categories: CategoryData[]
}

export default function DashboardPage() {
  const router = useRouter()
  const [data, setData] = useState<DashboardData | null>(null)
  const [user, setUser] = useState<{ username: string; avatar: string | null } | null>(null)
  const [loading, setLoading] = useState(true)
  const [notifOpen, setNotifOpen] = useState(false)

  useEffect(() => {
    fetch('/api/auth/me')
      .then(r => r.json())
      .then(d => {
        if (d.user) setUser(d.user)
        else router.push('/login')
      })
      .catch(() => router.push('/login'))

    fetch('/api/dashboard')
      .then(r => r.json())
      .then(d => {
        if (!d.error) setData(d)
        setLoading(false)
      })
      .catch(() => setLoading(false))
  }, [router])

  async function markNotifRead(id: number) {
    await fetch('/api/notifications', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id }),
    })
    setData(prev => prev ? {
      ...prev,
      notifications: prev.notifications.map(n =>
        n.id === id ? { ...n, is_read: true } : n
      ),
    } : prev)
  }

  async function markAllRead() {
    await fetch('/api/notifications', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ markAll: true }),
    })
    setData(prev => prev ? {
      ...prev,
      notifications: prev.notifications.map(n => ({ ...n, is_read: true })),
    } : prev)
  }

  const unreadCount = data?.notifications.filter(n => !n.is_read).length || 0

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-[#FF0F7B] border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  const container = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: { staggerChildren: 0.05 },
    },
  }

  const item = {
    hidden: { opacity: 0, y: 15 },
    show: { opacity: 1, y: 0 },
  }

  return (
    <div className="min-h-screen pb-24">
      <div className="absolute inset-0 bg-gradient-to-b from-[#FF0F7B]/3 via-transparent to-[#050505] pointer-events-none" />

      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-center justify-between py-8"
        >
          <div>
            <h1 className="text-3xl font-bold">
              Welcome back, <span className="neon-text">{user?.username || 'Student'}</span>
            </h1>
            <p className="text-gray-400 text-sm mt-1">Here&apos;s your learning overview</p>
          </div>
          <button
            onClick={() => setNotifOpen(!notifOpen)}
            className="relative glass-card !p-3"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
            </svg>
            {unreadCount > 0 && (
              <span className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-[#FF0F7B] text-[10px] font-bold flex items-center justify-center">
                {unreadCount}
              </span>
            )}
          </button>
        </motion.div>

        {notifOpen && data && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="relative mb-8"
          >
            <div className="glass-card p-6 max-w-md ml-auto">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-semibold">Notifications</h3>
                {unreadCount > 0 && (
                  <button onClick={markAllRead} className="text-xs text-[#FF0F7B] hover:underline">
                    Mark all read
                  </button>
                )}
              </div>
              <div className="space-y-3 max-h-80 overflow-y-auto">
                {data.notifications.length === 0 && (
                  <p className="text-sm text-gray-500 text-center py-4">No notifications yet</p>
                )}
                {data.notifications.map(n => (
                  <div
                    key={n.id}
                    onClick={() => markNotifRead(n.id)}
                    className={`p-3 rounded-xl cursor-pointer transition-colors ${
                      n.is_read ? 'bg-white/5' : 'bg-[#FF0F7B]/10 border border-[#FF0F7B]/20'
                    }`}
                  >
                    <p className="text-sm font-medium">{n.title}</p>
                    {n.message && <p className="text-xs text-gray-400 mt-1">{n.message}</p>}
                    <p className="text-[10px] text-gray-600 mt-1">{n.created_at}</p>
                  </div>
                ))}
              </div>
            </div>
          </motion.div>
        )}

        <motion.div
          variants={container}
          initial="hidden"
          animate="show"
        >
          {data && data.progress.length > 0 && (
            <section className="mb-10">
              <h2 className="text-xl font-semibold mb-5 flex items-center gap-2">
                <span className="w-1.5 h-5 rounded-full bg-[#FF0F7B]" />
                Continue Reading
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {data.progress.map(p => (
                  <motion.div key={p.id} variants={item}>
                    <Link
                      href={p.chapter_id ? `/reader/${p.book_id}?chapter=${p.chapter_id}&page=${p.last_page || 1}` : `/books/${p.books.slug}`}
                      className="glass-card p-5 flex items-center gap-4 group"
                    >
                      <div className="w-12 h-12 rounded-xl bg-[#FF0F7B]/10 flex items-center justify-center shrink-0 group-hover:bg-[#FF0F7B]/20 transition-colors">
                        <span className="text-lg">{p.books.title.charAt(0)}</span>
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="font-medium truncate group-hover:text-[#FF0F7B] transition-colors">
                          {p.books.title}
                        </p>
                        {p.chapters && (
                          <p className="text-xs text-gray-500 mt-0.5">
                            Chapter {p.chapters.chapter_number}: {p.chapters.title}
                          </p>
                        )}
                        <div className="mt-2 w-full h-1.5 rounded-full bg-white/5 overflow-hidden">
                          <div
                            className="h-full rounded-full bg-gradient-to-r from-[#FF0F7B] to-[#9D4EDD]"
                            style={{ width: `${Math.min(p.progress_percent || 0, 100)}%` }}
                          />
                        </div>
                        <p className="text-[10px] text-gray-600 mt-1">
                          {Math.round(p.progress_percent || 0)}% complete
                        </p>
                      </div>
                    </Link>
                  </motion.div>
                ))}
              </div>
            </section>
          )}

          <section className="mb-10">
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-xl font-semibold flex items-center gap-2">
                <span className="w-1.5 h-5 rounded-full bg-[#FF0F7B]" />
                Latest Books
              </h2>
              <Link href="/books" className="text-sm text-[#FF0F7B] hover:underline">
                View All &rarr;
              </Link>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {(data?.recentBooks || []).map(book => (
                <motion.div key={book.id} variants={item}>
                  <Link href={`/books/${book.slug}`} className="glass-card p-5 block group">
                    <div className="w-11 h-11 rounded-xl bg-[#FF0F7B]/10 flex items-center justify-center mb-3 group-hover:bg-[#FF0F7B]/20 transition-colors">
                      <span className="text-base font-bold text-[#FF0F7B]">{book.title.charAt(0)}</span>
                    </div>
                    <h3 className="font-medium mb-1 group-hover:text-[#FF0F7B] transition-colors truncate">
                      {book.title}
                    </h3>
                    {book.description && (
                      <p className="text-xs text-gray-500 line-clamp-2">{book.description}</p>
                    )}
                    <div className="flex items-center gap-2 mt-3 text-[10px] text-gray-600">
                      <span>{book.subject || 'General'}</span>
                      {book.categories && <span>&middot; {book.categories.name}</span>}
                    </div>
                  </Link>
                </motion.div>
              ))}
            </div>
          </section>

          <section className="mb-10">
            <h2 className="text-xl font-semibold mb-5 flex items-center gap-2">
              <span className="w-1.5 h-5 rounded-full bg-gradient-to-b from-[#FF0F7B] to-[#9D4EDD]" />
              Categories
            </h2>
            <div className="flex flex-wrap gap-3">
              {(data?.categories || []).map(cat => (
                <motion.div key={cat.id} variants={item}>
                  <Link
                    href={`/books?category=${cat.slug}`}
                    className="glass-card !rounded-xl px-4 py-2.5 text-sm hover:border-[#FF0F7B]/30 transition-colors block"
                  >
                    {cat.name}
                  </Link>
                </motion.div>
              ))}
            </div>
          </section>

          {data && data.bookmarks.length > 0 && (
            <section className="mb-10">
              <h2 className="text-xl font-semibold mb-5 flex items-center gap-2">
                <span className="w-1.5 h-5 rounded-full bg-[#FF0F7B]" />
                Bookmarks
              </h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {data.bookmarks.slice(0, 6).map(bm => (
                  <motion.div key={bm.id} variants={item}>
                    <Link
                      href={bm.chapter_id
                        ? `/reader/${bm.book_id}?chapter=${bm.chapter_id}&page=${bm.page || 1}`
                        : `/books/${bm.books.slug}`
                      }
                      className="glass-card !rounded-xl p-4 flex items-start gap-3 group"
                    >
                      <svg className="w-4 h-4 mt-0.5 shrink-0 text-[#FF0F7B]" fill="currentColor" viewBox="0 0 20 20">
                        <path d="M5 4a2 2 0 012-2h6a2 2 0 012 2v14l-5-2.5L5 18V4z" />
                      </svg>
                      <div className="min-w-0">
                        <p className="text-sm font-medium truncate group-hover:text-[#FF0F7B] transition-colors">
                          {bm.books.title}
                        </p>
                        {bm.chapters && (
                          <p className="text-xs text-gray-500 mt-0.5">
                            Ch {bm.chapters.chapter_number} &middot; Page {bm.page || 1}
                          </p>
                        )}
                        {bm.note && (
                          <p className="text-xs text-gray-600 mt-1 italic">&ldquo;{bm.note}&rdquo;</p>
                        )}
                      </div>
                    </Link>
                  </motion.div>
                ))}
              </div>
              {data.bookmarks.length > 6 && (
                <div className="mt-4 text-center">
                  <Link href="/bookmarks" className="text-sm text-[#FF0F7B] hover:underline">
                    View all {data.bookmarks.length} bookmarks &rarr;
                  </Link>
                </div>
              )}
            </section>
          )}

          {(!data || (!data.progress.length && !data.bookmarks.length && !data.recentBooks.length && !data.categories.length)) && (
            <div className="glass-card p-6 sm:p-12 text-center">
              <div className="text-5xl mb-4">📚</div>
              <h2 className="text-xl font-semibold mb-2">Welcome to Your Dashboard</h2>
              <p className="text-gray-400 text-sm max-w-md mx-auto mb-6">
                Start by exploring books and tracking your reading progress. Everything you need is just a click away.
              </p>
              <Link href="/books" className="btn-primary mandala-btn">
                Browse Books
              </Link>
            </div>
          )}
        </motion.div>
      </div>
    </div>
  )
}
