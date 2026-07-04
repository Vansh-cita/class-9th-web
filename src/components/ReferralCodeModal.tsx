'use client'

import { useState, useRef, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { motion } from 'framer-motion'
import AnimatedModal from './AnimatedModal'

interface Props {
  open: boolean
  onClose: () => void
}

export default function ReferralCodeModal({ open, onClose }: Props) {
  const router = useRouter()
  const [code, setCode] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState<{ title: string; slug: string } | null>(null)
  const [shake, setShake] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (open) {
      setCode('')
      setError('')
      setSuccess(null)
      setShake(false)
      setTimeout(() => inputRef.current?.focus(), 300)
    }
  }, [open])

  const triggerShake = () => {
    setShake(true)
    setTimeout(() => setShake(false), 500)
  }

  const handleSubmit = async () => {
    if (!code.trim()) return
    setLoading(true)
    setError('')
    try {
      const res = await fetch('/api/hidden/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code: code.trim() }),
      })
      const d = await res.json()
      if (d.success && d.page?.slug) {
        setSuccess({ title: d.page.title, slug: d.page.slug })
        setTimeout(() => {
          onClose()
          router.push(`/hidden/${d.page.slug}`)
        }, 1500)
      } else {
        setError(d.error || 'Invalid access code')
        triggerShake()
      }
    } catch {
      setError('Failed to verify code. Check your connection.')
      triggerShake()
    }
    setLoading(false)
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') handleSubmit()
  }

  return (
    <AnimatedModal open={open} onClose={onClose} title="Secret Access">
      {success ? (
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          className="flex flex-col items-center justify-center py-6 space-y-4"
        >
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ type: 'spring', stiffness: 200, damping: 15 }}
            className="w-16 h-16 rounded-full bg-green-500/20 flex items-center justify-center"
          >
            <svg className="w-8 h-8 text-green-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
            </svg>
          </motion.div>
          <div className="text-center">
            <p className="text-green-400 font-semibold">Access Granted!</p>
            <p className="text-sm text-gray-400 mt-1">Redirecting to &mdash; <span className="text-white">{success.title}</span></p>
          </div>
          <div className="w-5 h-5 border-2 border-green-400 border-t-transparent rounded-full animate-spin" />
        </motion.div>
      ) : (
        <div className="space-y-4">
          <div className="glass-card !rounded-xl p-4 font-mono text-xs text-gray-400 space-y-1">
            <p className="text-green-400">$ <span className="text-gray-300">./portal --unlock</span></p>
            <p className="text-gray-500">Initializing secure access protocol...</p>
            <p className="text-gray-500">Enter your referral code to continue.</p>
          </div>

          <motion.div
            className="flex items-center gap-3"
            animate={shake ? { x: [0, -10, 10, -10, 10, -5, 5, 0] } : { x: 0 }}
            transition={{ duration: 0.4 }}
          >
            <span className="text-green-400 font-mono text-sm shrink-0">$</span>
            <input
              ref={inputRef}
              value={code}
              onChange={e => { setCode(e.target.value); setError('') }}
              onKeyDown={handleKeyDown}
              placeholder="Enter access code..."
              disabled={loading}
              className={`flex-1 bg-white/5 border rounded-xl px-4 py-2.5 text-sm font-mono text-white placeholder-gray-600 focus:outline-none disabled:opacity-50 transition-colors ${
                error ? 'border-red-500/50 focus:border-red-500' : 'border-white/10 focus:border-[#FF0F7B]'
              }`}
            />
          </motion.div>

          {error && (
            <motion.p
              initial={{ opacity: 0, y: -4 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-red-400 text-xs flex items-center gap-1.5"
            >
              <svg className="w-3.5 h-3.5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              {error}
            </motion.p>
          )}

          <button
            onClick={handleSubmit}
            disabled={loading || !code.trim()}
            className="w-full btn-primary !py-2.5 !text-sm disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            {loading ? (
              <>
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                Verifying...
              </>
            ) : (
              'Unlock Access'
            )}
          </button>
        </div>
      )}
    </AnimatedModal>
  )
}
