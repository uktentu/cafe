'use client'

// OnyxLayout — Dark Parisian fine dining ✦ GOLD PRESS EDITION
// Golden metallic scanline sweeping vertically. Price text has animated gold shimmer.
// Sidebar category switch triggers spring stamp-pulse. Dot-leaders animate on hover.

import { useEffect, useRef } from 'react'
import { m } from 'framer-motion'
import type { Item } from '@/types/database'
import { useMenuStore } from '@/stores/menu'
import { useScrollCategorySync } from '@/components/menu/useCategorySync'
import { blurRise, staggerContainer, letterDrop } from '@/components/menu/scrollVariants'
import { track } from '@/lib/firebase'
import { VegMark, ItemBadge } from '@/components/menu/badges'
import { formatPrice } from '@/lib/utils'
import type { LayoutProps } from './MercadoLayout'

const ONYX_STYLES = `
  @keyframes gold-scanline {
    0%   { transform: translateY(-100%); opacity: 0; }
    10%  { opacity: 0.15; }
    90%  { opacity: 0.15; }
    100% { transform: translateY(100vh); opacity: 0; }
  }
  @keyframes gold-shimmer {
    0%   { background-position: -300% center; }
    100% { background-position: 300% center; }
  }
  @keyframes leader-expand {
    from { letter-spacing: 0.1em; }
    to   { letter-spacing: 0.35em; }
  }
  .onyx-price {
    background: linear-gradient(90deg, var(--brand), #f4d03f 35%, var(--brand2, #d4af37) 50%, #f4d03f 65%, var(--brand));
    background-size: 300% auto;
    -webkit-background-clip: text;
    background-clip: text;
    color: transparent;
    animation: gold-shimmer 4s linear infinite;
  }
  .onyx-row:hover .onyx-leader { animation: leader-expand 0.3s ease-out forwards; }
`

function GoldScanline() {
  return (
    <div className="pointer-events-none fixed inset-0 z-[1] overflow-hidden">
      <style dangerouslySetInnerHTML={{ __html: ONYX_STYLES }} />
      <div
        style={{
          position: 'absolute',
          left: 0, right: 0,
          height: 3,
          background: 'linear-gradient(90deg, transparent, var(--brand), #f4d03f, var(--brand), transparent)',
          animation: 'gold-scanline 8s ease-in-out infinite',
          boxShadow: '0 0 24px 8px rgba(212,175,55,0.3)',
        }}
      />
    </div>
  )
}

function DotRow({ item, idx, openItem }: { item: Item; idx: number; openItem: (i: Item) => void }) {
  return (
    <m.button
      custom={idx}
      variants={blurRise}
      initial="hidden"
      whileInView="show"
      viewport={{ once: true, margin: '-30px' }}
      onClick={() => { openItem(item); track('item_view', { business_id: item.business_id, item_id: item.id }) }}
      whileHover={{ x: 10, transition: { type: 'spring', stiffness: 400 } }}
      className="onyx-row group flex w-full flex-col py-4 text-left md:py-5"
      style={{ borderBottom: '1px solid var(--bdr)', opacity: item.is_available ? 1 : 0.5 }}
    >
      <div className="flex w-full items-baseline gap-2">
        <VegMark dietary={item.dietary} className="self-center" />
        <span
          className="shrink-0 text-sm font-medium transition-colors duration-300 group-hover:text-[color:var(--brand)]"
          style={{ fontFamily: 'var(--font-display)', color: 'var(--txt)' }}
        >
          {item.name}
        </span>
        {item.badge && <ItemBadge badge={item.badge} className="self-center" />}
        {!item.is_available && <span className="self-center text-[10px] uppercase" style={{ color: 'var(--txt3)' }}>Out</span>}
        <span
          aria-hidden
          className="onyx-leader min-w-6 flex-1 self-end pb-1 transition-all duration-300"
          style={{
            backgroundImage: 'radial-gradient(circle, var(--brand) 1px, transparent 1px)',
            backgroundSize: '6px 4px',
            backgroundRepeat: 'repeat-x',
            backgroundPosition: 'bottom 3px center',
            height: '12px',
            display: 'inline-block',
            opacity: 0.4,
          }}
        />
        <span className="onyx-price shrink-0 text-sm font-semibold tabular-nums flex flex-col items-end gap-0.5 mt-0.5">
          {item.compare_price && item.compare_price > item.price && (
            <s className="opacity-40 font-normal text-[10px] leading-none" style={{ WebkitTextFillColor: 'var(--txt3)', color: 'var(--txt3)' }}>
              {formatPrice(item.compare_price)}
            </s>
          )}
          <span className="leading-none">{formatPrice(item.price)}</span>
        </span>
      </div>
      {item.description && (
        <div className="mt-1.5 pl-6 pr-12 text-xs italic leading-relaxed" style={{ color: 'var(--txt2)', fontFamily: 'var(--font-display)' }}>
          {item.description}
        </div>
      )}
    </m.button>
  )
}

export function OnyxLayout({ categories, items, businessId: _businessId }: LayoutProps) {
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
    <div ref={containerRef} className="relative flex flex-col md:flex-row min-h-screen" style={{ background: 'var(--bg)', color: 'var(--txt)' }}>
      <GoldScanline />

      {/* Fixed left sidebar (md+) */}
      <aside
        className="hidden md:flex md:flex-col"
        style={{ width: 220, position: 'fixed', top: 0, left: 0, bottom: 0, borderRight: '1px solid var(--bdr)', background: 'var(--sf1)', zIndex: 20, padding: '4rem 1.5rem 2rem' }}
      >
        <p className="mb-6 text-[10px] uppercase tracking-[0.4em]" style={{ color: 'var(--brand)' }}>La Carte</p>
        <nav className="flex flex-col gap-1 flex-grow">
          {categories.map((cat) => {
            const active = activeId === cat.id
            return (
              <m.button id={`nav-btn-${cat.id}`}
                key={cat.id}
                onClick={() => requestJump(cat.id)}
                animate={active ? { scale: [1, 1.06, 1] } : { scale: 1 }}
                transition={{ type: 'spring', stiffness: 500, damping: 18 }}
                className="relative flex items-center gap-2 rounded px-2 py-2 text-left text-xs uppercase tracking-widest transition-colors"
                style={{ fontFamily: 'var(--font-body)', color: active ? 'var(--brand)' : 'var(--txt2)', fontWeight: active ? 700 : 400 }}
              >
                {active && (
                  <m.span
                    layoutId="onyx-sidebar-indicator"
                    className="absolute left-0 top-0.5 bottom-0.5 w-[2px]"
                    style={{ background: 'linear-gradient(to bottom, var(--brand), var(--brand2, #d4af37))' }}
                    transition={{ type: 'spring', stiffness: 500, damping: 28 }}
                  />
                )}
                <m.span
                  className="h-px shrink-0"
                  animate={{ width: active ? 20 : 8 }}
                  transition={{ type: 'spring', stiffness: 400, damping: 24 }}
                  style={{ background: active ? 'var(--brand)' : 'var(--bdr2)', display: 'inline-block' }}
                />
                {cat.name}
              </m.button>
            )
          })}
        </nav>
        <div className="mt-auto">
          <div className="mb-3 h-px" style={{ background: 'linear-gradient(90deg, var(--brand), transparent)' }} />
          <p className="text-xs italic" style={{ color: 'var(--txt3)', fontFamily: 'var(--font-display)' }}>Fine dining. Fine menu.</p>
        </div>
      </aside>

      {/* Mobile sticky top strip */}
      <nav ref={navRef} className="sticky top-[var(--menu-tabs-offset,0px)] z-30 flex gap-4 overflow-x-auto px-4 py-3 md:hidden" style={{ background: 'var(--glass)', backdropFilter: 'blur(12px)', borderBottom: '1px solid var(--bdr)' }}>
        {categories.map((cat) => (
          <button id={`nav-btn-${cat.id}`}
            key={cat.id}
            onClick={() => requestJump(cat.id)}
            className="shrink-0 text-xs uppercase tracking-widest transition-colors"
            style={{
              fontFamily: 'var(--font-body)',
              color: activeId === cat.id ? 'var(--brand)' : 'var(--txt2)',
              fontWeight: activeId === cat.id ? 700 : 400,
              minHeight: '44px',
              display: 'flex',
              alignItems: 'center',
            }}
          >
            {cat.name}
          </button>
        ))}
      </nav>

      <main className="flex-1 md:ml-[220px] relative z-10">
        {categories.map((cat) => {
          const catItems = items.filter((i) => i.category_id === cat.id)
          return (
            <section key={cat.id} data-cat={cat.id} ref={register(cat.id)} className="scroll-mt-16">
              <div
                className="sticky z-20 flex items-center gap-4 px-6 py-3 md:static md:mb-6 md:px-8 md:py-0 md:pt-12"
                style={{ top: 'calc(var(--inner-nav-h, 48px) + var(--menu-tabs-offset, 0px))', background: 'var(--bg)', backdropFilter: 'blur(10px)', borderBottom: '1px solid var(--bdr)' }}
              >
                <h2 className="shrink-0 text-xs font-semibold uppercase tracking-[0.3em]" style={{ color: 'var(--brand)', fontFamily: 'var(--font-body)' }}>
                  {cat.name.split('').map((char, i) => (
                    <m.span
                      key={i}
                      custom={i}
                      variants={letterDrop}
                      initial="hidden"
                      whileInView="show"
                      viewport={{ once: true }}
                      className="inline-block"
                      style={{ whiteSpace: 'pre' }}
                    >
                      {char}
                    </m.span>
                  ))}
                </h2>
                <div className="h-px flex-1" style={{ background: 'linear-gradient(90deg, var(--bdr), transparent)' }} />
                <span className="text-[10px] tabular-nums font-mono" style={{ color: 'var(--txt3)' }}>
                  {String(catItems.length).padStart(2, '0')} ITEMS
                </span>
              </div>
              <m.div
                className="px-6 pb-10 md:px-8 md:pb-12 lg:px-12 lg:pb-14 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-[1fr_0.618fr] gap-x-12"
                variants={staggerContainer}
                initial="hidden"
                whileInView="show"
                viewport={{ once: true, margin: '-20px' }}
              >
                {catItems.map((item, idx) => <DotRow key={item.id} item={item} idx={idx} openItem={openItem} />)}
              </m.div>
            </section>
          )
        })}
      </main>
    </div>
  )
}
