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
import { getCategoryIcon } from '@/components/menu/categoryIcon'
import type { LayoutProps } from './MercadoLayout'

function ItemGrid({ activeCat, catItems, openItem }: { activeCat: Category | undefined; catItems: Item[]; openItem: (i: Item) => void }) {
  const Icon = getCategoryIcon(activeCat?.icon)
  return (
    <div>
      {/* Sticky category heading — sticks within the inner scroll container on mobile */}
      <div
        className="sticky top-0 z-20 px-4 py-3 md:px-6 md:py-4"
        style={{ background: 'var(--bg)', backdropFilter: 'blur(10px)', borderBottom: '1px solid var(--bdr)' }}
      >
        <h2 className="text-xl font-bold" style={{ fontFamily: 'var(--font-display)', color: 'var(--txt)' }}>{activeCat?.name}</h2>
        {activeCat?.description && <p className="mt-0.5 text-xs" style={{ color: 'var(--txt2)' }}>{activeCat.description}</p>}
      </div>
      <div className="grid grid-cols-2 gap-4 px-4 pb-8 md:grid-cols-3 md:px-6 lg:grid-cols-4 lg:gap-5 lg:px-8">
        {catItems.map((item, idx) => {
          const imgUrl = cdnUrl(itemImageKey(item))
          return (
            <m.button
              key={item.id}
              initial={{ opacity: 0, y: 18 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: idx * 0.04, duration: 0.3 }}
              whileTap={{ scale: 0.97 }}
              whileHover={{ y: -3, boxShadow: '0 8px 30px rgba(0,0,0,0.12)' }}
              onClick={() => { openItem(item); track('item_view', { business_id: item.business_id, item_id: item.id }) }}
              className="flex flex-col overflow-hidden rounded-3xl text-left"
              style={{ background: 'var(--sf1)', border: '1px solid var(--bdr)', opacity: item.is_available ? 1 : 0.5 }}
            >
              <div className="relative aspect-[4/3] overflow-hidden md:aspect-[3/2]" style={{ background: 'var(--sf2)' }}>
                {imgUrl
                  ? <Image src={imgUrl} alt={item.name} fill className="object-cover" sizes="(max-width:768px) 50vw, 33vw" />
                  : <div className="flex h-full w-full items-center justify-center"><Icon size={32} style={{ color: 'var(--txt3)' }} /></div>
                }
              </div>
              <div className="flex-1 p-3">
                <div className="flex items-start justify-between gap-1">
                  <p className="flex-1 text-sm font-semibold leading-snug" style={{ fontFamily: 'var(--font-display)', color: 'var(--txt)' }}>{item.name}</p>
                  <span className="shrink-0 text-sm font-bold" style={{ color: 'var(--brand)', fontFamily: 'var(--font-body)' }}>{formatPrice(item.price)}</span>
                </div>
                {item.description && <p className="mt-1 line-clamp-2 text-xs leading-relaxed" style={{ color: 'var(--txt2)' }}>{item.description}</p>}
                <div className="mt-2 flex items-center gap-1.5">
                  <VegMark dietary={item.dietary} size="xs" />
                  {item.badge && <ItemBadge badge={item.badge} />}
                  {!item.is_available && <span className="text-[10px] font-medium uppercase tracking-wide" style={{ color: 'var(--txt3)' }}>Sold out</span>}
                </div>
              </div>
            </m.button>
          )
        })}
        {catItems.length === 0 && (
          <p className="col-span-2 py-12 text-center text-sm md:col-span-3" style={{ color: 'var(--txt3)' }}>No items here.</p>
        )}
      </div>
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
    <div style={{ background: 'var(--bg)', color: 'var(--txt)' }}>
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
              <button
                key={cat.id}
                onClick={() => setActiveId(cat.id)}
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
      <div className="flex flex-col md:hidden" style={{ height: '100svh' }}>
        <div className="shrink-0 px-4 pt-3 pb-0 z-30" style={{ background: 'var(--glass)', backdropFilter: 'blur(12px)', borderBottom: '1px solid var(--bdr)' }}>
          <div className="flex gap-2 overflow-x-auto pb-2">
            {categories.map((cat) => (
              <button
                key={cat.id}
                onClick={() => setActiveId(cat.id)}
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
            <m.div className="h-full rounded-full" style={{ background: 'var(--brand)' }} animate={{ width: `${progressPct}%` }} transition={{ type: 'spring', stiffness: 300, damping: 30 }} />
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
