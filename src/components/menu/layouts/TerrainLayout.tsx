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
import type { LayoutProps } from './MercadoLayout'

export function TerrainLayout({ categories, items, businessId: _businessId }: LayoutProps) {
  const openItem = useMenuStore((s) => s.openItem)
  const [openId, setOpenId] = useState<string>(categories[0]?.id ?? '')

  const toggle = (id: string) => setOpenId((prev) => (prev === id ? '' : id))

  return (
    <div style={{ background: 'var(--bg)', color: 'var(--txt)' }}>
      {/* Scrollable breadcrumb nav */}
      <div
        className="sticky top-0 z-30 px-5 py-2.5"
        style={{ background: 'var(--glass)', backdropFilter: 'blur(12px)', borderBottom: '1px solid var(--bdr)' }}
      >
        <nav className="flex gap-x-1.5 overflow-x-auto text-xs uppercase tracking-widest">
          {categories.map((cat, idx) => (
            <span key={cat.id} className="flex shrink-0 items-center gap-1.5">
              {idx > 0 && <span style={{ color: 'var(--bdr2)' }}>·</span>}
              <button
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
              <button
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
                    className="text-base font-semibold uppercase tracking-[0.18em] md:text-lg"
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

              {/* Accordion body with height animation */}
              <AnimatePresence initial={false}>
                {isOpen && (
                  <m.div
                    key="body"
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
                    style={{ overflow: 'hidden' }}
                  >
                    <div className="md:grid md:grid-cols-2 md:gap-4 md:px-4 md:py-4 lg:grid-cols-3 lg:gap-5 lg:px-6">
                      {catItems.map((item, idx) => {
                        const imgUrl = cdnUrl(itemImageKey(item))
                        return (
                          <m.button
                            key={item.id}
                            initial={{ opacity: 0, x: idx % 2 === 0 ? -20 : 20 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ duration: 0.35, delay: idx * 0.04, ease: [0.22, 1, 0.36, 1] }}
                            whileTap={{ scale: 0.99 }}
                            whileHover={{ y: -3, boxShadow: '0 8px 30px rgba(0,0,0,0.12)' }}
                            onClick={() => { openItem(item); track('item_view', { business_id: item.business_id, item_id: item.id }) }}
                            className="flex w-full items-center gap-4 px-5 py-4 text-left md:rounded-lg md:px-4"
                            style={{ borderBottom: '1px solid var(--bdr)', opacity: item.is_available ? 1 : 0.5 }}
                          >
                            <div
                              className="relative h-20 w-20 shrink-0 overflow-hidden rounded md:h-24 md:w-24"
                              style={{ background: 'var(--sf2)' }}
                            >
                              {imgUrl
                                ? <Image src={imgUrl} alt={item.name} fill className="object-cover" sizes="(max-width:768px) 80px, 96px" />
                                : <div className="flex h-full w-full items-center justify-center"><Icon size={24} style={{ color: 'var(--txt3)' }} /></div>
                              }
                            </div>
                            <div className="min-w-0 flex-1">
                              <div className="flex items-baseline justify-between gap-2">
                                <span className="truncate text-sm font-semibold" style={{ fontFamily: 'var(--font-display)', color: 'var(--txt)' }}>{item.name}</span>
                                <span className="shrink-0 text-sm font-medium" style={{ color: 'var(--brand)', fontFamily: 'var(--font-body)' }}>{formatPrice(item.price)}</span>
                              </div>
                              {item.description && (
                                <p className="mt-1 line-clamp-2 text-xs leading-relaxed" style={{ color: 'var(--txt2)' }}>{item.description}</p>
                              )}
                              <div className="mt-1.5 flex items-center gap-2">
                                <VegMark dietary={item.dietary} size="xs" />
                                {item.badge && <ItemBadge badge={item.badge} />}
                                {!item.is_available && <span className="text-[10px] uppercase tracking-wide" style={{ color: 'var(--txt3)' }}>Sold out</span>}
                              </div>
                            </div>
                          </m.button>
                        )
                      })}
                      {catItems.length === 0 && (
                        <p className="px-5 py-8 text-sm" style={{ color: 'var(--txt3)' }}>No items in this category.</p>
                      )}
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
