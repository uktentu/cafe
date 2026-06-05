'use client'

import React from 'react'
import { Globe } from 'lucide-react'
import { useLanguage } from './LanguageProvider'

export function FloatingLanguageToggle() {
  const { primaryLocale, secondaryLocale, activeLocale, setActiveLocale } = useLanguage()

  if (!secondaryLocale) return null

  return (
    <div className="fixed top-4 right-4 z-[100] flex flex-col gap-2">
      <div 
        className="flex items-center gap-1 rounded-full p-1 border"
        style={{ 
          background: 'var(--glass)', 
          borderColor: 'var(--border)',
          backdropFilter: 'blur(12px)',
          color: 'var(--txt)'
        }}
      >
        <Globe className="w-4 h-4 ml-2 mr-1 opacity-70" />
        <button
          onClick={() => setActiveLocale(primaryLocale)}
          className={`px-3 py-1.5 text-xs font-semibold rounded-full transition-colors ${
            activeLocale === primaryLocale ? 'bg-white text-black shadow-sm' : 'hover:bg-black/5 dark:hover:bg-white/10'
          }`}
        >
          {primaryLocale.toUpperCase()}
        </button>
        <button
          onClick={() => setActiveLocale(secondaryLocale)}
          className={`px-3 py-1.5 text-xs font-semibold rounded-full transition-colors ${
            activeLocale === secondaryLocale ? 'bg-white text-black shadow-sm' : 'hover:bg-black/5 dark:hover:bg-white/10'
          }`}
        >
          {secondaryLocale.toUpperCase()}
        </button>
      </div>
    </div>
  )
}
