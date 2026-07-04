'use client'

import { useEffect, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'

interface AnimatedModalProps {
  open: boolean
  onClose: () => void
  children: React.ReactNode
  title?: string
}

export default function AnimatedModal({ open, onClose, children, title }: AnimatedModalProps) {
  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    if (e.key === 'Escape') onClose()
  }, [onClose])

  useEffect(() => {
    if (open) {
      document.body.style.overflow = 'hidden'
      window.addEventListener('keydown', handleKeyDown)
    }
    return () => {
      document.body.style.overflow = ''
      window.removeEventListener('keydown', handleKeyDown)
    }
  }, [open, handleKeyDown])

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
        >
          <motion.div
            className="absolute inset-0 bg-black/60 backdrop-blur-md"
            onClick={onClose}
          />

          <motion.div
            className="relative w-full max-w-lg"
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            transition={{ duration: 0.25, ease: [0.4, 0, 0.2, 1] }}
          >
            <div className="relative rounded-2xl overflow-hidden">
              <div
                className="absolute inset-0 animate-spin-slow"
                style={{
                  background: 'conic-gradient(#FF0F7B, #9D4EDD, #00D4FF, #00FF88, #FF0F7B)',
                }}
              />
              <div className="relative m-[2px] rounded-2xl bg-[#050505]">
                <div className="flex items-center justify-between p-5 pb-0">
                  {title && <h2 className="text-lg font-semibold">{title}</h2>}
                  <button
                    onClick={onClose}
                    className="ml-auto text-gray-500 hover:text-white p-1 rounded-lg hover:bg-white/5 transition-colors"
                  >
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
                <div className="p-5">
                  {children}
                </div>
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
