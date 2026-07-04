'use client'

import { useEffect, useState, useCallback } from 'react'
import { motion } from 'framer-motion'
import ThemeDropdown from '@/components/ThemeDropdown'

interface HomepageConfig {
  id: number
  badge_text: string
  hero_title_line1: string
  hero_title_line2: string
  hero_subheading: string
  featured_title: string
  why_title: string
  card1_title: string
  card1_desc: string
  card1_icon: string
  card2_title: string
  card2_desc: string
  card2_icon: string
  card3_title: string
  card3_desc: string
  card3_icon: string
  footer_text: string
}

const CARD_ICONS = ['📚', '📊', '🔔', '🌟', '🚀', '💡', '🎯', '📖', '⚡', '🔥', '💎', '🎨']

export default function AdminHomepageManagerPage() {
  const [config, setConfig] = useState<HomepageConfig | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [msg, setMsg] = useState('')

  const fetchConfig = useCallback(async () => {
    try {
      const res = await fetch('/api/admin/homepage')
      const d = await res.json()
      if (d.config) setConfig(d.config)
    } catch {
      // Config stays null, fallback UI shows error
    }
    setLoading(false)
  }, [])

  useEffect(() => { fetchConfig() }, [fetchConfig])

  const update = (key: keyof HomepageConfig, value: string) => {
    setConfig(prev => prev ? { ...prev, [key]: value } : prev)
  }

  const handleSave = async () => {
    if (!config) return
    setSaving(true)
    setMsg('')
    try {
      const res = await fetch('/api/admin/homepage', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(config),
      })
      const d = await res.json()
      setMsg(d.config ? 'Homepage updated successfully!' : d.error || 'Error saving')
    } catch {
      setMsg('Network error')
    }
    setSaving(false)
  }

  const cardFields: { key: keyof HomepageConfig; label: string }[][] = [
    [
      { key: 'card1_title', label: 'Card 1 Title' },
      { key: 'card1_desc', label: 'Card 1 Description' },
      { key: 'card1_icon', label: 'Card 1 Icon' },
    ],
    [
      { key: 'card2_title', label: 'Card 2 Title' },
      { key: 'card2_desc', label: 'Card 2 Description' },
      { key: 'card2_icon', label: 'Card 2 Icon' },
    ],
    [
      { key: 'card3_title', label: 'Card 3 Title' },
      { key: 'card3_desc', label: 'Card 3 Description' },
      { key: 'card3_icon', label: 'Card 3 Icon' },
    ],
  ]

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="w-8 h-8 border-2 border-[#FF0F7B] border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  if (!config) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <p className="text-gray-500 text-sm">Failed to load homepage configuration.</p>
      </div>
    )
  }

  const container = { hidden: { opacity: 0 }, show: { opacity: 1, transition: { staggerChildren: 0.03 } } }
  const item = { hidden: { opacity: 0, y: 12 }, show: { opacity: 1, y: 0 } }

  return (
    <motion.div variants={container} initial="hidden" animate="show">
      <motion.div variants={item} className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold">Homepage Manager</h1>
          <p className="text-gray-400 text-sm mt-1">Edit the landing page content in real time</p>
        </div>
        <button onClick={handleSave} disabled={saving}
          className="btn-primary mandala-btn !py-2.5 !text-sm disabled:opacity-50 disabled:cursor-not-allowed">
          {saving ? (
            <span className="flex items-center gap-2">
              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              Saving...
            </span>
          ) : 'Save Changes'}
        </button>
      </motion.div>

      {msg && (
        <motion.div variants={item} className="glass-card !rounded-xl px-4 py-3 mb-6 text-sm border-l-4 border-[#FF0F7B]">
          {msg}
          <button onClick={() => setMsg('')} className="ml-3 text-gray-500 hover:text-white">&times;</button>
        </motion.div>
      )}

      {/* Hero Section */}
      <motion.div variants={item} className="glass-card p-6 mb-6">
        <h3 className="font-semibold mb-5 flex items-center gap-2">
          <svg className="w-4 h-4 text-[#FF0F7B]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25h16.5" />
          </svg>
          Hero Section
        </h3>
        <div className="space-y-4">
          <div>
            <label className="block text-xs text-gray-500 mb-1">Badge Text</label>
            <input value={config.badge_text} onChange={e => update('badge_text', e.target.value)}
              className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white focus:border-[#FF0F7B] focus:outline-none" />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs text-gray-500 mb-1">Hero Title — Line 1</label>
              <input value={config.hero_title_line1} onChange={e => update('hero_title_line1', e.target.value)}
                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white focus:border-[#FF0F7B] focus:outline-none" />
            </div>
            <div>
              <label className="block text-xs text-gray-500 mb-1">Hero Title — Line 2 (neon)</label>
              <input value={config.hero_title_line2} onChange={e => update('hero_title_line2', e.target.value)}
                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white focus:border-[#FF0F7B] focus:outline-none" />
            </div>
          </div>
          <div>
            <label className="block text-xs text-gray-500 mb-1">Subheading</label>
            <textarea value={config.hero_subheading} onChange={e => update('hero_subheading', e.target.value)}
              rows={3}
              className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white focus:border-[#FF0F7B] focus:outline-none resize-none" />
          </div>
        </div>
      </motion.div>

      {/* Section Titles */}
      <motion.div variants={item} className="glass-card p-6 mb-6">
        <h3 className="font-semibold mb-5 flex items-center gap-2">
          <svg className="w-4 h-4 text-[#FF0F7B]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M9.568 3H5.25A2.25 2.25 0 003 5.25v4.318c0 .597.237 1.17.659 1.591l9.581 9.581c.699.699 1.78.872 2.607.33a18.095 18.095 0 005.223-5.223c.542-.827.369-1.908-.33-2.607L11.16 3.66A2.25 2.25 0 009.568 3z" />
            <path strokeLinecap="round" strokeLinejoin="round" d="M6 6h.008v.008H6V6z" />
          </svg>
          Section Titles
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs text-gray-500 mb-1">Featured Books Title</label>
            <input value={config.featured_title} onChange={e => update('featured_title', e.target.value)}
              className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white focus:border-[#FF0F7B] focus:outline-none" />
          </div>
          <div>
            <label className="block text-xs text-gray-500 mb-1">Why Use This Portal? Title</label>
            <input value={config.why_title} onChange={e => update('why_title', e.target.value)}
              className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white focus:border-[#FF0F7B] focus:outline-none" />
          </div>
        </div>
      </motion.div>

      {/* Promo Cards */}
      <motion.div variants={item} className="glass-card p-6 mb-6">
        <h3 className="font-semibold mb-5 flex items-center gap-2">
          <svg className="w-4 h-4 text-[#FF0F7B]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M6 6l12 12m0-12L6 18" />
          </svg>
          Promo Cards — &ldquo;Why Use This Portal?&rdquo;
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {cardFields.map((fields, i) => (
            <div key={i} className="p-4 rounded-xl bg-white/[0.03] border border-white/5">
              <p className="text-[10px] text-gray-500 uppercase tracking-wider mb-3">Card {i + 1}</p>
              <div className="space-y-3">
                {fields.map(f => (
                  <div key={f.key}>
                    <label className="block text-[10px] text-gray-500 mb-0.5">{f.label}</label>
                    {f.key.endsWith('_icon') ? (
                      <div className="flex items-center gap-2">
                        <span className="text-2xl">{config[f.key]}</span>
                        <ThemeDropdown
                          options={CARD_ICONS.map(icon => ({ value: icon, label: icon }))}
                          value={String(config[f.key])}
                          onChange={v => update(f.key, v)}
                        />
                      </div>
                    ) : f.key.endsWith('_desc') ? (
                      <textarea value={config[f.key]} onChange={e => update(f.key, e.target.value)}
                        rows={2}
                        className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-sm text-white focus:border-[#FF0F7B] focus:outline-none resize-none" />
                    ) : (
                      <input value={config[f.key]} onChange={e => update(f.key, e.target.value)}
                        className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-sm text-white focus:border-[#FF0F7B] focus:outline-none" />
                    )}
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </motion.div>

      {/* Footer */}
      <motion.div variants={item} className="glass-card p-6">
        <h3 className="font-semibold mb-5 flex items-center gap-2">
          <svg className="w-4 h-4 text-[#FF0F7B]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M17.25 8.25L21 12m0 0l-3.75 3.75M21 12H3" />
          </svg>
          Footer
        </h3>
        <div>
          <label className="block text-xs text-gray-500 mb-1">Footer Text</label>
          <input value={config.footer_text} onChange={e => update('footer_text', e.target.value)}
            className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white focus:border-[#FF0F7B] focus:outline-none" />
        </div>
      </motion.div>
    </motion.div>
  )
}
