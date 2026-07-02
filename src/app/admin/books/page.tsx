'use client'

import { useEffect, useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { motion } from 'framer-motion'

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
  const [editingId, setEditingId] = useState<number | null>(null)
  const [form, setForm] = useState({
    title: '', slug: '', description: '', subject: '', author: 'NCERT', thumbnail: '', category_id: '',
  })

  const fetchAll = useCallback(async () => {
    const [booksRes, catsRes] = await Promise.all([
      fetch('/api/admin/books'),
      fetch('/api/admin/categories'),
    ])
    const bd = await booksRes.json()
    if (bd.books) setBooks(bd.books)
    const cd = await catsRes.json()
    if (cd.categories) setCategories(cd.categories)
    setLoading(false)
  }, [])

  useEffect(() => { fetchAll() }, [fetchAll])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setFormMsg('')

    let res: Response
    if (editingId) {
      res = await fetch(`/api/admin/books/${editingId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      })
    } else {
      res = await fetch('/api/admin/books', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      })
    }
    const d = await res.json()
    setFormMsg(d.book ? (editingId ? 'Book updated!' : 'Book created!') : d.error || 'Error')
    if (!res.ok) return

    setForm({ title: '', slug: '', description: '', subject: '', author: 'NCERT', thumbnail: '', category_id: '' })
    setEditingId(null)
    fetchAll()
    router.refresh()
  }

  async function deleteBook(id: number) {
    if (!confirm('Delete this book permanently?')) return
    await fetch(`/api/admin/books/${id}`, { method: 'DELETE' })
    fetchAll()
    router.refresh()
  }

  function startEdit(book: Book) {
    setEditingId(book.id)
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
          <input value={form.thumbnail} onChange={e => setForm({ ...form, thumbnail: e.target.value })}
            className="bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white placeholder-gray-500 focus:border-[#FF0F7B] focus:outline-none"
            placeholder="Cover image URL" />
          <select value={form.category_id} onChange={e => setForm({ ...form, category_id: e.target.value })}
            className="bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white focus:border-[#FF0F7B] focus:outline-none">
            <option value="">No category</option>
            {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
          </select>
          <div className="sm:col-span-2 lg:col-span-3">
            <textarea value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} rows={2}
              className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white placeholder-gray-500 focus:border-[#FF0F7B] focus:outline-none resize-none"
              placeholder="Description (optional)" />
          </div>
          <div className="flex gap-3 sm:col-span-2 lg:col-span-3">
            <button type="submit" className="btn-primary !py-2.5 !text-sm">
              {editingId ? 'Update Book' : 'Create Book'}
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
  )
}
