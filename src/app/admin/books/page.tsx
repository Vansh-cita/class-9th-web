'use client'

import { useEffect, useState, useCallback, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { motion } from 'framer-motion'
import ThemeDropdown from '@/components/ThemeDropdown'

interface Category {
  id: number
  name: string
  slug: string
  _count: { books: number }
}

interface Book {
  id: number
  title: string
  slug: string
  description: string | null
  subject: string | null
  author: string | null
  thumbnail: string | null
  categories: { id: number; name: string } | null
  _count: { chapters: number }
}

export default function AdminBooksPage() {
  const router = useRouter()
  const [books, setBooks] = useState<Book[]>([])
  const [categories, setCategories] = useState<Category[]>([])
  const [loading, setLoading] = useState(true)
  const [formMsg, setFormMsg] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [editingId, setEditingId] = useState<number | null>(null)
  const [form, setForm] = useState({
    title: '', slug: '', description: '', subject: '', author: 'NCERT', thumbnail: '', category_id: '',
  })
  const [coverFile, setCoverFile] = useState<File | null>(null)
  const [coverPreview, setCoverPreview] = useState<string>('')
  const [dragOver, setDragOver] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [chaptersBook, setChaptersBook] = useState<Book | null>(null)
  const [chapters, setChapters] = useState<{ id: number; title: string; chapter_number: number; pdf_file: string | null }[]>([])
  const [chLoading, setChLoading] = useState(false)
  const [chForm, setChForm] = useState({ chapter_number: '', title: '' })
  const [chFile, setChFile] = useState<File | null>(null)
  const [chDragOver, setChDragOver] = useState(false)
  const [chError, setChError] = useState('')
  const chFileRef = useRef<HTMLInputElement>(null)

  const fetchAll = useCallback(async () => {
    try {
      const [booksRes, catsRes] = await Promise.all([
        fetch('/api/admin/books'),
        fetch('/api/admin/categories'),
      ])
      const bd = await booksRes.json()
      if (bd.books) setBooks(bd.books)
      const cd = await catsRes.json()
      if (cd.categories) setCategories(cd.categories)
    } catch {
      setFormMsg('Failed to load data')
    }
    setLoading(false)
  }, [])

  useEffect(() => { fetchAll() }, [fetchAll])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setFormMsg('')
    setSubmitting(true)
    try {
      let res: Response
      if (editingId) {
        res = await fetch(`/api/admin/books/${editingId}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(form),
        })
      } else {
        const fd = new FormData()
        fd.set('title', form.title)
        fd.set('slug', form.slug)
        fd.set('description', form.description)
        fd.set('subject', form.subject)
        fd.set('author', form.author)
        fd.set('category_id', form.category_id)
        if (coverFile) fd.set('thumbnail', coverFile)
        res = await fetch('/api/admin/books', { method: 'POST', body: fd })
      }
      const d = await res.json()
      setFormMsg(d.book ? (editingId ? 'Book updated!' : 'Book created!') : d.error || 'Error')
      if (!res.ok) return

      setForm({ title: '', slug: '', description: '', subject: '', author: 'NCERT', thumbnail: '', category_id: '' })
      setCoverFile(null)
      setCoverPreview('')
      setEditingId(null)
      fetchAll()
      router.refresh()
    } catch {
      setFormMsg('Network error')
    }
    setSubmitting(false)
  }

  async function deleteBook(id: number) {
    if (!confirm('Delete this book permanently?')) return
    try {
      await fetch(`/api/admin/books/${id}`, { method: 'DELETE' })
      fetchAll()
      router.refresh()
    } catch {
      setFormMsg('Network error')
    }
  }

  function startEdit(book: Book) {
    setEditingId(book.id)
    setCoverFile(null)
    setCoverPreview('')
    setForm({
      title: book.title,
      slug: book.slug,
      description: book.description || '',
      subject: book.subject || '',
      author: book.author || 'NCERT',
      thumbnail: book.thumbnail || '',
      category_id: book.categories ? String(book.categories.id) : '',
    })
  }

  const handleFileSelect = (file: File | null) => {
    if (!file) return
    setCoverFile(file)
    const reader = new FileReader()
    reader.onload = e => setCoverPreview(e.target?.result as string)
    reader.readAsDataURL(file)
  }

  const clearCover = () => {
    setCoverFile(null)
    setCoverPreview('')
    if (fileInputRef.current) fileInputRef.current.value = ''
  }

  const fetchChapters = async (bookId: number) => {
    setChLoading(true)
    try {
      const res = await fetch(`/api/books/${books.find(b => b.id === bookId)?.slug}`)
      const d = await res.json()
      if (d.book?.chapters) setChapters(d.book.chapters)
    } catch {
      setChapters([])
    }
    setChLoading(false)
  }

  const uploadChapter = async () => {
    if (!chaptersBook || !chForm.chapter_number || !chForm.title || !chFile) return
    setChError('')
    const fd = new FormData()
    fd.set('book_id', String(chaptersBook.id))
    fd.set('chapter_number', chForm.chapter_number)
    fd.set('title', chForm.title)
    fd.set('pdf', chFile)
    try {
      const res = await fetch('/api/admin/books/chapters', { method: 'POST', body: fd })
      const d = await res.json()
      if (d.chapter) {
        setChForm({ chapter_number: '', title: '' })
        setChFile(null)
        setChError('')
        if (chFileRef.current) chFileRef.current.value = ''
        fetchChapters(chaptersBook.id)
        fetchAll()
      } else {
        setChError(d.error || 'Upload failed')
      }
    } catch (e) {
      setChError('Network error — could not reach server')
    }
  }

  const deleteChapter = async (id: number) => {
    if (!confirm('Delete this chapter permanently?')) return
    try {
      await fetch(`/api/admin/books/chapters?id=${id}`, { method: 'DELETE' })
      if (chaptersBook) fetchChapters(chaptersBook.id)
      fetchAll()
    } catch {
      // Silently fail
    }
  }

  const handleChFileSelect = (file: File | null) => {
    if (file && (file.type === 'application/pdf' || file.name?.toLowerCase().endsWith('.pdf'))) setChFile(file)
  }

  const container = { hidden: { opacity: 0 }, show: { opacity: 1, transition: { staggerChildren: 0.03 } } }
  const item = { hidden: { opacity: 0, y: 12 }, show: { opacity: 1, y: 0 } }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="w-8 h-8 border-2 border-[#FF0F7B] border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  return (
    <>
      <motion.div variants={container} initial="hidden" animate="show">
      <motion.div variants={item} className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold">Books Management</h1>
          <p className="text-gray-400 text-sm mt-1">Create, edit, and manage all books</p>
        </div>
      </motion.div>

      {formMsg && (
        <motion.div variants={item} className="glass-card !rounded-xl px-4 py-3 mb-6 text-sm border-l-4 border-[#FF0F7B]">
          {formMsg}
          <button onClick={() => setFormMsg('')} className="ml-3 text-gray-500 hover:text-white">&times;</button>
        </motion.div>
      )}

      <motion.div variants={item} className="glass-card p-6 mb-8">
        <h3 className="font-semibold mb-5">{editingId ? 'Edit Book' : 'Create New Book'}</h3>
        <form onSubmit={handleSubmit} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          <input value={form.title} onChange={e => setForm({ ...form, title: e.target.value, slug: editingId ? form.slug : e.target.value.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '') })}
            className="bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white placeholder-gray-500 focus:border-[#FF0F7B] focus:outline-none"
            placeholder="Book title" required />
          <input value={form.slug} onChange={e => setForm({ ...form, slug: e.target.value })}
            className="bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white placeholder-gray-500 focus:border-[#FF0F7B] focus:outline-none"
            placeholder="Slug" required />
          <input value={form.subject} onChange={e => setForm({ ...form, subject: e.target.value })}
            className="bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white placeholder-gray-500 focus:border-[#FF0F7B] focus:outline-none"
            placeholder="Subject (e.g., Mathematics)" />
          <input value={form.author} onChange={e => setForm({ ...form, author: e.target.value })}
            className="bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white placeholder-gray-500 focus:border-[#FF0F7B] focus:outline-none"
            placeholder="Author" />
          <div
            onDragOver={e => { e.preventDefault(); setDragOver(true) }}
            onDragLeave={() => setDragOver(false)}
            onDrop={e => { e.preventDefault(); setDragOver(false); handleFileSelect(e.dataTransfer.files[0]) }}
            onClick={() => fileInputRef.current?.click()}
            className={`relative col-span-1 sm:col-span-2 lg:col-span-1 flex flex-col items-center justify-center gap-2 border-2 border-dashed rounded-xl px-4 py-5 cursor-pointer transition-colors ${
              dragOver ? 'border-[#FF0F7B] bg-[#FF0F7B]/5' : 'border-white/10 hover:border-white/20 bg-white/[0.02]'
            }`}
          >
            {coverPreview ? (
              <>
                <img src={coverPreview} alt="Cover preview" className="h-20 w-auto rounded-lg object-cover" />
                <button type="button" onClick={e => { e.stopPropagation(); clearCover() }}
                  className="text-[10px] text-red-400 hover:text-red-300 underline">Remove</button>
              </>
            ) : (
              <>
                <svg className="w-8 h-8 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5m-13.5-9L12 3m0 0l4.5 4.5M12 3v13.5" />
                </svg>
                <p className="text-xs text-gray-500">Drop cover image here or click to browse</p>
              </>
            )}
            <input ref={fileInputRef} type="file" accept="image/png,image/jpeg,image/webp,image/gif"
              onChange={e => handleFileSelect(e.target.files?.[0] ?? null)} className="hidden" />
          </div>
          <ThemeDropdown
            options={[
              { value: '', label: 'No category' },
              ...categories.map(c => ({ value: String(c.id), label: c.name })),
            ]}
            value={form.category_id}
            onChange={v => setForm({ ...form, category_id: v })}
          />
          <div className="sm:col-span-2 lg:col-span-3">
            <textarea value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} rows={2}
              className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white placeholder-gray-500 focus:border-[#FF0F7B] focus:outline-none resize-none"
              placeholder="Description (optional)" />
          </div>
          <div className="flex gap-3 sm:col-span-2 lg:col-span-3">
            <button type="submit" disabled={submitting} className="btn-primary mandala-btn !py-2.5 !text-sm disabled:opacity-50 disabled:cursor-not-allowed">
                {submitting ? (
                  <span className="flex items-center gap-2">
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    {editingId ? 'Updating...' : 'Creating...'}
                  </span>
                ) : (editingId ? 'Update Book' : 'Create Book')}
              </button>
            {editingId && (
              <button type="button" onClick={() => { setEditingId(null); setForm({ title: '', slug: '', description: '', subject: '', author: 'NCERT', thumbnail: '', category_id: '' }) }}
                className="btn-outline !py-2.5 !text-sm">
                Cancel
              </button>
            )}
          </div>
        </form>
      </motion.div>

      <motion.div variants={item} className="glass-card p-6">
        <h3 className="font-semibold mb-4">Book Inventory ({books.length})</h3>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-gray-500 text-xs border-b border-white/5">
                <th className="pb-3 pr-4">Title</th>
                <th className="pb-3 pr-4">Subject</th>
                <th className="pb-3 pr-4">Author</th>
                <th className="pb-3 pr-4">Category</th>
                <th className="pb-3 pr-4">Chapters</th>
                <th className="pb-3">Actions</th>
              </tr>
            </thead>
            <tbody>
              {books.length === 0 && (
                <tr><td colSpan={6} className="py-8 text-center text-gray-500 text-sm">No books yet. Create one above.</td></tr>
              )}
              {books.map(b => (
                <tr key={b.id} className="border-b border-white/5 last:border-0">
                  <td className="py-3 pr-4 font-medium">{b.title}</td>
                  <td className="py-3 pr-4 text-gray-400">{b.subject || '-'}</td>
                  <td className="py-3 pr-4 text-gray-400">{b.author}</td>
                  <td className="py-3 pr-4 text-gray-400">{b.categories?.name || '-'}</td>
                  <td className="py-3 pr-4 text-gray-400">{b._count.chapters}</td>
                  <td className="py-3">
                    <div className="flex items-center gap-2">
                      <button onClick={() => { setChaptersBook(b); fetchChapters(b.id) }} className="text-xs px-2.5 py-1 rounded-lg bg-white/5 text-gray-400 hover:text-white hover:bg-white/10 transition-colors">
                        <svg className="w-3.5 h-3.5 inline mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 6.75h12M8.25 12h12m-12 5.25h12M3.75 6.75h.007v.008H3.75V6.75zm.375 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zM3.75 12h.007v.008H3.75V12zm.375 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm-.375 5.25h.007v.008H3.75v-.008zm.375 0a.375.375 0 11-.75 0 .375.375 0 01.75 0z" />
                        </svg>
                        Chapters
                      </button>
                      <button onClick={() => startEdit(b)} className="text-xs px-2.5 py-1 rounded-lg bg-white/5 text-gray-400 hover:text-white hover:bg-white/10 transition-colors">
                        Edit
                      </button>
                      <button onClick={() => deleteBook(b.id)} className="text-xs px-2.5 py-1 rounded-lg bg-red-500/10 text-red-400 hover:bg-red-500/20 transition-colors">
                        Delete
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </motion.div>
    </motion.div>

    {chaptersBook && (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4"
        onClick={() => { setChaptersBook(null); setChapters([]) }}>
        <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}
          onClick={e => e.stopPropagation()}
          className="glass-card w-full max-w-lg max-h-[85vh] flex flex-col rounded-2xl">
          <div className="flex items-center justify-between p-5 border-b border-white/5">
            <div>
              <h3 className="font-semibold">Manage Chapters</h3>
              <p className="text-xs text-gray-500 mt-0.5">{chaptersBook.title}</p>
            </div>
            <button onClick={() => { setChaptersBook(null); setChapters([]) }}
              className="text-gray-500 hover:text-white transition-colors p-1">
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          <div className="flex-1 overflow-y-auto p-5 space-y-5">
            <div className="space-y-3">
              <h4 className="text-xs text-gray-500 uppercase tracking-wider">Upload New Chapter</h4>
              <div className="grid grid-cols-2 gap-3">
                <input type="number" min={0} value={chForm.chapter_number}
                  onChange={e => setChForm({ ...chForm, chapter_number: e.target.value })}
                  className="bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-sm text-white focus:border-[#FF0F7B] focus:outline-none"
                  placeholder="Chapter #" />
                <input value={chForm.title} onChange={e => setChForm({ ...chForm, title: e.target.value })}
                  className="bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-sm text-white focus:border-[#FF0F7B] focus:outline-none"
                  placeholder="Chapter title" />
              </div>
              <div
                onDragOver={e => { e.preventDefault(); setChDragOver(true) }}
                onDragLeave={() => setChDragOver(false)}
                onDrop={e => { e.preventDefault(); setChDragOver(false); handleChFileSelect(e.dataTransfer.files[0]) }}
                onClick={() => chFileRef.current?.click()}
                className={`flex flex-col items-center justify-center gap-2 border-2 border-dashed rounded-xl px-4 py-5 cursor-pointer transition-colors ${
                  chDragOver ? 'border-[#FF0F7B] bg-[#FF0F7B]/5' : 'border-white/10 hover:border-white/20 bg-white/[0.02]'
                }`}
              >
                {chFile ? (
                  <div className="flex items-center gap-2">
                    <svg className="w-5 h-5 text-green-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <span className="text-xs text-gray-400">{chFile.name}</span>
                    <button type="button" onClick={e => { e.stopPropagation(); setChFile(null); if (chFileRef.current) chFileRef.current.value = '' }}
                      className="text-[10px] text-red-400 hover:text-red-300">Remove</button>
                  </div>
                ) : (
                  <>
                    <svg className="w-6 h-6 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" />
                    </svg>
                    <p className="text-xs text-gray-500">Drop PDF here or click to browse</p>
                  </>
                )}
                <input ref={chFileRef} type="file" accept=".pdf,application/pdf"
                  onChange={e => handleChFileSelect(e.target.files?.[0] ?? null)} className="hidden" />
              </div>
              {chError && (
                <p className="text-xs text-red-400 text-center">{chError}</p>
              )}
              <button onClick={uploadChapter} disabled={!chForm.chapter_number || !chForm.title || !chFile}
                className="w-full btn-primary mandala-btn !py-2 !text-xs disabled:opacity-50 disabled:cursor-not-allowed">
                Upload Chapter
              </button>
            </div>

            <div className="border-t border-white/5 pt-4">
              <h4 className="text-xs text-gray-500 uppercase tracking-wider mb-3">
                Existing Chapters ({chapters.length})
              </h4>
              {chLoading ? (
                <div className="flex items-center justify-center py-8">
                  <div className="w-5 h-5 border-2 border-[#FF0F7B] border-t-transparent rounded-full animate-spin" />
                </div>
              ) : chapters.length === 0 ? (
                <p className="text-xs text-gray-600 text-center py-6">No chapters uploaded yet.</p>
              ) : (
                <div className="space-y-2">
                  {chapters.map(ch => (
                    <div key={ch.id} className="flex items-center justify-between p-3 rounded-xl bg-white/5">
                      <div className="flex items-center gap-3 min-w-0">
                        <span className="text-[10px] font-mono text-gray-500 shrink-0">#{ch.chapter_number}</span>
                        <span className="text-xs text-gray-300 truncate">{ch.title}</span>
                        {ch.pdf_file && <span className="text-[10px] text-green-400/60">PDF</span>}
                      </div>
                      <button onClick={() => deleteChapter(ch.id)}
                        className="text-[10px] text-red-400 hover:text-red-300 shrink-0 ml-2">Delete</button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </motion.div>
      </div>
    )}
    </>
  )
}
