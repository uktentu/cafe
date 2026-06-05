'use client'

// TerrainLayout — Contemporary European bistro, linen
// Nav paradigm: ACCORDION sections — tap a category header to expand it.
// Only ONE open at a time. Scrollable breadcrumb nav at top syncs state.

import { useState } from 'react'
import Image from 'next/image'
import { m, AnimatePresence } from 'framer-motion'
import { cdnUrl, itemImageKey } from '@/types/database'
import { useMenuStore } from '@/stores/menu'
import { track } from '@/lib/firebase'
import { VegMark, ItemBadge } from '@/components/menu/badges'
import { formatPrice } from '@/lib/utils'
import { getCategoryIcon } from '@/components/menu/categoryIcon'
import { alternateSide } from '@/components/menu/scrollVariants'
import type { LayoutProps } from './MercadoLayout'

const TERRAIN_STYLES = `
  @keyframes herb-drift {
    0%,100% { transform: translateY(0) rotate(0deg); opacity: 0.06; }
    33%      { transform: translateY(-18px) rotate(8deg); opacity: 0.09; }
    66%      { transform: translateY(8px) rotate(-5deg); opacity: 0.05; }
  }
  @keyframes chalk-reveal {
    from { clip-path: inset(0 100% 0 0); }
    to   { clip-path: inset(0 0% 0 0); }
  }
  .terrain-heading { animation: chalk-reveal 0.55s cubic-bezier(0.34,1.3,0.64,1) both; }
`

function HerbWatermarks() {
  const herbs = ['🌿', '🌾', '🍃', '🍀']
  return (
    <div className="pointer-events-none fixed inset-0 z-0 overflow-hidden">
      <style>{TERRAIN_STYLES}</style>
      {[{ top: '5%', left: '2%', size: 120 }, { top: '15%', right: '3%', size: 100 }, { bottom: '10%', left: '5%', size: 90 }, { bottom: '20%', right: '2%', size: 110 }].map((pos, i) => (
        <div
          key={i}
          style={{
            position: 'absolute',
            ...pos,
            fontSize: pos.size,
            lineHeight: 1,
            opacity: 0.06, // Base opacity to prevent high-contrast flash before animation starts
            animationName: 'herb-drift',
            animationDuration: `${14 + i * 4}s`,
            animationDelay: `${i * 3}s`,
            animationTimingFunction: 'ease-in-out',
            animationIterationCount: 'infinite',
            animationFillMode: 'both',
          }}
        >
          {herbs[i]}
        </div>
      ))}
    </div>
  )
}

export function TerrainLayout({ categories, items, businessId: _businessId }: LayoutProps) {
  const openItem = useMenuStore((s) => s.openItem)
  const [openId, setOpenId] = useState<string>(categories[0]?.id ?? '')

  const toggle = (id: string) => setOpenId((prev) => (prev === id ? '' : id))

  return (
    <div className="relative" style={{ background: 'var(--bg)', color: 'var(--txt)' }}>
      <HerbWatermarks />
      {/* Linen texture overlay */}
      <div 
        className="pointer-events-none fixed inset-0 z-0 opacity-10 mix-blend-multiply" 
        style={{ backgroundImage: 'url("data:image/svg+xml,%3Csvg viewBox=%220 0 200 200%22 xmlns=%22http://www.w3.org/2000/svg%22%3E%3Cfilter id=%22noiseFilter%22%3E%3CfeTurbulence type=%22fractalNoise%22 baseFrequency=%220.85%22 numOctaves=%223%22 stitchTiles=%22stitch%22/%3E%3C/filter%3E%3Crect width=%22100%25%22 height=%22100%25%22 filter=%22url(%23noiseFilter)%22/%3E%3C/svg%3E")' }}
      />
      {/* Scrollable breadcrumb nav */}
      <div
        className="sticky top-0 z-30 px-5 py-2.5"
        style={{ background: 'var(--glass)', backdropFilter: 'blur(12px)', borderBottom: '1px solid var(--bdr)' }}
      >
        <nav className="flex gap-x-2 overflow-x-auto text-xs uppercase tracking-widest">
          {categories.map((cat, idx) => (
            <span key={cat.id} className="flex shrink-0 items-center gap-2">
              {/* Vertical rule separator — more controlled than middle-dot character */}
              {idx > 0 && <span className="inline-block w-px h-3 opacity-30" style={{ background: 'var(--bdr2)' }} />}
              <button id={`nav-btn-${cat.id}`}
                onClick={() => toggle(cat.id)}
                className="transition-colors"
                style={{
                  color: openId === cat.id ? 'var(--brand)' : 'var(--txt2)',
                  fontFamily: 'var(--font-body)',
                  fontWeight: openId === cat.id ? 700 : 400,
                }}
              >
                {cat.name}
              </button>
            </span>
          ))}
        </nav>
      </div>

      {/* Accordion sections */}
      <div className="divide-y" style={{ borderColor: 'var(--bdr)' }}>
        {categories.map((cat) => {
          const catItems = items.filter((i) => i.category_id === cat.id)
          const Icon = getCategoryIcon(cat.icon)
          const isOpen = openId === cat.id

          return (
            <div key={cat.id}>
              {/* Accordion header — sticky below the breadcrumb nav (~44px) when open */}
              <button id={`nav-btn-${cat.id}`}
                onClick={() => toggle(cat.id)}
                className="flex w-full items-center justify-between gap-3 px-5 py-4 text-left md:px-8 md:py-5"
                style={{
                  position: isOpen ? 'sticky' : 'relative',
                  top: isOpen ? 44 : undefined,
                  zIndex: isOpen ? 20 : undefined,
                  background: isOpen ? 'var(--sf1)' : 'var(--bg)',
                  borderLeft: isOpen ? '3px solid var(--brand)' : '3px solid transparent',
                  borderBottom: isOpen ? '1px solid var(--bdr)' : undefined,
                  transition: 'background 0.2s, border-color 0.2s',
                }}
              >
                <div className="min-w-0">
                  <h2
                    key={cat.id + isOpen}
                    className={`text-base font-semibold uppercase tracking-[0.18em] md:text-lg ${isOpen ? 'terrain-heading' : ''}`}
                    style={{ fontFamily: 'var(--font-display)', color: isOpen ? 'var(--brand)' : 'var(--txt)' }}
                  >
                    {cat.name}
                  </h2>
                  {cat.description && (
                    <p className="mt-0.5 text-xs leading-relaxed" style={{ color: 'var(--txt2)' }}>{cat.description}</p>
                  )}
                </div>
                <div className="flex shrink-0 items-center gap-2">
                  <span className="text-xs tabular-nums" style={{ color: 'var(--txt3)' }}>{catItems.length}</span>
                  <m.span
                    animate={{ rotate: isOpen ? 180 : 0 }}
                    transition={{ duration: 0.25 }}
                    className="block text-xs"
                    style={{ color: 'var(--brand)' }}
                  >
                    ▾
                  </m.span>
                </div>
              </button>

              {/* Accordion body with height animation — overflow:hidden on both parent and child */}
              <AnimatePresence initial={false}>
                {isOpen && (
                  <m.div
                    key="body"
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ type: 'spring', stiffness: 220, damping: 26 }}
                    style={{ overflow: 'hidden' }}
                  >
                    <div style={{ overflow: 'hidden' }}>
                    <div className="sm:grid sm:grid-cols-2 md:grid md:grid-cols-2 md:gap-4 md:px-4 md:py-4 lg:grid-cols-3 lg:gap-5 lg:px-6">
                      {catItems.map((item, idx) => {
                        const imgUrl = cdnUrl(itemImageKey(item))
                        return (
                          <m.button
                            key={item.id}
                            custom={idx}
                            variants={alternateSide(idx)}
                            initial="hidden"
                            animate="show"
                            whileTap={{ scale: 0.99 }}
                            whileHover={{ y: -3, boxShadow: '0 8px 30px rgba(0,0,0,0.12)' }}
                            onClick={() => { openItem(item); track('item_view', { business_id: item.business_id, item_id: item.id }) }}
                            className={`flex w-full items-center text-left ${imgUrl ? 'gap-4 px-5 py-4 md:rounded-lg md:px-4' : 'flex-col gap-2 p-6 md:rounded-lg justify-center border-l-4'}`}
                            style={{ borderBottom: '1px solid var(--bdr)', opacity: item.is_available ? 1 : 0.5, borderLeftColor: imgUrl ? 'transparent' : 'var(--brand)', background: imgUrl ? 'transparent' : 'var(--sf1)' }}
                          >
                            {imgUrl ? (
                              <>
                                <div className="relative h-20 w-20 shrink-0 overflow-hidden rounded md:h-24 md:w-24" style={{ background: 'var(--sf2)' }}>
                                  <Image src={imgUrl} alt={item.name} fill className="object-cover" sizes="(max-width:768px) 80px, 96px" />
                                </div>
                                <div className="min-w-0 flex-1">
                                  <div className="flex items-baseline justify-between gap-2">
                                    <span className="truncate text-sm font-semibold flex items-center gap-1.5" style={{ fontFamily: 'var(--font-display)', color: 'var(--txt)' }}>
                                      {item.name}
                                    </span>
                                    <div className="flex flex-col items-end shrink-0 gap-0.5 mt-1">
                                      {item.compare_price && item.compare_price > item.price && <s className="opacity-50 font-normal text-[10px] leading-none">{formatPrice(item.compare_price)}</s>}
                                      <span className="text-sm font-medium leading-none" style={{ color: 'var(--brand)', fontFamily: 'var(--font-body)' }}>{formatPrice(item.price)}</span>
                                    </div>
                                  </div>
                                  {item.description && (
                                    <p className="mt-1 text-xs leading-relaxed line-clamp-2" style={{ color: 'var(--txt2)' }}>{item.description}</p>
                                  )}
                                  <div className="mt-1.5 flex items-center gap-2">
                                    <VegMark dietary={item.dietary} size="xs" />
                                    {item.badge && <ItemBadge badge={item.badge} />}
                                    {!item.is_available && <span className="text-[10px] uppercase tracking-wide" style={{ color: 'var(--txt3)' }}>Out</span>}
                                  </div>
                                </div>
                              </>
                            ) : (
                              <div className="flex w-full gap-4 items-center">
                                <div className="min-w-0 flex-1">
                                  <div className="flex items-baseline justify-between gap-2">
                                    <span className="truncate text-base font-bold flex items-center gap-2" style={{ fontFamily: 'var(--font-display)', color: 'var(--txt)' }}>
                                      <Icon size={16} style={{ color: 'var(--brand)' }} />
                                      {item.name}
                                    </span>
                                    <div className="flex flex-col items-end shrink-0 gap-0.5 mt-1">
                                      {item.compare_price && item.compare_price > item.price && <s className="opacity-50 font-normal text-[10px] leading-none">{formatPrice(item.compare_price)}</s>}
                                      <span className="text-sm font-bold leading-none" style={{ color: 'var(--brand)', fontFamily: 'var(--font-body)' }}>{formatPrice(item.price)}</span>
                                    </div>
                                  </div>
                                  {item.description && (
                                    <p className="mt-1 text-sm leading-relaxed" style={{ color: 'var(--txt2)' }}>{item.description}</p>
                                  )}
                                  <div className="mt-2 flex items-center gap-2">
                                    <VegMark dietary={item.dietary} size="xs" />
                                    {item.badge && <ItemBadge badge={item.badge} />}
                                    {!item.is_available && <span className="text-[10px] uppercase tracking-wide" style={{ color: 'var(--txt3)' }}>Out</span>}
                                  </div>
                                </div>
                              </div>
                            )}
                          </m.button>
                        )
                      })}
                      {catItems.length === 0 && (
                        <p className="px-5 py-8 text-sm" style={{ color: 'var(--txt3)' }}>No items in this category.</p>
                      )}
                    </div>
                    </div>
                  </m.div>
                )}
              </AnimatePresence>
            </div>
          )
        })}
      </div>
    </div>
  )
}
