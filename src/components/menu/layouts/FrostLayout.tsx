'use client'

// FrostLayout — Ice Cream / Dessert / Sweet Cafe
// Playful pastel tabs (each its own colour). Each category is one "flavour room".
// Swipeable. 2-col circular-top cards that pop in on switch.

import Image from 'next/image'
import { m, AnimatePresence } from 'framer-motion'
import { cdnUrl, itemImageKey } from '@/types/database'
import { useMenuStore } from '@/stores/menu'
import { useTabCategorySync, useSwipeCategory } from '@/components/menu/useCategorySync'
import { track } from '@/lib/firebase'
import { VegMark, ItemBadge } from '@/components/menu/badges'
import { formatPrice } from '@/lib/utils'
import { getCategoryIcon } from '@/components/menu/categoryIcon'
import type { LayoutProps } from './MercadoLayout'

const PILL_COLORS = ['var(--brand)', 'var(--brand2)', 'var(--brand3)']
const BG_COLORS = ['var(--sf1)', 'var(--sf2)']

export function FrostLayout({ categories, items, businessId: _businessId }: LayoutProps) {
  const openItem = useMenuStore((s) => s.openItem)
  const requestJump = useMenuStore((s) => s.requestJump)
  const { activeId, setActiveId } = useTabCategorySync(categories)
  const { onDragEnd } = useSwipeCategory(categories, activeId, setActiveId)
  const activeIdx = categories.findIndex((c) => c.id === activeId)
  const Icon = getCategoryIcon(categories.find((c) => c.id === activeId)?.icon)
  const catItems = items.filter((i) => i.category_id === activeId)

  return (
    <div style={{ background: 'var(--bg)', color: 'var(--txt)' }}>
      {/* Colorful pill nav */}
      <div className="sticky top-0 z-30 flex gap-2 overflow-x-auto px-4 py-3" style={{ background: 'var(--glass)', backdropFilter: 'blur(12px)', borderBottom: '1px solid var(--bdr)' }}>
        {categories.map((cat, i) => {
          const pillColor = PILL_COLORS[i % PILL_COLORS.length]
          const isActive = cat.id === activeId
          return (
            <m.button
              key={cat.id}
              onClick={() => requestJump(cat.id)}
              whileTap={{ scale: 0.92 }}
              animate={isActive ? { scale: [1, 1.12, 1] } : { scale: 1 }}
              transition={{ type: 'spring', stiffness: 500, damping: 18 }}
              className="shrink-0 rounded-full px-4 py-2 text-sm font-semibold"
              style={{ background: isActive ? pillColor : 'var(--sf1)', color: isActive ? 'var(--bg)' : 'var(--txt2)', border: `2px solid ${isActive ? pillColor : 'var(--bdr)'}` }}
            >
              {cat.name}
            </m.button>
          )
        })}
      </div>

      <AnimatePresence mode="wait">
        <m.div
          key={activeId}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          drag="x"
          dragDirectionLock
          dragConstraints={{ left: 0, right: 0 }}
          dragElastic={0.18}
          onDragEnd={onDragEnd}
          style={{ touchAction: 'pan-y' }}
          className="grid grid-cols-1 gap-4 p-4 min-[400px]:grid-cols-2 lg:grid-cols-3 lg:gap-5 lg:p-6"
        >
          {catItems.map((item, idx) => {
            const imgUrl = cdnUrl(itemImageKey(item))
            const cardBg = BG_COLORS[idx % BG_COLORS.length]
            return (
              <m.button
                key={item.id}
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ delay: idx * 0.05, type: 'spring', stiffness: 360, damping: 24 }}
                whileTap={{ scale: 0.97 }}
                onClick={() => { openItem(item); track('item_view', { business_id: item.business_id, item_id: item.id }) }}
                className="flex flex-col overflow-hidden rounded-3xl text-left"
                style={{ background: cardBg, border: '1px solid var(--bdr)', opacity: item.is_available ? 1 : 0.55 }}
              >
                <div className="relative overflow-hidden" style={{ aspectRatio: '1', borderRadius: '50% 50% 0 0', background: 'var(--sf2)' }}>
                  {imgUrl ? (
                    <Image src={imgUrl} alt={item.name} fill className="object-cover" sizes="(max-width:768px) 50vw, 33vw" />
                  ) : (
                    <div className="flex h-full w-full items-center justify-center"><Icon size={32} style={{ color: 'var(--brand2)' }} /></div>
                  )}
                </div>
                <div className="flex flex-col gap-1 p-3">
                  <p className="text-sm font-semibold leading-snug" style={{ fontFamily: 'var(--font-display)', color: 'var(--txt)' }}>{item.name}</p>
                  {item.description && <p className="line-clamp-2 text-xs" style={{ color: 'var(--txt2)' }}>{item.description}</p>}
                  <div className="mt-1 flex flex-wrap items-center justify-between gap-1">
                    <span className="rounded-full px-2.5 py-0.5 text-xs font-bold" style={{ background: PILL_COLORS[activeIdx % PILL_COLORS.length], color: 'var(--bg)' }}>{formatPrice(item.price)}</span>
                    <div className="flex items-center gap-1"><VegMark dietary={item.dietary} size="xs" />{item.badge && <ItemBadge badge={item.badge} />}</div>
                  </div>
                  {!item.is_available && <p className="text-[10px] uppercase tracking-wide" style={{ color: 'var(--txt3)' }}>🍦 Sold out</p>}
                </div>
              </m.button>
            )
          })}
          {catItems.length === 0 && <p className="col-span-2 py-12 text-center text-sm" style={{ color: 'var(--txt3)' }}>No treats here yet.</p>}
        </m.div>
      </AnimatePresence>
    </div>
  )
}
