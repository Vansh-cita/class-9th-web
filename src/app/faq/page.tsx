'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'

const faqs = [
  {
    q: 'What is this portal?',
    a: 'This is the official CBSE Class 9 Learning Portal built for the new NCERT 2026 syllabus. It provides free access to all NCERT textbooks, chapter-wise reading, progress tracking, bookmarks, and school announcements — all in one place.',
  },
  {
    q: 'Is this platform free to use?',
    a: 'Yes, completely free. All NCERT textbooks and resources are accessible at no cost. Students only need to register with their roll number and school name to get started.',
  },
  {
    q: 'How do I register for an account?',
    a: 'Click the "Register" button on the top navigation bar. Fill in your username, roll number, school name, and create a password. Your User ID will be auto-generated, or you can set a custom one. After registration, you can log in immediately.',
  },
  {
    q: 'What is the new NCERT 2026 syllabus?',
    a: 'The NCERT has revised the Class 9 curriculum for the 2026 academic session with updated textbooks across all subjects including Mathematics, Science, Social Science, English, and Hindi. This portal hosts the latest editions aligned with the new syllabus.',
  },
  {
    q: 'How does the reading progress tracker work?',
    a: 'As you read through chapters, the system automatically tracks your progress. You can see how much of each book you have completed on your dashboard. The progress is saved per book and syncs across devices.',
  },
  {
    q: 'Can I bookmark pages for later?',
    a: 'Yes! You can bookmark any page or chapter in any book. Bookmarks are saved to your account and accessible from the dashboard. You can also add personal notes to your bookmarks.',
  },
  {
    q: 'How do I search for specific books?',
    a: 'Use the Search page to find books by title, subject, author, or keywords. You can also browse books by category on the Books page and filter by subject or category.',
  },
  {
    q: 'What are hidden pages?',
    a: 'Hidden pages are special access-restricted pages that teachers or admins can create for additional study materials, assignments, or premium content. Access is granted via a unique code provided by your school.',
  },
  {
    q: 'How do I receive announcements?',
    a: 'Announcements from your school or admin appear automatically on your dashboard. You will also receive notifications for new announcements. Important announcements may be pinned to the top.',
  },
  {
    q: 'What devices are supported?',
    a: 'The portal works on all modern devices — desktops, laptops, tablets, and smartphones. The interface adapts to your screen size for the best reading experience on any device.',
  },
  {
    q: 'Is my data safe?',
    a: 'Yes. All data is transmitted over HTTPS and stored securely. Passwords are hashed and never stored in plain text. Session tokens are encrypted and expire automatically. We do not share your personal information with third parties.',
  },
  {
    q: 'How do I reset my password?',
    a: 'Password reset is handled by your school administrator. Contact your teacher or admin to reset your password if you forget it.',
  },
  {
    q: 'Can I change my profile information?',
    a: 'Your username, school name, and profile settings can be updated from the Settings page in your dashboard. Some fields like roll number may require admin assistance to change.',
  },
  {
    q: 'What if I find a bug or have a suggestion?',
    a: 'Please report any issues or suggestions to your school administrator or the platform support team. Your feedback helps us improve the learning experience for everyone.',
  },
]

function StarRating({ value, onChange, disabled }: { value: number; onChange: (v: number) => void; disabled?: boolean }) {
  const [hovered, setHovered] = useState(0)

  return (
    <div className="flex items-center gap-1">
      {[1, 2, 3, 4, 5].map(star => {
        const filled = star <= (hovered || value)
        return (
          <button
            key={star}
            type="button"
            disabled={disabled}
            onMouseEnter={() => !disabled && setHovered(star)}
            onMouseLeave={() => setHovered(0)}
            onClick={() => onChange(star)}
            className={`transition-all duration-150 ${disabled ? 'cursor-default' : 'cursor-pointer hover:scale-110'} ${filled ? '' : 'opacity-40'}`}
          >
            <svg className="w-7 h-7 sm:w-8 sm:h-8" viewBox="0 0 24 24" fill={filled ? '#FFD700' : 'none'} stroke="#FFD700" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M11.48 3.499a.562.562 0 011.04 0l2.125 5.111a.563.563 0 00.475.345l5.518.442c.499.04.701.663.321.988l-4.204 3.602a.563.563 0 00-.182.557l1.285 5.385a.562.562 0 01-.84.61l-4.725-2.885a.563.563 0 00-.586 0L6.982 20.54a.562.562 0 01-.84-.61l1.285-5.386a.562.562 0 00-.182-.557l-4.204-3.602a.563.563 0 01.321-.988l5.518-.442a.563.563 0 00.475-.345L11.48 3.5z" />
            </svg>
          </button>
        )
      })}
    </div>
  )
}

export default function FAQPage() {
  const [openIndex, setOpenIndex] = useState<number | null>(null)
  const [rating, setRating] = useState(0)
  const [message, setMessage] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [submitted, setSubmitted] = useState(false)
  const [error, setError] = useState('')

  const toggle = (idx: number) => setOpenIndex(openIndex === idx ? null : idx)

  const handleSubmit = async () => {
    if (rating === 0) { setError('Please select a star rating'); return }
    if (!message.trim()) { setError('Please write your feedback'); return }
    setError('')
    setSubmitting(true)
    try {
      const res = await fetch('/api/feedback', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ rating, message: message.trim() }),
      })
      const d = await res.json()
      if (!res.ok) { setError(d.error || 'Submission failed'); setSubmitting(false); return }
      setSubmitted(true)
      setRating(0)
      setMessage('')
    } catch {
      setError('Network error. Please try again.')
    }
    setSubmitting(false)
  }

  return (
    <div className="min-h-screen pb-24 overflow-x-hidden">
      <div className="absolute inset-0 bg-gradient-to-b from-[#FF0F7B]/3 via-transparent to-[#050505] pointer-events-none" />
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[min(500px,100vw)] h-[500px] bg-[#FF0F7B]/5 rounded-full blur-[120px] pointer-events-none" />
      <div className="relative z-10 max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} className="py-8">
          <div className="text-center mb-10">
            <h1 className="text-3xl font-bold mb-2">Frequently Asked Questions</h1>
            <p className="text-gray-400 text-sm">Everything you need to know about the CBSE Class 9 Learning Portal</p>
          </div>

          <div className="space-y-3">
            {faqs.map((faq, idx) => {
              const isOpen = openIndex === idx
              return (
                <motion.div
                  key={idx}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: idx * 0.03 }}
                  className={`glass-card !rounded-xl overflow-hidden transition-all duration-200 ${isOpen ? 'border-[#FF0F7B]/20' : ''}`}
                >
                  <button
                    onClick={() => toggle(idx)}
                    className="w-full flex items-center justify-between px-5 py-4 text-left"
                  >
                    <span className="text-sm font-medium pr-4">{faq.q}</span>
                    <svg
                      className={`w-4 h-4 shrink-0 text-gray-500 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`}
                      fill="none" viewBox="0 0 24 24" stroke="currentColor"
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                  </button>
                  <AnimatePresence>
                    {isOpen && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.2 }}
                        className="overflow-hidden"
                      >
                        <div className="px-5 pb-4 text-sm text-gray-400 leading-relaxed">
                          {faq.a}
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </motion.div>
              )
            })}
          </div>

          {/* Feedback Form */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="mt-16"
          >
            <div className="glass-card p-6 sm:p-8">
              {submitted ? (
                <motion.div
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="text-center py-6"
                >
                  <div className="w-16 h-16 rounded-full bg-[#00FF88]/15 flex items-center justify-center mx-auto mb-4">
                    <svg className="w-8 h-8 text-[#00FF88]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
                    </svg>
                  </div>
                  <h3 className="text-lg font-semibold mb-1">Thank You for Your Feedback!</h3>
                  <p className="text-sm text-gray-400 mb-4">Your input helps us improve the platform for everyone.</p>
                  <button onClick={() => setSubmitted(false)} className="text-xs text-[#FF0F7B] hover:underline">
                    Submit another response
                  </button>
                </motion.div>
              ) : (
                <>
                  <h3 className="text-lg font-semibold mb-1">Share Your Feedback</h3>
                  <p className="text-sm text-gray-400 mb-6">Help us improve by rating your experience and leaving a message.</p>

                  <div className="space-y-5">
                    <div>
                      <label className="block text-sm font-medium mb-2">Your Rating</label>
                      <StarRating value={rating} onChange={setRating} disabled={submitting} />
                    </div>

                    <div>
                      <label className="block text-sm font-medium mb-2">Your Feedback</label>
                      <textarea value={message} onChange={e => setMessage(e.target.value)}
                        placeholder="Tell us what you like or what could be improved..."
                        rows={4}
                        disabled={submitting}
                        className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm text-white placeholder-gray-500 focus:border-[#FF0F7B] focus:outline-none resize-none transition-colors" />
                    </div>

                    {error && (
                      <motion.p initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }}
                        className="text-xs text-red-400">
                        {error}
                      </motion.p>
                    )}

                    <button onClick={handleSubmit} disabled={submitting}
                      className="btn-primary mandala-btn !py-2.5 !text-sm disabled:opacity-50 disabled:cursor-not-allowed">
                      {submitting ? (
                        <span className="flex items-center gap-2">
                          <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                          Submitting...
                        </span>
                      ) : 'Submit Feedback'}
                    </button>
                  </div>
                </>
              )}
            </div>
          </motion.div>

          <div className="mt-8 glass-card p-6 text-center">
            <p className="text-sm text-gray-400">
              Still have questions? Contact your school administrator or reach out to the support team.
            </p>
          </div>
        </motion.div>
      </div>
    </div>
  )
}
