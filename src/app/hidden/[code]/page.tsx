'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { motion } from 'framer-motion'

interface HiddenItem {
  id: number
  item_type: string
  title: string
  description: string | null
  file_path: string | null
}

interface HiddenPage {
  id: number
  title: string
  description: string | null
  content: string | null
  slug: string
  items: HiddenItem[]
}

export default function HiddenPageRoute() {
  const params = useParams()
  const router = useRouter()
  const code = (params?.code as string) ?? ''

  const [page, setPage] = useState<HiddenPage | null>(null)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(true)
  const [unlockedPages, setUnlockedPages] = useState<HiddenPage[]>([])
  const [manualCode, setManualCode] = useState('')

  useEffect(() => {
    if (!code) return

    fetch('/api/auth/me')
      .then(r => r.json())
      .then(d => {
        if (!d.user) {
          router.push(`/login?redirect=/hidden/${code}`)
          return
        }

        fetch('/api/hidden/verify', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ code }),
        })
          .then(r => r.json())
          .then(data => {
            if (data.success && data.page) {
              setPage(data.page)
            } else {
              setError(data.error || 'Invalid access code')
            }
            setLoading(false)
          })
          .catch(() => {
            setError('Network error')
            setLoading(false)
          })

        fetch('/api/hidden/verify')
          .then(r => r.json())
          .then(d => { if (d.pages) setUnlockedPages(d.pages) })
          .catch(() => {})
      })
      .catch(() => router.push(`/login?redirect=/hidden/${code}`))
  }, [code, router])

  const unlockByCode = async () => {
    if (!manualCode.trim()) return
    setLoading(true)
    setError('')
    const res = await fetch('/api/hidden/verify', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ code: manualCode.trim() }),
    })
    const data = await res.json()
    if (data.success && data.page) {
      setPage(data.page)
      router.push(`/hidden/${manualCode.trim()}`)
    } else {
      setError(data.error || 'Invalid code')
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-[#FF0F7B] border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  if (error && !page) {
    return (
      <div className="min-h-screen flex items-center justify-center px-4">
        <div className="absolute inset-0 bg-gradient-to-b from-[#FF0F7B]/5 via-transparent to-[#050505] pointer-events-none" />
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="relative z-10 w-full max-w-md"
        >
          <div className="glass-card p-6 sm:p-8 text-center">
            <div className="text-5xl mb-4">🔒</div>
            <h1 className="text-xl font-bold mb-2">Access Restricted</h1>
            <p className="text-sm text-gray-400 mb-6">{error}</p>
            <div className="space-y-4 max-w-xs mx-auto">
              <input
                value={manualCode}
                onChange={e => setManualCode(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && unlockByCode()}
                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm text-white text-center font-mono placeholder-gray-500 focus:border-[#FF0F7B] focus:outline-none"
                placeholder="Enter access code"
              />
              <button onClick={unlockByCode} className="btn-primary mandala-btn w-full !py-3">
                Unlock
              </button>
            </div>

            {unlockedPages.length > 0 && (
              <div className="mt-8 pt-6 border-t border-white/5">
                <p className="text-xs text-gray-500 mb-3">Your unlocked pages:</p>
                <div className="space-y-2">
                  {unlockedPages.map(p => (
                    <Link
                      key={p.id}
                      href={`/hidden/${p.slug}`}
                      className="block glass-card !rounded-xl px-4 py-3 text-sm hover:border-[#FF0F7B]/30 transition-all"
                    >
                      <span className="text-[#FF0F7B]">🔓</span> {p.title}
                    </Link>
                  ))}
                </div>
              </div>
            )}

            <Link href="/dashboard" className="block text-sm text-gray-500 hover:text-white mt-6">
              &larr; Back to Dashboard
            </Link>
          </div>
        </motion.div>
      </div>
    )
  }

  if (!page) return null

  return (
    <div className="min-h-screen pb-24 overflow-x-hidden">
      <div className="absolute inset-0 bg-gradient-to-b from-[#FF0F7B]/3 via-transparent to-[#050505] pointer-events-none" />
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[min(400px,100vw)] h-[400px] bg-[#FF0F7B]/5 rounded-full blur-[120px] pointer-events-none" />

      <div className="relative z-10 max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          className="py-8"
        >
          <Link href="/dashboard" className="text-sm text-gray-500 hover:text-white transition-colors inline-flex items-center gap-1 mb-6">
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg>
            Back to Dashboard
          </Link>

          <div className="glass-card p-4 sm:p-8">
            <div className="flex items-center gap-3 mb-2">
              <span className="text-2xl">🔓</span>
              <div>
                <h1 className="text-2xl font-bold">{page.title}</h1>
                {page.description && (
                  <p className="text-gray-400 mt-1">{page.description}</p>
                )}
              </div>
            </div>

            {page.content && (
              <div className="mt-6 p-4 rounded-xl bg-white/5 text-sm text-gray-300 leading-relaxed whitespace-pre-wrap">
                {page.content}
              </div>
            )}

            {page.items.length > 0 && (
              <div className="mt-8 space-y-4">
                <h2 className="text-lg font-semibold flex items-center gap-2">
                  <svg className="w-5 h-5 text-[#FF0F7B]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                  Materials
                </h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {page.items.map((item, i) => (
                    <motion.div
                      key={item.id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: i * 0.05 }}
                      className="glass-card !rounded-xl p-4"
                    >
                      <div className="flex items-start gap-3">
                        <span className="text-lg mt-0.5">
                          {item.item_type === 'book' ? '📖' : item.item_type === 'assignment' ? '📝' : '📌'}
                        </span>
                        <div className="min-w-0 flex-1">
                          <p className="font-medium text-sm">{item.title}</p>
                          {item.description && (
                            <p className="text-xs text-gray-400 mt-1">{item.description}</p>
                          )}
                          {item.file_path && (
                            <a
                              href={item.file_path}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="inline-block mt-2 text-xs text-[#FF0F7B] hover:underline"
                            >
                              Download &rarr;
                            </a>
                          )}
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {unlockedPages.filter(p => p.slug !== code).length > 0 && (
            <div className="mt-8">
              <h3 className="text-sm font-semibold text-gray-400 mb-3">Other Unlocked Pages</h3>
              <div className="flex flex-wrap gap-2">
                {unlockedPages.filter(p => p.slug !== code).map(p => (
                  <Link
                    key={p.id}
                    href={`/hidden/${p.slug}`}
                    className="glass-card !rounded-xl px-4 py-2 text-sm hover:border-[#FF0F7B]/30 transition-all"
                  >
                    🔓 {p.title}
                  </Link>
                ))}
              </div>
            </div>
          )}
        </motion.div>
      </div>
    </div>
  )
}
