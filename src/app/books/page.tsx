'use client'

import { useEffect, useState, useCallback } from 'react'
import Link from 'next/link'
import { motion } from 'framer-motion'
import { SkeletonBooksGrid } from '@/components/Skeleton'
import ThemeDropdown from '@/components/ThemeDropdown'

interface Category {
  id: number
  name: string
  slug: string
}

interface Book {
  id: number
  title: string
  slug: string
  description: string | null
  subject: string | null
  author: string | null
  thumbnail: string | null
  categories: Category | null
}

export default function BooksPage() {
  const [books, setBooks] = useState<Book[]>([])
  const [categories, setCategories] = useState<Category[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedCategory, setSelectedCategory] = useState('')
  const [searchQuery, setSearchQuery] = useState('')

  const fetchBooks = useCallback(async () => {
    setLoading(true)
    const params = new URLSearchParams()
    if (selectedCategory) params.set('category', selectedCategory)
    if (searchQuery) params.set('search', searchQuery)

    const [booksRes, catsRes] = await Promise.all([
      fetch(`/api/books?${params}`),
      fetch('/api/categories'),
    ])
    const bd = await booksRes.json()
    if (bd.books) setBooks(bd.books)
    const cd = await catsRes.json()
    if (cd.categories) setCategories(cd.categories)
    setLoading(false)
  }, [selectedCategory, searchQuery])

  useEffect(() => { fetchBooks() }, [fetchBooks])

  const grouped = categories.map(cat => ({
    ...cat,
    books: books.filter(b => b.categories?.id === cat.id),
  }))
  const uncategorized = books.filter(b => !b.categories)

  const container = { hidden: { opacity: 0 }, show: { opacity: 1, transition: { staggerChildren: 0.04 } } }
  const item = { hidden: { opacity: 0, y: 15 }, show: { opacity: 1, y: 0 } }

  return (
    <div className="min-h-screen pb-24">
      <div className="absolute inset-0 bg-gradient-to-b from-[#FF0F7B]/3 via-transparent to-[#050505] pointer-events-none" />
      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} className="py-8">
          <h1 className="text-3xl font-bold mb-2">Books</h1>
          <p className="text-gray-400 text-sm mb-6">Browse all NCERT textbooks and resources</p>

          <div className="flex flex-col sm:flex-row gap-3 mb-8">
            <div className="relative flex-1">
              <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
              <input value={searchQuery} onChange={e => setSearchQuery(e.target.value)}
                className="w-full bg-white/5 border border-white/10 rounded-xl pl-10 pr-4 py-2.5 text-sm text-white placeholder-gray-500 focus:border-[#FF0F7B] focus:outline-none"
                placeholder="Search books by title, subject, or author..." />
            </div>
            <ThemeDropdown
              options={[
                { value: '', label: 'All Categories' },
                ...categories.map(c => ({ value: String(c.id), label: c.name })),
              ]}
              value={selectedCategory}
              onChange={setSelectedCategory}
            />
          </div>

          {loading ? (
            <SkeletonBooksGrid count={6} />
          ) : (
            <motion.div variants={container} initial="hidden" animate="show">
              {selectedCategory ? (
                <div>
                  <h2 className="text-lg font-semibold mb-4 text-gray-300">
                    {categories.find(c => String(c.id) === selectedCategory)?.name || 'Category'}
                  </h2>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
                    {books.length === 0 && (
                      <p className="col-span-full text-center text-gray-500 py-12 text-sm">No books found in this category.</p>
                    )}
                    {books.map(book => (
                      <motion.div key={book.id} variants={item}>
                        <Link href={`/books/${book.slug}`} className="glass-card p-5 block group h-full">
                          {book.thumbnail && book.thumbnail !== 'default-book.png' ? (
                            <div className="w-full aspect-[3/4] rounded-xl overflow-hidden mb-3 hover-shimmer-effect">
                              <img src={book.thumbnail} alt={book.title}
                                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
                            </div>
                          ) : (
                            <div className="w-11 h-11 rounded-xl bg-[#FF0F7B]/10 flex items-center justify-center mb-3 group-hover:bg-[#FF0F7B]/20 transition-colors">
                              <span className="text-base font-bold text-[#FF0F7B]">{book.title.charAt(0)}</span>
                            </div>
                          )}
                          <h3 className="font-medium mb-1 group-hover:text-[#FF0F7B] transition-colors truncate">{book.title}</h3>
                          {book.description && <p className="text-xs text-gray-500 line-clamp-2">{book.description}</p>}
                          <div className="flex items-center gap-2 mt-3 text-[10px] text-gray-600">
                            <span>{book.subject || 'General'}</span>
                            {book.categories && <><span>&middot;</span><span>{book.categories.name}</span></>}
                          </div>
                          <p className="text-[10px] text-gray-600 mt-1">by {book.author || 'NCERT'}</p>
                        </Link>
                      </motion.div>
                    ))}
                  </div>
                </div>
              ) : (
                <>
                  {grouped.filter(g => g.books.length > 0).map(cat => (
                    <section key={cat.id} className="mb-10">
                      <div className="flex items-center justify-between mb-4">
                        <h2 className="text-lg font-semibold flex items-center gap-2">
                          <span className="w-1 h-4 rounded-full bg-[#FF0F7B]" />
                          {cat.name}
                        </h2>
                        <span className="text-xs text-gray-500">{cat.books.length} {cat.books.length === 1 ? 'book' : 'books'}</span>
                      </div>
                      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
                        {cat.books.map(book => (
                          <motion.div key={book.id} variants={item}>
                            <Link href={`/books/${book.slug}`} className="glass-card p-5 block group h-full">
                              {book.thumbnail && book.thumbnail !== 'default-book.png' ? (
                                <div className="w-full aspect-[3/4] rounded-xl overflow-hidden mb-3 hover-shimmer-effect">
                                  <img src={book.thumbnail} alt={book.title}
                                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
                                </div>
                              ) : (
                                <div className="w-11 h-11 rounded-xl bg-[#FF0F7B]/10 flex items-center justify-center mb-3 group-hover:bg-[#FF0F7B]/20 transition-colors">
                                  <span className="text-base font-bold text-[#FF0F7B]">{book.title.charAt(0)}</span>
                                </div>
                              )}
                              <h3 className="font-medium mb-1 group-hover:text-[#FF0F7B] transition-colors truncate">{book.title}</h3>
                              {book.description && <p className="text-xs text-gray-500 line-clamp-2">{book.description}</p>}
                              <p className="text-[10px] text-gray-600 mt-2">by {book.author || 'NCERT'} &middot; {book.subject || 'General'}</p>
                            </Link>
                          </motion.div>
                        ))}
                      </div>
                    </section>
                  ))}
                  {uncategorized.length > 0 && (
                    <section className="mb-10">
                      <div className="flex items-center justify-between mb-4">
                        <h2 className="text-lg font-semibold flex items-center gap-2">
                          <span className="w-1 h-4 rounded-full bg-gray-500" />
                          Uncategorized
                        </h2>
                        <span className="text-xs text-gray-500">{uncategorized.length} {uncategorized.length === 1 ? 'book' : 'books'}</span>
                      </div>
                      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
                        {uncategorized.map(book => (
                          <motion.div key={book.id} variants={item}>
                            <Link href={`/books/${book.slug}`} className="glass-card p-5 block group h-full">
                              {book.thumbnail && book.thumbnail !== 'default-book.png' ? (
                                <div className="w-full aspect-[3/4] rounded-xl overflow-hidden mb-3 hover-shimmer-effect">
                                  <img src={book.thumbnail} alt={book.title}
                                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
                                </div>
                              ) : (
                                <div className="w-11 h-11 rounded-xl bg-[#FF0F7B]/10 flex items-center justify-center mb-3 group-hover:bg-[#FF0F7B]/20 transition-colors">
                                  <span className="text-base font-bold text-[#FF0F7B]">{book.title.charAt(0)}</span>
                                </div>
                              )}
                              <h3 className="font-medium mb-1 group-hover:text-[#FF0F7B] transition-colors truncate">{book.title}</h3>
                              {book.description && <p className="text-xs text-gray-500 line-clamp-2">{book.description}</p>}
                              <p className="text-[10px] text-gray-600 mt-2">by {book.author || 'NCERT'} &middot; {book.subject || 'General'}</p>
                            </Link>
                          </motion.div>
                        ))}
                      </div>
                    </section>
                  )}
                  {grouped.every(g => g.books.length === 0) && uncategorized.length === 0 && (
                    <div className="glass-card p-12 text-center">
                      <div className="text-5xl mb-4">📚</div>
                      <p className="text-gray-400 text-sm">No books found. Check back later for new additions.</p>
                    </div>
                  )}
                </>
              )}
            </motion.div>
          )}
        </motion.div>
      </div>
    </div>
  )
}
