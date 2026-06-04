'use client'

// SakuraLayout — Girly / Women's Cafe
// Mobile: floating bottom pill nav above ThumbDock; single category at a time.
// Tablet (md+): fixed left sidebar (blush/rose themed, 220px) + content right.

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

const BG_PATTERN = {
  backgroundImage:
    'repeating-radial-gradient(circle at 20% 30%, rgba(var(--brand-rgb),0.07) 0px, rgba(var(--brand-rgb),0.07) 1.5px, transparent 1.5px, transparent 28px),' +
    'repeating-radial-gradient(circle at 75% 65%, rgba(var(--brand-rgb),0.07) 0px, rgba(var(--brand-rgb),0.07) 1.5px, transparent 1.5px, transparent 34px)',
  backgroundSize: '90px 90px, 110px 110px',
  backgroundAttachment: 'fixed' as const,
}

export function SakuraLayout({ categories, items, businessId: _businessId }: LayoutProps) {
  const openItem = useMenuStore((s) => s.openItem)
  const requestJump = useMenuStore((s) => s.requestJump)
  const { activeId } = useTabCategorySync(categories)
  const cat = categories.find((c) => c.id === activeId)
  const Icon = getCategoryIcon(cat?.icon)
  const catItems = items.filter((i) => i.category_id === activeId)

  return (
    <div className="relative min-h-svh" style={{ background: 'var(--bg)', color: 'var(--txt)', ...BG_PATTERN }}>
      {/* Tablet sidebar — fixed left, blush themed, hidden on mobile */}
      <aside
        className="hidden md:flex md:flex-col"
        style={{ position: 'fixed', top: 0, left: 0, bottom: 0, width: 220, background: 'var(--sf1)', borderRight: '1px solid var(--bdr)', zIndex: 30, overflowY: 'auto', padding: '2rem 1.25rem' }}
      >
        <p className="mb-6 text-[10px] font-semibold uppercase tracking-[0.4em]" style={{ color: 'var(--brand)', fontStyle: 'italic' }}>Menu</p>
        <nav className="flex flex-col gap-1">
          {categories.map((c) => {
            const active = c.id === activeId
            return (
              <button
                key={c.id}
                onClick={() => requestJump(c.id)}
                className="relative flex items-center rounded-2xl px-3 py-2.5 text-left text-sm transition-colors"
                style={{ color: active ? 'var(--brand)' : 'var(--txt2)', fontFamily: 'var(--font-body)', fontStyle: 'italic', fontWeight: active ? 600 : 400, background: active ? 'var(--sf2)' : 'transparent' }}
              >
                {active && <m.span layoutId="sakura-sidebar-indicator" className="absolute left-0 top-1 bottom-1 w-[3px] rounded-full" style={{ background: 'var(--brand)' }} />}
                <span className="pl-1">{c.name}</span>
              </button>
            )
          })}
        </nav>
        <div className="mt-auto py-4 text-center text-sm" style={{ color: 'var(--brand)', opacity: 0.4 }}>✦ ✦ ✦</div>
      </aside>

      {/* Content — offset on tablet, full-width on mobile */}
      <div className="md:ml-[220px]">
        <AnimatePresence mode="wait">
          <m.div
            key={activeId}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.32, ease: [0.22, 1, 0.36, 1] }}
            className="pb-52 pt-0 md:pb-10"
          >
            {/* Sticky category heading — sticks at top of the scrollable content area */}
            <div
              className="sticky z-20 mb-6 px-4 py-4 text-center"
              style={{ top: 0, background: 'var(--bg)', backdropFilter: 'blur(12px)', borderBottom: '1px solid var(--bdr)' }}
            >
              <h2 className="text-2xl md:text-3xl" style={{ fontFamily: 'var(--font-display)', fontStyle: 'italic', color: 'var(--brand)', letterSpacing: '0.02em' }}>
                {cat?.name}
              </h2>
              {cat?.description && (
                <p className="mt-0.5 text-xs tracking-widest" style={{ color: 'var(--txt2)' }}>{cat.description}</p>
              )}
            </div>

            <div className="mx-auto grid max-w-xl grid-cols-1 gap-3 md:max-w-2xl md:grid-cols-2 lg:max-w-4xl lg:grid-cols-3 lg:gap-4">
              {catItems.map((item, idx) => {
                const imgUrl = cdnUrl(itemImageKey(item))
                return (
                  <m.button
                    key={item.id}
                    initial={{ opacity: 0, y: 18 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: idx * 0.05, duration: 0.35 }}
                    whileTap={{ scale: 0.99 }}
                    whileHover={{ y: -3, boxShadow: '0 8px 30px rgba(0,0,0,0.1)' }}
                    onClick={() => { openItem(item); track('item_view', { business_id: item.business_id, item_id: item.id }) }}
                    className="flex w-full items-center gap-4 rounded-3xl p-3 text-left"
                    style={{ background: 'var(--glass)', backdropFilter: 'blur(12px)', border: '1px solid var(--bdr)', boxShadow: '0 4px 24px rgba(0,0,0,0.06)', opacity: item.is_available ? 1 : 0.55 }}
                  >
                    {imgUrl && (
                      <div className="relative h-[88px] w-[88px] shrink-0 overflow-hidden" style={{ borderRadius: 22, background: 'var(--sf2)' }}>
                        <Image src={imgUrl} alt={item.name} fill className="object-cover" sizes="88px" />
                      </div>
                    )}
                    <div className="min-w-0 flex-1">
                      <p className="text-[15px] font-semibold leading-snug flex items-center gap-1.5" style={{ fontFamily: 'var(--font-display)', fontStyle: 'italic', color: 'var(--txt)' }}>
                        {!imgUrl && <Icon size={16} style={{ color: 'var(--brand)', opacity: 0.6 }} />}
                        {item.name}
                      </p>
                      {item.description && <p className={`mt-1 text-xs leading-relaxed ${imgUrl ? 'line-clamp-2' : ''}`} style={{ color: 'var(--txt2)' }}>{item.description}</p>}
                      <div className="mt-1.5 flex flex-wrap items-center gap-2">
                        <span className="text-sm font-semibold" style={{ color: 'var(--brand)', fontStyle: 'italic' }}>
                          {item.compare_price && item.compare_price > item.price && <s className="opacity-50 font-normal mr-1.5 text-[0.85em]">{formatPrice(item.compare_price)}</s>}
                          {formatPrice(item.price)}
                        </span>
                        <VegMark dietary={item.dietary} size="xs" />
                        {item.badge && <ItemBadge badge={item.badge} />}
                        {!item.is_available && <span className="text-[10px] uppercase tracking-wide" style={{ color: 'var(--txt3)' }}>Sold out</span>}
                      </div>
                    </div>
                  </m.button>
                )
              })}
              {catItems.length === 0 && (
                <p className="py-12 text-center text-sm md:col-span-2" style={{ color: 'var(--txt3)' }}>Nothing here yet.</p>
              )}
            </div>
          </m.div>
        </AnimatePresence>
      </div>

      {/* Floating bottom pill nav — mobile only, above ThumbDock */}
      <div
        className="fixed left-0 right-0 z-40 flex justify-center px-4 md:hidden"
        style={{ bottom: 'calc(5.5rem + env(safe-area-inset-bottom))' }}
      >
        <div
          className="flex max-w-full items-center gap-2 overflow-x-auto rounded-full px-4 py-2 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
          style={{ background: 'var(--glass)', backdropFilter: 'blur(16px)', border: '1px solid var(--bdr)', boxShadow: '0 8px 32px rgba(0,0,0,0.12)' }}
        >
          {categories.map((c) => {
            const active = c.id === activeId
            return (
              <button
                key={c.id}
                onClick={() => requestJump(c.id)}
                className="relative shrink-0 rounded-full px-3 py-1.5 text-xs font-semibold transition-colors"
                style={{ background: active ? 'var(--brand)' : 'transparent', color: active ? 'var(--bg)' : 'var(--txt2)', fontFamily: 'var(--font-body)', fontStyle: 'italic' }}
              >
                {c.name}
              </button>
            )
          })}
        </div>
      </div>
    </div>
  )
}
