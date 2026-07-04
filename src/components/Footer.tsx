'use client'

import { useEffect, useState } from 'react'

export default function Footer() {
  const [text, setText] = useState('')

  useEffect(() => {
    fetch('/api/homepage')
      .then(r => r.json())
      .then(d => { if (d.config?.footer_text) setText(d.config.footer_text) })
      .catch(() => {})
  }, [])

  return (
    <footer className="w-full py-8 px-4">
      <div className="max-w-xl mx-auto text-center text-neutral-500 text-xs tracking-wide leading-relaxed space-y-1">
        {text ? (
          text.split('\n').map((line, i) => <p key={i}>{line}</p>)
        ) : (
          <>
            <p>&copy; 2026 Vansh. All Rights Reserved.</p>
            <p>All NCERT books and related content belong to their respective copyright owners.</p>
            <p className="mt-1 opacity-60">~Powered by Vansh</p>
          </>
        )}
      </div>
    </footer>
  )
}
