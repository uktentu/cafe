'use client'

// NocturneLayout — Dark luxury lounge
// Nav paradigm: Full-screen snap pages — each category = one viewport.
// Fixed left dot rail (outside scroll container). No nav buttons — dots only + ThumbDock.

import { useRef } from 'react'
import { m } from 'framer-motion'
import type { Item } from '@/types/database'
import { useMenuStore } from '@/stores/menu'
import { useSnapCategorySync } from '@/components/menu/useCategorySync'
import { track } from '@/lib/firebase'
import { VegMark, ItemBadge } from '@/components/menu/badges'
import { formatPrice } from '@/lib/utils'
import type { LayoutProps } from './MercadoLayout'

function Row({ item, idx, openItem }: { item: Item; idx: number; openItem: (i: Item) => void }) {
  return (
    <m.button
      initial={{ opacity: 0, y: 12 }}
      whileInView={{ opacity: item.is_available ? 1 : 0.4, y: 0 }}
      viewport={{ once: true, margin: '-5% 0px' }}
      transition={{ duration: 0.45, delay: Math.min(idx * 0.06, 0.4), ease: [0.22, 1, 0.36, 1] }}
      whileHover={{ x: 6 }}
      onClick={() => { openItem(item); track('item_view', { business_id: item.business_id, item_id: item.id }) }}
      className="group flex w-full items-center gap-3 py-4 text-left md:py-5"
      style={{ borderBottom: '1px solid var(--bdr2)' }}
    >
      <VegMark dietary={item.dietary} />
      <span className="min-w-0 flex-1 truncate text-[15px] tracking-wide transition-opacity group-hover:opacity-70"
        style={{ fontFamily: 'var(--font-display)', color: 'var(--txt)', fontStyle: 'italic' }}>
        {item.name}
      </span>
      {item.badge && <ItemBadge badge={item.badge} className="hidden sm:inline-flex" />}
      {!item.is_available && (
        <span className="shrink-0 text-[10px] uppercase tracking-widest" style={{ color: 'var(--txt3)' }}>Sold out</span>
      )}
      <span className="shrink-0 text-[15px] font-semibold tabular-nums"
        style={{ color: 'var(--brand)', fontFamily: 'var(--font-body)' }}>
        {formatPrice(item.price)}
      </span>
    </m.button>
  )
}

export function NocturneLayout({ categories, items, businessId: _businessId }: LayoutProps) {
  const openItem = useMenuStore((s) => s.openItem)
  const scrollRef = useRef<HTMLDivElement>(null)
  const { activeId, register } = useSnapCategorySync(categories, scrollRef)

  const jumpTo = (id: string) => {
    const el = scrollRef.current?.querySelector(`[data-cat="${id}"]`) as HTMLElement | null
    el?.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }

  return (
    <div className="relative" style={{ background: 'var(--bg)', color: 'var(--txt)' }}>
      {/* Fixed left dot rail — OUTSIDE the snap container */}
      <div className="fixed left-3 top-1/2 z-40 -translate-y-1/2 flex-col items-center gap-3 hidden md:flex">
        {categories.map((cat) => {
          const active = cat.id === activeId
          return (
            <button
              key={cat.id}
              onClick={() => jumpTo(cat.id)}
              aria-label={cat.name}
              className="rounded-full transition-all duration-300"
              style={{
                width: active ? 12 : 6,
                height: active ? 12 : 6,
                background: active ? 'var(--brand)' : 'var(--bdr2)',
                boxShadow: active ? '0 0 10px var(--brand)' : 'none',
              }}
            />
          )
        })}
      </div>

      {/* Snap scroll container */}
      <div
        ref={scrollRef}
        style={{
          height: '100svh',
          overflowY: 'scroll',
          scrollSnapType: 'y mandatory',
          overscrollBehavior: 'contain',
          touchAction: 'pan-y',
        }}
      >
        {categories.map((cat, ci) => {
          const catItems = items.filter((i) => i.category_id === cat.id)
          return (
            <section
              key={cat.id}
              data-cat={cat.id}
              ref={register(cat.id)}
              style={{
                minHeight: '100svh',
                scrollSnapAlign: 'start',
                scrollSnapStop: 'always',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'center',
                padding: '5rem 1.5rem 8rem',
                position: 'relative',
              }}
              className="md:px-20 md:py-24"
            >
              <div className="mx-auto w-full max-w-xl md:max-w-2xl">
                {/* Big index numeral */}
                <m.span
                  initial={{ opacity: 0, y: 24 }}
                  whileInView={{ opacity: 0.15, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
                  className="block select-none leading-none md:text-[12rem]"
                  style={{
                    fontFamily: 'var(--font-display)',
                    fontSize: 'clamp(5rem, 20vw, 10rem)',
                    color: 'var(--brand)',
                    fontStyle: 'italic',
                  }}
                >
                  {String(ci + 1).padStart(2, '0')}
                </m.span>

                {/* Category name + count */}
                <m.div
                  initial={{ opacity: 0, y: 16 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.55, delay: 0.1, ease: [0.22, 1, 0.36, 1] }}
                  className="-mt-4 mb-1 flex items-baseline gap-4"
                >
                  <h2 className="text-3xl sm:text-4xl"
                    style={{ fontFamily: 'var(--font-display)', color: 'var(--txt)', fontStyle: 'italic' }}>
                    {cat.name}
                  </h2>
                  <span className="text-xs uppercase tracking-[0.3em]" style={{ color: 'var(--brand)' }}>
                    {catItems.length} {catItems.length === 1 ? 'dish' : 'dishes'}
                  </span>
                </m.div>

                {cat.description && (
                  <p className="mb-5 text-sm tracking-wide" style={{ color: 'var(--txt2)' }}>{cat.description}</p>
                )}

                {/* Gold hairline */}
                <div className="mb-2 h-px" style={{ background: 'var(--brand)' }} />

                <div>
                  {catItems.map((item, idx) => (
                    <Row key={item.id} item={item} idx={idx} openItem={openItem} />
                  ))}
                  {catItems.length === 0 && (
                    <p className="py-10 text-center text-sm" style={{ color: 'var(--txt3)' }}>No dishes here yet.</p>
                  )}
                </div>
              </div>

              {/* Bottom progress dots (inside viewport, absolute) */}
              <div className="absolute bottom-6 left-1/2 flex -translate-x-1/2 gap-2 md:hidden">
                {categories.map((c) => (
                  <span
                    key={c.id}
                    className="rounded-full transition-all duration-300"
                    style={{
                      width: c.id === cat.id ? 20 : 6,
                      height: 6,
                      background: c.id === cat.id ? 'var(--brand)' : 'var(--bdr2)',
                    }}
                  />
                ))}
              </div>
            </section>
          )
        })}
      </div>
    </div>
  )
}
