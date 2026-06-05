'use client'

// EmberLayout — Chinese / Asian Restaurant
// Nav paradigm: Block tabs at top — switching triggers a dramatic clipPath curtain reveal.
// Each category switch wipes with an animated red curtain from left to right.

import Image from 'next/image'
import { m, AnimatePresence } from 'framer-motion'
import { cdnUrl, itemImageKey } from '@/types/database'
import { useMenuStore } from '@/stores/menu'
import { useTabCategorySync } from '@/components/menu/useCategorySync'
import { track } from '@/lib/firebase'
import { VegMark, ItemBadge } from '@/components/menu/badges'
import { emberRise, staggerContainer } from '@/components/menu/scrollVariants'
import { formatPrice } from '@/lib/utils'
import { getCategoryIcon } from '@/components/menu/categoryIcon'
import type { LayoutProps } from './MercadoLayout'

function EmberParticles() {
  const particles = Array.from({ length: 25 })
  return (
    <div className="pointer-events-none fixed inset-0 z-0 overflow-hidden">
      <style dangerouslySetInnerHTML={{ __html: `
        @keyframes lantern-spin { from { transform: rotate(0deg) scale(1); } 50% { transform: rotate(180deg) scale(1.05); } to { transform: rotate(360deg) scale(1); } }
        @keyframes ember-glow { 0%,100% { box-shadow: 0 0 0 0 transparent; } 50% { box-shadow: 0 0 30px 8px rgba(255,60,0,0.25); } }
        .ember-item:hover { animation: ember-glow 0.6s ease-out; }
      ` }} />
      {particles.map((_, i) => {
        const pseudoRand1 = ((i * 13) % 100) / 100
        const pseudoRand2 = ((i * 29) % 100) / 100
        const pseudoRand3 = ((i * 47) % 100) / 100
        const pseudoRand4 = ((i * 71) % 100) / 100
        const pseudoRand5 = ((i * 89) % 100) / 100
        const pseudoRand6 = ((i * 101) % 100) / 100
        const pseudoRand7 = ((i * 103) % 100) / 100
        
        const duration = pseudoRand1 * 8 + 5
        const delay = pseudoRand2 * 5
        const xOffset = pseudoRand3 * 100 - 50
        const color = ['var(--brand)', 'var(--brand2)', '#ff6b00'][Math.floor(pseudoRand4 * 3)]
        return (
          <m.div
            key={i}
            className="absolute rounded-full"
            style={{
              width: pseudoRand5 * 4 + 2,
              height: pseudoRand5 * 4 + 2,
              background: color,
              left: `${pseudoRand6 * 100}%`,
              bottom: -20,
              boxShadow: `0 0 10px 2px ${color}`
            }}
            animate={{
              y: [0, -1200],
              x: xOffset,
              opacity: [0, pseudoRand7 * 0.8 + 0.2, 0]
            }}
            transition={{
              duration,
              repeat: Infinity,
              delay,
              ease: 'linear'
            }}
          />
        )
      })}
    </div>
  )
}

function LanternWatermark() {
  return (
    <div className="pointer-events-none fixed inset-0 z-[1] flex items-center justify-end pr-8 overflow-hidden">
      <div style={{
        fontSize: 'clamp(8rem, 25vw, 18rem)',
        color: 'var(--brand)',
        opacity: 0.04,
        animation: 'lantern-spin 30s linear infinite',
        userSelect: 'none',
        lineHeight: 1,
      }}>🏮</div>
    </div>
  )
}

export function EmberLayout({ categories, items, businessId: _businessId }: LayoutProps) {
  const openItem = useMenuStore((s) => s.openItem)
  const requestJump = useMenuStore((s) => s.requestJump)
  const { activeId } = useTabCategorySync(categories)
  const cat = categories.find((c) => c.id === activeId)
  const Icon = getCategoryIcon(cat?.icon)
  const catItems = items.filter((i) => i.category_id === activeId)

  return (
    <div style={{ background: 'var(--bg)', color: 'var(--txt)' }}>
      <EmberParticles />
      <LanternWatermark />
      {/* Block tabs — sticky, full-width horizontal, scrollbar hidden with right-fade mask */}
      <div
        className="sticky top-[var(--menu-tabs-offset,0px)] z-30 flex overflow-x-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
        style={{
          background: 'var(--glass)',
          backdropFilter: 'blur(12px)',
          borderBottom: '2px solid var(--brand)',
          maskImage: 'linear-gradient(to right, black calc(100% - 48px), transparent 100%)',
          WebkitMaskImage: 'linear-gradient(to right, black calc(100% - 48px), transparent 100%)',
        }}
      >
        {categories.map((c) => {
          const isActive = c.id === activeId
          return (
            <button id={`nav-btn-${c.id}`}
              key={c.id}
              onClick={() => requestJump(c.id)}
              className="shrink-0 px-5 py-3 text-sm font-bold tracking-wide transition-colors"
              style={{
                background: isActive ? 'var(--brand)' : 'transparent',
                color: isActive ? 'var(--brand2)' : 'var(--txt2)',
                fontFamily: 'var(--font-display)',
                borderRight: '1px solid var(--bdr)',
              }}
            >
              {c.name}
            </button>
          )
        })}
      </div>

      {/* Curtain reveal content */}
      <AnimatePresence mode="wait">
        <m.div
          key={activeId}
          initial={{ clipPath: 'inset(0 100% 0 0)' }}
          animate={{ clipPath: 'inset(0 0% 0 0)' }}
          exit={{ clipPath: 'inset(0 0 0 100%)' }}
          transition={{ duration: 0.4, ease: [0.22, 0, 0.36, 1] }}
          className="pb-8"
        >
          {/* Red banner heading */}
          <div
            className="flex w-full items-center justify-center gap-3 px-4 py-4"
            style={{ background: 'var(--brand)' }}
          >
            <span style={{ color: 'var(--brand2)', fontSize: 14 }}>◈</span>
            <h2
              className="text-base font-bold uppercase tracking-widest"
              style={{ fontFamily: 'var(--font-display)', color: 'var(--brand2)' }}
            >
              {cat?.name}
            </h2>
            <span style={{ color: 'var(--brand2)', fontSize: 14 }}>◈</span>
          </div>

          <m.div 
            className="grid grid-cols-1 gap-3 p-4 xs:grid-cols-2 sm:grid-cols-2 lg:grid-cols-3 lg:gap-4 lg:p-6 relative z-10"
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
                  variants={emberRise}
                  initial="hidden"
                  whileInView="show"
                  viewport={{ once: true, margin: '-20px' }}
                  whileTap={{ scale: 0.97 }}
                  whileHover={{ y: -5, boxShadow: '0 10px 40px -5px rgba(255,80,0,0.3)', borderColor: 'var(--brand)' }}
                  onClick={() => { openItem(item); track('item_view', { business_id: item.business_id, item_id: item.id }) }}
                  className={`relative overflow-hidden rounded-xl text-left ${imgUrl ? 'aspect-square' : 'col-span-full flex flex-col p-6'}`}
                  style={{
                    background: imgUrl ? 'var(--sf1)' : 'linear-gradient(to bottom, var(--sf1), var(--bg))',
                    border: '1px solid var(--bdr)',
                    opacity: item.is_available ? 1 : 0.55,
                    boxShadow: imgUrl ? 'none' : 'inset 0 0 40px rgba(255,50,0,0.03)'
                  }}
                >
                  {imgUrl ? (
                    <>
                      <Image src={imgUrl} alt={item.name} fill className="object-cover" sizes="(max-width:768px) 50vw, 33vw" />
                      <div
                        className="absolute inset-x-0 bottom-0 p-2 pt-8 pointer-events-none"
                        style={{ background: 'linear-gradient(to top, rgba(0,0,0,0.88) 0%, transparent 100%)' }}
                      >
                        <p
                          className="text-xs font-bold leading-tight"
                          style={{ color: 'var(--brand2)', fontFamily: 'var(--font-display)' }}
                        >
                          {item.name}
                        </p>
                        <div className="mt-1 flex items-end justify-between">
                          <div className="flex flex-wrap items-center gap-1 pb-0.5">
                            <VegMark dietary={item.dietary} size="xs" />
                            {item.badge && <ItemBadge badge={item.badge} />}
                          </div>
                          <div className="flex flex-col items-end shrink-0 gap-0.5">
                            {item.compare_price && item.compare_price > item.price && <s className="opacity-50 font-normal text-[10px] leading-none">{formatPrice(item.compare_price)}</s>}
                            <span className="text-xs font-semibold leading-none" style={{ color: 'var(--brand2)' }}>{formatPrice(item.price)}</span>
                          </div>
                        </div>
                        {!item.is_available && (
                          <span className="text-[9px] uppercase tracking-widest" style={{ color: 'var(--txt3)' }}>
                            Out
                          </span>
                        )}
                      </div>
                    </>
                  ) : (
                    <>
                      <div className="flex justify-between items-start gap-4 mb-3">
                        <h3 className="text-xl font-black leading-snug tracking-wide uppercase flex-1 min-w-0" style={{ color: 'var(--brand)', fontFamily: 'var(--font-display)' }}>{item.name}</h3>
                        <div className="flex flex-col items-end shrink-0">
                          {item.compare_price && item.compare_price > item.price && <s className="opacity-50 font-normal text-xs mb-0.5">{formatPrice(item.compare_price)}</s>}
                          <span className="text-lg font-black" style={{ color: 'var(--brand2, var(--txt))' }}>{formatPrice(item.price)}</span>
                        </div>
                      </div>
                      {item.description && <p className="text-sm leading-relaxed mb-4" style={{ color: 'var(--txt2)' }}>{item.description}</p>}
                      <div className="mt-auto pt-4 border-t border-[var(--bdr)] flex items-center justify-between">
                        <div className="flex flex-wrap items-center gap-2">
                          <VegMark dietary={item.dietary} size="xs" />
                          {item.badge && <ItemBadge badge={item.badge} />}
                        </div>
                        {!item.is_available && <span className="text-[10px] uppercase tracking-widest font-bold" style={{ color: 'var(--txt3)' }}>Out</span>}
                        {item.is_available && (
                          <div className="opacity-30 flex items-center justify-center">
                            <Icon size={20} style={{ color: 'var(--brand)' }} />
                          </div>
                        )}
                      </div>
                    </>
                  )}
                </m.button>
              )
            })}
            {catItems.length === 0 && (
              <p className="col-span-2 py-12 text-center text-sm" style={{ color: 'var(--txt3)' }}>No dishes here.</p>
            )}
          </m.div>

          {/* Chinese decorative divider — each ◈ twinkles with staggered animation */}
          <p className="py-4 text-center text-sm tracking-widest" style={{ color: 'var(--brand)' }}>
            <style dangerouslySetInnerHTML={{ __html: `
              @keyframes ember-twinkle { 0%,100%{opacity:1} 50%{opacity:0.3} }
              .ember-dec:nth-child(1){animation:ember-twinkle 2s ease-in-out infinite 0s}
              .ember-dec:nth-child(2){animation:ember-twinkle 2s ease-in-out infinite 0.3s}
              .ember-dec:nth-child(3){animation:ember-twinkle 2s ease-in-out infinite 0.6s}
              .ember-dec:nth-child(4){animation:ember-twinkle 2s ease-in-out infinite 0.9s}
              .ember-dec:nth-child(5){animation:ember-twinkle 2s ease-in-out infinite 1.2s}
            ` }} />
            <span className="ember-dec">◈</span>
            <span className="ember-dec"> · </span>
            <span className="ember-dec">·</span>
            <span className="ember-dec"> ◈</span>
            <span className="ember-dec"> · · ◈</span>
          </p>
        </m.div>
      </AnimatePresence>
    </div>
  )
}
