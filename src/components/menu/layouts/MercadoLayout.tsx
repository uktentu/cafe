'use client'

// MercadoLayout — Bold street food, dark + red
// Sticky pill nav → full-width band heading per category → dense 2/3-col grid.
// Square cards: image fills, name + price over a dark gradient. Diagonal reveals.

import Image from 'next/image'
import { m } from 'framer-motion'
import type { Category, Item } from '@/types/database'
import { cdnUrl, itemImageKey } from '@/types/database'
import { useMenuStore } from '@/stores/menu'
import { useScrollCategorySync } from '@/components/menu/useCategorySync'
import { diagonalReveal } from '@/components/menu/scrollVariants'
import { track } from '@/lib/firebase'
import { VegMark, ItemBadge } from '@/components/menu/badges'
import { formatPrice } from '@/lib/utils'
import { getCategoryIcon } from '@/components/menu/categoryIcon'

export interface LayoutProps {
  categories: Category[]
  items: Item[]
  businessId: string
}

export function MercadoLayout({ categories, items, businessId: _businessId }: LayoutProps) {
  const openItem = useMenuStore((s) => s.openItem)
  const requestJump = useMenuStore((s) => s.requestJump)
  const { activeId, register } = useScrollCategorySync(categories)

  return (
    <div style={{ background: 'var(--bg)', color: 'var(--txt)' }}>
      {/* Sticky pill nav */}
      <nav
        className="sticky top-0 z-30 overflow-x-auto px-4 py-3 lg:px-8"
        style={{ background: 'var(--glass)', backdropFilter: 'blur(14px)', borderBottom: '1px solid var(--bdr)' }}
      >
        <div className="flex gap-2 lg:mx-auto lg:max-w-5xl">
        {categories.map((cat) => {
          const active = activeId === cat.id
          return (
            <button
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
        {categories.map((cat) => {
          const catItems = items.filter((i) => i.category_id === cat.id)
          const Icon = getCategoryIcon(cat.icon)
          return (
            <section key={cat.id} data-cat={cat.id} ref={register(cat.id)} className="scroll-mt-16">
              {/* Sticky band heading — sits just below the pill nav (~52px tall) */}
              <div
                className="sticky z-20 px-4 py-3 md:px-8 md:py-4"
                style={{ top: 52, background: 'var(--sf1)', borderBottom: '1px solid var(--bdr)' }}
              >
                <h2 className="text-xl font-black uppercase tracking-widest md:text-2xl" style={{ fontFamily: 'var(--font-display)', color: 'var(--brand)' }}>
                  {cat.name}
                </h2>
                {cat.description && <p className="mt-0.5 text-xs" style={{ color: 'var(--txt2)' }}>{cat.description}</p>}
              </div>

              <div className="grid grid-cols-2 gap-px min-[480px]:grid-cols-3 md:grid-cols-3 lg:grid-cols-4" style={{ background: 'var(--bdr)' }}>
                {catItems.map((item, idx) => {
                  const imgUrl = cdnUrl(itemImageKey(item))
                  return (
                    <m.button
                      key={item.id}
                      custom={idx}
                      variants={diagonalReveal}
                      initial="hidden"
                      whileInView="show"
                      viewport={{ once: true, margin: '-40px' }}
                      whileTap={{ scale: 0.97 }}
                      whileHover={{ scale: 1.02 }}
                      onClick={() => { openItem(item); track('item_view', { business_id: item.business_id, item_id: item.id }) }}
                      className={`relative overflow-hidden text-left ${imgUrl ? 'aspect-square' : ''}`}
                      style={{ background: 'var(--sf2)', opacity: item.is_available ? 1 : 0.5 }}
                    >
                      {imgUrl ? (
                        <>
                          <Image src={imgUrl} alt={item.name} fill className="object-cover transition-transform duration-500 hover:scale-105" sizes="(max-width:768px) 50vw, (max-width:1024px) 33vw, 25vw" />
                          <div className="absolute inset-x-0 bottom-0 h-2/3 bg-gradient-to-t from-black/85 to-transparent pointer-events-none" />
                          <div className="absolute inset-x-0 bottom-0 p-2">
                            <div className="flex items-end justify-between gap-1">
                              <span className="flex-1 truncate text-sm font-bold text-white" style={{ fontFamily: 'var(--font-display)' }}>{item.name}</span>
                              {item.compare_price && item.compare_price > item.price && <s className="opacity-50 font-normal mr-1.5 text-[0.85em]">{formatPrice(item.compare_price)}</s>}
                              <span className="shrink-0 text-sm font-black" style={{ color: 'var(--brand2, var(--brand))', fontFamily: 'var(--font-display)' }}>{formatPrice(item.price)}</span>
                            </div>
                            <div className="mt-1 flex items-center gap-1.5">
                              <VegMark dietary={item.dietary} size="xs" />
                              {item.badge && <ItemBadge badge={item.badge} />}
                              {!item.is_available && <span className="rounded-full bg-black/60 px-1.5 py-0.5 text-[9px] font-semibold uppercase text-white">Sold out</span>}
                            </div>
                          </div>
                        </>
                      ) : (
                        <div className="flex flex-col p-3 h-full min-h-[100px] relative">
                          <Icon size={72} className="absolute -right-4 -bottom-4 opacity-5 pointer-events-none" style={{ color: 'var(--brand)', transform: 'rotate(-10deg)' }} />
                          <div className="flex items-start justify-between gap-2">
                            <span className="text-sm font-bold" style={{ fontFamily: 'var(--font-display)', color: 'var(--txt)' }}>{item.name}</span>
                            {item.compare_price && item.compare_price > item.price && <s className="opacity-50 font-normal mr-1.5 text-[0.85em]">{formatPrice(item.compare_price)}</s>}
                            <span className="shrink-0 text-sm font-black" style={{ color: 'var(--brand)', fontFamily: 'var(--font-display)' }}>{formatPrice(item.price)}</span>
                          </div>
                          {item.description && (
                            <p className="mt-1 text-[11px] leading-snug line-clamp-2" style={{ color: 'var(--txt2)' }}>{item.description}</p>
                          )}
                          <div className="mt-auto pt-3 flex flex-wrap items-center gap-1.5">
                            <VegMark dietary={item.dietary} size="xs" />
                            {item.badge && <ItemBadge badge={item.badge} />}
                            {!item.is_available && <span className="rounded-full px-1.5 py-0.5 text-[9px] font-semibold uppercase" style={{ background: 'var(--bdr)', color: 'var(--txt3)' }}>Sold out</span>}
                          </div>
                        </div>
                      )}
                    </m.button>
                  )
                })}
              </div>
            </section>
          )
        })}
      </div>
    </div>
  )
}
