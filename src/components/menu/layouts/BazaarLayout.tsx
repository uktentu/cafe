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

const BAZAAR_STYLES = `
  @keyframes geo-pulse {
    0%,100% { opacity: 0.04; }
    50%      { opacity: 0.07; }
  }
  @keyframes ink-underline {
    from { transform: scaleX(0); transform-origin: left; }
    to   { transform: scaleX(1); transform-origin: left; }
  }
  .bazaar-underline { animation: ink-underline 0.5s cubic-bezier(0.34,1.3,0.64,1) both; }
`

function BazaarBackground() {
  return (
    <div className="pointer-events-none fixed inset-0 z-0" style={{
      backgroundImage: [
        'repeating-linear-gradient(60deg, var(--brand) 0, var(--brand) 1px, transparent 1px, transparent 30px)',
        'repeating-linear-gradient(-60deg, var(--brand) 0, var(--brand) 1px, transparent 1px, transparent 30px)',
      ].join(','),
      animation: 'geo-pulse 8s ease-in-out infinite',
    }}>
      <style dangerouslySetInnerHTML={{ __html: BAZAAR_STYLES }} />
    </div>
  )
}

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

  // Auto-hide swipe hint after 3s on desktop
  useEffect(() => {
    const timer = setTimeout(() => setHintVisible(false), 3000)
    return () => clearTimeout(timer)
  }, [])

  return (
    <section ref={registerRef} data-cat={cat.id} className="mx-auto max-w-5xl scroll-mt-16 py-6" style={{ borderBottom: '1px solid var(--bdr)' }}>
      {/* Sticky category heading — sticks at top-0 (Bazaar has no inline sticky nav) */}
      <div
        className="sticky z-20 flex items-baseline justify-between px-4 py-3 md:px-8"
        style={{ top: 'var(--menu-tabs-offset, 0px)', background: 'var(--bg)', borderBottom: '1px solid var(--bdr)' }}
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
      <div
          ref={stripRef}
          onMouseMove={(e) => {
            const rect = e.currentTarget.getBoundingClientRect()
            e.currentTarget.style.setProperty('--mx', `${e.clientX - rect.left}px`)
            e.currentTarget.style.setProperty('--my', `${e.clientY - rect.top}px`)
          }}
          className="flex gap-4 overflow-x-auto px-4 pb-8 pt-4 md:px-8"
          style={{ scrollSnapType: 'x mandatory', clipPath: 'inset(-40px 0px -40px 0px)' }}
        >
          {catItems.map((item, idx) => {
            const imgUrl = cdnUrl(itemImageKey(item))
            return (
              <m.button
                key={item.id}
                initial={{ opacity: 0, x: 60, scale: 0.9 }}
                whileInView={{ opacity: 1, x: 0, scale: 1 }}
                viewport={{ once: true }}
                transition={{ type: 'spring', stiffness: 280, damping: 20 }}
                onMouseMove={(e) => {
                  const rect = e.currentTarget.getBoundingClientRect()
                  const x = (e.clientX - rect.left - rect.width / 2) / rect.width
                  const y = (e.clientY - rect.top - rect.height / 2) / rect.height
                  e.currentTarget.style.transform = `perspective(600px) rotateX(${-y * 18}deg) rotateY(${x * 18}deg) scale(1.06)`
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = ''
                }}
                whileTap={{ scale: 0.95, y: 0 }}
                onClick={() => { openItem(item); track('item_view', { business_id: item.business_id, item_id: item.id }) }}
                className={`relative shrink-0 overflow-hidden rounded-2xl text-left transition-shadow ${imgUrl ? '' : 'p-4 flex flex-col justify-between'}`}
                style={{
                  width: 'clamp(180px, 28vw, 260px)',
                  height: 'clamp(180px, 28vw, 260px)',
                  scrollSnapAlign: 'start',
                  background: 'var(--sf1)',
                  opacity: item.is_available ? 1 : 0.5,
                  transformOrigin: 'bottom center',
                  boxShadow: '0 4px 15px -3px rgba(0,0,0,0.1)'
                }}
              >
                {imgUrl ? (
                  <>
                    <Image src={imgUrl} alt={item.name} fill className="object-cover" sizes="168px" loading={idx < 4 ? "eager" : "lazy"} fetchPriority={idx < 4 ? "high" : "auto"} unoptimized={idx < 4} />
                    <div className="absolute inset-x-0 bottom-0 h-1/2 bg-gradient-to-t from-black/80 to-transparent pointer-events-none" />
                    <div className="absolute inset-x-0 bottom-0 p-2.5">
                      <p className="truncate text-sm font-bold leading-tight text-white" style={{ fontFamily: 'var(--font-display)' }}>{item.name}</p>
                      <div className="mt-1 flex items-end justify-between gap-1">
                        <div className="flex flex-wrap items-center gap-1 pb-0.5">
                          <VegMark dietary={item.dietary} size="xs" />
                          {item.badge && <ItemBadge badge={item.badge} />}
                          {!item.is_available && <span className="rounded-full bg-black/60 px-1.5 py-0.5 text-[9px] font-semibold text-white">Out</span>}
                        </div>
                        <div className="flex flex-col items-end gap-0.5 shrink-0">
                          {item.compare_price && item.compare_price > item.price && <s className="text-white/60 font-normal text-[10px] leading-none">{formatPrice(item.compare_price)}</s>}
                          <span className="text-xs font-black leading-none" style={{ color: 'var(--brand2, var(--brand))' }}>{formatPrice(item.price)}</span>
                        </div>
                      </div>
                    </div>
                  </>
                ) : (
                  <>
                    <Icon size={72} className="absolute -right-4 -bottom-4 opacity-5 pointer-events-none" style={{ color: 'var(--brand)', transform: 'rotate(-10deg)' }} />
                    <div>
                      <div className="flex items-start justify-between gap-2 mb-1 w-full">
                        <span className="text-sm font-bold leading-tight flex-1 min-w-0" style={{ fontFamily: 'var(--font-display)', color: 'var(--txt)' }}>{item.name}</span>
                      </div>
                      {item.description && <p className="text-[11px] leading-snug line-clamp-2" style={{ color: 'var(--txt2)' }}>{item.description}</p>}
                    </div>
                    <div className="mt-2 flex items-end justify-between relative z-10 gap-2">
                      <div className="flex flex-wrap items-center gap-1.5 pb-0.5">
                        <VegMark dietary={item.dietary} size="xs" />
                        {item.badge && <ItemBadge badge={item.badge} />}
                        {!item.is_available && <span className="rounded-full px-1.5 py-0.5 text-[9px] font-semibold uppercase" style={{ background: 'var(--bdr)', color: 'var(--txt3)' }}>Out</span>}
                      </div>
                      <div className="flex flex-col items-end gap-0.5 shrink-0 mt-auto">
                        {item.compare_price && item.compare_price > item.price && <s className="opacity-50 font-normal text-[10px] leading-none">{formatPrice(item.compare_price)}</s>}
                        <span className="text-sm font-black leading-none" style={{ color: 'var(--brand)' }}>{formatPrice(item.price)}</span>
                      </div>
                    </div>
                  </>
                )}
              </m.button>
            )
          })}
        </div>
      </div>
    </section>
  )
}

export function BazaarLayout({ categories, items, businessId: _businessId }: LayoutProps) {
  const openItem = useMenuStore((s) => s.openItem)
  const { register } = useScrollCategorySync(categories)
  return (
    <div className="relative" style={{ background: 'var(--bg)', color: 'var(--txt)' }}>
      <BazaarBackground />
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
