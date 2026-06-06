'use client'

// CoastalLayout — Coastal, ocean vibes
// Mobile: horizontal pill nav at top + fixed-height paged content area.
// Tablet (md+): fixed left sidebar (220px) + right content fills full height.

import { useRef } from 'react'
import Image from 'next/image'
import { m, AnimatePresence } from 'framer-motion'
import type { Category, Item } from '@/types/database'
import { cdnUrl, itemImageKey } from '@/types/database'
import { useMenuStore } from '@/stores/menu'
import { useTabCategorySync } from '@/components/menu/useCategorySync'
import { track } from '@/lib/firebase'
import { VegMark, ItemBadge } from '@/components/menu/badges'
import { formatPrice } from '@/lib/utils'
import { waveReveal, staggerContainer } from '@/components/menu/scrollVariants'
import type { LayoutProps } from './MercadoLayout'

const COASTAL_STYLES = `
  @keyframes ocean-shift {
    0%,100% { background-position: 0% 50%; }
    50%      { background-position: 100% 50%; }
  }
  @keyframes foam-rise {
    0%   { transform: translateY(0) scale(1); opacity: 0.6; }
    100% { transform: translateY(-120px) scale(0.4); opacity: 0; }
  }
  @keyframes wave-morph {
    0%   { border-radius: 60% 40% 55% 45% / 55% 45% 55% 45%; }
    50%  { border-radius: 45% 55% 45% 55% / 45% 55% 65% 35%; }
    100% { border-radius: 60% 40% 55% 45% / 55% 45% 55% 45%; }
  }
  @keyframes morph {
    0%   { border-radius: 40% 60% 70% 30% / 40% 50% 60% 50%; }
    34%  { border-radius: 70% 30% 50% 50% / 30% 30% 70% 70%; }
    67%  { border-radius: 100% 60% 60% 100% / 100% 100% 60% 60%; }
    100% { border-radius: 40% 60% 70% 30% / 40% 50% 60% 50%; }
  }
`

function OceanBackground() {
  return (
    <div className="pointer-events-none fixed inset-0 z-0">
      <style dangerouslySetInnerHTML={{ __html: COASTAL_STYLES }} />
      {/* Deep gradient layer */}
      <div style={{
        position: 'absolute', inset: 0,
        background: 'linear-gradient(180deg, transparent 0%, rgba(var(--brand-rgb, 0, 150, 200), 0.04) 60%, rgba(var(--brand-rgb, 0, 150, 200), 0.08) 100%)',
      }} />
      {/* Animated colour sweep */}
      <div style={{
        position: 'absolute', bottom: 0, left: 0, right: 0, height: '40%',
        background: 'linear-gradient(90deg, var(--brand), var(--brand2, #06b6d4), var(--brand))',
        backgroundSize: '200% 100%',
        opacity: 0.06,
        animation: 'ocean-shift 12s ease-in-out infinite',
      }} />
    </div>
  )
}

function SeaFoam() {
  return (
    <div className="pointer-events-none fixed bottom-0 left-0 right-0 z-[1] h-24 overflow-hidden">
      {Array.from({ length: 12 }).map((_, i) => {
        const pseudoRand1 = ((i * 13) % 100) / 100
        const pseudoRand2 = ((i * 29) % 100) / 100
        const pseudoRand3 = ((i * 47) % 100) / 100
        const pseudoRand4 = ((i * 71) % 100) / 100
        
        return (
          <div
            key={i}
            style={{
              position: 'absolute',
              bottom: 0,
              left: `${(i / 12) * 100 + pseudoRand1 * 8}%`,
              width: 8 + pseudoRand2 * 12,
              height: 8 + pseudoRand2 * 12,
              borderRadius: '50%',
              background: 'var(--brand)',
              opacity: 0,
              animationName: 'foam-rise',
              animationDuration: `${2 + pseudoRand3 * 3}s`,
              animationDelay: `${pseudoRand4 * 5}s`,
              animationTimingFunction: 'ease-out',
              animationIterationCount: 'infinite',
            }}
          />
        )
      })}
    </div>
  )
}

function ItemGrid({ activeCat, catItems, openItem }: { activeCat: Category | undefined; catItems: Item[]; openItem: (i: Item) => void }) {
  return (
    <div>
      <div
        className="sticky top-[var(--menu-tabs-offset,0px)] z-20 px-4 py-3 md:px-6 md:py-4"
        style={{ background: 'var(--glass)', backdropFilter: 'blur(16px)', borderBottom: '1px solid var(--bdr)' }}
      >
        <h2 className="text-xl font-bold" style={{ fontFamily: 'var(--font-display)', color: 'var(--txt)' }}>{activeCat?.name}</h2>
        {activeCat?.description && <p className="mt-0.5 text-xs" style={{ color: 'var(--txt2)' }}>{activeCat.description}</p>}
      </div>
      <m.div 
        className="grid grid-cols-2 gap-4 px-4 pb-8 md:grid-cols-2 md:px-6 lg:grid-cols-3 xl:grid-cols-4 lg:gap-5 lg:px-8"
        variants={staggerContainer}
        initial="hidden"
        animate="show"
      >
        {catItems.map((item, idx) => {
          const imgUrl = cdnUrl(itemImageKey(item))
          return (
            <m.button
              key={item.id}
              custom={idx}
              variants={waveReveal}
              initial="hidden"
              whileInView="show"
              viewport={{ once: true, margin: '-20px' }}
              whileTap={{ scale: 0.97 }}
              whileHover={{ y: -6, scale: 1.03, boxShadow: '0 16px 48px rgba(0,150,200,0.2)' }}
              onClick={() => { openItem(item); track('item_view', { business_id: item.business_id, item_id: item.id }) }}
              className={`flex flex-col text-left relative overflow-hidden ${imgUrl ? 'rounded-3xl' : 'col-span-full rounded-2xl sm:col-span-1'}`}
              style={{
                background: imgUrl ? 'var(--sf1)' : 'transparent',
                border: imgUrl ? '1px solid var(--bdr)' : '1px solid var(--bdr)',
                opacity: item.is_available ? 1 : 0.5
              }}
            >
              {imgUrl ? (
                <>
                  <div className="relative aspect-[4/3] w-full overflow-hidden" style={{ background: 'var(--sf2)' }}>
                    <Image src={imgUrl} alt={item.name} fill className="object-cover" sizes="(max-width:768px) 50vw, 33vw" loading={idx < 4 ? "eager" : "lazy"} fetchPriority={idx < 4 ? "high" : "auto"} />
                  </div>
                  <div className="flex-1 p-3 w-full flex flex-col">
                    <div className="flex items-start justify-between gap-1 mb-1">
                      <p className="flex-1 min-w-0 text-sm font-semibold leading-snug line-clamp-2" style={{ fontFamily: 'var(--font-display)', color: 'var(--txt)' }}>{item.name}</p>
                    </div>
                    {item.description && (
                      <p className="mb-2 text-xs leading-relaxed line-clamp-2" style={{ color: 'var(--txt2)' }}>
                        {item.description}
                      </p>
                    )}
                    <div className="mt-auto pt-2 flex items-end justify-between border-t border-[var(--bdr2)]">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <VegMark dietary={item.dietary} size="xs" />
                        {item.badge && <ItemBadge badge={item.badge} />}
                        {!item.is_available && <span className="text-[10px] font-medium uppercase tracking-wide" style={{ color: 'var(--txt3)' }}>Out</span>}
                      </div>
                      <div className="flex flex-col items-end shrink-0 gap-0.5">
                        {item.compare_price && item.compare_price > item.price && <s className="opacity-50 font-normal text-[10px] leading-none">{formatPrice(item.compare_price)}</s>}
                        <span className="shrink-0 text-sm font-bold leading-none" style={{ color: 'var(--brand)', fontFamily: 'var(--font-body)' }}>{formatPrice(item.price)}</span>
                      </div>
                    </div>
                  </div>
                </>
              ) : (
                <>
                  <div className="absolute inset-0 rounded-2xl" style={{ background: 'var(--brand-dim, var(--sf2))', opacity: 0.3 }} />
                  <div className="relative z-10 p-5 w-full flex h-full items-center justify-between gap-4">
                    <div className="flex-1 min-w-0 flex flex-col justify-center">
                      <p className="text-base font-bold leading-tight mb-1" style={{ fontFamily: 'var(--font-display)', color: 'var(--txt)' }}>{item.name}</p>
                      {item.description && (
                        <p className="mb-2 text-xs leading-relaxed line-clamp-2" style={{ color: 'var(--txt2)' }}>
                          {item.description}
                        </p>
                      )}
                      <div className="flex items-center gap-1.5 flex-wrap mt-auto">
                        <VegMark dietary={item.dietary} size="xs" />
                        {item.badge && <ItemBadge badge={item.badge} />}
                        {!item.is_available && <span className="text-[10px] font-medium uppercase tracking-wide" style={{ color: 'var(--txt3)' }}>Out</span>}
                      </div>
                    </div>
                    <div className="flex flex-col items-end shrink-0 gap-0.5">
                        {item.compare_price && item.compare_price > item.price && <s className="opacity-50 font-normal text-[10px] leading-none">{formatPrice(item.compare_price)}</s>}
                        <span className="shrink-0 text-sm font-bold leading-none" style={{ color: 'var(--brand)', fontFamily: 'var(--font-body)' }}>{formatPrice(item.price)}</span>
                    </div>
                  </div>
                </>
              )}
            </m.button>
          )
        })}
        {catItems.length === 0 && (
          <p className="col-span-2 py-12 text-center text-sm md:col-span-3" style={{ color: 'var(--txt3)' }}>No items here.</p>
        )}
      </m.div>
    </div>
  )
}

export function CoastalLayout({ categories, items, businessId: _businessId }: LayoutProps) {
  const openItem = useMenuStore((s) => s.openItem)
  const requestJump = useMenuStore((s) => s.requestJump)
  const { activeId, setActiveId } = useTabCategorySync(categories)
  const prevIdxRef = useRef(0)
  const activeIdx = categories.findIndex((c) => c.id === activeId)
  const direction = activeIdx >= prevIdxRef.current ? 1 : -1
  prevIdxRef.current = activeIdx

  const activeCat = categories.find((c) => c.id === activeId)
  const catItems = items.filter((i) => i.category_id === activeId)

  const touchStartX = useRef(0)
  const onTouchStart = (e: React.TouchEvent) => { touchStartX.current = e.touches[0].clientX }
  const onTouchEnd = (e: React.TouchEvent) => {
    const dx = e.changedTouches[0].clientX - touchStartX.current
    if (dx < -50) { const next = activeIdx + 1; if (next < categories.length) setActiveId(categories[next].id) }
    else if (dx > 50) { const prev = activeIdx - 1; if (prev >= 0) setActiveId(categories[prev].id) }
  }

  const progressPct = categories.length > 1 ? (activeIdx / (categories.length - 1)) * 100 : 100

  return (
    <div className="relative" style={{ background: 'var(--bg)', color: 'var(--txt)' }}>
      <OceanBackground />
      <SeaFoam />
      {/* Tablet sidebar — fixed left, hidden on mobile */}
      <aside
        className="hidden md:flex md:flex-col"
        style={{ position: 'fixed', top: 0, left: 0, bottom: 0, width: 220, background: 'var(--sf1)', borderRight: '1px solid var(--bdr)', zIndex: 30, overflowY: 'auto', padding: '2rem 1.25rem' }}
      >
        <p className="mb-6 text-[10px] font-semibold uppercase tracking-[0.4em]" style={{ color: 'var(--brand)' }}>Categories</p>
        <nav className="flex flex-col gap-1">
          {categories.map((cat) => {
            const active = activeId === cat.id
            return (
              <button id={`nav-btn-${cat.id}`}
                key={cat.id}
                onClick={() => requestJump(cat.id)}
                className="relative flex items-center gap-2 rounded-lg px-3 py-2.5 text-left text-sm transition-colors"
                style={{ color: active ? 'var(--brand)' : 'var(--txt2)', fontFamily: 'var(--font-body)', fontWeight: active ? 600 : 400, background: active ? 'var(--sf2)' : 'transparent' }}
              >
                {active && <m.span layoutId="coastal-sidebar-indicator" className="absolute left-0 top-1 bottom-1 w-[3px] rounded-full" style={{ background: 'var(--brand)' }} />}
                <span className="pl-1">{cat.name}</span>
              </button>
            )
          })}
        </nav>
      </aside>

      {/* Mobile layout — hidden on tablet */}
      <div className="flex flex-col md:hidden" style={{ height: '100svh', minHeight: '400px' }}>
        <div className="shrink-0 px-4 pt-3 pb-0 z-30" style={{ background: 'var(--glass)', backdropFilter: 'blur(12px)', borderBottom: '1px solid var(--bdr)' }}>
          <div className="flex gap-2 overflow-x-auto pb-2">
            {categories.map((cat) => (
              <button id={`nav-btn-${cat.id}`}
                key={cat.id}
                onClick={() => requestJump(cat.id)}
                className="relative shrink-0 rounded-full px-4 py-2 text-sm font-semibold transition-colors"
                style={{ color: activeId === cat.id ? 'var(--bg)' : 'var(--txt2)', fontFamily: 'var(--font-body)' }}
              >
                {activeId === cat.id && (
                  <m.span layoutId="coastal-pill" className="absolute inset-0 rounded-full" style={{ background: 'var(--brand)' }} transition={{ type: 'spring', stiffness: 400, damping: 35 }} />
                )}
                <span className="relative">{cat.name}</span>
              </button>
            ))}
          </div>
          <div className="h-0.5 w-full" style={{ background: 'var(--bdr)' }}>
            <m.div className="h-full rounded-full" style={{ background: 'var(--brand)' }} animate={{ width: `${progressPct}%` }} transition={{ type: 'spring', stiffness: 180, damping: 28 }} />
          </div>
        </div>
        <div className="relative flex-1 overflow-hidden" onTouchStart={onTouchStart} onTouchEnd={onTouchEnd}>
          <AnimatePresence mode="wait" custom={direction}>
            <m.div
              key={activeId}
              custom={direction}
              initial={{ x: direction * 80, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              exit={{ x: direction * -80, opacity: 0 }}
              transition={{ type: 'spring', stiffness: 320, damping: 32 }}
              style={{ position: 'absolute', inset: 0, overflowY: 'auto', overscrollBehavior: 'contain' }}
            >
              <ItemGrid activeCat={activeCat} catItems={catItems} openItem={openItem} />
            </m.div>
          </AnimatePresence>
        </div>
      </div>

      {/* Tablet content — visible on md+, offset by sidebar */}
      <div className="hidden md:block md:ml-[220px]" style={{ minHeight: '100svh' }}>
        <AnimatePresence mode="wait" custom={direction}>
          <m.div
            key={activeId}
            custom={direction}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -12 }}
            transition={{ duration: 0.3 }}
          >
            <ItemGrid activeCat={activeCat} catItems={catItems} openItem={openItem} />
          </m.div>
        </AnimatePresence>
      </div>
    </div>
  )
}
