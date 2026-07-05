'use client'

import { useEffect, useState, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import ThemeDropdown from '@/components/ThemeDropdown'

interface UserEntry {
  id: number
  username: string
  password: string
  role_number: string
  school_name: string
  user_id: string | null
  role: string | null
  avatar: string | null
  theme: string | null
  reading_font: string | null
  reading_font_size: number | null
  created_at: string | null
  updated_at: string | null
  bookmarks_count: number
  uploads_count: number
  notifications_count: number
  books_in_progress: number
  logs_count: number
  hidden_pages_accessed: number
}

export default function AdminUserDetailsPage() {
  const [users, setUsers] = useState<UserEntry[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [roleFilter, setRoleFilter] = useState('all')

  const [resetUserId, setResetUserId] = useState<number | null>(null)
  const [resetUsername, setResetUsername] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [resetting, setResetting] = useState(false)
  const [resetMsg, setResetMsg] = useState('')

  const fetchAll = useCallback(async () => {
    try {
      const res = await fetch('/api/admin/users')
      const d = await res.json()
      if (d.users) setUsers(d.users)
    } catch {
      // Silently fail users load
    }
    setLoading(false)
  }, [])

  useEffect(() => { fetchAll() }, [fetchAll])

  const openResetModal = (u: UserEntry) => {
    setResetUserId(u.id)
    setResetUsername(u.username)
    setNewPassword('')
    setResetMsg('')
  }

  const closeResetModal = () => {
    setResetUserId(null)
    setResetUsername('')
    setNewPassword('')
    setResetMsg('')
    setResetting(false)
  }

  const handleResetPassword = async () => {
    if (!resetUserId || newPassword.length < 4) {
      setResetMsg('Password must be at least 4 characters')
      return
    }
    setResetting(true)
    setResetMsg('')
    try {
      const res = await fetch('/api/admin/users/reset-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: resetUserId, newPassword }),
      })
      const d = await res.json()
      if (d.success) {
        setResetMsg('Password updated successfully!')
        setTimeout(closeResetModal, 1200)
      } else {
        setResetMsg(d.error || 'Error resetting password')
      }
    } catch {
      setResetMsg('Network error')
    }
    setResetting(false)
  }

  const filtered = users.filter(u => {
    const matchesSearch = search === '' ||
      u.username.toLowerCase().includes(search.toLowerCase()) ||
      (u.user_id && u.user_id.toLowerCase().includes(search.toLowerCase())) ||
      u.school_name.toLowerCase().includes(search.toLowerCase()) ||
      u.role_number.toLowerCase().includes(search.toLowerCase())
    const matchesRole = roleFilter === 'all' || u.role === roleFilter
    return matchesSearch && matchesRole
  })

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
          <h1 className="text-2xl sm:text-3xl font-bold">User Details</h1>
          <p className="text-gray-400 text-sm mt-1">Manage and inspect all registered accounts</p>
        </div>
        <button onClick={() => fetchAll()}
          className="btn-outline !py-2 !text-xs">
          Refresh
        </button>
      </motion.div>

      {/* Filters */}
      <motion.div variants={item} className="flex flex-col sm:flex-row gap-3 mb-6">
        <div className="relative flex-1">
          <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          <input type="text" value={search} onChange={e => setSearch(e.target.value)}
            placeholder="Search by name, email, school, or roll number..."
            className="w-full glass-card !py-2.5 !px-10 !text-sm !rounded-xl" />
        </div>
        <ThemeDropdown
          options={[
            { value: 'all', label: 'All Roles' },
            { value: 'admin', label: 'Admin' },
            { value: 'student', label: 'Student' },
          ]}
          value={roleFilter}
          onChange={setRoleFilter}
        />
      </motion.div>

      {/* Summary bar */}
      <motion.div variants={item} className="flex flex-wrap gap-3 mb-6 text-xs text-gray-500">
        <span><strong className="text-white">{users.length}</strong> total users</span>
        <span className="opacity-30">|</span>
        <span><strong className="text-[#FF0F7B]">{users.filter(u => u.role === 'admin').length}</strong> admins</span>
        <span className="opacity-30">|</span>
        <span><strong className="text-gray-300">{users.filter(u => u.role === 'student').length}</strong> students</span>
      </motion.div>

      {/* Table */}
      <motion.div variants={item} className="glass-card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-gray-500 text-xs border-b border-white/5">
                <th className="p-4">ID</th>
                <th className="p-4">Username</th>
                <th className="p-4">Email / User ID</th>
                <th className="p-4">Password</th>
                <th className="p-4">School</th>
                <th className="p-4">Roll No.</th>
                <th className="p-4">Role</th>
                <th className="p-4">Activity</th>
                <th className="p-4">Registered</th>
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 && (
                <tr><td colSpan={9} className="py-16 text-center text-gray-500 text-sm">No users match your filters.</td></tr>
              )}
              {filtered.map(u => (
                <tr key={u.id} className="border-b border-white/5 last:border-0 hover:bg-white/[0.02] transition-colors">
                  <td className="p-4 text-gray-500 font-mono text-[10px]">{u.id}</td>
                  <td className="p-4">
                    <div className="flex items-center gap-2">
                      <div className="w-7 h-7 rounded-full bg-[#FF0F7B]/20 flex items-center justify-center text-[10px] font-bold text-[#FF0F7B] shrink-0">
                        {u.username.charAt(0).toUpperCase()}
                      </div>
                      <span className="text-gray-200 font-medium">{u.username}</span>
                    </div>
                  </td>
                  <td className="p-4 text-gray-400 text-xs">{u.user_id || <span className="text-gray-600 italic">none</span>}</td>
                  <td className="p-4">
                    <div className="flex items-center gap-2 min-w-0">
                      <code className="text-[10px] font-mono bg-white/5 px-2 py-1 rounded truncate max-w-[200px]">
                        <span className="text-yellow-400/70 italic">credentials encrypted</span>
                      </code>
                      <button onClick={() => openResetModal(u)}
                        className="text-gray-500 hover:text-pink-400 shrink-0 transition-colors"
                        title="Reset password for this user">
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 5.25a3 3 0 013 3m3 0a6 6 0 01-7.029 5.912c-.563-.097-1.159.026-1.563.43L10.5 17.25H8.25v2.25H6v2.25H2.25v-2.818c0-.597.237-1.17.659-1.591l6.499-6.499c.404-.404.527-1 .43-1.563A6 6 0 1121.75 8.25z" />
                        </svg>
                      </button>
                    </div>
                  </td>
                  <td className="p-4 text-gray-400 text-xs max-w-[140px] truncate">{u.school_name}</td>
                  <td className="p-4 text-gray-500 text-[10px] font-mono">{u.role_number}</td>
                  <td className="p-4">
                    <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium ${
                      u.role === 'admin'
                        ? 'bg-[#FF0F7B]/20 text-[#FF0F7B]'
                        : 'bg-white/5 text-gray-400'
                    }`}>
                      {u.role || 'student'}
                    </span>
                  </td>
                  <td className="p-4">
                    <div className="flex gap-2 text-[10px] text-gray-500">
                      <span title="Bookmarks">{u.bookmarks_count} BM</span>
                      <span title="Uploads">{u.uploads_count} UP</span>
                      <span title="Books in progress">{u.books_in_progress} IP</span>
                    </div>
                  </td>
                  <td className="p-4 text-gray-500 text-[10px] whitespace-nowrap">{u.created_at}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </motion.div>

      {/* Footnote */}
      <motion.div variants={item} className="mt-4 text-[10px] text-gray-600 text-center">
        Click the key icon to reset a user&apos;s password. Passwords are bcrypt-hashed and cannot be decrypted.
      </motion.div>

      {/* Password Reset Modal */}
      <AnimatePresence>
        {resetUserId !== null && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
            onClick={closeResetModal}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              transition={{ duration: 0.15 }}
              onClick={e => e.stopPropagation()}
              className="glass-card !rounded-2xl p-6 w-full max-w-md"
            >
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-semibold text-lg">Reset Password</h3>
                <button onClick={closeResetModal} className="text-gray-500 hover:text-white p-1">
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              <p className="text-sm text-gray-400 mb-1">
                Enter a fresh password for <span className="text-white font-medium">{resetUsername}</span>
              </p>
              <p className="text-[11px] text-gray-500 mb-4">
                This will be bcrypt-hashed and stored securely — the original password cannot be recovered.
              </p>

              <input
                type="text"
                value={newPassword}
                onChange={e => setNewPassword(e.target.value)}
                placeholder="New password (min 4 characters)"
                autoFocus
                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white placeholder-gray-500 focus:border-[#FF0F7B] focus:outline-none mb-3"
                onKeyDown={e => { if (e.key === 'Enter' && !resetting) handleResetPassword() }}
              />

              {resetMsg && (
                <div className={`text-sm mb-3 px-3 py-2 rounded-lg ${
                  resetMsg.includes('success') ? 'bg-green-500/10 text-green-400' : 'bg-red-500/10 text-red-400'
                }`}>
                  {resetMsg}
                </div>
              )}

              <div className="flex gap-2">
                <button onClick={closeResetModal}
                  className="flex-1 btn-outline !py-2.5 !text-sm">
                  Cancel
                </button>
                <button onClick={handleResetPassword} disabled={resetting || newPassword.length < 4}
                  className="flex-1 btn-primary mandala-btn !py-2.5 !text-sm disabled:opacity-50 disabled:cursor-not-allowed">
                  {resetting ? (
                    <span className="flex items-center justify-center gap-2">
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      Resetting...
                    </span>
                  ) : 'Set Password'}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  )
}
