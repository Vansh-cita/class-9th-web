'use client'

import { useEffect, useState, useCallback } from 'react'
import { motion } from 'framer-motion'

interface FeedbackEntry {
  id: number
  rating: number
  message: string
  created_at: string | null
  users: { id: number; username: string; user_id: string | null } | null
}

function Stars({ count }: { count: number }) {
  return (
    <div className="flex items-center gap-0.5">
      {[1, 2, 3, 4, 5].map(s => (
        <svg key={s} className="w-3.5 h-3.5" viewBox="0 0 24 24"
          fill={s <= count ? '#FFD700' : 'none'} stroke="#FFD700" strokeWidth={1.5}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M11.48 3.499a.562.562 0 011.04 0l2.125 5.111a.563.563 0 00.475.345l5.518.442c.499.04.701.663.321.988l-4.204 3.602a.563.563 0 00-.182.557l1.285 5.385a.562.562 0 01-.84.61l-4.725-2.885a.563.563 0 00-.586 0L6.982 20.54a.562.562 0 01-.84-.61l1.285-5.386a.562.562 0 00-.182-.557l-4.204-3.602a.563.563 0 01.321-.988l5.518-.442a.563.563 0 00.475-.345L11.48 3.5z" />
        </svg>
      ))}
    </div>
  )
}

export default function AdminFeedbackPage() {
  const [feedback, setFeedback] = useState<FeedbackEntry[]>([])
  const [loading, setLoading] = useState(true)

  const fetchAll = useCallback(async () => {
    try {
      const res = await fetch('/api/feedback')
      const d = await res.json()
      if (d.feedback) setFeedback(d.feedback)
    } catch {
      // Silently fail feedback load
    }
    setLoading(false)
  }, [])

  useEffect(() => { fetchAll() }, [fetchAll])

  const container = { hidden: { opacity: 0 }, show: { opacity: 1, transition: { staggerChildren: 0.02 } } }
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
          <h1 className="text-2xl sm:text-3xl font-bold">Feedback &amp; FAQs</h1>
          <p className="text-gray-400 text-sm mt-1">Student reviews, ratings, and submitted requests</p>
        </div>
        <button onClick={() => fetchAll()}
          className="btn-outline !py-2 !text-xs">
          Refresh
        </button>
      </motion.div>

      <motion.div variants={item} className="flex flex-wrap gap-3 mb-6 text-xs text-gray-500">
        <span><strong className="text-white">{feedback.length}</strong> total submissions</span>
        <span className="opacity-30">|</span>
        <span>
          <strong className="text-[#FFD700]">
            {feedback.length > 0
              ? (feedback.reduce((s, f) => s + f.rating, 0) / feedback.length).toFixed(1)
              : '—'}
          </strong> avg rating
        </span>
      </motion.div>

      <motion.div variants={item} className="glass-card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-gray-500 text-xs border-b border-white/5">
                <th className="p-4">Student</th>
                <th className="p-4">Email / ID</th>
                <th className="p-4">Rating</th>
                <th className="p-4">Feedback</th>
                <th className="p-4">Date</th>
              </tr>
            </thead>
            <tbody>
              {feedback.length === 0 && (
                <tr><td colSpan={5} className="py-16 text-center text-gray-500 text-sm">No feedback submissions yet.</td></tr>
              )}
              {feedback.map(f => (
                <tr key={f.id} className="border-b border-white/5 last:border-0 hover:bg-white/[0.02] transition-colors">
                  <td className="p-4">
                    <div className="flex items-center gap-2">
                      <div className="w-7 h-7 rounded-full bg-[#FF0F7B]/20 flex items-center justify-center text-[10px] font-bold text-[#FF0F7B] shrink-0">
                        {f.users?.username?.charAt(0).toUpperCase() || '?'}
                      </div>
                      <span className="text-gray-200 text-xs">{f.users?.username || 'Deleted User'}</span>
                    </div>
                  </td>
                  <td className="p-4 text-gray-400 text-[10px] font-mono">{f.users?.user_id || '—'}</td>
                  <td className="p-4"><Stars count={f.rating} /></td>
                  <td className="p-4 text-gray-400 text-xs max-w-[320px]">
                    <p className="line-clamp-2 leading-relaxed">{f.message}</p>
                  </td>
                  <td className="p-4 text-gray-500 text-[10px] whitespace-nowrap">{f.created_at}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </motion.div>
    </motion.div>
  )
}
