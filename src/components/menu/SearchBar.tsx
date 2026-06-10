'use client'

import { useEffect, useRef, useState } from 'react'
import { Search, X } from 'lucide-react'
import { m, AnimatePresence } from 'framer-motion'

interface SearchBarProps {
  query: string
  onChange: (q: string) => void
  resultCount: number
}

export function SearchBar({ query, onChange, resultCount }: SearchBarProps) {
  const [expanded, setExpanded] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (expanded) inputRef.current?.focus()
  }, [expanded])

  function clear() {
    onChange('')
    setExpanded(false)
  }

  const hasQuery = query.length > 0

  return (
    <div
      className="flex items-center justify-between gap-3 px-4 py-2"
      style={{ borderBottom: '1px solid var(--bdr)' }}
    >
      <AnimatePresence mode="wait">
        {hasQuery && (
          <m.span
            key="count"
            initial={{ opacity: 0, x: -8 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -8 }}
            transition={{ duration: 0.15 }}
            className="text-xs"
            style={{ color: 'var(--txt2)', fontFamily: 'var(--font-body)' }}
          >
            {resultCount} result{resultCount !== 1 ? 's' : ''}
          </m.span>
        )}
      </AnimatePresence>

      <div className="ml-auto">
        <AnimatePresence mode="wait" initial={false}>
          {expanded ? (
            <m.div
              key="input"
              initial={{ width: 36, opacity: 0.6 }}
              animate={{ width: 200, opacity: 1 }}
              exit={{ width: 36, opacity: 0 }}
              transition={{ type: 'spring', stiffness: 400, damping: 30 }}
              className="flex items-center gap-2 overflow-hidden rounded-full border px-3 py-1.5"
              style={{ background: 'var(--sf1)', borderColor: 'var(--bdr2)' }}
            >
              <Search className="h-3.5 w-3.5 shrink-0" style={{ color: 'var(--brand)' }} />
              <input
                ref={inputRef}
                value={query}
                onChange={(e) => onChange(e.target.value)}
                placeholder="Search items…"
                className="min-w-0 flex-1 bg-transparent text-sm outline-none"
                style={{ color: 'var(--txt)', caretColor: 'var(--brand)' }}
              />
              <button
                onClick={clear}
                aria-label="Clear search"
                className="shrink-0 rounded-full p-0.5 transition-colors hover:bg-black/10"
              >
                <X className="h-3 w-3" style={{ color: 'var(--txt2)' }} />
              </button>
            </m.div>
          ) : (
            <m.button
              key="pill"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setExpanded(true)}
              className="flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs transition-transform hover:scale-105 active:scale-95"
              style={{
                background: 'var(--sf1)',
                borderColor: 'var(--bdr)',
                color: 'var(--txt2)',
                fontFamily: 'var(--font-body)',
              }}
              aria-label="Search menu items"
            >
              <Search className="h-3.5 w-3.5" />
              Search
            </m.button>
          )}
        </AnimatePresence>
      </div>
    </div>
  )
}
