'use client'

// BazaarLayout — Vibrant Indian bazaar
// Horizontal variety: the page scrolls VERTICALLY between categories, but each
// category is a HORIZONTAL snap strip you swipe left↔right. Strip slides in from
// the right on entry. Scroll-sync feeds the ThumbDock.

import { useEffect, useRef, useState } from 'react'
import Image from 'next/image'
import { m } from 'framer-motion'
import type { Category, Item } from '@/types/database'
import { cdnUrl, itemImageKey } from '@/types/database'
import { useMenuStore } from '@/stores/menu'
import { useScrollCategorySync } from '@/components/menu/useCategorySync'
import { track } from '@/lib/firebase'
import { VegMark, ItemBadge } from '@/components/menu/badges'
import { formatPrice } from '@/lib/utils'
import { getCategoryIcon } from '@/components/menu/categoryIcon'
import type { LayoutProps } from './MercadoLayout'

function CategoryStrip({
  cat, catItems, openItem, registerRef,
}: {
  cat: Category
  catItems: Item[]
  openItem: (i: Item) => void
  registerRef: (el: HTMLElement | null) => void
}) {
  const Icon = getCategoryIcon(cat.icon)
  const [hintVisible, setHintVisible] = useState(true)
  const stripRef = useRef<HTMLDivElement>(null)
  const [inView, setInView] = useState(false)

  useEffect(() => {
    const el = stripRef.current
    if (!el) return
    const io = new IntersectionObserver(([entry]) => { if (entry.isIntersecting) setInView(true) }, { threshold: 0.2 })
    io.observe(el)
    return () => io.disconnect()
  }, [])

  return (
    <section ref={registerRef} data-cat={cat.id} className="mx-auto max-w-5xl scroll-mt-16 py-6" style={{ borderBottom: '1px solid var(--bdr)' }}>
      {/* Sticky category heading — sticks at top-0 (Bazaar has no inline sticky nav) */}
      <div
        className="sticky z-20 flex items-baseline justify-between px-4 py-3 md:px-8"
        style={{ top: 0, background: 'var(--bg)', borderBottom: '1px solid var(--bdr)' }}
      >
        <div>
          <h2 className="text-3xl font-black uppercase leading-none tracking-tight md:text-4xl" style={{ fontFamily: 'var(--font-display)', color: 'var(--brand)' }}>{cat.name}</h2>
          {cat.description && <p className="mt-1 text-xs" style={{ color: 'var(--txt2)' }}>{cat.description}</p>}
        </div>
        <span className="shrink-0 text-xs uppercase tracking-widest" style={{ color: 'var(--txt3)' }}>{catItems.length}</span>
      </div>

      <div className="relative">
        {hintVisible && catItems.length > 2 && (
          <div className="pointer-events-none absolute right-3 top-1/2 z-10 -translate-y-1/2 rounded-full px-3 py-1 text-xs font-semibold uppercase tracking-wide" style={{ background: 'var(--brand)', color: 'var(--bg)' }}>
            swipe →
          </div>
        )}
        <m.div
          ref={stripRef}
          initial={{ x: 60, opacity: 0 }}
          animate={inView ? { x: 0, opacity: 1 } : {}}
          transition={{ duration: 0.5, ease: [0.25, 0.46, 0.45, 0.94] }}
          onScroll={() => hintVisible && setHintVisible(false)}
          className="flex gap-3 overflow-x-auto px-4 pb-2 md:px-8"
          style={{ scrollSnapType: 'x mandatory' }}
        >
          {catItems.map((item) => {
            const imgUrl = cdnUrl(itemImageKey(item))
            return (
              <button
                key={item.id}
                onClick={() => { openItem(item); track('item_view', { business_id: item.business_id, item_id: item.id }) }}
                className={`relative shrink-0 overflow-hidden rounded-2xl text-left ${imgUrl ? '' : 'p-3 flex flex-col justify-between'}`}
                style={{ 
                  width: imgUrl ? 'clamp(168px, 25vw, 240px)' : 'clamp(200px, 40vw, 280px)',
                  height: 'clamp(168px, 25vw, 240px)', 
                  scrollSnapAlign: 'start', 
                  background: 'var(--sf1)', 
                  opacity: item.is_available ? 1 : 0.5 
                }}
              >
                {imgUrl ? (
                  <>
                    <Image src={imgUrl} alt={item.name} fill className="object-cover" sizes="168px" />
                    <div className="absolute inset-x-0 bottom-0 h-1/2 bg-gradient-to-t from-black/80 to-transparent pointer-events-none" />
                    <div className="absolute inset-x-0 bottom-0 p-2.5">
                      <p className="truncate text-sm font-bold leading-tight text-white" style={{ fontFamily: 'var(--font-display)' }}>{item.name}</p>
                      <div className="mt-1 flex items-center justify-between gap-1">
                        <div className="flex items-center gap-1">
                          <VegMark dietary={item.dietary} size="xs" />
                          {!item.is_available && <span className="rounded-full bg-black/60 px-1.5 py-0.5 text-[9px] font-semibold text-white">Sold out</span>}
                        </div>
                        {item.compare_price && item.compare_price > item.price && <s className="opacity-50 font-normal mr-1.5 text-[0.85em]">{formatPrice(item.compare_price)}</s>}
                        <span className="text-xs font-black" style={{ color: 'var(--brand2, var(--brand))' }}>{formatPrice(item.price)}</span>
                      </div>
                      {item.badge && <div className="mt-1"><ItemBadge badge={item.badge} /></div>}
                    </div>
                  </>
                ) : (
                  <>
                    <Icon size={72} className="absolute -right-4 -bottom-4 opacity-5 pointer-events-none" style={{ color: 'var(--brand)', transform: 'rotate(-10deg)' }} />
                    <div>
                      <div className="flex items-start justify-between gap-2 mb-1">
                        <span className="text-sm font-bold leading-tight" style={{ fontFamily: 'var(--font-display)', color: 'var(--txt)' }}>{item.name}</span>
                        {item.compare_price && item.compare_price > item.price && <s className="opacity-50 font-normal mr-1.5 text-[0.85em]">{formatPrice(item.compare_price)}</s>}
                        <span className="shrink-0 text-sm font-black" style={{ color: 'var(--brand)' }}>{formatPrice(item.price)}</span>
                      </div>
                      {item.description && <p className="text-[11px] leading-snug line-clamp-3" style={{ color: 'var(--txt2)' }}>{item.description}</p>}
                    </div>
                    <div className="mt-2 flex flex-wrap items-center gap-1.5 relative z-10">
                      <VegMark dietary={item.dietary} size="xs" />
                      {item.badge && <ItemBadge badge={item.badge} />}
                      {!item.is_available && <span className="rounded-full px-1.5 py-0.5 text-[9px] font-semibold uppercase" style={{ background: 'var(--bdr)', color: 'var(--txt3)' }}>Sold out</span>}
                    </div>
                  </>
                )}
              </button>
            )
          })}
        </m.div>
      </div>
    </section>
  )
}

export function BazaarLayout({ categories, items, businessId: _businessId }: LayoutProps) {
  const openItem = useMenuStore((s) => s.openItem)
  const { register } = useScrollCategorySync(categories)
  return (
    <div style={{ background: 'var(--bg)', color: 'var(--txt)' }}>
      {categories.map((cat) => (
        <CategoryStrip
          key={cat.id}
          cat={cat}
          catItems={items.filter((i) => i.category_id === cat.id)}
          openItem={openItem}
          registerRef={register(cat.id)}
        />
      ))}
    </div>
  )
}
