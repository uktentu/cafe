'use client'

// AetherLayout — Organic, airy
// Floating CSS-column masonry. All categories shown, scroll between them; each
// is a centered label + masonry of soft cards (image cards + compact text cards).
// Scroll-sync feeds the ThumbDock. Diagonal + zoom reveals.

import Image from 'next/image'
import { m } from 'framer-motion'
import { cdnUrl, itemImageKey } from '@/types/database'
import { useMenuStore } from '@/stores/menu'
import { useScrollCategorySync } from '@/components/menu/useCategorySync'
import { track } from '@/lib/firebase'
import { VegMark, ItemBadge } from '@/components/menu/badges'
import { floatUp, staggerContainer } from '@/components/menu/scrollVariants'
import { formatPrice } from '@/lib/utils'
import { getCategoryIcon } from '@/components/menu/categoryIcon'
import type { LayoutProps } from './MercadoLayout'

const AETHER_STYLES = `
  @keyframes aether-float-1 {
    0%, 100% { transform: translate(0, 0) scale(1); }
    50% { transform: translate(50px, -30px) scale(1.1); }
  }
  @keyframes aether-float-2 {
    0%, 100% { transform: translate(0, 0) scale(1); }
    50% { transform: translate(-40px, 40px) scale(1.05); }
  }
  @keyframes aether-float-3 {
    0%, 100% { transform: translate(0, 0) scale(1); }
    50% { transform: translate(30px, 50px) scale(1.15); }
  }
  @keyframes aether-breathe {
    0%,100% { box-shadow: 0 0 0 0 transparent; }
    50%      { box-shadow: 0 0 40px 8px rgba(var(--brand-rgb,139,92,246),0.2); }
  }
  .aether-card:hover { animation: aether-breathe 1.2s ease-out; }
  .aether-cloud {
    position: absolute;
    border-radius: 9999px;
    filter: blur(100px);
    opacity: 0.02;
    will-change: transform;
  }
`

function Clouds() {
  return (
    <div className="pointer-events-none fixed inset-0 h-[100dvh] z-0 overflow-hidden" aria-hidden="true">
      <style dangerouslySetInnerHTML={{ __html: AETHER_STYLES }} />
      <div className="aether-cloud" style={{ width: '60vw', height: '40vh', background: 'var(--brand)', top: '-10%', left: '-10%', animation: 'aether-float-1 20s ease-in-out infinite' }} />
      <div className="aether-cloud" style={{ width: '50vw', height: '50vh', background: 'var(--brand2, var(--brand))', top: '40%', right: '-15%', animation: 'aether-float-2 25s ease-in-out infinite' }} />
      <div className="aether-cloud" style={{ width: '70vw', height: '30vh', background: 'var(--brand)', bottom: '-10%', left: '15%', animation: 'aether-float-3 22s ease-in-out infinite' }} />
    </div>
  )
}

export function AetherLayout({ categories, items, businessId: _businessId }: LayoutProps) {
  const openItem = useMenuStore((s) => s.openItem)
  const { register } = useScrollCategorySync(categories)

  return (
    <div className="relative" style={{ background: 'var(--bg)', color: 'var(--txt)' }}>
      <Clouds />
      <div className="px-4 py-6 md:px-8 lg:px-10 relative z-10">
        {categories.map((cat) => {
          const catItems = items.filter((i) => i.category_id === cat.id)
          const Icon = getCategoryIcon(cat.icon)
          return (
            <section key={cat.id} data-cat={cat.id} ref={register(cat.id)} className="mb-8 scroll-mt-16">
              {/* Sticky section label — max-w so lines hug content on wide viewports */}
              <div
                className="sticky top-[var(--menu-tabs-offset,0px)] z-40 mb-6 flex items-center gap-4 py-3 max-w-2xl mx-auto lg:max-w-none"
                style={{ background: 'var(--bg)', backdropFilter: 'blur(12px)', borderBottom: '2px solid var(--bg)' }}
              >
                <div className="h-px flex-1" style={{ background: 'var(--bdr)' }} />
                <h2 className="text-center text-sm font-bold uppercase tracking-[0.25em] md:tracking-[0.3em]" style={{ fontFamily: 'var(--font-display)', color: 'var(--txt)' }}>{cat.name}</h2>
                <div className="h-px flex-1" style={{ background: 'var(--bdr)' }} />
              </div>

              <m.div 
                className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 md:gap-5"
                variants={staggerContainer}
                initial="hidden"
                whileInView="show"
                viewport={{ once: true, margin: '-20px' }}
              >
                {catItems.map((item, idx) => {
                  const imgUrl = cdnUrl(itemImageKey(item))
                  const hasImage = !!imgUrl
                  return (
                    <m.button
                      key={item.id}
                      custom={idx}
                      variants={floatUp}
                      initial="hidden"
                      whileInView="show"
                      viewport={{ once: true, margin: '-40px' }}
                      whileTap={{ scale: 0.98 }}
                      whileHover={hasImage ? { y: -6, boxShadow: 'var(--shadow-card-hover, 0 12px 40px rgba(0,0,0,0.1))' } : { y: -2 }}
                      onClick={() => { openItem(item); track('item_view', { business_id: item.business_id, item_id: item.id }) }}
                      className={`aether-card w-full flex relative ${hasImage ? 'rounded-3xl flex-col h-full overflow-hidden text-left' : 'col-span-full flex-col items-center text-center py-6 px-4 gap-3'}`}
                      style={{ background: hasImage ? 'var(--glass)' : 'transparent', backdropFilter: hasImage ? 'blur(16px)' : 'none', boxShadow: hasImage ? '0 4px 24px rgba(0,0,0,0.06)' : 'none', border: hasImage ? '1px solid var(--bdr)' : 'none', opacity: item.is_available ? 1 : 0.5, transition: 'box-shadow 0.3s' }}
                    >
                      {hasImage ? (
                        <>
                          <div className="relative aspect-[4/3] shrink-0 overflow-hidden" style={{ borderRadius: '24px 24px 0 0' }}>
                            <Image src={imgUrl!} alt={item.name} fill className="object-cover" sizes="(max-width:768px) 50vw, 33vw" />
                          </div>
                          <div className="flex flex-col flex-1 p-4">
                            <h3 className="text-sm font-semibold leading-snug" style={{ fontFamily: 'var(--font-display)', color: 'var(--txt)' }}>{item.name}</h3>
                            {item.description && <p className="mt-1.5 text-xs leading-relaxed line-clamp-4 lg:line-clamp-2" style={{ color: 'var(--txt2)' }}>{item.description}</p>}
                            <div className="mt-auto pt-4 flex items-end justify-between gap-2 border-t border-[var(--bdr2)]">
                              <div className="flex flex-wrap items-center gap-1.5 pb-0.5">
                                <VegMark dietary={item.dietary} size="xs" />
                                {item.badge && <ItemBadge badge={item.badge} />}
                                {!item.is_available && <span className="text-[10px] font-medium uppercase" style={{ color: 'var(--txt3)' }}>Out</span>}
                              </div>
                              <div className="flex flex-col items-end gap-0.5 shrink-0">
                                {item.compare_price && item.compare_price > item.price && <s className="opacity-50 font-normal text-[10px] leading-none">{formatPrice(item.compare_price)}</s>}
                                <span className="shrink-0 text-sm font-bold leading-none" style={{ color: 'var(--brand)', fontFamily: 'var(--font-body)' }}>{formatPrice(item.price)}</span>
                              </div>
                            </div>
                          </div>
                        </>
                      ) : (
                        <>
                          <div className="w-full max-w-2xl mx-auto flex flex-col items-center">
                            <div className="flex shrink-0 h-12 w-12 items-center justify-center rounded-full mb-4" style={{ background: 'var(--brand-dim, var(--sf1))' }}>
                              <Icon size={24} style={{ color: 'var(--brand)', opacity: 0.8 }} />
                            </div>
                            
                            <div className="flex flex-col items-center text-center min-w-0 px-4 w-full">
                              <h3 className="text-xl font-light tracking-wide w-full" style={{ fontFamily: 'var(--font-display)', color: 'var(--txt)' }}>{item.name}</h3>
                              {item.description && <p className="mt-2 text-sm leading-relaxed max-w-lg" style={{ color: 'var(--txt2)' }}>{item.description}</p>}
                            </div>

                            {/* Footer row: Dietary left, Price right */}
                            <div className="w-full mt-4 flex items-end justify-between gap-4 pt-4 border-t" style={{ borderColor: 'var(--bdr2)' }}>
                              <div className="flex flex-col items-start gap-1.5 pt-1">
                                <div className="flex flex-wrap items-center gap-1.5">
                                  <VegMark dietary={item.dietary} size="xs" />
                                  {item.badge && <ItemBadge badge={item.badge} />}
                                </div>
                                {!item.is_available && <span className="text-[10px] font-medium uppercase tracking-widest" style={{ color: 'var(--txt3)' }}>Out</span>}
                              </div>
                              
                              <div className="flex flex-col items-end shrink-0 gap-0.5 pt-1">
                                {item.compare_price && item.compare_price > item.price && <s className="opacity-50 font-normal text-[10px] leading-none">{formatPrice(item.compare_price)}</s>}
                                <span className="text-base font-bold leading-none" style={{ color: 'var(--brand)', fontFamily: 'var(--font-body)' }}>{formatPrice(item.price)}</span>
                              </div>
                            </div>
                          </div>
                        </>
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
