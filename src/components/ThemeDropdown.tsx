'use client'

import { useState, useRef, useEffect } from 'react'

interface DropdownOption {
  value: string
  label: string
}

interface ThemeDropdownProps {
  options: DropdownOption[]
  value: string
  onChange: (value: string) => void
  className?: string
}

export default function ThemeDropdown({ options, value, onChange, className = '' }: ThemeDropdownProps) {
  const [isOpen, setIsOpen] = useState(false)
  const dropdownRef = useRef<HTMLDivElement>(null)
  const selectedOption = options.find(opt => opt.value === value) || options[0]

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  return (
    <div ref={dropdownRef} className={`relative inline-block w-48 text-left select-none ${className}`}>
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center justify-between px-4 py-2.5 bg-neutral-900 border border-neutral-800 rounded-xl text-sm font-medium text-neutral-200 hover:bg-neutral-800/80 transition duration-200 focus:outline-none focus:border-fuchsia-600 focus:ring-1 focus:ring-fuchsia-600"
      >
        <span>{selectedOption?.label}</span>
        <svg
          className={`w-4 h-4 text-neutral-400 transition-transform duration-200 ${isOpen ? 'transform rotate-180' : ''}`}
          fill="none" viewBox="0 0 24 24" stroke="currentColor"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {isOpen && (
        <div className="absolute right-0 z-50 mt-2 w-full origin-top-right rounded-xl bg-neutral-950 border border-neutral-800 shadow-2xl p-1.5 focus:outline-none animate-in fade-in slide-in-from-top-1 duration-150">
          <div className="py-1 flex flex-col gap-1">
            {options.map(option => (
              <button
                key={option.value}
                type="button"
                onClick={() => {
                  onChange(option.value)
                  setIsOpen(false)
                }}
                className={`w-full text-left px-3 py-2 text-sm rounded-lg transition duration-150 ${
                  value === option.value
                    ? 'bg-fuchsia-600/10 text-fuchsia-400 font-medium'
                    : 'text-neutral-400 hover:bg-neutral-900 hover:text-neutral-200'
                }`}
              >
                {option.label}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
