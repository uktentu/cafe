'use client'

// StudioLayout — Art gallery, tactile textures
// Each category is a labelled gallery block: a borderless grid of square cells.
// Default shows the image only; hover/tap reveals name + price from the bottom.
// Scroll-sync feeds the ThumbDock. Monospace prices.

import { useState } from 'react'
import Image from 'next/image'
import { m } from 'framer-motion'
import type { Category, Item } from '@/types/database'
import { cdnUrl, itemImageKey } from '@/types/database'
import { useMenuStore } from '@/stores/menu'
import { useScrollCategorySync } from '@/components/menu/useCategorySync'
import { track } from '@/lib/firebase'
import { VegMark, ItemBadge } from '@/components/menu/badges'
import { formatPrice } from '@/lib/utils'
import { getCategoryIcon } from '@/components/menu/categoryIcon'
import type { LucideIcon } from 'lucide-react'
import type { LayoutProps } from './MercadoLayout'

function GalleryCell({ item, Icon, idx }: { item: Item; Icon: LucideIcon; idx: number }) {
  const openItem = useMenuStore((s) => s.openItem)
  const [revealed, setRevealed] = useState(false)
  const imgUrl = cdnUrl(itemImageKey(item))

  function tap() {
    if (!revealed) setRevealed(true)
    else { openItem(item); track('item_view', { business_id: item.business_id, item_id: item.id }) }
  }

  return (
    <m.button
      initial={{ opacity: 0 }}
      whileInView={{ opacity: item.is_available ? 1 : 0.6 }}
      viewport={{ once: true, margin: '-30px' }}
      transition={{ duration: 0.4, delay: (idx % 4) * 0.05 }}
      className="group relative aspect-square overflow-hidden transition-transform duration-300"
      style={{ background: 'var(--sf2)', borderRight: '1px solid var(--bdr)', borderBottom: '1px solid var(--bdr)' }}
      onClick={tap}
      onMouseEnter={() => setRevealed(true)}
      onMouseLeave={() => setRevealed(false)}
      aria-label={`${item.name} — ${formatPrice(item.price)}`}
    >
      {imgUrl ? (
        <Image src={imgUrl} alt={item.name} fill className="object-cover transition-transform duration-500 group-hover:scale-105" sizes="(max-width:768px) 50vw, (max-width:1024px) 33vw, 25vw" />
      ) : (
        <div className="absolute inset-0 flex items-center justify-center" style={{ background: 'repeating-linear-gradient(45deg, var(--sf1) 0px, var(--sf1) 2px, var(--sf2) 2px, var(--sf2) 14px)' }}>
          <Icon size={30} style={{ color: 'var(--txt3)', opacity: 0.5 }} />
        </div>
      )}
      {!item.is_available && (
        <div className="absolute left-2 top-2 rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase" style={{ background: 'rgba(0,0,0,0.6)', color: '#fff' }}>Sold out</div>
      )}
      <div className="absolute inset-x-0 bottom-0 flex flex-col justify-end px-3 pb-3 pt-10 transition-transform duration-300" style={{ background: 'linear-gradient(to top, rgba(0,0,0,0.85) 0%, transparent 100%)', transform: revealed ? 'translateY(0)' : 'translateY(100%)' }}>
        <div className="flex items-end justify-between gap-2">
          <div className="min-w-0">
            <p className="truncate text-sm font-semibold leading-tight text-white" style={{ fontFamily: 'var(--font-display)' }}>{item.name}</p>
            <div className="mt-1 flex items-center gap-1.5"><VegMark dietary={item.dietary} size="xs" />{item.badge && <ItemBadge badge={item.badge} />}</div>
          </div>
          <span className="shrink-0 text-sm font-bold text-white" style={{ fontFamily: 'monospace', letterSpacing: '0.03em' }}>{formatPrice(item.price)}</span>
        </div>
      </div>
    </m.button>
  )
}

export function StudioLayout({ categories, items, businessId: _businessId }: LayoutProps) {
  const { register } = useScrollCategorySync(categories)
  const catMap: Record<string, Category> = Object.fromEntries(categories.map((c) => [c.id, c]))

  return (
    <div style={{ background: 'var(--bg)', color: 'var(--txt)' }}>
      {categories.map((cat) => {
        const catItems = items.filter((i) => i.category_id === cat.id)
        return (
          <section key={cat.id} data-cat={cat.id} ref={register(cat.id)} className="scroll-mt-16">
            {/* Sticky block label — sticks at top-0 (Studio has no inline sticky nav) */}
            <div
              className="sticky z-20 flex items-center justify-between border-b border-t px-4 py-3 md:px-6 md:py-4"
              style={{ top: 0, background: 'var(--bg)', backdropFilter: 'blur(10px)', borderColor: 'var(--bdr2)' }}
            >
              <h2 className="text-xs font-bold uppercase tracking-[0.25em] md:text-sm" style={{ fontFamily: 'var(--font-display)', color: 'var(--brand2, var(--brand))' }}>{cat.name}</h2>
              <span className="font-mono text-xs" style={{ color: 'var(--txt3)' }}>{String(catItems.length).padStart(2, '0')}</span>
            </div>
            <div className="grid grid-cols-1 min-[420px]:grid-cols-2 md:grid-cols-3 lg:grid-cols-4" style={{ borderLeft: '1px solid var(--bdr)' }}>
              {catItems.map((item, idx) => {
                const Icon = getCategoryIcon(catMap[item.category_id ?? '']?.icon)
                return <GalleryCell key={item.id} item={item} Icon={Icon} idx={idx} />
              })}
            </div>
          </section>
        )
      })}
    </div>
  )
}
