'use client'

import { useEffect, useState } from 'react'
import AnimatedModal from './AnimatedModal'
import { SkeletonAnnouncementItem } from './Skeleton'

interface Announcement {
  id: number
  title: string
  content: string
  type: string | null
  is_pinned: boolean | null
  created_at: string | null
  users: { username: string } | null
}

interface Props {
  open: boolean
  onClose: () => void
}

function timeAgo(dateStr: string | null): string {
  if (!dateStr) return ''
  const now = Date.now()
  const date = new Date(dateStr).getTime()
  const diff = now - date
  const seconds = Math.floor(diff / 1000)
  const minutes = Math.floor(seconds / 60)
  const hours = Math.floor(minutes / 60)
  const days = Math.floor(hours / 24)
  if (days > 7) {
    return new Date(dateStr).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })
  }
  if (days > 0) return `${days}d ago`
  if (hours > 0) return `${hours}h ago`
  if (minutes > 0) return `${minutes}m ago`
  return 'just now'
}

export default function AnnouncementModal({ open, onClose }: Props) {
  const [announcements, setAnnouncements] = useState<Announcement[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    if (!open) return
    setLoading(true)
    setError('')
    fetch('/api/announcements')
      .then(r => r.json())
      .then(d => {
        if (d.announcements) setAnnouncements(d.announcements)
        else setError('Failed to load announcements')
      })
      .catch(() => setError('Failed to load announcements'))
      .finally(() => setLoading(false))
  }, [open])

  return (
    <AnimatedModal open={open} onClose={onClose} title="Announcements">
      {loading ? (
        <div className="space-y-3">
          {Array.from({ length: 4 }).map((_, i) => <SkeletonAnnouncementItem key={i} />)}
        </div>
      ) : error ? (
        <p className="text-gray-500 text-sm text-center py-8">{error}</p>
      ) : announcements.length === 0 ? (
        <p className="text-gray-500 text-sm text-center py-8">No announcements yet.</p>
      ) : (
        <div className="space-y-3 max-h-[50vh] overflow-y-auto pr-1">
          {announcements.map(a => (
            <div
              key={a.id}
              className="glass-card !rounded-xl p-4 border-l-2"
              style={{ borderLeftColor: a.is_pinned ? '#FF0F7B' : 'rgba(255,255,255,0.06)' }}
            >
              <div className="flex items-center gap-2 mb-1.5">
                {a.is_pinned ? (
                  <span className="text-[10px] px-1.5 py-0.5 rounded bg-[#FF0F7B]/10 text-[#FF0F7B] font-medium uppercase">Pinned</span>
                ) : null}
                {a.type ? (
                  <span className="text-[10px] px-1.5 py-0.5 rounded bg-white/5 text-gray-500 uppercase">{a.type}</span>
                ) : null}
              </div>
              <h3 className="text-sm font-medium mb-0.5">{a.title}</h3>
              <p className="text-xs text-gray-400 leading-relaxed">{a.content}</p>
              <div className="flex items-center gap-2 mt-2 text-[10px] text-gray-600">
                {a.users?.username ? <span>{a.users.username}</span> : null}
                {a.users?.username && a.created_at ? <span>&middot;</span> : null}
                {a.created_at ? <span>{timeAgo(a.created_at)}</span> : null}
              </div>
            </div>
          ))}
        </div>
      )}
    </AnimatedModal>
  )
}
