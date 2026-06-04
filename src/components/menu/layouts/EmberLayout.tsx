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
import { formatPrice } from '@/lib/utils'
import { getCategoryIcon } from '@/components/menu/categoryIcon'
import type { LayoutProps } from './MercadoLayout'

export function EmberLayout({ categories, items, businessId: _businessId }: LayoutProps) {
  const openItem = useMenuStore((s) => s.openItem)
  const { activeId, setActiveId } = useTabCategorySync(categories)
  const cat = categories.find((c) => c.id === activeId)
  const Icon = getCategoryIcon(cat?.icon)
  const catItems = items.filter((i) => i.category_id === activeId)

  return (
    <div style={{ background: 'var(--bg)', color: 'var(--txt)' }}>
      {/* Block tabs — sticky, full-width horizontal */}
      <div
        className="sticky top-0 z-30 flex overflow-x-auto"
        style={{ background: 'var(--glass)', backdropFilter: 'blur(12px)', borderBottom: '2px solid var(--brand)' }}
      >
        {categories.map((c) => {
          const isActive = c.id === activeId
          return (
            <button
              key={c.id}
              onClick={() => setActiveId(c.id)}
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
          exit={{ opacity: 0 }}
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

          <div className="grid grid-cols-1 gap-3 p-4 xs:grid-cols-2 sm:grid-cols-2">
            {catItems.map((item, idx) => {
              const imgUrl = cdnUrl(itemImageKey(item))
              return (
                <m.button
                  key={item.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: idx * 0.05, duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
                  whileTap={{ scale: 0.97 }}
                  onClick={() => { openItem(item); track('item_view', { business_id: item.business_id, item_id: item.id }) }}
                  className="relative aspect-square overflow-hidden rounded-xl text-left"
                  style={{
                    background: 'var(--sf1)',
                    border: '1px solid var(--bdr)',
                    opacity: item.is_available ? 1 : 0.55,
                  }}
                >
                  {imgUrl
                    ? <Image src={imgUrl} alt={item.name} fill className="object-cover" sizes="(max-width:768px) 50vw, 33vw" />
                    : (
                      <div className="absolute inset-0 flex items-center justify-center" style={{ background: 'var(--sf2)' }}>
                        <Icon size={36} style={{ color: 'var(--brand)' }} />
                      </div>
                    )
                  }
                  <div
                    className="absolute inset-x-0 bottom-0 p-2 pt-8"
                    style={{ background: 'linear-gradient(to top, rgba(0,0,0,0.88) 0%, transparent 100%)' }}
                  >
                    <p
                      className="text-xs font-bold leading-tight"
                      style={{ color: 'var(--brand2)', fontFamily: 'var(--font-display)' }}
                    >
                      {item.name}
                    </p>
                    <div className="mt-1 flex items-center justify-between">
                      <span className="text-xs font-semibold" style={{ color: 'var(--brand2)' }}>
                        {formatPrice(item.price)}
                      </span>
                      <div className="flex items-center gap-1">
                        <VegMark dietary={item.dietary} size="xs" />
                        {item.badge && <ItemBadge badge={item.badge} />}
                      </div>
                    </div>
                    {!item.is_available && (
                      <span className="text-[9px] uppercase tracking-widest" style={{ color: 'var(--txt3)' }}>
                        Sold out
                      </span>
                    )}
                  </div>
                </m.button>
              )
            })}
            {catItems.length === 0 && (
              <p className="col-span-2 py-12 text-center text-sm" style={{ color: 'var(--txt3)' }}>No dishes here.</p>
            )}
          </div>

          {/* Chinese decorative divider */}
          <p className="py-4 text-center text-sm tracking-widest" style={{ color: 'var(--brand)' }}>◈ · · ◈ · · ◈</p>
        </m.div>
      </AnimatePresence>
    </div>
  )
}
