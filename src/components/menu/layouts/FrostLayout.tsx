'use client'

// FrostLayout — Ice Cream / Dessert / Sweet Cafe ✦ ARCTIC EDITION
// Floating bubble orbs drifting behind. Deep glassmorphism cards.
// Rainbow shimmer border on active pill. Swipeable.

import Image from 'next/image'
import { m, AnimatePresence } from 'framer-motion'
import { cdnUrl, itemImageKey } from '@/types/database'
import { useMenuStore } from '@/stores/menu'
import { useTabCategorySync, useSwipeCategory } from '@/components/menu/useCategorySync'
import { track } from '@/lib/firebase'
import { VegMark, ItemBadge } from '@/components/menu/badges'
import { magneticFloat, staggerContainer } from '@/components/menu/scrollVariants'
import { formatPrice } from '@/lib/utils'
import { getCategoryIcon } from '@/components/menu/categoryIcon'
import type { LayoutProps } from './MercadoLayout'

const PILL_COLORS = [
  'var(--brand, #C892D8)',
  'var(--brand2, #8EC4F0)',
  'var(--brand3, #A8E6B4)',
]

const FROST_STYLES = `
  @keyframes bubble-float {
    0%, 100% { transform: translateY(0) scale(1); }
    33%       { transform: translateY(-40px) scale(1.05); }
    66%       { transform: translateY(-20px) scale(0.97); }
  }
  @keyframes rainbow-border {
    0%   { border-color: #ff6eb4; box-shadow: 0 0 16px #ff6eb455; }
    20%  { border-color: #b88cff; box-shadow: 0 0 16px #b88cff55; }
    40%  { border-color: #74cfff; box-shadow: 0 0 16px #74cfff55; }
    60%  { border-color: #7fdc9e; box-shadow: 0 0 16px #7fdc9e55; }
    80%  { border-color: #ffe066; box-shadow: 0 0 16px #ffe06655; }
    100% { border-color: #ff6eb4; box-shadow: 0 0 16px #ff6eb455; }
  }
  .frost-pill-active { animation: rainbow-border 2.5s linear infinite; }
  .frost-card-glass {
    background: var(--glass, rgba(255,255,255,0.08));
    backdrop-filter: blur(24px) saturate(1.6);
    -webkit-backdrop-filter: blur(24px) saturate(1.6);
  }
  .frost-card-glass::before {
    content: '';
    position: absolute;
    inset: 0;
    z-index: 10;
    opacity: 0;
    transition: opacity 0.3s;
    pointer-events: none;
    border-radius: inherit;
    background: radial-gradient(600px circle at var(--x, 50%) var(--y, 50%), rgba(255,255,255,0.3), transparent 50%);
  }
  .frost-card-glass:hover::before { opacity: 1; }
`

function FrostBubbles() {
  const bubbles = Array.from({ length: 10 }, (_, i) => {
    const pseudoRand1 = ((i * 13) % 100) / 100
    const pseudoRand2 = ((i * 29) % 100) / 100
    const pseudoRand3 = ((i * 47) % 100) / 100
    const pseudoRand4 = ((i * 71) % 100) / 100
    const pseudoRand5 = ((i * 89) % 100) / 100
    return {
      size: 80 + pseudoRand1 * 220,
      x: pseudoRand2 * 100,
      y: pseudoRand3 * 100,
      delay: pseudoRand4 * 8,
      duration: 12 + pseudoRand5 * 10,
      color: PILL_COLORS[i % PILL_COLORS.length],
    }
  })
  return (
    <div className="pointer-events-none fixed inset-0 z-0 overflow-hidden">
      <style dangerouslySetInnerHTML={{ __html: FROST_STYLES }} />
      {bubbles.map((b, i) => (
        <div
          key={i}
          style={{
            position: 'absolute',
            width: b.size,
            height: b.size,
            borderRadius: '50%',
            background: b.color,
            opacity: 0.07,
            left: `${b.x}%`,
            top: `${b.y}%`,
            filter: 'blur(40px)',
            animationName: 'bubble-float',
            animationDuration: `${b.duration}s`,
            animationDelay: `${b.delay}s`,
            animationTimingFunction: 'ease-in-out',
            animationIterationCount: 'infinite',
          }}
        />
      ))}
    </div>
  )
}

export function FrostLayout({ categories, items, businessId: _businessId }: LayoutProps) {
  const openItem = useMenuStore((s) => s.openItem)
  const requestJump = useMenuStore((s) => s.requestJump)
  const { activeId, setActiveId } = useTabCategorySync(categories)
  const { onDragEnd } = useSwipeCategory(categories, activeId, setActiveId)
  const activeIdx = categories.findIndex((c) => c.id === activeId)
  const Icon = getCategoryIcon(categories.find((c) => c.id === activeId)?.icon)
  const catItems = items.filter((i) => i.category_id === activeId)
  const activePill = PILL_COLORS[activeIdx % PILL_COLORS.length]

  return (
    <div className="relative" style={{ background: 'var(--bg)', color: 'var(--txt)' }}>
      <FrostBubbles />

      {/* Rainbow pill nav */}
      <div
        className="sticky top-[var(--menu-tabs-offset,0px)] z-30 flex gap-2 overflow-x-auto px-4 py-3"
        style={{ background: 'var(--glass)', backdropFilter: 'blur(16px)', borderBottom: '1px solid var(--bdr)' }}
      >
        {categories.map((cat, i) => {
          const pillColor = PILL_COLORS[i % PILL_COLORS.length]
          const isActive = cat.id === activeId
          return (
            <m.button id={`nav-btn-${cat.id}`}
              key={cat.id}
              onClick={() => requestJump(cat.id)}
              whileTap={{ scale: 0.9 }}
              animate={isActive ? { scale: [1, 1.1, 1] } : { scale: 1 }}
              transition={{ type: 'spring', stiffness: 500, damping: 16 }}
              className={`shrink-0 rounded-full px-4 py-2 text-sm font-bold ${isActive ? 'frost-pill-active' : ''}`}
              style={{
                background: isActive ? pillColor : 'var(--sf1)',
                color: isActive ? '#fff' : 'var(--txt2)',
                border: `2px solid ${isActive ? pillColor : 'var(--bdr)'}`,
                boxShadow: isActive ? `0 0 20px ${pillColor}66` : 'none',
              }}
            >
              {cat.name}
            </m.button>
          )
        })}
      </div>

      <AnimatePresence mode="wait">
        <m.div
          key={activeId}
          initial={{ opacity: 0, y: 24, scale: 0.97 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: -12, scale: 0.98 }}
          transition={{ type: 'spring', stiffness: 360, damping: 28 }}
          drag="x"
          dragDirectionLock
          dragConstraints={{ left: 0, right: 0 }}
          dragElastic={0.08}
          onDragEnd={onDragEnd}
          style={{ touchAction: 'pan-y' }}
        >
          <m.div
            className="grid grid-cols-1 gap-4 p-4 sm:grid-cols-2 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 lg:gap-5 lg:p-6 relative z-10"
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
                  variants={magneticFloat}
                  whileTap={{ scale: 0.93 }}
                  whileHover={{ y: -6, scale: 1.03, boxShadow: `0 16px 48px ${activePill}44` }}
                  onMouseMove={(e) => {
                    const rect = e.currentTarget.getBoundingClientRect()
                    e.currentTarget.style.setProperty('--x', `${e.clientX - rect.left}px`)
                    e.currentTarget.style.setProperty('--y', `${e.clientY - rect.top}px`)
                  }}
                  onClick={() => { openItem(item); track('item_view', { business_id: item.business_id, item_id: item.id }) }}
                  className={`frost-card-glass flex overflow-hidden text-left relative ${imgUrl ? 'flex-col rounded-3xl' : 'flex-row col-span-full rounded-full items-center px-6 py-4 gap-5'}`}
                  style={{
                    border: `1.5px solid ${activePill}55`,
                    opacity: item.is_available ? 1 : 0.55,
                  }}
                >
                  {imgUrl ? (
                    <>
                      <div className="relative overflow-hidden" style={{ aspectRatio: '1', borderRadius: '50% 50% 0 0 / 60% 60% 0 0', background: 'var(--sf2)' }}>
                        <Image src={imgUrl} alt={item.name} fill loading={idx < 4 ? "eager" : "lazy"} fetchPriority={idx < 4 ? "high" : "auto"} unoptimized={idx < 4} className="object-cover transition-transform duration-500 group-hover:scale-105" sizes="(max-width:768px) 50vw, 33vw" />
                      </div>
                      <div className="flex flex-col gap-1.5 p-4 w-full">
                        <p className="text-sm font-bold leading-snug" style={{ fontFamily: 'var(--font-display)', color: 'var(--txt)' }}>{item.name}</p>
                        {item.description && (
                          <p className="text-xs line-clamp-2" style={{ color: 'var(--txt2)' }}>{item.description}</p>
                        )}
                        <div className="mt-2 flex items-end justify-between gap-2">
                          <div className="flex flex-wrap items-center gap-1.5">
                            <VegMark dietary={item.dietary} size="xs" />
                            {item.badge && <ItemBadge badge={item.badge} />}
                            {!item.is_available && <span className="rounded-full bg-black/60 px-2 py-0.5 text-[9px] font-semibold text-white">Out</span>}
                          </div>
                          <div className="flex flex-col items-end shrink-0 gap-0.5">
                            {item.compare_price && item.compare_price > item.price && <s className="opacity-50 text-[10px] font-normal leading-none" style={{ color: 'var(--txt3)' }}>{formatPrice(item.compare_price)}</s>}
                            <span className="rounded-full px-3 py-1 text-xs font-black leading-none" style={{ background: activePill, color: '#fff', boxShadow: `0 4px 12px ${activePill}66` }}>
                              {formatPrice(item.price)}
                            </span>
                          </div>
                        </div>
                      </div>
                    </>
                  ) : (
                    <>
                      <div className="flex shrink-0 h-14 w-14 items-center justify-center rounded-full" style={{ background: `${activePill}22`, border: `2px solid ${activePill}66` }}>
                        <Icon size={26} style={{ color: activePill }} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex justify-between items-start gap-3">
                          <p className="text-base font-bold leading-tight" style={{ fontFamily: 'var(--font-display)', color: 'var(--txt)' }}>{item.name}</p>
                          <div className="flex flex-col items-end shrink-0 gap-0.5 mt-0.5">
                            {item.compare_price && item.compare_price > item.price && <s className="opacity-50 text-[10px] font-normal leading-none" style={{ color: 'var(--txt3)' }}>{formatPrice(item.compare_price)}</s>}
                            <span className="text-[15px] font-black leading-none" style={{ color: activePill }}>{formatPrice(item.price)}</span>
                          </div>
                        </div>
                        {item.description && <p className="text-xs leading-relaxed mt-0.5 line-clamp-2" style={{ color: 'var(--txt2)' }}>{item.description}</p>}
                        <div className="mt-2 flex flex-wrap items-center gap-2">
                          <VegMark dietary={item.dietary} size="xs" />
                          {item.badge && <ItemBadge badge={item.badge} />}
                          {!item.is_available && <span className="text-[10px] font-bold uppercase tracking-widest px-2 py-0.5 rounded-full" style={{ background: 'var(--bg)', color: 'var(--txt3)' }}>Out</span>}
                        </div>
                      </div>
                    </>
                  )}
                </m.button>
              )
            })}
            {catItems.length === 0 && <p className="col-span-2 py-12 text-center text-sm" style={{ color: 'var(--txt3)' }}>No treats here yet.</p>}
          </m.div>
        </m.div>
      </AnimatePresence>
    </div>
  )
}
