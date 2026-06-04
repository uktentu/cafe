'use client'

// OnyxLayout — Dark Parisian fine dining
// md+ fixed left sidebar (category list + tagline); printed-menu dot-leader rows
// (name · · · ₹price). No images in the list — pure typography. Blur-rise reveals.

import { m } from 'framer-motion'
import type { Item } from '@/types/database'
import { useMenuStore } from '@/stores/menu'
import { useScrollCategorySync } from '@/components/menu/useCategorySync'
import { blurRise } from '@/components/menu/scrollVariants'
import { track } from '@/lib/firebase'
import { VegMark, ItemBadge } from '@/components/menu/badges'
import { formatPrice } from '@/lib/utils'
import type { LayoutProps } from './MercadoLayout'

function DotRow({ item, idx, openItem }: { item: Item; idx: number; openItem: (i: Item) => void }) {
  return (
    <m.button
      custom={idx}
      variants={blurRise}
      initial="hidden"
      whileInView="show"
      viewport={{ once: true, margin: '-30px' }}
      onClick={() => { openItem(item); track('item_view', { business_id: item.business_id, item_id: item.id }) }}
      whileHover={{ x: 8 }}
      className="group flex w-full items-baseline gap-2 py-3.5 text-left md:py-5"
      style={{ borderBottom: '1px solid var(--bdr)', opacity: item.is_available ? 1 : 0.5 }}
    >
      <VegMark dietary={item.dietary} className="self-center" />
      <span className="shrink-0 text-sm font-medium transition-colors group-hover:text-[color:var(--brand)]" style={{ fontFamily: 'var(--font-display)', color: 'var(--txt)' }}>
        {item.name}
      </span>
      {item.badge && <ItemBadge badge={item.badge} className="self-center" />}
      {!item.is_available && <span className="self-center text-[10px] uppercase" style={{ color: 'var(--txt3)' }}>Sold out</span>}
      {/* Dot leader fills available space, baseline-aligned */}
      <span
        aria-hidden
        className="min-w-6 flex-1 self-end overflow-hidden whitespace-nowrap pb-1 leading-none"
        style={{ color: 'var(--txt3)', fontSize: '0.55rem', letterSpacing: '0.3em' }}
      >
        {'·'.repeat(120)}
      </span>
      <span className="shrink-0 text-sm font-semibold tabular-nums" style={{ color: 'var(--brand)', fontFamily: 'var(--font-body)' }}>
        {formatPrice(item.price)}
      </span>
    </m.button>
  )
}

export function OnyxLayout({ categories, items, businessId: _businessId }: LayoutProps) {
  const openItem = useMenuStore((s) => s.openItem)
  const requestJump = useMenuStore((s) => s.requestJump)
  const { activeId, register } = useScrollCategorySync(categories)

  return (
    <div className="relative flex min-h-screen" style={{ background: 'var(--bg)', color: 'var(--txt)' }}>
      {/* Fixed left sidebar (md+) */}
      <aside
        className="hidden md:flex md:flex-col"
        style={{ width: 220, position: 'fixed', top: 0, left: 0, bottom: 0, borderRight: '1px solid var(--bdr)', background: 'var(--sf1)', zIndex: 20, padding: '4rem 1.5rem 2rem' }}
      >
        <p className="mb-6 text-[10px] uppercase tracking-[0.4em]" style={{ color: 'var(--brand2)' }}>La Carte</p>
        <nav className="flex flex-col gap-1">
          {categories.map((cat) => {
            const active = activeId === cat.id
            return (
              <button
                key={cat.id}
                onClick={() => requestJump(cat.id)}
                className="relative flex items-center gap-2 rounded px-2 py-2 text-left text-xs uppercase tracking-widest transition-colors"
                style={{ fontFamily: 'var(--font-body)', color: active ? 'var(--brand)' : 'var(--txt2)', fontWeight: active ? 700 : 400 }}
              >
                {active && (
                  <m.span layoutId="onyx-sidebar-indicator" className="absolute left-0 top-0.5 bottom-0.5 w-[2px]" style={{ background: 'var(--brand)' }} transition={{ type: 'spring', stiffness: 400, damping: 30 }} />
                )}
                <span className="h-px shrink-0 transition-all duration-300" style={{ width: active ? 16 : 8, background: active ? 'var(--brand)' : 'var(--bdr2)' }} />
                {cat.name}
              </button>
            )
          })}
        </nav>
        <div className="mt-auto text-xs italic" style={{ color: 'var(--txt3)', fontFamily: 'var(--font-display)' }}>
          Fine dining. Fine menu.
        </div>
      </aside>

      {/* Mobile sticky top strip */}
      <nav className="sticky top-0 z-30 flex gap-4 overflow-x-auto px-4 py-3 md:hidden" style={{ background: 'var(--glass)', backdropFilter: 'blur(12px)', borderBottom: '1px solid var(--bdr)' }}>
        {categories.map((cat) => (
          <button key={cat.id} onClick={() => requestJump(cat.id)} className="shrink-0 text-xs uppercase tracking-widest transition-colors" style={{ fontFamily: 'var(--font-body)', color: activeId === cat.id ? 'var(--brand)' : 'var(--txt2)', fontWeight: activeId === cat.id ? 700 : 400 }}>
            {cat.name}
          </button>
        ))}
      </nav>

      <main className="flex-1 md:ml-[220px]">
        {categories.map((cat) => {
          const catItems = items.filter((i) => i.category_id === cat.id)
          return (
            <section key={cat.id} data-cat={cat.id} ref={register(cat.id)} className="scroll-mt-16">
              {/* Sticky section heading: below mobile nav (~48px) on mobile; not sticky on tablet (sidebar handles it) */}
              <div
                className="sticky z-20 flex items-center gap-4 px-6 py-3 md:static md:mb-6 md:px-14 md:py-0 md:pt-12"
                style={{ top: 48, background: 'var(--bg)', backdropFilter: 'blur(10px)', borderBottom: '1px solid var(--bdr)' }}
              >
                <h2 className="shrink-0 text-xs font-semibold uppercase tracking-[0.25em]" style={{ color: 'var(--brand2, var(--brand))', fontFamily: 'var(--font-body)' }}>{cat.name}</h2>
                <div className="h-px flex-1" style={{ background: 'var(--bdr)' }} />
              </div>
              <div className="px-6 pb-10 md:px-14 md:pb-12">
                {catItems.map((item, idx) => <DotRow key={item.id} item={item} idx={idx} openItem={openItem} />)}
              </div>
            </section>
          )
        })}
      </main>
    </div>
  )
}
