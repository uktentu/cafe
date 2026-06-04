'use client'

// ProvenanceLayout — Premium white, organic/wellness
// Mobile: underline text tabs at top. Tablet (md+): fixed left sidebar 220px.
// Editorial rows (image left, rich text right). Blur-rise reveals per row.

import Image from 'next/image'
import { m, AnimatePresence } from 'framer-motion'
import { cdnUrl, itemImageKey } from '@/types/database'
import { useMenuStore } from '@/stores/menu'
import { useTabCategorySync } from '@/components/menu/useCategorySync'
import { track } from '@/lib/firebase'
import { VegMark, ItemBadge } from '@/components/menu/badges'
import { formatPrice } from '@/lib/utils'
import { getCategoryIcon } from '@/components/menu/categoryIcon'
import type { LayoutProps } from './MercadoLayout'

export function ProvenanceLayout({ categories, items, businessId: _businessId }: LayoutProps) {
  const openItem = useMenuStore((s) => s.openItem)
  const requestJump = useMenuStore((s) => s.requestJump)
  const { activeId } = useTabCategorySync(categories)
  const catItems = items.filter((i) => i.category_id === activeId)

  return (
    <div style={{ background: 'var(--bg)', color: 'var(--txt)' }}>
      {/* Mobile top tab nav — hidden on tablet */}
      <nav className="sticky top-0 z-30 flex overflow-x-auto md:hidden" style={{ background: 'var(--glass)', backdropFilter: 'blur(12px)', borderBottom: '1px solid var(--bdr2)' }}>
        {categories.map((cat) => (
          <button
            key={cat.id}
            onClick={() => requestJump(cat.id)}
            className="relative shrink-0 px-5 py-4 text-sm font-medium transition-colors"
            style={{ color: activeId === cat.id ? 'var(--brand)' : 'var(--txt2)', fontFamily: 'var(--font-body)' }}
          >
            {cat.name}
            {activeId === cat.id && <m.span layoutId="provenance-underline" className="absolute inset-x-0 bottom-0 h-[2px]" style={{ background: 'var(--brand)' }} />}
          </button>
        ))}
      </nav>

      {/* Tablet sidebar — fixed left, hidden on mobile */}
      <aside
        className="hidden md:flex md:flex-col"
        style={{ position: 'fixed', top: 0, left: 0, bottom: 0, width: 220, background: 'var(--sf1)', borderRight: '1px solid var(--bdr)', zIndex: 30, overflowY: 'auto', padding: '2rem 1.25rem' }}
      >
        <p className="mb-6 text-[10px] font-semibold uppercase tracking-[0.4em]" style={{ color: 'var(--brand)' }}>Menu</p>
        <nav className="flex flex-col gap-1">
          {categories.map((cat) => {
            const active = activeId === cat.id
            return (
              <button
                key={cat.id}
                onClick={() => requestJump(cat.id)}
                className="relative flex items-center gap-2 rounded px-3 py-2.5 text-left text-sm transition-colors"
                style={{ color: active ? 'var(--brand)' : 'var(--txt2)', fontFamily: 'var(--font-body)', fontWeight: active ? 600 : 400, background: active ? 'var(--sf2)' : 'transparent' }}
              >
                {active && <m.span layoutId="provenance-sidebar-indicator" className="absolute left-0 top-1 bottom-1 w-[3px] rounded-full" style={{ background: 'var(--brand)' }} />}
                <span className="pl-1">{cat.name}</span>
              </button>
            )
          })}
        </nav>
      </aside>

      {/* Content area — offset by sidebar on tablet */}
      <div className="md:ml-[220px]">
        <AnimatePresence mode="wait">
          <m.div
            key={activeId}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.3 }}
            className="mx-auto max-w-2xl px-4 py-6 md:max-w-none md:px-8 lg:max-w-4xl lg:px-12"
          >
            {catItems.map((item, idx) => {
              const imgUrl = cdnUrl(itemImageKey(item))
              const Icon = getCategoryIcon(categories.find((c) => c.id === item.category_id)?.icon)
              return (
                <m.button
                  key={item.id}
                  initial={{ opacity: 0, y: 16, filter: 'blur(6px)' }}
                  animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
                  transition={{ duration: 0.45, delay: idx * 0.06 }}
                  whileHover={{ x: 4 }}
                  onClick={() => { openItem(item); track('item_view', { business_id: item.business_id, item_id: item.id }) }}
                  className="flex w-full items-start gap-5 py-6 text-left"
                  style={{ borderBottom: idx < catItems.length - 1 ? '1px solid var(--bdr2)' : 'none', opacity: item.is_available ? 1 : 0.5 }}
                >
                  {imgUrl && (
                    <div className="relative h-24 w-24 shrink-0 overflow-hidden rounded-lg md:h-32 md:w-32" style={{ background: 'var(--sf1)' }}>
                      <Image src={imgUrl} alt={item.name} fill className="object-cover" sizes="(max-width:768px) 96px, 128px" />
                    </div>
                  )}
                  <div className="min-w-0 flex-1">
                    <div className="flex items-start justify-between gap-3">
                      <h3 className="text-lg leading-snug flex items-start gap-2" style={{ fontFamily: 'var(--font-display)', color: 'var(--txt)', fontStyle: 'italic' }}>
                        {!imgUrl && <Icon size={20} className="mt-1 opacity-40 shrink-0" style={{ color: 'var(--brand)' }} />}
                        {item.name}
                      </h3>
                      {item.compare_price && item.compare_price > item.price && <s className="opacity-50 font-normal mr-1.5 text-[0.85em]">{formatPrice(item.compare_price)}</s>}
                      <span className="shrink-0 text-base font-semibold" style={{ color: 'var(--brand)', fontFamily: 'var(--font-body)' }}>{formatPrice(item.price)}</span>
                    </div>
                    {item.description && <p className={`mt-1.5 text-sm leading-relaxed ${imgUrl ? 'line-clamp-2' : ''}`} style={{ color: 'var(--txt2)' }}>{item.description}</p>}
                    <div className="mt-2 flex items-center gap-2">
                      <VegMark dietary={item.dietary} size="xs" />
                      {item.badge && <ItemBadge badge={item.badge} />}
                      {!item.is_available && <span className="rounded-full px-2 py-0.5 text-[10px] font-medium uppercase tracking-wide" style={{ background: 'var(--sf1)', color: 'var(--txt3)' }}>Sold out</span>}
                    </div>
                  </div>
                </m.button>
              )
            })}
            {catItems.length === 0 && <p className="py-12 text-center text-sm" style={{ color: 'var(--txt3)' }}>No items in this category.</p>}
          </m.div>
        </AnimatePresence>
      </div>
    </div>
  )
}
