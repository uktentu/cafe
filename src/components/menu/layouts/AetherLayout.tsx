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
import { formatPrice } from '@/lib/utils'
import { getCategoryIcon } from '@/components/menu/categoryIcon'
import type { LayoutProps } from './MercadoLayout'

export function AetherLayout({ categories, items, businessId: _businessId }: LayoutProps) {
  const openItem = useMenuStore((s) => s.openItem)
  const { register } = useScrollCategorySync(categories)

  return (
    <div style={{ background: 'var(--bg)', color: 'var(--txt)' }}>
      <style>{`.aether-grid{column-count:2;column-gap:1rem}@media(min-width:768px){.aether-grid{column-count:3}}@media(min-width:1024px){.aether-grid{column-count:4;column-gap:1.25rem}}`}</style>

      <div className="px-4 py-6 md:px-8 lg:px-10">
        {categories.map((cat) => {
          const catItems = items.filter((i) => i.category_id === cat.id)
          const Icon = getCategoryIcon(cat.icon)
          return (
            <section key={cat.id} data-cat={cat.id} ref={register(cat.id)} className="mb-12 scroll-mt-16">
              {/* Sticky section label — sticks at top-0 (Aether has no inline sticky nav) */}
              <div
                className="sticky z-20 mb-6 flex items-center gap-4 py-2"
                style={{ top: 0, background: 'var(--bg)', backdropFilter: 'blur(12px)' }}
              >
                <div className="h-px flex-1" style={{ background: 'var(--bdr)' }} />
                <h2 className="text-center text-sm font-bold uppercase tracking-[0.25em] md:tracking-[0.3em]" style={{ fontFamily: 'var(--font-display)', color: 'var(--txt)' }}>{cat.name}</h2>
                <div className="h-px flex-1" style={{ background: 'var(--bdr)' }} />
              </div>

              <div className="aether-grid">
                {catItems.map((item, idx) => {
                  const imgUrl = cdnUrl(itemImageKey(item))
                  const hasImage = !!imgUrl
                  return (
                    <m.button
                      key={item.id}
                      initial={{ opacity: 0, y: 24, scale: 0.96 }}
                      whileInView={{ opacity: 1, y: 0, scale: 1 }}
                      viewport={{ once: true, margin: '-30px' }}
                      transition={{ duration: 0.5, delay: (idx % 3) * 0.08, ease: [0.22, 1, 0.36, 1] }}
                      whileTap={{ scale: 0.98 }}
                      whileHover={{ y: -6, boxShadow: '0 12px 40px rgba(0,0,0,0.1)' }}
                      onClick={() => { openItem(item); track('item_view', { business_id: item.business_id, item_id: item.id }) }}
                      className="mb-4 inline-block w-full overflow-hidden rounded-3xl text-left align-top"
                      style={{ breakInside: 'avoid', background: 'var(--sf1)', boxShadow: '0 4px 24px rgba(0,0,0,0.06)', border: '1px solid var(--bdr)', opacity: item.is_available ? 1 : 0.5 }}
                    >
                      {hasImage && (
                        <div className="relative aspect-[4/3] overflow-hidden" style={{ borderRadius: '24px 24px 0 0' }}>
                          <Image src={imgUrl!} alt={item.name} fill className="object-cover" sizes="(max-width:768px) 50vw, 33vw" />
                        </div>
                      )}
                      <div className={hasImage ? 'p-4' : 'p-5'}>
                        {!hasImage && (
                          <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-full" style={{ background: 'var(--brand-dim, var(--sf2))' }}><Icon size={20} style={{ color: 'var(--brand)' }} /></div>
                        )}
                        <h3 className="text-sm font-semibold leading-snug" style={{ fontFamily: 'var(--font-display)', color: 'var(--txt)' }}>{item.name}</h3>
                        {item.description && <p className="mt-1.5 line-clamp-3 text-xs leading-relaxed" style={{ color: 'var(--txt2)' }}>{item.description}</p>}
                        <div className="mt-3 flex items-center justify-between gap-2">
                          <div className="flex items-center gap-1.5">
                            <VegMark dietary={item.dietary} size="xs" />
                            {item.badge && <ItemBadge badge={item.badge} />}
                            {!item.is_available && <span className="text-[10px] font-medium uppercase" style={{ color: 'var(--txt3)' }}>Sold out</span>}
                          </div>
                          <span className="shrink-0 text-sm font-bold" style={{ color: 'var(--brand)', fontFamily: 'var(--font-body)' }}>{formatPrice(item.price)}</span>
                        </div>
                      </div>
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
