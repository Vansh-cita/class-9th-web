'use client'

import Link from 'next/link'
import { motion } from 'framer-motion'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'

interface BookData {
  id: number
  title: string
  slug: string
  description: string | null
  subject: string | null
  categories: { id: number; name: string; slug: string } | null
}

interface HomepageConfig {
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
}

export default function Home() {
  const [featuredBooks, setFeaturedBooks] = useState<BookData[]>([])
  const [user, setUser] = useState<{ username: string; role: string } | null>(null)
  const [config, setConfig] = useState<HomepageConfig | null>(null)
  const router = useRouter()

  useEffect(() => {
    fetch('/api/books?limit=6')
      .then(r => r.json())
      .then(d => { if (d.books) setFeaturedBooks(d.books) })
      .catch(() => {})

    fetch('/api/auth/me')
      .then(r => r.json())
      .then(d => { if (d.user) setUser(d.user) })
      .catch(() => {})

    fetch('/api/homepage')
      .then(r => r.json())
      .then(d => { if (d.config) setConfig(d.config) })
      .catch(() => {})
  }, [])

  const container = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: { staggerChildren: 0.1 },
    },
  }

  const item = {
    hidden: { opacity: 0, y: 20 },
    show: { opacity: 1, y: 0 },
  }

  const promoDefaults = [
    { title: 'Free Access', desc: 'All NCERT textbooks available at no cost, anytime.', icon: '📚' },
    { title: 'Track Progress', desc: 'Bookmark pages and track your reading across all books.', icon: '📊' },
    { title: 'Stay Updated', desc: 'Get announcements and notifications from your school.', icon: '🔔' },
  ]

  const promos = config
    ? [
        { title: config.card1_title, desc: config.card1_desc, icon: config.card1_icon },
        { title: config.card2_title, desc: config.card2_desc, icon: config.card2_icon },
        { title: config.card3_title, desc: config.card3_desc, icon: config.card3_icon },
      ]
    : promoDefaults

  return (
    <div className="relative min-h-screen w-full overflow-x-hidden">
      {/* Full-page background gradient and glow — stretches edge to edge */}
      <div className="absolute inset-0 w-full h-full min-h-full bg-gradient-to-b from-[#FF0F7B]/5 via-transparent to-transparent pointer-events-none" />
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[min(600px,100vw)] h-[600px] bg-[#FF0F7B]/8 rounded-full blur-[150px] pointer-events-none" />
      <div className="absolute bottom-1/4 right-0 w-[min(400px,100vw)] h-[400px] bg-[#9D4EDD]/8 rounded-full blur-[120px] pointer-events-none" />

      <section className="relative z-10 min-h-[90vh] flex items-center justify-center pt-24">

        <div className="text-center px-4 max-w-4xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
          >
            <span className="inline-block px-4 py-1.5 rounded-full text-xs font-medium bg-[#FF0F7B]/10 text-[#FF0F7B] border border-[#FF0F7B]/20 mb-6">
              {config?.badge_text || 'CBSE Class 9 Learning Portal'}
            </span>
            <h1 className="text-5xl sm:text-6xl lg:text-7xl font-bold tracking-tight mb-6">
              {config?.hero_title_line1 || 'Learn Smarter,'}
              <br />
              <span className="neon-text">{config?.hero_title_line2 || 'Study Better'}</span>
            </h1>
            <p className="text-lg sm:text-xl text-gray-400 max-w-2xl mx-auto mb-10 leading-relaxed">
              {config?.hero_subheading || 'Access NCERT textbooks, track your reading progress, and stay updated with the latest announcements — all in one place.'}
            </p>
            <div className="flex items-center justify-center gap-4 flex-wrap">
              {user ? (
                <>
                  <Link href={user.role === 'admin' ? '/admin/dashboard' : '/dashboard'} className="btn-primary mandala-btn text-lg !px-8 !py-4">
                    Go to Dashboard
                  </Link>
                  <button
                    onClick={async () => {
                      await fetch('/api/auth/logout', { method: 'POST' })
                      setUser(null)
                      router.push('/')
                      router.refresh()
                    }}
                    className="btn-outline text-lg !px-8 !py-4"
                  >
                    Logout
                  </button>
                </>
              ) : (
                <>
                  <Link href="/register" className="btn-primary mandala-btn text-lg !px-8 !py-4">
                    Get Started Free
                  </Link>
                  <Link href="/books" className="btn-outline text-lg !px-8 !py-4">
                    Browse Books
                  </Link>
                </>
              )}
            </div>
          </motion.div>
        </div>
      </section>

      {featuredBooks.length > 0 && (
        <section className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-24">
          <motion.div
            variants={container}
            initial="hidden"
            whileInView="show"
            viewport={{ once: true }}
          >
            <div className="flex items-center justify-between mb-10">
              <h2 className="text-3xl font-bold">{config?.featured_title || 'Featured Books'}</h2>
              <Link href="/books" className="text-[#FF0F7B] text-sm hover:underline">
                View All &rarr;
              </Link>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {featuredBooks.map((book) => (
                <motion.div key={book.id} variants={item}>
                  <Link href={`/books/${book.slug}`} className="glass-card p-6 block group">
                    <div className="w-12 h-12 rounded-xl bg-[#FF0F7B]/10 flex items-center justify-center mb-4 group-hover:bg-[#FF0F7B]/20 transition-colors">
                      <span className="text-[#FF0F7B] text-lg font-bold">
                        {book.title.charAt(0)}
                      </span>
                    </div>
                    <h3 className="text-lg font-semibold mb-2 group-hover:text-[#FF0F7B] transition-colors">
                      {book.title}
                    </h3>
                    {book.description && (
                      <p className="text-sm text-gray-400 line-clamp-2">{book.description}</p>
                    )}
                    <div className="flex items-center gap-3 mt-4 text-xs text-gray-500">
                      <span>{book.subject || 'General'}</span>
                      {book.categories && <span>&middot; {book.categories.name}</span>}
                    </div>
                  </Link>
                </motion.div>
              ))}
            </div>
          </motion.div>
        </section>
      )}

      <section className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-24">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ delay: 0.2 }}
        >
          <h2 className="text-3xl font-bold mb-10 text-center">{config?.why_title || 'Why Use This Portal?'}</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {promos.map((feature, i) => (
              <motion.div
                key={i}
                className="glass-card p-8 text-center"
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: 0.1 * i }}
              >
                <div className="text-4xl mb-4">{feature.icon}</div>
                <h3 className="text-lg font-semibold mb-2">{feature.title}</h3>
                <p className="text-sm text-gray-400">{feature.desc}</p>
              </motion.div>
            ))}
          </div>
        </motion.div>
      </section>

    </div>
  )
}
