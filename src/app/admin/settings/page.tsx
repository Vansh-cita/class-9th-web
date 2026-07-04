'use client'

import { useEffect, useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { motion } from 'framer-motion'

interface Settings {
  [key: string]: string | null
}

const defaultSettings: Settings = {
  site_name: 'CBSE Class 9 Learning Portal',
  site_visible: 'true',
  registration_enabled: 'true',
  notice_board: '',
  maintenance_mode: 'false',
  default_author: 'NCERT',
}

const settingMeta: Record<string, { label: string; type: string; description: string }> = {
  site_name: { label: 'Site Name', type: 'text', description: 'The name displayed in the browser tab and header' },
  site_visible: { label: 'Site Visible', type: 'toggle', description: 'When disabled, the site shows a maintenance page to visitors' },
  registration_enabled: { label: 'Registration Enabled', type: 'toggle', description: 'Allow new students to register accounts' },
  notice_board: { label: 'Notice Board', type: 'textarea', description: 'Global notice shown at the top of all pages (supports plain text)' },
  maintenance_mode: { label: 'Maintenance Mode', type: 'toggle', description: 'Enable to show maintenance page to non-admin users' },
  default_author: { label: 'Default Author', type: 'text', description: 'Default author name used when creating new books' },
}

export default function AdminSettingsPage() {
  const router = useRouter()
  const [settings, setSettings] = useState<Settings>({})
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [formMsg, setFormMsg] = useState('')

  const fetchSettings = useCallback(async () => {
    const res = await fetch('/api/admin/settings')
    const d = await res.json()
    if (d.settings) {
      setSettings({ ...defaultSettings, ...d.settings })
    }
    setLoading(false)
  }, [])

  useEffect(() => { fetchSettings() }, [fetchSettings])

  const updateSetting = (key: string, value: string | boolean) => {
    setSettings(prev => ({ ...prev, [key]: String(value) }))
  }

  const handleSave = async () => {
    setSaving(true)
    setFormMsg('')
    try {
      const res = await fetch('/api/admin/settings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(settings),
      })
      const d = await res.json()
      setFormMsg(d.success ? 'Settings saved successfully!' : d.error || 'Error saving settings')
      router.refresh()
    } catch {
      setFormMsg('Network error')
    }
    setSaving(false)
  }

  const container = { hidden: { opacity: 0 }, show: { opacity: 1, transition: { staggerChildren: 0.03 } } }
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
          <h1 className="text-2xl sm:text-3xl font-bold">Settings</h1>
          <p className="text-gray-400 text-sm mt-1">Global platform configuration</p>
        </div>
        <button onClick={handleSave} disabled={saving}
          className="btn-primary !py-2.5 !text-sm disabled:opacity-50 disabled:cursor-not-allowed">
          {saving ? (
            <span className="flex items-center gap-2">
              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              Saving...
            </span>
          ) : 'Save All Settings'}
        </button>
      </motion.div>

      {formMsg && (
        <motion.div variants={item} className="glass-card !rounded-xl px-4 py-3 mb-6 text-sm border-l-4 border-[#FF0F7B]">
          {formMsg}
          <button onClick={() => setFormMsg('')} className="ml-3 text-gray-500 hover:text-white">&times;</button>
        </motion.div>
      )}

      <motion.div variants={item} className="glass-card p-6">
        <h3 className="font-semibold mb-6">General Settings</h3>
        <div className="space-y-6">
          {Object.entries(settingMeta).map(([key, meta]) => (
            <div key={key}>
              {meta.type === 'toggle' ? (
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium">{meta.label}</p>
                    <p className="text-xs text-gray-500 mt-0.5">{meta.description}</p>
                  </div>
                  <button
                    onClick={() => updateSetting(key, settings[key] !== 'true')}
                    className={`relative w-12 h-6 rounded-full transition-colors shrink-0 ${
                      settings[key] === 'true' ? 'bg-[#FF0F7B]' : 'bg-white/10'
                    }`}
                  >
                    <div className={`w-4 h-4 rounded-full bg-white absolute top-1 transition-transform ${
                      settings[key] === 'true' ? 'translate-x-7' : 'translate-x-1'
                    }`} />
                  </button>
                </div>
              ) : meta.type === 'textarea' ? (
                <div>
                  <label className="block text-sm font-medium mb-1.5">{meta.label}</label>
                  <p className="text-xs text-gray-500 mb-2">{meta.description}</p>
                  <textarea value={settings[key] || ''} onChange={e => updateSetting(key, e.target.value)}
                    rows={3}
                    className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white placeholder-gray-500 focus:border-[#FF0F7B] focus:outline-none resize-none" />
                </div>
              ) : (
                <div>
                  <label className="block text-sm font-medium mb-1.5">{meta.label}</label>
                  <p className="text-xs text-gray-500 mb-2">{meta.description}</p>
                  <input value={settings[key] || ''} onChange={e => updateSetting(key, e.target.value)}
                    className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white placeholder-gray-500 focus:border-[#FF0F7B] focus:outline-none" />
                </div>
              )}
              {Object.entries(settingMeta).indexOf([key, meta]) < Object.entries(settingMeta).length - 1 && (
                <div className="border-b border-white/5 mt-6" />
              )}
            </div>
          ))}
        </div>
      </motion.div>
    </motion.div>
  )
}
