'use client'

import { useEffect, useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { motion } from 'framer-motion'
import ThemeDropdown from '@/components/ThemeDropdown'

interface Announcement {
  id: number
  title: string
  content: string
  type: string | null
  is_pinned: boolean | null
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
    try {
      const res = await fetch('/api/admin/announcements')
      const d = await res.json()
      if (d.announcements) setAnnouncements(d.announcements)
    } catch {
      setFormMsg('Failed to load announcements')
    }
    setLoading(false)
  }, [])

  useEffect(() => { fetchAll() }, [fetchAll])

  async function deleteAnnouncement(id: number) {
    if (!confirm('Delete this announcement permanently?')) return
    try {
      const res = await fetch(`/api/admin/announcements?id=${id}`, { method: 'DELETE' })
      const d = await res.json()
      setFormMsg(d.success ? 'Announcement deleted!' : d.error || 'Error')
      if (d.success) { fetchAll(); router.refresh() }
    } catch {
      setFormMsg('Network error')
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setFormMsg('')
    setSubmitting(true)
    try {
      const res = await fetch('/api/admin/announcements', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      })
      const d = await res.json()

      if (!res.ok) { setFormMsg(d.error || 'Error'); return }

      setFormMsg('Announcement sent to all users!')
      setForm({ title: '', content: '', type: 'general', is_pinned: false })
      fetchAll()
      router.refresh()
    } catch {
      setFormMsg('Network error')
    }
    setSubmitting(false)
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
            <ThemeDropdown
              options={[
                { value: 'general', label: 'General' },
                { value: 'exam', label: 'Exam' },
                { value: 'event', label: 'Event' },
                { value: 'holiday', label: 'Holiday' },
              ]}
              value={form.type}
              onChange={v => setForm({ ...form, type: v })}
            />
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
              <div className="flex items-center justify-between mt-2">
                <p className="text-[10px] text-gray-600">{a.users?.username} &middot; {a.created_at}</p>
                <button onClick={() => deleteAnnouncement(a.id)}
                  className="text-red-400 hover:text-red-300 transition-colors p-1"
                  title="Delete announcement">
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0" />
                  </svg>
                </button>
              </div>
            </div>
          ))}
        </div>
      </motion.div>
    </motion.div>
  )
}
