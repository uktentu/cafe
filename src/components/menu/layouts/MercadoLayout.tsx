'use client'

// MercadoLayout — Bold street food, dark + red
// Sticky pill nav → full-width band heading per category → dense 2/3-col grid.
// Square cards: image fills, name + price over a dark gradient. Diagonal reveals.

import { useEffect, useRef } from 'react'
import Image from 'next/image'
import { m } from 'framer-motion'
import type { Category, Item } from '@/types/database'
import { cdnUrl, itemImageKey } from '@/types/database'
import { useMenuStore } from '@/stores/menu'
import { useScrollCategorySync } from '@/components/menu/useCategorySync'
import { zoomPop, staggerContainer } from '@/components/menu/scrollVariants'
import { track } from '@/lib/firebase'
import { VegMark, ItemBadge } from '@/components/menu/badges'
import { formatPrice } from '@/lib/utils'
import { getCategoryIcon } from '@/components/menu/categoryIcon'

const MERCADO_STYLES = `
  @keyframes diag-shift {
    0%   { background-position: 0 0; }
    100% { background-position: 40px 40px; }
  }
  @keyframes spray-reveal {
    from { clip-path: inset(0 100% 0 0); }
    to   { clip-path: inset(0 0% 0 0); }
  }
  .mercado-cat-heading { animation: spray-reveal 0.55s cubic-bezier(0.34,1.2,0.64,1) both; }
`

export interface LayoutProps {
  categories: Category[]
  items: Item[]
  businessId: string
}

export function MercadoLayout({ categories, items, businessId: _businessId }: LayoutProps) {
  const openItem = useMenuStore((s) => s.openItem)
  const requestJump = useMenuStore((s) => s.requestJump)
  const { activeId, register } = useScrollCategorySync(categories)

  const containerRef = useRef<HTMLDivElement>(null)
  const navRef = useRef<HTMLElement>(null)

  useEffect(() => {
    const nav = navRef.current
    const container = containerRef.current
    if (!nav || !container) return
    const ro = new ResizeObserver(() => {
      container.style.setProperty('--inner-nav-h', `${nav.offsetHeight}px`)
    })
    ro.observe(nav)
    return () => ro.disconnect()
  }, [])

  return (
    <div ref={containerRef} className="relative" style={{ background: 'var(--bg)', color: 'var(--txt)' }}>
      <style dangerouslySetInnerHTML={{ __html: MERCADO_STYLES }} />
      {/* Subtle diagonal stripe overlay */}
      <div className="pointer-events-none fixed inset-0 z-0" style={{
        backgroundImage: 'repeating-linear-gradient(45deg, var(--brand) 0px, var(--brand) 1px, transparent 1px, transparent 20px)',
        opacity: 0.025,
        animation: 'diag-shift 4s linear infinite',
      }} />
      {/* Sticky pill nav */}
      <nav
        ref={navRef}
        className="sticky top-[var(--menu-tabs-offset,0px)] z-30 overflow-x-auto px-4 py-3 lg:px-8"
        style={{ background: 'var(--glass)', backdropFilter: 'blur(14px)', borderBottom: '1px solid var(--bdr)' }}
      >
        <div className="flex gap-2 lg:mx-auto lg:max-w-5xl">
        {categories.map((cat) => {
          const active = activeId === cat.id
          return (
            <button id={`nav-btn-${cat.id}`}
              key={cat.id}
              onClick={() => requestJump(cat.id)}
              className="relative shrink-0 rounded-full px-4 py-1.5 text-sm font-semibold uppercase tracking-wide transition-colors md:px-5 md:py-2"
              style={{ color: active ? 'var(--bg)' : 'var(--txt2)', fontFamily: 'var(--font-body)', border: active ? 'none' : '1px solid var(--bdr2)' }}
            >
              {active && (
                <m.span layoutId="mercado-pill" className="absolute inset-0 rounded-full" style={{ background: 'var(--brand)' }} transition={{ type: 'spring', stiffness: 420, damping: 36 }} />
              )}
              <span className="relative z-10">{cat.name}</span>
            </button>
          )
        })}
        </div>
      </nav>

      <div className="mx-auto max-w-5xl">
        {categories.map((cat, catIdx) => {
          const catItems = items.filter((i) => i.category_id === cat.id)
          const Icon = getCategoryIcon(cat.icon)
          return (
            <section key={cat.id} data-cat={cat.id} ref={register(cat.id)} className="scroll-mt-16">
              {/* Sticky band heading — sits just below the pill nav */}
              <div
                key={cat.id}
                className="sticky z-20 px-4 py-3 md:px-8 md:py-4"
                style={{ top: 'calc(var(--inner-nav-h, 52px) + var(--menu-tabs-offset, 0px))', background: 'var(--sf1)', borderBottom: '1px solid var(--bdr)', borderLeft: '4px solid var(--brand)' }}
              >
                <h2
                  className="mercado-cat-heading font-black uppercase tracking-widest"
                  style={{ fontFamily: 'var(--font-display)', color: 'var(--brand)', fontSize: 'clamp(1.25rem, 4vw, 2rem)' }}
                >
                  {cat.name}
                </h2>
                {cat.description && <p className="mt-0.5 text-xs" style={{ color: 'var(--txt2)' }}>{cat.description}</p>}
              </div>

              {/* 1px gap on mobile, 2px on lg+ for denser street-food wall feel */}
              <m.div 
                className="grid grid-cols-2 [gap:1px] lg:[gap:2px] min-[480px]:grid-cols-3 md:grid-cols-3 lg:grid-cols-4" 
                style={{ background: 'var(--bdr)' }}
                variants={staggerContainer}
                initial="hidden"
                whileInView="show"
                viewport={{ once: true, margin: '-20px' }}
              >
                {catItems.map((item, idx) => {
                  const isPriority = catIdx === 0 && idx < 4
                  const imgUrl = cdnUrl(itemImageKey(item))
                  return (
                    <m.button
                      key={item.id}
                      custom={idx}
                      variants={zoomPop}
                      whileTap={{ scale: 0.94 }}
                      whileHover={{ scale: 1.05, y: -10, rotate: (idx % 2 === 0 ? 3 : -3), zIndex: 20, boxShadow: '0 20px 40px rgba(0,0,0,0.5)' }}
                      onClick={() => { openItem(item); track('item_view', { business_id: item.business_id, item_id: item.id }) }}
                      className="relative overflow-hidden text-left aspect-square"
                      style={{ background: imgUrl ? 'var(--sf2)' : 'var(--glass)', opacity: item.is_available ? 1 : 0.5, borderRadius: imgUrl ? 0 : 24 }}
                    >
                        {imgUrl ? (
                        <>
                          <Image src={imgUrl} alt={item.name} fill loading={isPriority ? "eager" : "lazy"} fetchPriority={isPriority ? "high" : "auto"} className="object-cover transition-transform duration-500 hover:scale-105" sizes="(max-width:768px) 50vw, (max-width:1024px) 33vw, 25vw" />
                          <div className="absolute inset-x-0 bottom-0 h-2/3 bg-gradient-to-t from-black/85 to-transparent pointer-events-none" />

                          {/* Sold-out diagonal stripe overlay */}
                          {!item.is_available && (
                            <div
                              className="absolute inset-0 z-10"
                              style={{
                                background: 'repeating-linear-gradient(45deg, rgba(0,0,0,0.55) 0px, rgba(0,0,0,0.55) 2px, transparent 2px, transparent 10px)',
                              }}
                            >
                              <div className="absolute inset-0 flex items-center justify-center">
                                <span className="px-2 py-0.5 text-[10px] font-black uppercase tracking-widest text-white" style={{ background: 'rgba(0,0,0,0.7)', border: '1px solid rgba(255,255,255,0.25)' }}>Out</span>
                              </div>
                            </div>
                          )}

                          {/* Top-Left Badges */}
                          <div className="absolute left-2 top-2 flex flex-col gap-1.5 items-start z-10">
                            <VegMark dietary={item.dietary} size="sm" />
                            {item.badge && <ItemBadge badge={item.badge} />}
                          </div>

                          {/* Bottom: Name left, sharp-badge price right */}
                          <div className="absolute inset-x-0 bottom-0 p-3 flex items-end justify-between gap-3">
                            <div className="flex-1 min-w-0 flex flex-col justify-end">
                              <span className="truncate text-[15px] font-black text-white leading-tight" style={{ fontFamily: 'var(--font-display)' }}>{item.name}</span>
                              {item.description && <span className="line-clamp-2 text-[10px] font-medium text-white/80 mt-0.5 leading-snug">{item.description}</span>}
                            </div>
                            <div className="shrink-0 flex flex-col items-end justify-end">
                              {item.compare_price && item.compare_price > item.price && <s className="text-white/60 font-medium text-[11px] mb-0.5">{formatPrice(item.compare_price)}</s>}
                              {/* Sharp angled badge instead of rounded pill */}
                              <div
                                className="px-2.5 py-1 text-sm font-black shadow-lg"
                                style={{
                                  background: 'var(--brand)',
                                  color: 'var(--bg)',
                                  fontFamily: 'var(--font-display)',
                                  clipPath: 'polygon(6px 0%, 100% 0%, calc(100% - 6px) 100%, 0% 100%)',
                                }}
                              >
                                {formatPrice(item.price)}
                              </div>
                            </div>
                          </div>
                        </>
                      ) : (
                        <div className="flex h-full flex-col w-full relative justify-between p-4 shadow-lg" style={{ background: 'var(--sf1)' }}>
                          {/* Watermark icon — rotated, large, low opacity */}
                          <Icon size={96} className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 pointer-events-none -rotate-[8deg]" style={{ color: 'var(--brand)', opacity: 0.06 }} />
                          
                          {/* Top Row: Name */}
                          <div className="w-full relative z-10">
                            <span className="text-[15px] font-black leading-tight text-left block" style={{ fontFamily: 'var(--font-display)', color: 'var(--txt)' }}>{item.name}</span>
                          </div>
                          
                          {/* Middle: Description */}
                          {item.description && <p className="text-[11px] font-medium leading-snug line-clamp-3 text-left mt-2 relative z-10" style={{ color: 'var(--txt2)' }}>{item.description}</p>}

                          {/* Bottom Row: Badges (Left), Price (Right) */}
                          <div className="flex items-end justify-between w-full mt-auto relative z-10 pt-4 gap-2">
                            <div className="flex flex-wrap items-center gap-1.5 pb-1">
                              <VegMark dietary={item.dietary} size="sm" />
                              {item.badge && <ItemBadge badge={item.badge} />}
                              {!item.is_available && <span className="rounded bg-[var(--bdr)] px-1.5 py-0.5 text-[9px] font-black uppercase text-[var(--txt3)]">Out</span>}
                            </div>
                            <div className="shrink-0 flex flex-col items-end justify-end">
                              {item.compare_price && item.compare_price > item.price && <s className="opacity-50 font-medium text-[11px] mb-0.5">{formatPrice(item.compare_price)}</s>}
                              <div
                                className="px-2.5 py-1 text-sm font-black shadow-md"
                                style={{
                                  background: 'var(--txt)',
                                  color: 'var(--bg)',
                                  fontFamily: 'var(--font-display)',
                                  clipPath: 'polygon(6px 0%, 100% 0%, calc(100% - 6px) 100%, 0% 100%)',
                                }}
                              >
                                {formatPrice(item.price)}
                              </div>
                            </div>
                          </div>
                        </div>
                      )}
                    </m.button>
                  )
                })}
              </m.div>
            </section>
          )
        })}
      </div>
    </div>
  )
}
