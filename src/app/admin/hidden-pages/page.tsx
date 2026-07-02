'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { motion } from 'framer-motion'

interface HiddenPageItem {
  id: number
  item_type: string
  title: string
  description: string | null
  file_path: string | null
}

interface AccessCodeEntry {
  id: number
  code: string
  is_active: number | null
  used_by: number | null
}

interface HiddenPageData {
  id: number
  title: string
  slug: string
  description: string | null
  content: string | null
  access_code: string
  is_active: number | null
  created_at: string | null
  access_codes: AccessCodeEntry[]
  hidden_page_items: HiddenPageItem[]
  _count: { user_access: number }
}

export default function AdminHiddenPages() {
  const router = useRouter()
  const [pages, setPages] = useState<HiddenPageData[]>([])
  const [editingId, setEditingId] = useState<number | null>(null)
  const [showCreate, setShowCreate] = useState(false)
  const [form, setForm] = useState({
    title: '', description: '', content: '', access_code: '', is_active: true,
    items: [{ item_type: 'note' as string, title: '', description: '', file_path: '' }],
  })

  const fetchPages = async () => {
    const res = await fetch('/api/admin/hidden-pages')
    const d = await res.json()
    if (d.pages) setPages(d.pages)
  }

  useEffect(() => { fetchPages() }, [])

  const togglePage = async (page: HiddenPageData) => {
    await fetch(`/api/admin/hidden-pages/${page.id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ is_active: !page.is_active }),
    })
    fetchPages(); router.refresh()
  }

  const addItem = () => setForm(prev => ({
    ...prev,
    items: [...prev.items, { item_type: 'note', title: '', description: '', file_path: '' }],
  }))

  const updateItem = (idx: number, field: string, value: string) => setForm(prev => {
    const items = [...prev.items]
    items[idx] = { ...items[idx], [field]: value }
    return { ...prev, items }
  })

  const removeItem = (idx: number) => setForm(prev => ({
    ...prev,
    items: prev.items.filter((_, i) => i !== idx),
  }))

  const createPage = async (e: React.FormEvent) => {
    e.preventDefault()
    const res = await fetch('/api/admin/hidden-pages', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(form),
    })
    const d = await res.json()
    if (d.page) {
      setShowCreate(false)
      setForm({ title: '', description: '', content: '', access_code: '', is_active: true, items: [{ item_type: 'note', title: '', description: '', file_path: '' }] })
      fetchPages(); router.refresh()
    }
  }

  const deletePage = async (id: number) => {
    if (!confirm('Delete this hidden page permanently?')) return
    await fetch(`/api/admin/hidden-pages/${id}`, { method: 'DELETE' })
    fetchPages(); router.refresh()
  }

  const container = { hidden: { opacity: 0 }, show: { opacity: 1, transition: { staggerChildren: 0.04 } } }
  const item = { hidden: { opacity: 0, y: 12 }, show: { opacity: 1, y: 0 } }

  return (
    <motion.div variants={container} initial="hidden" animate="show">
      <motion.div variants={item} className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold">Hidden Pages</h1>
          <p className="text-gray-400 text-sm mt-1">Create and manage secret access-restricted pages</p>
        </div>
        <button onClick={() => setShowCreate(!showCreate)} className="btn-primary !py-2.5 !text-sm self-start">
          {showCreate ? 'Cancel' : '+ New Hidden Page'}
        </button>
      </motion.div>

      {showCreate && (
        <motion.div variants={item} className="glass-card p-6 mb-8">
          <h3 className="font-semibold mb-5">Create Hidden Page</h3>
          <form onSubmit={createPage} className="space-y-5">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs text-gray-500 mb-1.5">Title *</label>
                <input value={form.title} onChange={e => setForm({ ...form, title: e.target.value })}
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white focus:border-[#FF0F7B] focus:outline-none" required />
              </div>
              <div>
                <label className="block text-xs text-gray-500 mb-1.5">Access Code *</label>
                <input value={form.access_code} onChange={e => setForm({ ...form, access_code: e.target.value })}
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white font-mono focus:border-[#FF0F7B] focus:outline-none" required placeholder="e.g., SECRET-123" />
              </div>
            </div>
            <div>
              <label className="block text-xs text-gray-500 mb-1.5">Description</label>
              <input value={form.description} onChange={e => setForm({ ...form, description: e.target.value })}
                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white focus:border-[#FF0F7B] focus:outline-none" />
            </div>
            <div>
              <label className="block text-xs text-gray-500 mb-1.5">Content / Notes</label>
              <textarea value={form.content} onChange={e => setForm({ ...form, content: e.target.value })} rows={4}
                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white focus:border-[#FF0F7B] focus:outline-none resize-none" />
            </div>
            <div>
              <label className="block text-xs text-gray-500 mb-1.5">Status</label>
              <label className="flex items-center gap-3 cursor-pointer">
                <div
                  onClick={() => setForm({ ...form, is_active: !form.is_active })}
                  className={`w-10 h-5 rounded-full transition-colors relative ${form.is_active ? 'bg-[#FF0F7B]' : 'bg-white/10'}`}
                >
                  <div className={`w-3.5 h-3.5 rounded-full bg-white absolute top-0.5 transition-transform ${form.is_active ? 'translate-x-5' : 'translate-x-1'}`} />
                </div>
                <span className="text-sm text-gray-400">{form.is_active ? 'Active' : 'Inactive'}</span>
              </label>
            </div>

            <div>
              <div className="flex items-center justify-between mb-3">
                <label className="text-xs text-gray-500">Items (Notes, Books, Assignments)</label>
                <button type="button" onClick={addItem} className="text-xs text-[#FF0F7B] hover:underline">+ Add Item</button>
              </div>
              <div className="space-y-3">
                {form.items.map((item, idx) => (
                  <div key={idx} className="flex gap-3 items-start bg-white/5 rounded-xl p-3">
                    <div className="flex-1 space-y-2">
                      <div className="flex gap-2">
                        <select value={item.item_type} onChange={e => updateItem(idx, 'item_type', e.target.value)}
                          className="bg-white/5 border border-white/10 rounded-lg px-2 py-1.5 text-xs text-white focus:border-[#FF0F7B] focus:outline-none">
                          <option value="note">Note</option>
                          <option value="book">Book</option>
                          <option value="assignment">Assignment</option>
                        </select>
                        <input value={item.title} onChange={e => updateItem(idx, 'title', e.target.value)}
                          className="flex-1 bg-transparent border border-white/10 rounded-lg px-2 py-1.5 text-xs text-white placeholder-gray-500 focus:border-[#FF0F7B] focus:outline-none"
                          placeholder="Item title" />
                      </div>
                      <input value={item.description} onChange={e => updateItem(idx, 'description', e.target.value)}
                        className="w-full bg-transparent border border-white/10 rounded-lg px-2 py-1.5 text-xs text-white placeholder-gray-500 focus:border-[#FF0F7B] focus:outline-none"
                        placeholder="Description (optional)" />
                    </div>
                    <button type="button" onClick={() => removeItem(idx)}
                      className="text-gray-500 hover:text-red-400 text-xs p-1 mt-1">&times;</button>
                  </div>
                ))}
              </div>
            </div>

            <button type="submit" className="btn-primary !py-2.5 !text-sm">Create Hidden Page</button>
          </form>
        </motion.div>
      )}

      <motion.div variants={item} className="space-y-4">
        {pages.length === 0 && (
          <div className="glass-card p-6 sm:p-12 text-center">
            <div className="text-5xl mb-4">🔒</div>
            <p className="text-gray-400 text-sm">No hidden pages yet. Create your first one above.</p>
          </div>
        )}
        {pages.map(page => (
          <motion.div key={page.id} variants={item} className="glass-card p-6">
            <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-3 mb-1">
                  <h3 className="font-semibold truncate">{page.title}</h3>
                  <span className={`shrink-0 text-[10px] px-2 py-0.5 rounded-full ${
                    page.is_active ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'
                  }`}>
                    {page.is_active ? 'ACTIVE' : 'INACTIVE'}
                  </span>
                </div>
                <p className="text-xs text-gray-500">{page.slug}</p>
                {page.description && <p className="text-sm text-gray-400 mt-2">{page.description}</p>}
                <div className="flex flex-wrap items-center gap-x-4 gap-y-1 mt-3 text-xs text-gray-500">
                  <span>Code: <code className="text-[#FF0F7B] font-mono">{page.access_code}</code></span>
                  <span>{page._count.user_access} users unlocked</span>
                  <span>{page.hidden_page_items.length} items</span>
                </div>
              </div>
              <div className="flex items-center gap-3 shrink-0 self-end sm:self-start">
                <label className="flex items-center gap-2 cursor-pointer">
                  <div
                    onClick={() => togglePage(page)}
                    className={`w-10 h-5 rounded-full transition-colors relative ${page.is_active ? 'bg-[#FF0F7B]' : 'bg-white/10'}`}
                  >
                    <div className={`w-3.5 h-3.5 rounded-full bg-white absolute top-0.5 transition-transform ${page.is_active ? 'translate-x-5' : 'translate-x-1'}`} />
                  </div>
                </label>
                <button onClick={() => setEditingId(editingId === page.id ? null : page.id)}
                  className="text-xs text-gray-400 hover:text-white transition-colors px-2 py-1">
                  {editingId === page.id ? 'Close' : 'Edit'}
                </button>
                <button onClick={() => deletePage(page.id)}
                  className="text-xs text-red-400 hover:text-red-300 transition-colors px-2 py-1">
                  Delete
                </button>
              </div>
            </div>

            {editingId === page.id && (
              <EditHiddenPageForm page={page} onSave={fetchPages} />
            )}

            {page.hidden_page_items.length > 0 && (
              <div className="mt-4 pt-4 border-t border-white/5">
                <p className="text-xs text-gray-500 mb-2">Items:</p>
                <div className="flex flex-wrap gap-2">
                  {page.hidden_page_items.map(item => (
                    <span key={item.id} className="text-[10px] px-2 py-1 rounded-lg bg-white/5 text-gray-400">
                      [{item.item_type}] {item.title}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </motion.div>
        ))}
      </motion.div>
    </motion.div>
  )
}

function EditHiddenPageForm({ page, onSave }: { page: HiddenPageData; onSave: () => void }) {
  const router = useRouter()
  const [form, setForm] = useState({
    title: page.title,
    description: page.description || '',
    content: page.content || '',
    access_code: page.access_code,
    is_active: !!page.is_active,
  })

  const save = async (e: React.FormEvent) => {
    e.preventDefault()
    await fetch(`/api/admin/hidden-pages/${page.id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(form),
    })
    onSave(); router.refresh()
  }

  return (
    <form onSubmit={save} className="mt-4 pt-4 border-t border-white/5 space-y-3">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <input value={form.title} onChange={e => setForm({ ...form, title: e.target.value })}
          className="bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-sm text-white focus:border-[#FF0F7B] focus:outline-none" />
        <input value={form.access_code} onChange={e => setForm({ ...form, access_code: e.target.value })}
          className="bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-sm text-white font-mono focus:border-[#FF0F7B] focus:outline-none" />
      </div>
      <input value={form.description} onChange={e => setForm({ ...form, description: e.target.value })}
        className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-sm text-white focus:border-[#FF0F7B] focus:outline-none" />
      <textarea value={form.content} onChange={e => setForm({ ...form, content: e.target.value })} rows={3}
        className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-sm text-white focus:border-[#FF0F7B] focus:outline-none resize-none" />
      <div className="flex items-center gap-4">
        <label className="flex items-center gap-2 cursor-pointer">
          <div onClick={() => setForm({ ...form, is_active: !form.is_active })}
            className={`w-10 h-5 rounded-full transition-colors relative ${form.is_active ? 'bg-[#FF0F7B]' : 'bg-white/10'}`}>
            <div className={`w-3.5 h-3.5 rounded-full bg-white absolute top-0.5 transition-transform ${form.is_active ? 'translate-x-5' : 'translate-x-1'}`} />
          </div>
          <span className="text-xs text-gray-400">Active</span>
        </label>
        <button type="submit" className="btn-primary !py-1.5 !px-4 !text-xs">Save</button>
      </div>
    </form>
  )
}
