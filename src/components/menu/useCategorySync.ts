'use client'

// Shared category-navigation glue. Every template uses ONE of these so the
// thumb dock can drive its navigation generically.
//   • useScrollCategorySync — scroll-spy + scrollIntoView (vertical templates)
//   • useSnapCategorySync   — variant for nested scroll containers (Nocturne)
//   • useTabCategorySync    — tab switching (one-category-at-a-time templates)
import { useCallback, useEffect, useRef, useState } from 'react'
import { useMenuStore } from '@/stores/menu'

interface Cat { id: string }

// ── Vertical scrolling (document scroll) ─────────────────────────────────────

/** Used by all vertical-scroll templates (Mercado, Terrain, Bazaar, Aether, Studio, Onyx). */
export function useScrollCategorySync(categories: Cat[]) {
  const setActive = useMenuStore((s) => s.setActiveCategoryId)
  const jump = useMenuStore((s) => s.jumpTarget)
  const [activeId, setActiveId] = useState(categories[0]?.id ?? '')
  const refs = useRef<Record<string, HTMLElement | null>>({})

  const isJumping = useRef(false)
  const visibleSections = useRef(new Set<string>())

  const register = useCallback(
    (id: string) => (el: HTMLElement | null) => {
      refs.current[id] = el
    },
    [],
  )

  // Scroll-spy — observes against the document viewport.
  useEffect(() => {
    // A thin band starting 150px from top, ending 40% down. This perfectly catches
    // tall sections that cover the screen, and short sections as they pass.
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((e) => {
          const id = e.target.getAttribute('data-cat')
          if (!id) return
          if (e.isIntersecting) {
            visibleSections.current.add(id)
          } else {
            visibleSections.current.delete(id)
          }
        })

        if (isJumping.current) return

        // Pick the top-most visible section based on DOM order or bounding box
        // Since visibleSections is a Set, we map it to actual elements to sort by top position
        const visibleArray = Array.from(visibleSections.current).map(id => ({
          id,
          top: refs.current[id]?.getBoundingClientRect().top ?? Infinity
        }))

        // Sort by closest to 150px (our header/dock area)
        visibleArray.sort((a, b) => Math.abs(a.top - 150) - Math.abs(b.top - 150))

        if (visibleArray.length > 0) {
          const bestId = visibleArray[0].id
          setActiveId(bestId)
          setActive(bestId)
        }
      },
      { threshold: 0, rootMargin: '-150px 0px -50% 0px' },
    )
    Object.values(refs.current).forEach((el) => el && observer.observe(el))
    return () => observer.disconnect()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [categories.length])

  // Jump → scrollIntoView (document scroll).
  useEffect(() => {
    if (!jump) return
    const el = refs.current[jump.id]
    if (el) { 
      isJumping.current = true
      setActiveId(jump.id)
      setActive(jump.id)
      el.scrollIntoView({ behavior: 'smooth', block: 'start' }) 
      setTimeout(() => { isJumping.current = false }, 1000) // Lock observer during smooth scroll
    }
  }, [jump, setActive])

  // Sync horizontal nav bar scroll position
  useEffect(() => {
    if (!activeId) return
    const btn = document.getElementById(`nav-btn-${activeId}`)
    if (btn) {
      btn.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'center' })
    }
  }, [activeId])

  return { activeId, register }
}

// ── Nested scroll container (Nocturne snap-scroll) ────────────────────────────

/**
 * Variant for templates where sections live inside a *nested* scrollable div
 * (not the document). The caller provides a `rootRef` pointing to that container.
 * The ThumbDock jump scrolls inside the container instead of the document.
 */
export function useSnapCategorySync(categories: Cat[], rootRef: React.RefObject<HTMLElement>) {
  const setActive = useMenuStore((s) => s.setActiveCategoryId)
  const jump = useMenuStore((s) => s.jumpTarget)
  const [activeId, setActiveId] = useState(categories[0]?.id ?? '')
  const sectionRefs = useRef<Record<string, HTMLElement | null>>({})

  const register = useCallback(
    (id: string) => (el: HTMLElement | null) => {
      sectionRefs.current[id] = el
    },
    [],
  )

  // Scroll-spy — root is the inner scroll container, not the document.
  useEffect(() => {
    const root = rootRef.current
    if (!root) return
    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries
          .filter((e) => e.isIntersecting)
          .sort((a, b) => b.intersectionRatio - a.intersectionRatio)[0]
        if (visible) {
          const id = visible.target.getAttribute('data-cat') ?? ''
          if (id) { setActiveId(id); setActive(id) }
        }
      },
      { root, threshold: 0.5 },
    )
    Object.values(sectionRefs.current).forEach((el) => el && observer.observe(el))
    return () => observer.disconnect()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [categories.length, rootRef])

  // Jump → scroll inside the nested container.
  useEffect(() => {
    if (!jump) return
    const el = sectionRefs.current[jump.id]
    if (el) { setActiveId(jump.id); el.scrollIntoView({ behavior: 'smooth', block: 'start' }) }
  }, [jump])

  return { activeId, register }
}

// ── Tab switching ─────────────────────────────────────────────────────────────

export function useTabCategorySync(categories: Cat[]) {
  const setActive = useMenuStore((s) => s.setActiveCategoryId)
  const jump = useMenuStore((s) => s.jumpTarget)
  const [activeId, setActiveId] = useState(categories[0]?.id ?? '')

  useEffect(() => { setActive(activeId) }, [activeId, setActive])

  useEffect(() => {
    if (jump && categories.some((c) => c.id === jump.id)) {
      setActiveId(jump.id)
      // Scroll to the top of the menu container when switching tabs via jump
      setTimeout(() => {
        document.getElementById('menu')?.scrollIntoView({ behavior: 'smooth', block: 'start' })
      }, 50)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [jump])

  useEffect(() => {
    if (categories.length && !categories.some((c) => c.id === activeId)) {
      setActiveId(categories[0].id)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [categories])

  return { activeId, setActiveId }
}

// ── Touch swipe helper ────────────────────────────────────────────────────────

export function useSwipeCategory(
  categories: Cat[],
  activeId: string,
  setActiveId: (id: string) => void,
) {
  const idx = categories.findIndex((c) => c.id === activeId)
  const go = useCallback(
    (dir: 1 | -1) => {
      const next = idx + dir
      if (next >= 0 && next < categories.length) setActiveId(categories[next].id)
    },
    [idx, categories, setActiveId],
  )
  // Kept for backwards compat with any layout still using drag (shouldn't be used).
  const onDragEnd = useCallback(
    (_e: unknown, info: { offset: { x: number }; velocity: { x: number } }) => {
      const { offset, velocity } = info
      if (offset.x < -80 || velocity.x < -500) go(1)
      else if (offset.x > 80 || velocity.x > 500) go(-1)
    },
    [go],
  )
  return { onDragEnd, canPrev: idx > 0, canNext: idx < categories.length - 1, go }
}
