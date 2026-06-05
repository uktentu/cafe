'use client'

// SakuraLayout — Girly / Women's Cafe ✦ FULL BLOSSOM EDITION
// Physics-driven petals (3 sizes, random drift, rotation), breathing blush backdrop,
// deep glassmorphism cards with blossom glow, category bloom entrance.

import Image from 'next/image'
import { m, AnimatePresence } from 'framer-motion'
import { cdnUrl, itemImageKey } from '@/types/database'
import { useMenuStore } from '@/stores/menu'
import { useTabCategorySync } from '@/components/menu/useCategorySync'
import { track } from '@/lib/firebase'
import { VegMark, ItemBadge } from '@/components/menu/badges'
import { formatPrice } from '@/lib/utils'
import { getCategoryIcon } from '@/components/menu/categoryIcon'
import { floatUp, staggerContainer } from '@/components/menu/scrollVariants'
import type { LayoutProps } from './MercadoLayout'

const SAKURA_STYLES = `
  @keyframes blossom-breathe {
    0%, 100% { background-position: 0% 50%; }
    50%       { background-position: 100% 50%; }
  }
  @keyframes petal-sway {
    0%   { transform: rotate(0deg); }
    25%  { transform: rotate(25deg); }
    75%  { transform: rotate(-15deg); }
    100% { transform: rotate(0deg); }
  }
  .sakura-card {
    background: var(--glass, rgba(255,255,255,0.08));
    backdrop-filter: blur(20px) saturate(1.5);
    -webkit-backdrop-filter: blur(20px) saturate(1.5);
  }
  .sakura-card:hover {
    box-shadow: 0 0 40px var(--brand, #f9a8d4), 0 8px 32px rgba(0,0,0,0.1);
  }
`

// Petal sizes for variety
const PETAL_SIZES = [8, 14, 20]

function FallingPetals() {
  return (
    <div className="pointer-events-none fixed inset-0 z-[2] overflow-hidden">
      <style dangerouslySetInnerHTML={{ __html: SAKURA_STYLES }} />
      {Array.from({ length: 22 }).map((_, i) => {
        // Use deterministic pseudo-random values based on index `i` to prevent React hydration mismatch
        const pseudoRand1 = ((i * 13) % 100) / 100
        const pseudoRand2 = ((i * 29) % 100) / 100
        const pseudoRand3 = ((i * 47) % 100) / 100
        const pseudoRand4 = ((i * 71) % 100) / 100
        const pseudoRand5 = ((i * 89) % 100) / 100

        const size = PETAL_SIZES[i % 3]
        const duration = 12 + pseudoRand1 * 14
        const swayDuration = 3 + pseudoRand2 * 4
        const delay = pseudoRand3 * 14
        const startX = pseudoRand4 * 100
        const driftX = pseudoRand5 * 160 - 80
        const opacity = 0.15 + pseudoRand1 * 0.35
        return (
          <m.div
            key={i}
            style={{
              position: 'absolute',
              width: size,
              height: size,
              background: i % 3 === 0 ? 'var(--brand, #f9a8d4)' : i % 3 === 1 ? 'var(--brand2, #fbb6ce)' : 'rgba(255,192,203,0.9)',
              borderRadius: '0 50% 50% 50%',
              opacity,
              left: `${startX}%`,
              top: -size - 10,
              filter: 'blur(0.5px)',
            }}
            animate={{
              y: ['0vh', '112vh'],
              x: [0, driftX * 0.33, driftX * 0.66, driftX],
              rotate: [0, 180, 360, 540],
            }}
            transition={{
              y: { duration, repeat: Infinity, delay, ease: 'linear' },
              x: { duration, repeat: Infinity, delay, ease: 'easeInOut' },
              rotate: { duration: swayDuration, repeat: Infinity, delay, ease: 'linear' },
            }}
          />
        )
      })}
    </div>
  )
}

function BlossomBackdrop() {
  return (
    <div
      className="pointer-events-none fixed inset-0 z-0"
      style={{
        background: 'linear-gradient(135deg, var(--bg) 0%, rgba(var(--brand-rgb, 249,168,212),0.06) 50%, var(--bg) 100%)',
        backgroundSize: '400% 400%',
        animation: 'blossom-breathe 16s ease-in-out infinite',
      }}
    />
  )
}

const BG_PATTERN = {
  backgroundImage:
    'repeating-radial-gradient(circle at 20% 30%, rgba(var(--brand-rgb, 196, 122, 144),0.05) 0px, rgba(var(--brand-rgb, 196, 122, 144),0.05) 1.5px, transparent 1.5px, transparent 28px),' +
    'repeating-radial-gradient(circle at 75% 65%, rgba(var(--brand-rgb, 196, 122, 144),0.05) 0px, rgba(var(--brand-rgb, 196, 122, 144),0.05) 1.5px, transparent 1.5px, transparent 34px)',
  backgroundSize: '120px 120px, 140px 140px',
  backgroundAttachment: 'fixed' as const,
}

export function SakuraLayout({ categories, items, businessId: _businessId }: LayoutProps) {
  const openItem = useMenuStore((s) => s.openItem)
  const requestJump = useMenuStore((s) => s.requestJump)
  const { activeId } = useTabCategorySync(categories)
  const cat = categories.find((c) => c.id === activeId)
  const Icon = getCategoryIcon(cat?.icon)
  const catItems = items.filter((i) => i.category_id === activeId)

  return (
    <div className="relative min-h-svh" style={{ background: 'var(--bg)', color: 'var(--txt)', ...BG_PATTERN }}>
      <BlossomBackdrop />
      <FallingPetals />

      {/* Tablet sidebar */}
      <aside
        className="hidden md:flex md:flex-col"
        style={{ position: 'fixed', top: 0, left: 0, bottom: 0, width: 220, background: 'var(--sf1)', borderRight: '1px solid var(--bdr)', zIndex: 30, overflowY: 'auto', padding: '2rem 1.25rem' }}
      >
        <p className="mb-6 text-[10px] font-semibold uppercase tracking-[0.4em]" style={{ color: 'var(--brand)', fontStyle: 'italic' }}>Menu</p>
        <nav className="flex flex-col gap-1">
          {categories.map((c) => {
            const active = c.id === activeId
            return (
              <button id={`nav-btn-${c.id}`}
                key={c.id}
                onClick={() => requestJump(c.id)}
                className="relative flex items-center rounded-2xl px-3 py-2.5 text-left text-sm transition-colors"
                style={{ color: active ? 'var(--brand)' : 'var(--txt2)', fontFamily: 'var(--font-body)', fontStyle: 'italic', fontWeight: active ? 600 : 400, background: active ? 'var(--sf2)' : 'transparent' }}
              >
                {active && <m.span layoutId="sakura-sidebar-indicator" className="absolute left-0 top-1 bottom-1 w-[3px] rounded-full" style={{ background: 'var(--brand)' }} />}
                <span className="pl-1">{c.name}</span>
              </button>
            )
          })}
        </nav>
        <m.div
          className="mt-auto py-4 text-center text-xl"
          animate={{ opacity: [0.3, 0.8, 0.3] }}
          transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut' }}
          style={{ color: 'var(--brand)' }}
        >
          ✿ ✿ ✿
        </m.div>
      </aside>

      {/* Content */}
      <div className="md:ml-[220px] relative z-10">
        <AnimatePresence mode="wait">
          <m.div
            key={activeId}
            initial={{ opacity: 0, scale: 0.96, filter: 'blur(8px)' }}
            animate={{ opacity: 1, scale: 1, filter: 'blur(0px)' }}
            exit={{ opacity: 0, scale: 1.02, filter: 'blur(4px)' }}
            transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
            className="pb-52 pt-0 md:pb-10"
          >
            {/* Sticky category heading */}
            <div
              className="sticky z-20 mb-6 px-4 py-4 text-center"
              style={{ top: 'var(--menu-tabs-offset, 0px)', background: 'var(--glass)', backdropFilter: 'blur(16px)', borderBottom: '1px solid var(--bdr)' }}
            >
              <m.h2
                key={activeId + 'title'}
                initial={{ opacity: 0, scale: 0.85, filter: 'blur(8px)' }}
                animate={{ opacity: 1, scale: 1, filter: 'blur(0px)' }}
                transition={{ duration: 0.5, ease: [0.34, 1.3, 0.64, 1] }}
                className="text-2xl md:text-3xl"
                style={{ fontFamily: 'var(--font-display)', fontStyle: 'italic', color: 'var(--brand)', letterSpacing: '0.02em' }}
              >
                {cat?.name}
              </m.h2>
              {cat?.description && (
                <p className="mt-0.5 text-xs tracking-widest" style={{ color: 'var(--txt2)' }}>{cat.description}</p>
              )}
            </div>

            <m.div
              className="mx-auto grid max-w-xl grid-cols-1 gap-3 px-4 md:max-w-2xl md:grid-cols-2 lg:max-w-4xl lg:grid-cols-3 lg:gap-4"
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
                    variants={floatUp}
                    whileTap={{ scale: 0.97 }}
                    whileHover={{ y: -6, scale: 1.02 }}
                    onClick={() => { openItem(item); track('item_view', { business_id: item.business_id, item_id: item.id }) }}
                    className="sakura-card flex w-full items-center gap-4 rounded-3xl p-3 text-left relative overflow-hidden"
                    style={{
                      border: '1.5px solid var(--bdr)',
                      opacity: item.is_available ? 1 : 0.55,
                      transition: 'box-shadow 0.3s ease',
                    }}
                  >
                    {/* Inner blossom glow */}
                    <div
                      className="pointer-events-none absolute inset-0 rounded-3xl"
                      style={{ background: 'radial-gradient(circle at 80% 20%, var(--brand, #f9a8d4)22, transparent 60%)', zIndex: 0 }}
                    />
                    {imgUrl && (
                      <div className="relative shrink-0 overflow-hidden z-10" style={{ borderRadius: 22, background: 'var(--sf2)', width: 88, height: 88 }}>
                        <Image src={imgUrl} alt={item.name} fill className="object-cover" sizes="88px" />
                      </div>
                    )}
                    <div className="min-w-0 flex-1 relative z-10">
                      <p className="text-[15px] font-semibold leading-snug flex items-start gap-1.5 w-full" style={{ fontFamily: 'var(--font-display)', fontStyle: 'italic', color: 'var(--txt)' }}>
                        {!imgUrl && <Icon size={16} className="mt-0.5 shrink-0" style={{ color: 'var(--brand)', opacity: 0.6 }} />}
                        <span className="flex-1 min-w-0 break-words">{item.name}</span>
                      </p>
                      {item.description && <p className={`mt-1 text-xs leading-relaxed ${imgUrl ? 'line-clamp-2' : ''}`} style={{ color: 'var(--txt2)' }}>{item.description}</p>}
                      <div className="mt-1.5 flex items-end justify-between gap-2">
                        <div className="flex flex-wrap items-center gap-1.5 pb-0.5">
                          <VegMark dietary={item.dietary} size="xs" />
                          {item.badge && <ItemBadge badge={item.badge} />}
                          {!item.is_available && <span className="text-[10px] uppercase tracking-wide" style={{ color: 'var(--txt3)' }}>Out</span>}
                        </div>
                        <div className="flex flex-col items-end shrink-0 gap-0.5">
                          {item.compare_price && item.compare_price > item.price && <s className="opacity-50 font-normal not-italic text-[10px] leading-none" style={{ color: 'var(--txt3)' }}>{formatPrice(item.compare_price)}</s>}
                          <span className="text-sm font-bold leading-none" style={{ color: 'var(--brand)', fontStyle: 'italic' }}>{formatPrice(item.price)}</span>
                        </div>
                      </div>
                    </div>
                  </m.button>
                )
              })}
              {catItems.length === 0 && (
                <p className="py-12 text-center text-sm md:col-span-2" style={{ color: 'var(--txt3)' }}>Nothing here yet.</p>
              )}
            </m.div>
          </m.div>
        </AnimatePresence>
      </div>

      {/* Floating bottom pill nav — mobile only */}
      <div
        className="fixed left-0 right-0 z-50 flex justify-center px-4 md:hidden"
        style={{ bottom: 'calc(5.5rem + env(safe-area-inset-bottom))' }}
      >
        <div
          className="flex max-w-full items-center gap-2 overflow-x-auto rounded-full px-4 py-2 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
          style={{ background: 'var(--glass)', backdropFilter: 'blur(20px)', border: '1px solid var(--bdr)', boxShadow: '0 8px 32px rgba(0,0,0,0.12)' }}
        >
          {categories.map((c) => {
            const active = c.id === activeId
            return (
              <button id={`nav-btn-${c.id}`}
                key={c.id}
                onClick={() => requestJump(c.id)}
                className="relative shrink-0 rounded-full px-3 py-1.5 text-xs font-semibold transition-all"
                style={{ background: active ? 'var(--brand)' : 'transparent', color: active ? '#fff' : 'var(--txt2)', fontFamily: 'var(--font-body)', fontStyle: 'italic', boxShadow: active ? `0 0 16px var(--brand)` : 'none' }}
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
