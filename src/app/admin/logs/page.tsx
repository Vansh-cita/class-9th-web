'use client'

import { useEffect, useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { motion } from 'framer-motion'

interface LogEntry {
  id: number
  action: string
  details: string | null
  ip_address: string | null
  created_at: string | null
  users: { id: number; username: string } | null
}

export default function AdminLogsPage() {
  const router = useRouter()
  const [logs, setLogs] = useState<LogEntry[]>([])
  const [loading, setLoading] = useState(true)

  const fetchAll = useCallback(async () => {
    const res = await fetch('/api/admin/logs?limit=100')
    const d = await res.json()
    if (d.logs) setLogs(d.logs)
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
          <h1 className="text-2xl sm:text-3xl font-bold">System Logs</h1>
          <p className="text-gray-400 text-sm mt-1">Activity audit trail for the entire platform</p>
        </div>
        <button onClick={() => fetchAll()}
          className="btn-outline !py-2 !text-xs">
          Refresh
        </button>
      </motion.div>

      <motion.div variants={item} className="glass-card p-6">
        <h3 className="font-semibold mb-4">Activity Logs ({logs.length})</h3>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-gray-500 text-xs border-b border-white/5">
                <th className="pb-3 pr-4">Action</th>
                <th className="pb-3 pr-4">User</th>
                <th className="pb-3 pr-4">Details</th>
                <th className="pb-3 pr-4">IP</th>
                <th className="pb-3">Date</th>
              </tr>
            </thead>
            <tbody>
              {logs.length === 0 && (
                <tr><td colSpan={5} className="py-12 text-center text-gray-500 text-sm">No activity logs found.</td></tr>
              )}
              {logs.map(log => (
                <tr key={log.id} className="border-b border-white/5 last:border-0">
                  <td className="py-3 pr-4">
                    <span className="text-[10px] px-1.5 py-0.5 rounded bg-white/5 text-gray-400 uppercase font-mono">
                      {log.action}
                    </span>
                  </td>
                  <td className="py-3 pr-4 text-gray-400 text-xs">{log.users?.username || 'system'}</td>
                  <td className="py-3 pr-4 text-gray-400 text-xs max-w-[300px] truncate">{log.details || '-'}</td>
                  <td className="py-3 pr-4 text-gray-600 text-[10px] font-mono">{log.ip_address || '-'}</td>
                  <td className="py-3 text-gray-500 text-[10px] whitespace-nowrap">{log.created_at}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </motion.div>
    </motion.div>
  )
}
