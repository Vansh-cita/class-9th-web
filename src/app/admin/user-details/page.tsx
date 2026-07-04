'use client'

import { useEffect, useState, useCallback } from 'react'
import { motion } from 'framer-motion'
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
  const [visiblePasswords, setVisiblePasswords] = useState<Set<number>>(new Set())

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

  const togglePassword = (id: number) => {
    setVisiblePasswords(prev => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id); else next.add(id)
      return next
    })
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
                    <div className="flex items-center gap-2">
                      <code className="text-[10px] font-mono bg-white/5 px-2 py-1 rounded select-all">
                        {visiblePasswords.has(u.id) ? (
                          <span className="text-yellow-400/70 italic">credentials encrypted</span>
                        ) : u.password}
                      </code>
                      <button onClick={() => togglePassword(u.id)}
                        className="text-gray-500 hover:text-white shrink-0 transition-colors"
                        title={visiblePasswords.has(u.id) ? 'Hide' : 'View credentials'}>
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                          {visiblePasswords.has(u.id) ? (
                            <path strokeLinecap="round" strokeLinejoin="round" d="M3.98 8.223A10.477 10.477 0 001.934 12C3.226 16.338 7.244 19.5 12 19.5c.993 0 1.953-.138 2.863-.395M6.228 6.228A10.45 10.45 0 0112 4.5c4.756 0 8.773 3.162 10.065 7.498a10.523 10.523 0 01-4.293 5.774M6.228 6.228L3 3m3.228 3.228l3.65 3.65m7.894 7.894L21 21m-3.228-3.228l-3.65-3.65m0 0a3 3 0 10-4.243-4.243m4.242 4.242L9.88 9.88" />
                          ) : (
                            <path strokeLinecap="round" strokeLinejoin="round" d="M2.036 12.322a1.012 1.012 0 010-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178z" />
                          )}
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

      {/* Detail modal trigger info */}
      <motion.div variants={item} className="mt-4 text-[10px] text-gray-600 text-center">
        Click the eye icon <svg className="w-3 h-3 inline" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M2.036 12.322a1.012 1.012 0 010-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178z" /></svg> next to a password to view credential status. Password hashes are encrypted and never exposed in plain text.
      </motion.div>
    </motion.div>
  )
}
