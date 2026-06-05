'use client'

// ThumbDock — a floating, bottom-anchored control reachable with one thumb.
// Works across EVERY template: a compact pill that expands into a bottom sheet
// holding (1) the dietary filter and (2) category shortcuts. Tapping a shortcut
// drives the active layout via the menu store's jump channel (scroll OR tab).
import { useState } from 'react'
import { m, AnimatePresence } from 'framer-motion'
import { LayoutGrid, ArrowUp, X, Check } from 'lucide-react'
import { useMenuStore, type DietaryFilter } from '@/stores/menu'
import { VegMark } from '@/components/menu/badges'
import { getCategoryIcon } from '@/components/menu/categoryIcon'
import type { Category, DietaryPreference } from '@/types/database'
import { useLanguage } from './LanguageProvider'

interface ThumbDockProps {
  categories: Category[]
  presentDietary: DietaryPreference[]
}

const DIETARY_LABEL: Record<DietaryFilter, string> = {
  all: 'All', none: 'All', veg: 'Veg', 'non-veg': 'Non-Veg', egg: 'Egg', vegan: 'Vegan',
}

export function ThumbDock({ categories, presentDietary }: ThumbDockProps) {
  const { tUi } = useLanguage()
  const [open, setOpen] = useState(false)
  const activeCategoryId = useMenuStore((s) => s.activeCategoryId)
  const requestJump = useMenuStore((s) => s.requestJump)
  const dietary = useMenuStore((s) => s.dietary)
  const setDietary = useMenuStore((s) => s.setDietary)

  const activeCat = categories.find((c) => c.id === activeCategoryId)
  const filterOptions: DietaryFilter[] = ['all', ...presentDietary]
  const hasFilter = presentDietary.length > 0

  function jumpTo(id: string) {
    requestJump(id)
    setOpen(false)
  }
  function scrollTop() {
    window.scrollTo({ top: 0, behavior: 'smooth' })
    setOpen(false)
  }

  if (categories.length === 0) return null

  return (
    <>
      {/* Floating pill — thumb zone, bottom-center, clear of the WhatsApp FAB */}
      <div
        className="fixed inset-x-0 z-[65] flex justify-center px-4"
        style={{ bottom: 'calc(1rem + env(safe-area-inset-bottom))' }}
      >
        <m.button
          onClick={() => setOpen(true)}
          whileTap={{ scale: 0.95 }}
          className="pointer-events-auto flex items-center gap-2 rounded-full py-2.5 pl-4 pr-5 shadow-lg backdrop-blur-md"
          style={{
            background: 'var(--glass)',
            border: '1px solid var(--bdr2)',
            color: 'var(--txt)',
            maxWidth: 'calc(100% - 76px)', // leave room for the WhatsApp FAB
          }}
          aria-label="Open menu navigation"
        >
          <LayoutGrid className="h-[18px] w-[18px] shrink-0" style={{ color: 'var(--brand)' }} />
          <span className="truncate text-sm font-semibold" style={{ fontFamily: 'var(--font-body)' }}>
            {activeCat?.name ?? 'Menu'}
          </span>
          {dietary !== 'all' && (
            <span
              className="shrink-0 rounded-full px-2 py-0.5 text-[10px] font-bold uppercase"
              style={{ background: 'var(--brand)', color: 'var(--bg)' }}
            >
              {tUi(DIETARY_LABEL[dietary], DIETARY_LABEL[dietary])}
            </span>
          )}
        </m.button>
      </div>

      {/* Bottom sheet */}
      <AnimatePresence>
        {open && (
          <>
            <m.div
              className="fixed inset-0 z-[80]"
              style={{ background: 'rgba(0,0,0,0.5)' }}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setOpen(false)}
            />
            <m.div
              className="fixed inset-x-0 bottom-0 z-[81] max-h-[80svh] overflow-y-auto rounded-t-3xl pb-[env(safe-area-inset-bottom)] lg:inset-x-auto lg:left-1/2 lg:w-[560px] lg:-translate-x-1/2 lg:rounded-3xl lg:bottom-4"
              style={{ background: 'var(--sf1)', borderTop: '1px solid var(--bdr2)', touchAction: 'none' }}
              initial={{ y: '100%' }}
              animate={{ y: 0 }}
              exit={{ y: '100%' }}
              transition={{ type: 'spring', stiffness: 360, damping: 36 }}
              drag="y"
              dragConstraints={{ top: 0, bottom: 0 }}
              dragElastic={{ top: 0, bottom: 0.4 }}
              onDragEnd={(_e, info) => { if (info.offset.y > 120) setOpen(false) }}
            >
              {/* Grab handle */}
              <div className="flex justify-center pt-3">
                <div className="h-1 w-10 rounded-full" style={{ background: 'var(--bdr2)' }} />
              </div>

              <div className="flex items-center justify-between px-5 pt-3">
                <h3 className="text-base font-bold" style={{ fontFamily: 'var(--font-display)', color: 'var(--txt)' }}>
                  Browse menu
                </h3>
                <button
                  onClick={() => setOpen(false)}
                  className="flex h-8 w-8 items-center justify-center rounded-full"
                  style={{ background: 'var(--sf2)', color: 'var(--txt2)' }}
                  aria-label="Close"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>

              {/* Dietary filter */}
              {hasFilter && (
                <div className="px-5 pt-4">
                  <p className="mb-2 text-[11px] font-semibold uppercase tracking-widest" style={{ color: 'var(--txt3)' }}>
                    Dietary
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {filterOptions.map((opt) => {
                      const active = dietary === opt
                      return (
                        <button
                          key={opt}
                          onClick={() => setDietary(opt)}
                          className="flex items-center gap-1.5 rounded-full px-3.5 py-2 text-sm font-semibold transition-colors"
                          style={{
                            background: active ? 'var(--brand)' : 'var(--sf2)',
                            color: active ? 'var(--bg)' : 'var(--txt)',
                            border: `1px solid ${active ? 'var(--brand)' : 'var(--bdr2)'}`,
                          }}
                        >
                          {opt !== 'all' && <VegMark dietary={opt} size="xs" />}
                          {tUi(DIETARY_LABEL[opt], DIETARY_LABEL[opt])}
                          {active && <Check className="h-3.5 w-3.5" />}
                        </button>
                      )
                    })}
                  </div>
                </div>
              )}

              {/* Category shortcuts */}
              <div className="px-5 pb-4 pt-5">
                <p className="mb-2 text-[11px] font-semibold uppercase tracking-widest" style={{ color: 'var(--txt3)' }}>
                  Jump to
                </p>
                <div className="grid grid-cols-2 gap-2 lg:grid-cols-3">
                  {categories.map((cat) => {
                    const Icon = getCategoryIcon(cat.icon)
                    const active = cat.id === activeCategoryId
                    return (
                      <button
                        key={cat.id}
                        onClick={() => jumpTo(cat.id)}
                        className="flex items-center gap-2.5 rounded-2xl px-3.5 py-3 text-left transition-colors"
                        style={{
                          background: active ? 'var(--brand)' : 'var(--sf2)',
                          color: active ? 'var(--bg)' : 'var(--txt)',
                        }}
                      >
                        <Icon className="h-[18px] w-[18px] shrink-0" style={{ color: active ? 'var(--bg)' : 'var(--brand)' }} />
                        <span className="truncate text-sm font-semibold">{cat.name}</span>
                      </button>
                    )
                  })}
                </div>
              </div>

              {/* Back to top */}
              <div className="px-5 pb-5">
                <button
                  onClick={scrollTop}
                  className="flex w-full items-center justify-center gap-2 rounded-2xl py-3 text-sm font-semibold"
                  style={{ background: 'var(--sf2)', color: 'var(--txt2)' }}
                >
                  <ArrowUp className="h-4 w-4" /> Back to top
                </button>
              </div>
            </m.div>
          </>
        )}
      </AnimatePresence>
    </>
  )
}
