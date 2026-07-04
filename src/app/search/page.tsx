'use client'

import { useEffect, useState, useCallback } from 'react'
import Link from 'next/link'
import { motion } from 'framer-motion'
import { SkeletonSearchBookCard, SkeletonCategoryChip, SkeletonAnnouncementItem } from '@/components/Skeleton'

interface Category { id: number; name: string; slug: string; description: string | null }
interface Book { id: number; title: string; slug: string; description: string | null; subject: string | null; author: string | null; categories: Category | null }
interface Announcement { id: number; title: string; content: string; type: string | null; created_at: string | null; users: { username: string } | null }

export default function SearchPage() {
  const [query, setQuery] = useState('')
  const [results, setResults] = useState<{ books: Book[]; categories: Category[]; announcements: Announcement[] } | null>(null)
  const [searched, setSearched] = useState(false)
  const [loading, setLoading] = useState(false)

  const doSearch = useCallback(async (q: string) => {
    if (!q.trim()) { setResults(null); setSearched(false); return }
    setLoading(true)
    setSearched(true)
    try {
      const res = await fetch(`/api/search?q=${encodeURIComponent(q)}`)
      const d = await res.json()
      if (!d.error) setResults(d)
    } catch { /* ignore */ }
    setLoading(false)
  }, [])

  useEffect(() => {
    const timer = setTimeout(() => doSearch(query), 250)
    return () => clearTimeout(timer)
  }, [query, doSearch])

  const total = results
    ? results.books.length + results.categories.length + results.announcements.length
    : 0

  const container = { hidden: { opacity: 0 }, show: { opacity: 1, transition: { staggerChildren: 0.03 } } }
  const item = { hidden: { opacity: 0, y: 12 }, show: { opacity: 1, y: 0 } }

  return (
    <div className="min-h-screen pb-24">
      <div className="absolute inset-0 bg-gradient-to-b from-[#FF0F7B]/3 via-transparent to-[#050505] pointer-events-none" />
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[600px] h-[600px] bg-[#00D4FF]/5 rounded-full blur-[150px] pointer-events-none" />
      <div className="relative z-10 max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} className="py-8">
          <h1 className="text-3xl font-bold mb-2">Search</h1>
          <p className="text-gray-400 text-sm mb-6">Find books, categories, and announcements across the platform</p>

          <div className="relative max-w-2xl mx-auto mb-10">
            <svg className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            <input value={query} onChange={e => setQuery(e.target.value)} autoFocus
              className="w-full bg-white/5 border border-white/10 rounded-2xl pl-12 pr-10 py-4 text-base text-white placeholder-gray-500 focus:border-[#FF0F7B] focus:outline-none transition-all"
              placeholder="Type to search books, categories, announcements..." />
            {loading && (
              <div className="absolute right-4 top-1/2 -translate-y-1/2">
                <div className="w-5 h-5 border-2 border-[#FF0F7B] border-t-transparent rounded-full animate-spin" />
              </div>
            )}
          </div>

          {searched && loading && (
            <motion.div variants={container} initial="hidden" animate="show" className="space-y-10">
              <section>
                <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
                  <span className="w-1 h-4 rounded-full bg-[#FF0F7B]" />
                  Books
                </h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {Array.from({ length: 3 }).map((_, i) => <SkeletonSearchBookCard key={i} />)}
                </div>
              </section>
              <section>
                <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
                  <span className="w-1 h-4 rounded-full bg-[#00D4FF]" />
                  Categories
                </h2>
                <div className="flex flex-wrap gap-3">
                  {Array.from({ length: 4 }).map((_, i) => <SkeletonCategoryChip key={i} />)}
                </div>
              </section>
              <section>
                <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
                  <span className="w-1 h-4 rounded-full bg-[#00FF88]" />
                  Announcements
                </h2>
                <div className="space-y-3">
                  {Array.from({ length: 2 }).map((_, i) => <SkeletonAnnouncementItem key={i} />)}
                </div>
              </section>
            </motion.div>
          )}

          {searched && !loading && total === 0 && (
            <div className="text-center py-16">
              <div className="text-5xl mb-4">🔍</div>
              <h2 className="text-xl font-semibold mb-2">No results found</h2>
              <p className="text-gray-400 text-sm">Try a different search term or browse categories</p>
            </div>
          )}

          {results && !loading && total > 0 && (
            <motion.div variants={container} initial="hidden" animate="show" className="space-y-10">
              {results.books.length > 0 && (
                <section>
                  <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
                    <span className="w-1 h-4 rounded-full bg-[#FF0F7B]" />
                    Books ({results.books.length})
                  </h2>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                    {results.books.map(book => (
                      <motion.div key={book.id} variants={item}>
                        <Link href={`/books/${book.slug}`} className="glass-card p-4 block group">
                          <h3 className="font-medium text-sm group-hover:text-[#FF0F7B] transition-colors truncate">{book.title}</h3>
                          {book.description && <p className="text-xs text-gray-500 mt-1 line-clamp-2">{book.description}</p>}
                          <div className="flex items-center gap-2 mt-2 text-[10px] text-gray-600">
                            <span>{book.subject || 'General'}</span>
                            {book.categories && <><span>&middot;</span><span>{book.categories.name}</span></>}
                          </div>
                        </Link>
                      </motion.div>
                    ))}
                  </div>
                </section>
              )}

              {results.categories.length > 0 && (
                <section>
                  <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
                    <span className="w-1 h-4 rounded-full bg-[#00D4FF]" />
                    Categories ({results.categories.length})
                  </h2>
                  <div className="flex flex-wrap gap-3">
                    {results.categories.map(cat => (
                      <motion.div key={cat.id} variants={item}>
                        <Link href={`/books?category=${cat.id}`}
                          className="glass-card !rounded-xl px-4 py-2.5 text-sm hover:border-[#FF0F7B]/30 transition-colors block">
                          {cat.name}
                        </Link>
                      </motion.div>
                    ))}
                  </div>
                </section>
              )}

              {results.announcements.length > 0 && (
                <section>
                  <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
                    <span className="w-1 h-4 rounded-full bg-[#00FF88]" />
                    Announcements ({results.announcements.length})
                  </h2>
                  <div className="space-y-3">
                    {results.announcements.map(a => (
                      <motion.div key={a.id} variants={item} className="glass-card p-4">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="text-[10px] px-1.5 py-0.5 rounded bg-white/5 text-gray-500 uppercase">{a.type || 'general'}</span>
                        </div>
                        <h3 className="font-medium text-sm">{a.title}</h3>
                        <p className="text-xs text-gray-400 mt-1 line-clamp-2">{a.content}</p>
                        <p className="text-[10px] text-gray-600 mt-2">{a.users?.username} &middot; {a.created_at}</p>
                      </motion.div>
                    ))}
                  </div>
                </section>
              )}
            </motion.div>
          )}

          {!searched && (
            <div className="text-center py-16">
              <div className="text-5xl mb-4">🔎</div>
              <h2 className="text-xl font-semibold mb-2">Search Across Everything</h2>
              <p className="text-gray-400 text-sm max-w-md mx-auto">
                Instantly find books by title, subject, or author. Discover categories and stay updated with announcements.
              </p>
              <div className="flex items-center justify-center gap-6 mt-8 text-xs text-gray-600">
                <span>📚 Books</span>
                <span>📁 Categories</span>
                <span>🔔 Announcements</span>
              </div>
            </div>
          )}
        </motion.div>
      </div>
    </div>
  )
}
