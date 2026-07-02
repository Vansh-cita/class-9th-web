'use client'

import { useEffect, useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { motion } from 'framer-motion'

interface Announcement {
  id: number
  title: string
  content: string
  type: string | null
  is_pinned: number | null
  created_at: string | null
  users: { username: string } | null
}

export default function AdminAnnouncementsPage() {
  const router = useRouter()
  const [announcements, setAnnouncements] = useState<Announcement[]>([])
  const [loading, setLoading] = useState(true)
  const [formMsg, setFormMsg] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [form, setForm] = useState({ title: '', content: '', type: 'general', is_pinned: false })

  const fetchAll = useCallback(async () => {
    const res = await fetch('/api/admin/announcements')
    const d = await res.json()
    if (d.announcements) setAnnouncements(d.announcements)
    setLoading(false)
  }, [])

  useEffect(() => { fetchAll() }, [fetchAll])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setFormMsg('')
    setSubmitting(true)

    const res = await fetch('/api/admin/announcements', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(form),
    })
    const d = await res.json()

    setSubmitting(false)
    if (!res.ok) { setFormMsg(d.error || 'Error'); return }

    setFormMsg('Announcement sent to all users!')
    setForm({ title: '', content: '', type: 'general', is_pinned: false })
    fetchAll()
    router.refresh()
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
          <h1 className="text-2xl sm:text-3xl font-bold">Announcements</h1>
          <p className="text-gray-400 text-sm mt-1">Broadcast messages to all students</p>
        </div>
      </motion.div>

      {formMsg && (
        <motion.div variants={item} className="glass-card !rounded-xl px-4 py-3 mb-6 text-sm border-l-4 border-[#FF0F7B]">
          {formMsg}
          <button onClick={() => setFormMsg('')} className="ml-3 text-gray-500 hover:text-white">&times;</button>
        </motion.div>
      )}

      <motion.div variants={item} className="glass-card p-6 mb-8">
        <h3 className="font-semibold mb-5">Create Announcement</h3>
        <form onSubmit={handleSubmit} className="space-y-4">
          <input value={form.title} onChange={e => setForm({ ...form, title: e.target.value })}
            className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white placeholder-gray-500 focus:border-[#FF0F7B] focus:outline-none"
            placeholder="Announcement title" required />
          <textarea value={form.content} onChange={e => setForm({ ...form, content: e.target.value })} rows={4}
            className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white placeholder-gray-500 focus:border-[#FF0F7B] focus:outline-none resize-none"
            placeholder="Announcement content" required />
          <div className="flex flex-col sm:flex-row sm:items-center gap-4 sm:gap-6">
            <select value={form.type} onChange={e => setForm({ ...form, type: e.target.value })}
              className="bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white focus:border-[#FF0F7B] focus:outline-none">
              <option value="general">General</option>
              <option value="exam">Exam</option>
              <option value="event">Event</option>
              <option value="holiday">Holiday</option>
            </select>
            <label className="flex items-center gap-2 text-sm text-gray-400 cursor-pointer">
              <input type="checkbox" checked={form.is_pinned} onChange={e => setForm({ ...form, is_pinned: e.target.checked })}
                className="accent-[#FF0F7B] w-4 h-4" />
              Pin announcement
            </label>
          </div>
          <button type="submit" disabled={submitting}
            className="btn-primary !py-2.5 !text-sm disabled:opacity-50 disabled:cursor-not-allowed">
            {submitting ? (
              <span className="flex items-center gap-2">
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                Sending...
              </span>
            ) : 'Send to All Users'}
          </button>
        </form>
      </motion.div>

      <motion.div variants={item} className="glass-card p-6">
        <h3 className="font-semibold mb-4">Sent Announcements ({announcements.length})</h3>
        <div className="space-y-3">
          {announcements.length === 0 && (
            <p className="text-sm text-gray-500 text-center py-8">No announcements sent yet.</p>
          )}
          {announcements.map(a => (
            <div key={a.id} className="p-4 rounded-xl bg-white/5">
              <div className="flex items-center gap-2 mb-1.5">
                <span className="text-xs px-1.5 py-0.5 rounded bg-white/5 text-gray-500 uppercase">{a.type}</span>
                {a.is_pinned ? <span className="text-[10px] px-1.5 py-0.5 rounded bg-[#FF0F7B]/20 text-[#FF0F7B]">PINNED</span> : null}
              </div>
              <h4 className="font-medium text-sm">{a.title}</h4>
              <p className="text-xs text-gray-400 mt-1 line-clamp-2">{a.content}</p>
              <p className="text-[10px] text-gray-600 mt-2">{a.users?.username} &middot; {a.created_at}</p>
            </div>
          ))}
        </div>
      </motion.div>
    </motion.div>
  )
}
