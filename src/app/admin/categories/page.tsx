'use client'

import { useEffect, useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { motion } from 'framer-motion'

interface Category {
  id: number
  name: string
  slug: string
  description: string | null
  icon: string | null
  _count: { books: number }
}

export default function AdminCategoriesPage() {
  const router = useRouter()
  const [categories, setCategories] = useState<Category[]>([])
  const [loading, setLoading] = useState(true)
  const [formMsg, setFormMsg] = useState('')
  const [editingId, setEditingId] = useState<number | null>(null)
  const [form, setForm] = useState({ name: '', slug: '', description: '' })

  const fetchAll = useCallback(async () => {
    const res = await fetch('/api/admin/categories')
    const d = await res.json()
    if (d.categories) setCategories(d.categories)
    setLoading(false)
  }, [])

  useEffect(() => { fetchAll() }, [fetchAll])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setFormMsg('')

    if (editingId) {
      const res = await fetch(`/api/admin/categories/${editingId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      })
      const d = await res.json()
      if (!res.ok) { setFormMsg(d.error || 'Error'); return }
      setFormMsg('Category updated!')
    } else {
      const res = await fetch('/api/admin/categories', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      })
      const d = await res.json()
      if (!res.ok) { setFormMsg(d.error || 'Error'); return }
      setFormMsg('Category created!')
    }

    setForm({ name: '', slug: '', description: '' })
    setEditingId(null)
    fetchAll()
    router.refresh()
  }

  async function deleteCategory(id: number) {
    if (!confirm('Delete this category permanently? Books in this category will be uncategorized.')) return
    const res = await fetch(`/api/admin/categories/${id}`, { method: 'DELETE' })
    const d = await res.json()
    setFormMsg(d.success ? 'Category deleted!' : d.error || 'Error')
    fetchAll()
    router.refresh()
  }

  function startEdit(cat: Category) {
    setEditingId(cat.id)
    setForm({ name: cat.name, slug: cat.slug, description: cat.description || '' })
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
          <h1 className="text-2xl sm:text-3xl font-bold">Categories</h1>
          <p className="text-gray-400 text-sm mt-1">Manage subject categories</p>
        </div>
      </motion.div>

      {formMsg && (
        <motion.div variants={item} className="glass-card !rounded-xl px-4 py-3 mb-6 text-sm border-l-4 border-[#FF0F7B]">
          {formMsg}
          <button onClick={() => setFormMsg('')} className="ml-3 text-gray-500 hover:text-white">&times;</button>
        </motion.div>
      )}

      <motion.div variants={item} className="glass-card p-6 mb-8">
        <h3 className="font-semibold mb-5">{editingId ? 'Edit Category' : 'Create Category'}</h3>
        <form onSubmit={handleSubmit} className="flex flex-wrap gap-4 items-end">
          <div className="flex-1 min-w-[200px]">
            <label className="block text-xs text-gray-500 mb-1">Name</label>
            <input value={form.name} onChange={e => setForm({ ...form, name: e.target.value, slug: editingId ? form.slug : e.target.value.toLowerCase().replace(/[^a-z0-9]+/g, '-') })}
              className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white focus:border-[#FF0F7B] focus:outline-none" required />
          </div>
          <div className="flex-1 min-w-[200px]">
            <label className="block text-xs text-gray-500 mb-1">Slug</label>
            <input value={form.slug} onChange={e => setForm({ ...form, slug: e.target.value })}
              className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white focus:border-[#FF0F7B] focus:outline-none" required />
          </div>
          <div className="flex-1 min-w-[200px]">
            <label className="block text-xs text-gray-500 mb-1">Description</label>
            <input value={form.description} onChange={e => setForm({ ...form, description: e.target.value })}
              className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white focus:border-[#FF0F7B] focus:outline-none" />
          </div>
          <div className="flex gap-2">
            <button type="submit" className="btn-primary !py-2.5 !text-sm">
              {editingId ? 'Update' : 'Create'}
            </button>
            {editingId && (
              <button type="button" onClick={() => { setEditingId(null); setForm({ name: '', slug: '', description: '' }) }}
                className="btn-outline !py-2.5 !text-sm">
                Cancel
              </button>
            )}
          </div>
        </form>
      </motion.div>

      <motion.div variants={item} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {categories.length === 0 && (
          <div className="col-span-full glass-card p-12 text-center">
            <p className="text-gray-400 text-sm">No categories yet. Create one above.</p>
          </div>
        )}
        {categories.map(c => (
          <div key={c.id} className="glass-card p-5">
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0 flex-1">
                <p className="font-medium truncate">{c.name}</p>
                <p className="text-xs text-gray-500 mt-1">{c._count.books} {c._count.books === 1 ? 'book' : 'books'}</p>
                {c.description && <p className="text-xs text-gray-600 mt-1 line-clamp-2">{c.description}</p>}
              </div>
              <div className="flex items-center gap-1.5 shrink-0">
                <button onClick={() => startEdit(c)} className="text-[10px] px-2 py-1 rounded bg-white/5 text-gray-400 hover:text-white transition-colors">
                  Edit
                </button>
                <button onClick={() => deleteCategory(c.id)} className="text-[10px] px-2 py-1 rounded bg-red-500/10 text-red-400 hover:bg-red-500/20 transition-colors">
                  Del
                </button>
              </div>
            </div>
          </div>
        ))}
      </motion.div>
    </motion.div>
  )
}
