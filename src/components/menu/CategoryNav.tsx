'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import { m } from 'framer-motion'
import { track } from '@/lib/firebase'
import type { CategoryNavStyle } from '@/lib/design-tokens'
import type { Category } from '@/types/database'

interface CategoryNavProps {
  categories: Pick<Category, 'id' | 'name'>[]
  businessId: string
  navStyle?: CategoryNavStyle
}

// ── shared scroll-spy hook ─────────────────────────────────────────

function useScrollSpy(categories: Pick<Category, 'id' | 'name'>[]) {
  const [active, setActive] = useState(categories[0]?.id ?? '')
  const pillRefs = useRef<Record<string, HTMLButtonElement | null>>({})
  const manualLock = useRef(false)
  const lockTimer = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => {
    const sections = categories
      .map((c) => document.getElementById(`cat-${c.id}`))
      .filter((el): el is HTMLElement => Boolean(el))
    if (sections.length === 0) return

    const observer = new IntersectionObserver(
      (entries) => {
        if (manualLock.current) return
        const best = entries
          .filter((e) => e.isIntersecting)
          .sort((a, b) => b.intersectionRatio - a.intersectionRatio)[0]
        if (best) setActive(best.target.id.replace('cat-', ''))
      },
      { rootMargin: '-10% 0px -50% 0px', threshold: [0, 0.1, 0.5, 1] },
    )
    sections.forEach((s) => observer.observe(s))
    return () => observer.disconnect()
  }, [categories])

  useEffect(() => {
    pillRefs.current[active]?.scrollIntoView({ behavior: 'smooth', inline: 'center', block: 'nearest' })
  }, [active])

  const goTo = useCallback((id: string, businessId: string) => {
    setActive(id)
    track('category_tap', { business_id: businessId })
    manualLock.current = true
    if (lockTimer.current) clearTimeout(lockTimer.current)
    lockTimer.current = setTimeout(() => { manualLock.current = false }, 900)
    document.getElementById(`cat-${id}`)?.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }, [])

  return { active, pillRefs, goTo }
}

// ── Pills (mercado, coastal) ───────────────────────────────────────
function PillsNav({ categories, businessId }: Omit<CategoryNavProps, 'navStyle'>) {
  const { active, pillRefs, goTo } = useScrollSpy(categories)
  if (categories.length === 0) return null
  return (
    <nav
      aria-label="Menu categories"
      className="sticky top-0 z-50 border-b"
      style={{ background: 'var(--glass)', backdropFilter: 'blur(16px)', borderColor: 'var(--bdr)' }}
    >
      <div className="flex gap-2 overflow-x-auto px-4 py-3 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        {categories.map((c) => {
          const isActive = c.id === active
          return (
            <button
              key={c.id}
              id={`nav-btn-${c.id}`}
              ref={(el) => { pillRefs.current[c.id] = el }}
              onClick={() => goTo(c.id, businessId)}
              aria-current={isActive ? 'true' : undefined}
              className="relative shrink-0 whitespace-nowrap rounded-full px-4 py-1.5 text-sm font-medium transition-colors"
              style={{ color: isActive ? 'var(--bg)' : 'var(--txt2)', fontFamily: 'var(--font-body)', border: isActive ? 'none' : '1px solid var(--bdr2)' }}
            >
              {isActive && (
                <m.span
                  layoutId="active-pill"
                  className="absolute inset-0 rounded-full"
                  style={{ background: 'var(--brand)' }}
                  transition={{ type: 'spring', stiffness: 450, damping: 38 }}
                />
              )}
              <span className="relative z-10">{c.name}</span>
            </button>
          )
        })}
      </div>
    </nav>
  )
}

// ── Text underline (provenance, nocturne, aether) ─────────────────
function TextNav({ categories, businessId }: Omit<CategoryNavProps, 'navStyle'>) {
  const { active, pillRefs, goTo } = useScrollSpy(categories)
  if (categories.length === 0) return null
  return (
    <nav
      aria-label="Menu categories"
      className="sticky top-0 z-50 border-b"
      style={{ background: 'var(--glass)', backdropFilter: 'blur(12px)', borderColor: 'var(--bdr)' }}
    >
      <div className="flex gap-6 overflow-x-auto px-5 pt-3 pb-0 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        {categories.map((c) => {
          const isActive = c.id === active
          return (
            <button
              key={c.id}
              id={`nav-btn-${c.id}`}
              ref={(el) => { pillRefs.current[c.id] = el }}
              onClick={() => goTo(c.id, businessId)}
              aria-current={isActive ? 'true' : undefined}
              className="relative shrink-0 whitespace-nowrap pb-3 text-sm font-medium transition-colors"
              style={{
                fontFamily: 'var(--font-body)',
                color: isActive ? 'var(--txt)' : 'var(--txt2)',
                letterSpacing: '0.02em',
              }}
            >
              {c.name}
              {isActive && (
                <m.span
                  layoutId="active-underline"
                  className="absolute inset-x-0 bottom-0 h-[2px]"
                  style={{ background: 'var(--brand)' }}
                  transition={{ type: 'spring', stiffness: 500, damping: 40 }}
                />
              )}
            </button>
          )
        })}
      </div>
    </nav>
  )
}

// ── Sections (terrain, studio) — minimal top sticky, looks like content ──
function SectionsNav({ categories, businessId }: Omit<CategoryNavProps, 'navStyle'>) {
  const { active, goTo } = useScrollSpy(categories)
  if (categories.length === 0) return null
  return (
    <nav
      aria-label="Menu categories"
      className="sticky top-0 z-50 border-b"
      style={{ background: 'var(--glass)', backdropFilter: 'blur(12px)', borderColor: 'var(--bdr)' }}
    >
      <div className="flex items-center gap-1 overflow-x-auto px-4 py-2 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        {categories.map((c, idx) => {
          const isActive = c.id === active
          return (
            <span key={c.id} className="flex shrink-0 items-center gap-1">
              {idx > 0 && <span className="text-xs opacity-30" style={{ color: 'var(--txt)' }}>·</span>}
              <button
                id={`nav-btn-${c.id}`}
                onClick={() => goTo(c.id, businessId)}
                aria-current={isActive ? 'true' : undefined}
                className="whitespace-nowrap px-2 py-1.5 text-xs font-semibold uppercase tracking-widest transition-colors"
                style={{
                  fontFamily: 'var(--font-body)',
                  color: isActive ? 'var(--brand)' : 'var(--txt2)',
                }}
              >
                {c.name}
              </button>
            </span>
          )
        })}
      </div>
    </nav>
  )
}

// ── Blocks (bazaar) — large tappable tiles ────────────────────────
function BlocksNav({ categories, businessId }: Omit<CategoryNavProps, 'navStyle'>) {
  const { active, goTo } = useScrollSpy(categories)
  if (categories.length === 0) return null
  return (
    <nav
      aria-label="Menu categories"
      className="sticky top-0 z-50 border-b"
      style={{ background: 'var(--bg)', borderColor: 'var(--bdr)' }}
    >
      <div className="flex overflow-x-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        {categories.map((c) => {
          const isActive = c.id === active
          return (
            <button
              key={c.id}
              id={`nav-btn-${c.id}`}
              onClick={() => goTo(c.id, businessId)}
              aria-current={isActive ? 'true' : undefined}
              className="relative shrink-0 whitespace-nowrap px-5 py-3 text-sm font-bold uppercase tracking-widest transition-colors"
              style={{
                fontFamily: 'var(--font-display)',
                color: isActive ? 'var(--bg)' : 'var(--txt2)',
                background: isActive ? 'var(--brand)' : 'transparent',
                letterSpacing: '0.08em',
              }}
            >
              {c.name}
              {isActive && (
                <m.span
                  layoutId="active-block"
                  className="absolute inset-0 -z-10"
                  style={{ background: 'var(--brand)' }}
                  transition={{ type: 'spring', stiffness: 400, damping: 38 }}
                />
              )}
            </button>
          )
        })}
      </div>
    </nav>
  )
}

// ── Vertical (onyx) — side rail on md+, compact pills on mobile ───
function VerticalNav({ categories, businessId }: Omit<CategoryNavProps, 'navStyle'>) {
  const { active, goTo } = useScrollSpy(categories)
  if (categories.length === 0) return null
  return (
    <>
      {/* Mobile: compact pills at top */}
      <nav
        aria-label="Menu categories"
        className="sticky top-0 z-50 border-b md:hidden"
        style={{ background: 'var(--glass)', backdropFilter: 'blur(12px)', borderColor: 'var(--bdr)' }}
      >
        <div className="flex gap-2 overflow-x-auto px-4 py-2 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          {categories.map((c) => {
            const isActive = c.id === active
            return (
              <button
                key={c.id}
                id={`nav-btn-${c.id}`}
                onClick={() => goTo(c.id, businessId)}
                aria-current={isActive ? 'true' : undefined}
                className="relative shrink-0 whitespace-nowrap rounded-full px-3 py-1 text-xs font-medium uppercase tracking-wider transition-colors"
                style={{
                  fontFamily: 'var(--font-body)',
                  color: isActive ? 'var(--bg)' : 'var(--txt2)',
                  background: isActive ? 'var(--brand)' : 'transparent',
                  border: isActive ? 'none' : '1px solid var(--bdr2)',
                }}
              >
                {c.name}
              </button>
            )
          })}
        </div>
      </nav>
      {/* Desktop: fixed left rail */}
      <nav
        aria-label="Menu categories"
        className="fixed left-4 top-1/2 z-40 hidden -translate-y-1/2 flex-col gap-1 md:flex"
        style={{ maxHeight: '60vh', overflowY: 'auto' }}
      >
        {categories.map((c) => {
          const isActive = c.id === active
          return (
            <button
              key={c.id}
              onClick={() => goTo(c.id, businessId)}
              aria-current={isActive ? 'true' : undefined}
              className="group flex items-center gap-2 py-1 text-left"
            >
              <m.span
                className="h-px"
                style={{ background: isActive ? 'var(--brand)' : 'var(--bdr2)' }}
                animate={{ width: isActive ? 20 : 12 }}
                transition={{ duration: 0.25 }}
              />
              <span
                className="text-xs font-medium uppercase tracking-widest transition-colors"
                style={{
                  fontFamily: 'var(--font-body)',
                  color: isActive ? 'var(--brand)' : 'var(--txt3)',
                }}
              >
                {c.name}
              </span>
            </button>
          )
        })}
      </nav>
    </>
  )
}

// ── Router ────────────────────────────────────────────────────────
const NAV_MAP: Record<CategoryNavStyle, React.ComponentType<Omit<CategoryNavProps, 'navStyle'>>> = {
  pills: PillsNav,
  text: TextNav,
  sections: SectionsNav,
  blocks: BlocksNav,
  vertical: VerticalNav,
}

export function CategoryNav({ categories, businessId, navStyle = 'pills' }: CategoryNavProps) {
  const Nav = NAV_MAP[navStyle] ?? PillsNav
  return <Nav categories={categories} businessId={businessId} />
}
