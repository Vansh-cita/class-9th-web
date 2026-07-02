'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { motion } from 'framer-motion'

export default function RegisterPage() {
  const router = useRouter()
  const [form, setForm] = useState({
    username: '',
    password: '',
    confirmPassword: '',
    role_number: '',
    school_name: '',
    user_id: '',
  })
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    setSuccess('')

    if (form.password !== form.confirmPassword) {
      setError('Passwords do not match')
      return
    }

    setLoading(true)

    try {
      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          username: form.username,
          password: form.password,
          role_number: form.role_number,
          school_name: form.school_name,
          user_id: form.user_id || undefined,
        }),
      })
      const data = await res.json()
      if (!res.ok) {
        setError(data.error || 'Registration failed')
      } else {
        setSuccess('Registration successful! Redirecting to login...')
        setTimeout(() => router.push('/login'), 1500)
      }
    } catch {
      setError('Network error. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-20">
      <div className="absolute inset-0 bg-gradient-to-b from-[#FF0F7B]/5 via-transparent to-[#050505] pointer-events-none" />
      <div className="absolute top-1/3 left-1/2 -translate-x-1/2 w-[400px] h-[400px] bg-[#FF0F7B]/8 rounded-full blur-[100px] pointer-events-none" />

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="relative z-10 w-full max-w-md"
      >
        <div className="glass-card p-6 sm:p-8">
          <div className="text-center mb-8">
            <h1 className="text-2xl font-bold neon-text">Create Account</h1>
            <p className="text-gray-400 text-sm mt-2">Join the CBSE Class 9 Learning Portal</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm text-gray-400 mb-2">Username *</label>
              <input
                type="text"
                value={form.username}
                onChange={e => setForm({ ...form, username: e.target.value })}
                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-gray-500 focus:border-[#FF0F7B] focus:outline-none transition-colors"
                required
              />
            </div>
            <div>
              <label className="block text-sm text-gray-400 mb-2">Roll Number *</label>
              <input
                type="text"
                value={form.role_number}
                onChange={e => setForm({ ...form, role_number: e.target.value })}
                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-gray-500 focus:border-[#FF0F7B] focus:outline-none transition-colors"
                required
              />
            </div>
            <div>
              <label className="block text-sm text-gray-400 mb-2">School Name *</label>
              <input
                type="text"
                value={form.school_name}
                onChange={e => setForm({ ...form, school_name: e.target.value })}
                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-gray-500 focus:border-[#FF0F7B] focus:outline-none transition-colors"
                required
              />
            </div>
            <div>
              <label className="block text-sm text-gray-400 mb-2">
                User ID <span className="text-gray-600">(optional)</span>
              </label>
              <input
                type="text"
                value={form.user_id}
                onChange={e => setForm({ ...form, user_id: e.target.value })}
                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-gray-500 focus:border-[#FF0F7B] focus:outline-none transition-colors"
                placeholder="Leave blank for auto-generated ID"
              />
            </div>
            <div>
              <label className="block text-sm text-gray-400 mb-2">Password *</label>
              <input
                type="password"
                value={form.password}
                onChange={e => setForm({ ...form, password: e.target.value })}
                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-gray-500 focus:border-[#FF0F7B] focus:outline-none transition-colors"
                required
              />
            </div>
            <div>
              <label className="block text-sm text-gray-400 mb-2">Confirm Password *</label>
              <input
                type="password"
                value={form.confirmPassword}
                onChange={e => setForm({ ...form, confirmPassword: e.target.value })}
                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-gray-500 focus:border-[#FF0F7B] focus:outline-none transition-colors"
                required
              />
            </div>

            {error && (
              <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-red-400 text-sm text-center">
                {error}
              </motion.p>
            )}
            {success && (
              <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-green-400 text-sm text-center">
                {success}
              </motion.p>
            )}

            <button
              type="submit"
              disabled={loading}
              className="btn-primary w-full !py-3.5 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Creating account...' : 'Register'}
            </button>
          </form>

          <p className="text-center text-sm text-gray-400 mt-6">
            Already have an account?{' '}
            <Link href="/login" className="text-[#FF0F7B] hover:underline">
              Login
            </Link>
          </p>
        </div>
      </motion.div>
    </div>
  )
}
