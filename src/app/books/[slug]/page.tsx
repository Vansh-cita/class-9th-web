'use client'

import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import Link from 'next/link'
import { motion } from 'framer-motion'

interface Chapter {
  id: number
  title: string
  chapter_number: number
  pdf_file: string | null
  file_path: string | null
}

interface BookData {
  id: number
  title: string
  slug: string
  description: string | null
  subject: string | null
  author: string | null
  thumbnail: string | null
  categories: { id: number; name: string } | null
  chapters: Chapter[]
}

export default function BookDetailPage() {
  const params = useParams()
  const slug = params?.slug as string
  const [book, setBook] = useState<BookData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    if (!slug) return
    setLoading(true)
    fetch(`/api/books/${slug}`)
      .then(r => r.json())
      .then(d => {
        if (d.book) setBook(d.book)
        else setError('Book not found')
      })
      .catch(() => setError('Failed to load book'))
      .finally(() => setLoading(false))
  }, [slug])

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-[#FF0F7B] border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  if (error || !book) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-400 text-lg mb-2">{error || 'Book not found'}</p>
          <Link href="/books" className="text-sm text-[#FF0F7B] hover:underline">Back to books</Link>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen pb-24">
      <div className="absolute inset-0 bg-gradient-to-b from-[#FF0F7B]/3 via-transparent to-[#050505] pointer-events-none" />
      <div className="relative z-10 max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }}>
          <Link href="/books" className="text-xs text-gray-500 hover:text-white transition-colors mb-4 inline-block">
            &larr; Back to Books
          </Link>

          <div className="glass-card p-6 sm:p-8 mb-8">
            <div className="flex flex-col sm:flex-row gap-6">
              {book.thumbnail && book.thumbnail !== 'default-book.png' ? (
                <div className="shrink-0">
                  <img src={book.thumbnail} alt={book.title}
                    className="w-32 h-44 sm:w-40 sm:h-56 rounded-xl object-cover shadow-lg" />
                </div>
              ) : (
                <div className="shrink-0 w-32 h-44 sm:w-40 sm:h-56 rounded-xl bg-[#FF0F7B]/10 flex items-center justify-center">
                  <span className="text-5xl font-bold text-[#FF0F7B]">{book.title.charAt(0)}</span>
                </div>
              )}
              <div className="flex-1 min-w-0">
                <h1 className="text-2xl sm:text-3xl font-bold mb-2">{book.title}</h1>
                {book.description && <p className="text-sm text-gray-400 mb-4">{book.description}</p>}
                <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-gray-500">
                  {book.subject && <span>Subject: <strong className="text-gray-300">{book.subject}</strong></span>}
                  {book.author && <span>Author: <strong className="text-gray-300">{book.author}</strong></span>}
                  {book.categories && <span>Category: <strong className="text-gray-300">{book.categories.name}</strong></span>}
                  <span>Chapters: <strong className="text-gray-300">{book.chapters.length}</strong></span>
                </div>
              </div>
            </div>
          </div>

          <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <span className="w-1 h-4 rounded-full bg-[#FF0F7B]" />
            Chapters
          </h2>

          {book.chapters.length === 0 ? (
            <div className="glass-card p-12 text-center">
              <div className="text-5xl mb-4">📖</div>
              <p className="text-gray-400 text-sm">No chapters available yet. Check back later.</p>
            </div>
          ) : (
            <div className="glass-card overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="text-left text-gray-500 text-xs border-b border-white/5">
                      <th className="p-4 w-16">#</th>
                      <th className="p-4">Chapter Title</th>
                      <th className="p-4 w-24">Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {book.chapters.map(ch => (
                      <tr key={ch.id} className="border-b border-white/5 last:border-0 hover:bg-white/[0.02] transition-colors">
                        <td className="p-4 text-gray-500 font-mono text-xs">{ch.chapter_number}</td>
                        <td className="p-4 font-medium">{ch.title}</td>
                        <td className="p-4">
                          {ch.pdf_file ? (
                            <Link href={`/books/${book.slug}/read`}
                              className="inline-flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg bg-[#FF0F7B]/10 text-[#FF0F7B] hover:bg-[#FF0F7B]/20 transition-colors">
                              <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="M5.25 5.653c0-.856.917-1.398 1.667-.986l11.54 6.348a1.125 1.125 0 010 1.971l-11.54 6.347a1.125 1.125 0 01-1.667-.985V5.653z" />
                              </svg>
                              Read
                            </Link>
                          ) : (
                            <span className="text-[10px] text-gray-600">No PDF</span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </motion.div>
      </div>
    </div>
  )
}
