'use client'

import { useEffect, useState, useCallback } from 'react'
import { motion } from 'framer-motion'

interface AdminStats {
  totalUsers: number
  totalBooks: number
  totalCategories: number
  totalChapters: number
  totalUploads: number
  totalBookmarks: number
  totalHiddenPages: number
  activeHiddenPages: number
}

interface LogEntry {
  id: number
  action: string
  details: string | null
  created_at: string | null
  users: { username: string } | null
}

interface AnnouncementEntry {
  id: number
  title: string
  content: string
  type: string | null
  is_pinned: number | null
  created_at: string | null
  users: { username: string } | null
}

export default function AdminDashboardPage() {
  const [stats, setStats] = useState<AdminStats | null>(null)
  const [logs, setLogs] = useState<LogEntry[]>([])
  const [announcements, setAnnouncements] = useState<AnnouncementEntry[]>([])

  const fetchAll = useCallback(async () => {
    const [statsRes, logsRes, annRes] = await Promise.all([
      fetch('/api/admin/stats'),
      fetch('/api/admin/logs?limit=10'),
      fetch('/api/admin/announcements'),
    ])
    const sd = await statsRes.json()
    if (sd.stats) setStats(sd.stats)
    const ld = await logsRes.json()
    if (ld.logs) setLogs(ld.logs)
    const ad = await annRes.json()
    if (ad.announcements) setAnnouncements(ad.announcements)
  }, [])

  useEffect(() => { fetchAll() }, [fetchAll])

  const statCards = stats ? [
    { label: 'Total Users', value: stats.totalUsers, color: 'from-[#FF0F7B] to-[#9D4EDD]' },
    { label: 'Books', value: stats.totalBooks, color: 'from-[#00D4FF] to-[#0099CC]' },
    { label: 'Categories', value: stats.totalCategories, color: 'from-[#FFD700] to-[#FFA500]' },
    { label: 'Chapters', value: stats.totalChapters, color: 'from-[#00FF88] to-[#00CC66]' },
    { label: 'Uploads', value: stats.totalUploads, color: 'from-[#FF6B6B] to-[#EE4444]' },
    { label: 'Bookmarks', value: stats.totalBookmarks, color: 'from-[#A855F7] to-[#7C3AED]' },
    { label: 'Hidden Pages', value: stats.totalHiddenPages, color: 'from-[#FF0F7B] to-[#9D4EDD]' },
    { label: 'Active Hidden', value: stats.activeHiddenPages, color: 'from-[#00FF88] to-[#00CC66]' },
  ] : []

  const container = { hidden: { opacity: 0 }, show: { opacity: 1, transition: { staggerChildren: 0.03 } } }
  const item = { hidden: { opacity: 0, y: 12 }, show: { opacity: 1, y: 0 } }

  return (
    <motion.div variants={container} initial="hidden" animate="show">
      <motion.div variants={item} className="mb-8">
        <h1 className="text-2xl sm:text-3xl font-bold">Admin Dashboard</h1>
        <p className="text-gray-400 text-sm mt-1">Full control over the learning portal</p>
      </motion.div>

      <motion.div variants={item} className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-8">
        {statCards.map(s => (
          <div key={s.label} className="glass-card p-5">
            <p className="text-xs text-gray-500 mb-1">{s.label}</p>
            <p className={`text-3xl font-bold bg-gradient-to-r ${s.color} bg-clip-text text-transparent`}>
              {s.value}
            </p>
          </div>
        ))}
      </motion.div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        <motion.div variants={item} className="glass-card p-6">
          <h3 className="font-semibold mb-4">Recent Logs</h3>
          <div className="space-y-2 max-h-64 overflow-y-auto">
            {logs.map(log => (
              <div key={log.id} className="flex items-start gap-3 py-2 border-b border-white/5 last:border-0">
                <span className="text-[10px] px-1.5 py-0.5 rounded bg-white/5 text-gray-400 uppercase shrink-0 mt-0.5">
                  {log.action}
                </span>
                <div className="min-w-0">
                  <p className="text-xs text-gray-300 truncate">{log.details || log.action}</p>
                  <p className="text-[10px] text-gray-600">{log.users?.username || 'system'} &middot; {log.created_at}</p>
                </div>
              </div>
            ))}
          </div>
        </motion.div>

        <motion.div variants={item} className="glass-card p-6">
          <h3 className="font-semibold mb-4">Recent Announcements</h3>
          <div className="space-y-3 max-h-64 overflow-y-auto">
            {announcements.map(a => (
              <div key={a.id} className="p-3 rounded-xl bg-white/5">
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-sm font-medium">{a.title}</span>
                  {a.is_pinned ? <span className="text-[10px] px-1.5 py-0.5 rounded bg-[#FF0F7B]/20 text-[#FF0F7B]">PINNED</span> : null}
                </div>
                <p className="text-xs text-gray-400 line-clamp-2">{a.content}</p>
                <p className="text-[10px] text-gray-600 mt-1">{a.users?.username} &middot; {a.created_at}</p>
              </div>
            ))}
          </div>
        </motion.div>
      </div>
    </motion.div>
  )
}
