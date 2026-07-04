'use client'

import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import dynamic from 'next/dynamic'

const PDFReader = dynamic(() => import('@/components/PDFReader'), {
  ssr: false,
  loading: () => (
    <div className="min-h-screen bg-[#050505] flex items-center justify-center">
      <div className="flex flex-col items-center gap-3">
        <div className="w-8 h-8 border-2 border-[#FF0F7B] border-t-transparent rounded-full animate-spin" />
        <p className="text-sm text-gray-500">Loading PDF reader...</p>
      </div>
    </div>
  ),
})

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
  chapters: Chapter[]
}

export default function BookReaderPage() {
  const params = useParams()
  const slug = params?.slug as string
  const [book, setBook] = useState<BookData | null>(null)
  const [chapterId, setChapterId] = useState<number | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    if (!slug) return
    setLoading(true)
    fetch(`/api/books/${slug}`)
      .then(r => r.json())
      .then(d => {
        if (d.book) {
          setBook(d.book)
          if (d.book.chapters.length > 0) {
            setChapterId(d.book.chapters[0].id)
          }
        } else {
          setError('Book not found')
        }
      })
      .catch(() => setError('Failed to load book'))
      .finally(() => setLoading(false))
  }, [slug])

  const activeChapter = book?.chapters.find(c => c.id === chapterId)

  const pdfUrl = activeChapter?.pdf_file || activeChapter?.file_path || ''

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#050505]">
        <div className="flex flex-col items-center gap-4">
          <div className="w-10 h-10 border-2 border-[#FF0F7B] border-t-transparent rounded-full animate-spin" />
          <p className="text-sm text-gray-500">Loading reader...</p>
        </div>
      </div>
    )
  }

  if (error || !book) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#050505]">
        <div className="text-center">
          <p className="text-gray-400 text-lg mb-2">{error || 'Book not found'}</p>
          <a href="/books" className="text-sm text-[#FF0F7B] hover:underline">Back to books</a>
        </div>
      </div>
    )
  }

  if (!pdfUrl) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#050505]">
        <div className="glass-card p-8 text-center max-w-md">
          <svg className="w-12 h-12 mx-auto mb-3 text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
          </svg>
          <h2 className="text-lg font-semibold mb-2">No PDF Available</h2>
          <p className="text-sm text-gray-400 mb-4">
            This book doesn&apos;t have a PDF file attached yet. Chapters need a PDF uploaded by an admin.
          </p>
          <a href={`/books/${slug}`} className="text-sm text-[#FF0F7B] hover:underline">Back to book details</a>
        </div>
      </div>
    )
  }

  return (
    <div className="bg-[#050505] min-h-screen">
      {book.chapters.length > 1 && (
        <div className="glass border-b border-white/5 px-3 sm:px-4 py-2 flex items-center gap-2 overflow-x-auto">
          <span className="text-[10px] text-gray-500 uppercase shrink-0">Chapter:</span>
          {book.chapters.map(ch => (
            <button key={ch.id} onClick={() => setChapterId(ch.id)}
              className={`shrink-0 text-xs px-3 py-1.5 rounded-lg transition-colors ${
                chapterId === ch.id
                  ? 'bg-[#FF0F7B]/15 text-[#FF0F7B] border border-[#FF0F7B]/20'
                  : 'text-gray-400 hover:text-white hover:bg-white/5'
              }`}>
              {ch.title}
            </button>
          ))}
        </div>
      )}

      <div className="max-w-6xl mx-auto px-4 py-6">
        <PDFReader url={pdfUrl} />
      </div>
    </div>
  )
}
