'use client'

import { useEffect, useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { motion } from 'framer-motion'

interface Upload {
  id: number
  filename: string
  original_name: string | null
  file_path: string
  file_type: string | null
  file_size: number | null
  created_at: string | null
  users: { username: string } | null
  books: { title: string } | null
}

export default function AdminUploadsPage() {
  const router = useRouter()
  const [uploads, setUploads] = useState<Upload[]>([])
  const [loading, setLoading] = useState(true)

  const fetchAll = useCallback(async () => {
    try {
      const res = await fetch('/api/admin/uploads')
      const d = await res.json()
      if (d.uploads) setUploads(d.uploads)
    } catch {
      // Silently fail uploads load
    }
    setLoading(false)
  }, [])

  useEffect(() => { fetchAll() }, [fetchAll])

  const container = { hidden: { opacity: 0 }, show: { opacity: 1, transition: { staggerChildren: 0.03 } } }
  const item = { hidden: { opacity: 0, y: 12 }, show: { opacity: 1, y: 0 } }

  const formatSize = (bytes: number | null) => {
    if (!bytes) return '-'
    if (bytes < 1024) return `${bytes} B`
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
    return `${(bytes / (1024 * 1024)).toFixed(2)} MB`
  }

  const getTypeIcon = (type: string | null) => {
    if (!type) return '📄'
    if (type.startsWith('image')) return '🖼️'
    if (type.includes('pdf')) return '📕'
    if (type.includes('epub')) return '📘'
    return '📄'
  }

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
          <h1 className="text-2xl sm:text-3xl font-bold">Uploads</h1>
          <p className="text-gray-400 text-sm mt-1">File assets and uploaded resources</p>
        </div>
      </motion.div>

      <motion.div variants={item} className="glass-card p-6">
        <h3 className="font-semibold mb-4">All Uploaded Files ({uploads.length})</h3>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-gray-500 text-xs border-b border-white/5">
                <th className="pb-3 pr-4">File</th>
                <th className="pb-3 pr-4">Type</th>
                <th className="pb-3 pr-4">Size</th>
                <th className="pb-3 pr-4">Uploaded By</th>
                <th className="pb-3 pr-4">Book</th>
                <th className="pb-3">Date</th>
              </tr>
            </thead>
            <tbody>
              {uploads.length === 0 && (
                <tr><td colSpan={6} className="py-12 text-center text-gray-500 text-sm">No files uploaded yet.</td></tr>
              )}
              {uploads.map(u => (
                <tr key={u.id} className="border-b border-white/5 last:border-0">
                  <td className="py-3 pr-4">
                    <div className="flex items-center gap-2">
                      <span className="text-base">{getTypeIcon(u.file_type)}</span>
                      <span className="font-medium truncate max-w-[200px]">{u.original_name || u.filename}</span>
                    </div>
                  </td>
                  <td className="py-3 pr-4 text-gray-400 text-[10px] uppercase">{u.file_type || '-'}</td>
                  <td className="py-3 pr-4 text-gray-400">{formatSize(u.file_size)}</td>
                  <td className="py-3 pr-4 text-gray-400">{u.users?.username || 'system'}</td>
                  <td className="py-3 pr-4 text-gray-400">{u.books?.title || '-'}</td>
                  <td className="py-3 text-gray-500 text-[10px]">{u.created_at}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </motion.div>
    </motion.div>
  )
}
