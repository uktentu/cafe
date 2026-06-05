'use client'

// NocturneLayout — Dark luxury lounge ✦ AURORA EDITION
// Scroll-based. Categories anchor-linked via sidebar dots (md+) and bottom pill strip (mobile).
// No full-page snap — smooth vertical scroll. Price right-aligned with metallic shimmer.

import { m } from 'framer-motion'
import type { Item } from '@/types/database'
import { useMenuStore } from '@/stores/menu'
import { useScrollCategorySync } from '@/components/menu/useCategorySync'
import { track } from '@/lib/firebase'
import { VegMark, ItemBadge } from '@/components/menu/badges'
import { formatPrice } from '@/lib/utils'
import { diagonalReveal, staggerContainer } from '@/components/menu/scrollVariants'
import type { LayoutProps } from './MercadoLayout'

function Aurora() {
  return (
    <div className="pointer-events-none fixed inset-0 z-0 overflow-hidden">
      <style>{`
        @keyframes aurora-sweep {
          0%   { transform: rotate(0deg) scale(1.4); opacity: 0.07; }
          50%  { opacity: 0.12; }
          100% { transform: rotate(360deg) scale(1.4); opacity: 0.07; }
        }
        @keyframes aurora2 {
          0%,100% { transform: translateX(-20%) rotate(-15deg) scale(1.3); opacity: 0.05; }
          50%      { transform: translateX(20%) rotate(30deg) scale(1.5); opacity: 0.09; }
        }
        @keyframes dot-pulse {
          0%, 100% { box-shadow: 0 0 4px 1px var(--brand); }
          50%       { box-shadow: 0 0 12px 4px var(--brand); }
        }
        @keyframes price-shimmer {
          0%   { background-position: -200% center; }
          100% { background-position: 200% center; }
        }
      `}</style>
      {/* Very subtle aurora — must not overpower food names */}
      <div style={{
        position: 'absolute', inset: 0,
        background: 'conic-gradient(from 0deg at 30% 50%, var(--brand), transparent 40%, var(--brand2, var(--brand)), transparent 70%, var(--brand))',
        animation: 'aurora-sweep 20s linear infinite',
      }} />
      <div style={{
        position: 'absolute', inset: 0,
        background: 'conic-gradient(from 180deg at 70% 60%, var(--brand2, #8b5cf6), transparent 50%, #06b6d4, transparent 80%)',
        animation: 'aurora2 25s ease-in-out infinite',
      }} />
    </div>
  )
}

function Starfield() {
  const stars = Array.from({ length: 45 })
  return (
    <div className="pointer-events-none fixed inset-0 z-[1] overflow-hidden">
      {stars.map((_, i) => (
        <m.div
          key={i}
          className="absolute rounded-full"
          style={{
            width: Math.random() * 2 + 0.5,
            height: Math.random() * 2 + 0.5,
            background: i % 5 === 0 ? 'var(--brand2, #a78bfa)' : '#fff',
            left: `${Math.random() * 100}%`,
            top: `${Math.random() * 100}%`,
          }}
          animate={{ opacity: [0.04, Math.random() * 0.7 + 0.2, 0.04] }}
          transition={{ duration: Math.random() * 4 + 2, repeat: Infinity, ease: 'easeInOut', delay: Math.random() * 5 }}
        />
      ))}
    </div>
  )
}

// Row: name LEFT (flex-1), badges small & inline, price always RIGHT
function Row({ item, idx, openItem }: { item: Item; idx: number; openItem: (i: Item) => void }) {
  return (
    <m.button
      custom={idx}
      variants={diagonalReveal}
      initial="hidden"
      whileInView="show"
      viewport={{ once: true, margin: '-5% 0px' }}
      whileHover={{ x: 6, transition: { type: 'spring', stiffness: 400 } }}
      onClick={() => { openItem(item); track('item_view', { business_id: item.business_id, item_id: item.id }) }}
      className="group flex w-full items-center gap-3 py-4 text-left md:py-5"
      style={{ borderBottom: '1px solid var(--bdr2)', opacity: item.is_available ? 1 : 0.5 }}
    >
      <div className="flex shrink-0 items-center gap-1.5">
        <VegMark dietary={item.dietary} size="xs" />
        {item.badge && <ItemBadge badge={item.badge} />}
        {!item.is_available && (
          <span className="shrink-0 text-[9px] uppercase tracking-widest px-1.5 py-0.5 rounded-full" style={{ background: 'var(--bdr)', color: 'var(--txt3)' }}>Out</span>
        )}
      </div>

      {/* Name — dominant, always truncated cleanly */}
      <span
        className="min-w-0 flex-1 truncate text-[15px] transition-opacity group-hover:opacity-60"
        style={{ fontFamily: 'var(--font-display)', color: 'var(--txt)', fontStyle: 'italic' }}
      >
        {item.name}
      </span>

      {/* Price — always far right, compare price stacked above it */}
      <span className="shrink-0 text-right tabular-nums">
        {item.compare_price && item.compare_price > item.price && (
          <s className="block text-[10px] font-normal leading-none mb-0.5 opacity-40" style={{ color: 'var(--txt3)' }}>
            {formatPrice(item.compare_price)}
          </s>
        )}
        <span
          className="text-[15px] font-semibold"
          style={{
            color: 'transparent',
            fontFamily: 'var(--font-body)',
            background: 'linear-gradient(90deg, var(--brand), var(--brand2, #a78bfa) 50%, var(--brand))',
            backgroundSize: '200% auto',
            WebkitBackgroundClip: 'text',
            backgroundClip: 'text',
            animation: 'price-shimmer 3s linear infinite',
          }}
        >
          {formatPrice(item.price)}
        </span>
      </span>
    </m.button>
  )
}

export function NocturneLayout({ categories, items, businessId: _businessId }: LayoutProps) {
  const openItem = useMenuStore((s) => s.openItem)
  const { activeId, register } = useScrollCategorySync(categories)

  const jumpTo = (id: string) => {
    const el = document.querySelector(`[data-cat="${id}"]`) as HTMLElement | null
    el?.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }

  const bestsellers = items.filter((i) => i.badge === 'bestseller' || i.is_featured)

  return (
    <div className="relative" style={{ background: 'var(--bg)', color: 'var(--txt)' }}>
      <Aurora />
      <Starfield />

      {/* Fixed left glow-dot rail — desktop only */}
      <div className="fixed left-3 top-1/2 z-40 -translate-y-1/2 flex-col items-center gap-3 hidden md:flex">
        {bestsellers.length > 0 && (
          <button
            onClick={() => jumpTo('top')}
            aria-label="Best Sellers"
            className="rounded-full transition-all duration-300"
            style={{
              width: activeId === 'top' || !activeId ? 10 : 5,
              height: activeId === 'top' || !activeId ? 10 : 5,
              background: 'var(--brand)',
              animation: activeId === 'top' || !activeId ? 'dot-pulse 2s ease-in-out infinite' : 'none',
            }}
          />
        )}
        {categories.map((cat) => {
          const active = cat.id === activeId
          return (
            <button
              key={cat.id}
              onClick={() => jumpTo(cat.id)}
              aria-label={cat.name}
              title={cat.name}
              className="rounded-full transition-all duration-300"
              style={{
                width: active ? 9 : 4,
                height: active ? 9 : 4,
                background: active ? 'var(--brand)' : 'rgba(255,255,255,0.3)',
                animation: active ? 'dot-pulse 2s ease-in-out infinite' : 'none',
              }}
            />
          )
        })}
      </div>

      {/* Scroll content — normal document flow */}
      <div className="relative z-10 pb-32 md:pb-16">
        {bestsellers.length > 0 && (
          <section
            data-cat="top"
            ref={register('top')}
            className="mx-auto max-w-xl px-5 pt-12 pb-10 md:max-w-2xl md:px-16 lg:max-w-3xl scroll-mt-4"
          >
            {/* Ghost numeral — decorative, very subtle */}
            <m.span
              initial={{ opacity: 0 }}
              whileInView={{ opacity: 0.05, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.9 }}
              aria-hidden
              className="block select-none leading-none pointer-events-none"
              style={{ fontFamily: 'var(--font-display)', fontSize: 'clamp(4rem, 16vw, 9rem)', color: 'var(--brand)', fontStyle: 'italic' }}
            >
              ★
            </m.span>
            <m.div
              initial={{ opacity: 0, y: 14 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: 0.08 }}
              className="-mt-4 mb-1 flex items-baseline gap-3 flex-wrap"
            >
              <h2 className="text-2xl sm:text-3xl" style={{ fontFamily: 'var(--font-display)', color: 'var(--txt)', fontStyle: 'italic' }}>
                Best Sellers
              </h2>
              <span className="text-[10px] uppercase tracking-[0.3em]" style={{ color: 'var(--brand)' }}>
                {bestsellers.length} items
              </span>
            </m.div>
            <p className="mb-4 text-xs tracking-wide" style={{ color: 'var(--txt2)' }}>Our most loved dishes.</p>
            <div className="mb-2 h-px" style={{ background: 'linear-gradient(90deg, var(--brand), transparent)' }} />
            <m.div variants={staggerContainer} initial="hidden" whileInView="show" viewport={{ once: true, margin: '-20px' }}>
              {bestsellers.map((item, idx) => <Row key={item.id} item={item} idx={idx} openItem={openItem} />)}
            </m.div>
          </section>
        )}

        {categories.map((cat, ci) => {
          const catItems = items.filter((i) => i.category_id === cat.id)
          return (
            <section
              key={cat.id}
              data-cat={cat.id}
              ref={register(cat.id)}
              className="mx-auto max-w-xl px-5 pt-10 pb-8 md:max-w-2xl md:px-16 lg:max-w-3xl scroll-mt-4"
            >
              {/* Ghost numeral */}
              <m.span
                initial={{ opacity: 0 }}
                whileInView={{ opacity: 0.05, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.8 }}
                aria-hidden
                className="block select-none leading-none pointer-events-none"
                style={{ fontFamily: 'var(--font-display)', fontSize: 'clamp(3.5rem, 14vw, 8rem)', color: 'var(--brand)', fontStyle: 'italic' }}
              >
                {String(ci + 1).padStart(2, '0')}
              </m.span>

              <m.div
                initial={{ opacity: 0, y: 12 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: 0.08 }}
                className="-mt-3 mb-1 flex items-baseline gap-3 flex-wrap"
              >
                <h2 className="text-2xl sm:text-3xl" style={{ fontFamily: 'var(--font-display)', color: 'var(--txt)', fontStyle: 'italic' }}>
                  {cat.name}
                </h2>
                <span className="text-[10px] uppercase tracking-[0.3em]" style={{ color: 'var(--brand)' }}>
                  {catItems.length} items
                </span>
              </m.div>

              {cat.description && (
                <p className="mb-4 text-xs tracking-wide" style={{ color: 'var(--txt2)' }}>{cat.description}</p>
              )}

              <div className="mb-2 h-px" style={{ background: 'linear-gradient(90deg, var(--brand), var(--brand2, var(--brand)), transparent)', opacity: 0.6 }} />

              <m.div variants={staggerContainer} initial="hidden" whileInView="show" viewport={{ once: true, margin: '-20px' }}>
                {catItems.map((item, idx) => <Row key={item.id} item={item} idx={idx} openItem={openItem} />)}
                {catItems.length === 0 && (
                  <p className="py-8 text-center text-sm" style={{ color: 'var(--txt3)' }}>No dishes here yet.</p>
                )}
              </m.div>
            </section>
          )
        })}
      </div>

      {/* Mobile bottom pill nav */}
      <div
        className="fixed left-0 right-0 z-50 flex justify-center px-4 md:hidden"
        style={{ bottom: 'calc(5.5rem + env(safe-area-inset-bottom))' }}
      >
        <div
          className="flex max-w-full items-center gap-2 overflow-x-auto rounded-full px-3 py-2 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
          style={{ background: 'var(--glass)', backdropFilter: 'blur(20px)', border: '1px solid var(--bdr)', boxShadow: '0 8px 32px rgba(0,0,0,0.2)' }}
        >
          {categories.map((c) => {
            const active = c.id === activeId
            return (
              <button
                key={c.id}
                onClick={() => jumpTo(c.id)}
                className="shrink-0 rounded-full px-3 py-1.5 text-xs font-semibold transition-all"
                style={{
                  background: active ? 'var(--brand)' : 'transparent',
                  color: active ? '#fff' : 'var(--txt2)',
                  fontFamily: 'var(--font-body)',
                  fontStyle: 'italic',
                  boxShadow: active ? '0 0 12px var(--brand)' : 'none',
                }}
              >
                {c.name}
              </button>
            )
          })}
        </div>
      </div>
    </div>
  )
}
