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
import { blurRise } from '@/components/menu/scrollVariants'
const PROVENANCE_STYLES = `
  @keyframes seal-stamp {
    0%   { transform: scale(3) rotate(-20deg); opacity: 0; filter: blur(8px); }
    60%  { transform: scale(0.9) rotate(2deg); opacity: 1; filter: blur(0); }
    80%  { transform: scale(1.05) rotate(-1deg); }
    100% { transform: scale(1) rotate(0deg); opacity: 1; }
  }
  .wax-seal { animation: seal-stamp 0.6s cubic-bezier(0.34,1.56,0.64,1) forwards; }
`
import { getCategoryIcon } from '@/components/menu/categoryIcon'
import type { LayoutProps } from './MercadoLayout'

export function ProvenanceLayout({ categories, items, businessId: _businessId }: LayoutProps) {
  const openItem = useMenuStore((s) => s.openItem)
  const requestJump = useMenuStore((s) => s.requestJump)
  const { activeId } = useTabCategorySync(categories)
  const catItems = items.filter((i) => i.category_id === activeId)

  return (
    <div className="relative" style={{ background: 'var(--bg)', color: 'var(--txt)' }}>
      <style dangerouslySetInnerHTML={{ __html: PROVENANCE_STYLES }} />
      {/* Aged paper texture */}
      <div
        className="pointer-events-none fixed inset-0 z-0 opacity-[0.06] mix-blend-multiply"
        style={{ backgroundImage: 'url("data:image/svg+xml,%3Csvg viewBox=%220 0 200 200%22 xmlns=%22http://www.w3.org/2000/svg%22%3E%3Cfilter id=%22n%22%3E%3CfeTurbulence type=%22fractalNoise%22 baseFrequency=%220.9%22 numOctaves=%224%22 stitchTiles=%22stitch%22/%3E%3C/filter%3E%3Crect width=%22100%25%22 height=%22100%25%22 filter=%22url(%23n)%22/%3E%3C/svg%3E")' }}
      />
      {/* Mobile top tab nav — hidden on tablet */}
      <nav className="sticky top-[var(--menu-tabs-offset,0px)] z-30 flex overflow-x-auto md:hidden" style={{ background: 'var(--glass)', backdropFilter: 'blur(12px)', borderBottom: '1px solid var(--bdr2)' }}>
        {categories.map((cat) => (
          <button id={`nav-btn-${cat.id}`}
            key={cat.id}
            onClick={() => requestJump(cat.id)}
            className="relative shrink-0 px-5 py-4 text-sm font-medium transition-colors"
            style={{ color: activeId === cat.id ? 'var(--brand)' : 'var(--txt2)', fontFamily: 'var(--font-body)' }}
          >
            {cat.name}
            {activeId === cat.id && <m.span layoutId="provenance-mobile-underline" className="absolute inset-x-0 bottom-0 h-[2px]" style={{ background: 'var(--brand)' }} />}
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
              <button id={`nav-btn-${cat.id}`}
                key={cat.id}
                onClick={() => requestJump(cat.id)}
                className="relative flex items-center gap-2 rounded px-3 py-2.5 text-left text-sm transition-colors"
                style={{ color: active ? 'var(--brand)' : 'var(--txt2)', fontFamily: 'var(--font-body)', fontWeight: active ? 600 : 400, background: active ? 'var(--sf2)' : 'transparent' }}
              >
                {active && <m.span layoutId="provenance-desktop-sidebar-indicator" className="absolute left-0 top-1 bottom-1 w-[3px] rounded-full" style={{ background: 'var(--brand)' }} />}
                <span className="pl-1">{cat.name}</span>
              </button>
            )
          })}
        </nav>
        {/* Wax seal watermark */}
        <div className="mt-auto pt-6 text-center">
          <div
            key={activeId}
            className="wax-seal inline-block text-5xl"
            style={{ color: 'var(--brand)', opacity: 0.7, filter: 'drop-shadow(0 4px 12px var(--brand))' }}
          >
            ⊕
          </div>
        </div>
      </aside>

      {/* Content area — offset by sidebar on tablet */}
      <div className="md:ml-[220px] relative z-10" style={{ perspective: '1200px' }}>
        <AnimatePresence mode="wait">
          <m.div
            key={activeId}
            initial={{ opacity: 0, rotateY: 6, x: 40 }}
            animate={{ opacity: 1, rotateY: 0, x: 0 }}
            exit={{ opacity: 0, rotateY: -6, x: -40 }}
            transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
            className="mx-auto max-w-2xl px-4 py-6 md:max-w-none md:px-8 lg:max-w-4xl lg:px-12"
          >
            {catItems.map((item, idx) => {
              const imgUrl = cdnUrl(itemImageKey(item))
              const Icon = getCategoryIcon(categories.find((c) => c.id === item.category_id)?.icon)
              return (
                <m.button
                  key={item.id}
                  custom={idx}
                  variants={blurRise}
                  initial="hidden"
                  whileInView="show"
                  viewport={{ once: true, margin: '-20px' }}
                  whileHover={{ x: 4 }}
                  onClick={() => { openItem(item); track('item_view', { business_id: item.business_id, item_id: item.id }) }}
                  className="group flex w-full items-start gap-5 py-6 text-left last:pb-0"
                  style={{ borderBottom: idx < catItems.length - 1 ? '1px solid var(--bdr2)' : 'none', opacity: item.is_available ? 1 : 0.5 }}
                >
                  {imgUrl && (
                    <div className="relative h-24 w-24 shrink-0 overflow-hidden rounded-lg md:h-32 md:w-32" style={{ background: 'var(--sf1)' }}>
                      <Image 
                        src={imgUrl} 
                        alt={item.name} 
                        fill 
                        className="object-cover transition-all duration-700 sepia-[0.8] group-hover:sepia-0 group-hover:scale-105" 
                        sizes="(max-width:768px) 96px, 128px" 
                      />
                    </div>
                  )}
                  <div className="min-w-0 flex-1">
                    <div className="flex items-start justify-between gap-3">
                      <h3 className="text-lg leading-snug flex items-start gap-2 flex-1 min-w-0" style={{ fontFamily: 'var(--font-display)', color: 'var(--txt)', fontStyle: 'italic', fontSynthesis: 'none' }}>
                        {!imgUrl && <Icon size={20} className="mt-1 opacity-40 shrink-0" style={{ color: 'var(--brand)' }} />}
                        <span className="truncate whitespace-normal line-clamp-2">{item.name}</span>
                      </h3>
                      <div className="flex flex-col items-end shrink-0 gap-0.5 mt-1">
                        {item.compare_price && item.compare_price > item.price && <s className="opacity-50 font-normal text-[10px] leading-none">{formatPrice(item.compare_price)}</s>}
                        <span className="text-base font-semibold leading-none" style={{ color: 'var(--brand)', fontFamily: 'var(--font-body)' }}>{formatPrice(item.price)}</span>
                      </div>
                    </div>
                    {item.description && <p className={`mt-1.5 text-sm leading-relaxed ${imgUrl ? 'line-clamp-2' : ''}`} style={{ color: 'var(--txt2)' }}>{item.description}</p>}
                    <div className="mt-2 flex items-center gap-2">
                      <VegMark dietary={item.dietary} size="xs" />
                      {item.badge && <ItemBadge badge={item.badge} />}
                      {!item.is_available && <span className="rounded-full px-2 py-0.5 text-[10px] font-medium uppercase tracking-wide" style={{ background: 'var(--sf1)', color: 'var(--txt3)' }}>Out</span>}
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
