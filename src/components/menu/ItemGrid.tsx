// Renders each category as a scroll-target section with its items.
// Layout (grid vs row, columns, padding) is chosen per theme.
import { ItemCard, type CardVariant } from './ItemCard'
import type { Category, Item, Theme } from '@/types/database'

interface ItemGridProps {
  categories: Category[]
  items: Item[]
  theme: Theme
}

interface Layout {
  variant: CardVariant
  cols: string
  gap: string
  sectionPad: string
}

const THEME_LAYOUT: Record<Theme, Layout> = {
  // Basic
  mercado:    { variant: 'grid', cols: 'grid-cols-2 md:grid-cols-3', gap: 'gap-3',   sectionPad: 'px-4 py-6' },
  provenance: { variant: 'row',  cols: 'grid-cols-1 md:grid-cols-2', gap: 'gap-3',   sectionPad: 'px-5 py-6' },
  terrain:    { variant: 'row',  cols: 'grid-cols-1 md:grid-cols-2', gap: 'gap-4',   sectionPad: 'px-5 py-7' },
  // Advanced
  bazaar:     { variant: 'grid', cols: 'grid-cols-2 md:grid-cols-3', gap: 'gap-3',   sectionPad: 'px-4 py-6' },
  nocturne:   { variant: 'row',  cols: 'grid-cols-1 md:grid-cols-2', gap: 'gap-3',   sectionPad: 'px-5 py-7' },
  coastal:    { variant: 'row',  cols: 'grid-cols-1 md:grid-cols-2', gap: 'gap-4',   sectionPad: 'px-5 py-7' },
  // Premium
  aether:     { variant: 'row',  cols: 'grid-cols-1 md:grid-cols-2', gap: 'gap-4',   sectionPad: 'px-6 py-8' },
  onyx:       { variant: 'row',  cols: 'grid-cols-1',                gap: 'gap-0',   sectionPad: 'px-0 py-0' },
  studio:     { variant: 'grid', cols: 'grid-cols-2 md:grid-cols-3', gap: 'gap-0',   sectionPad: 'px-0 py-0' },
  // Specialty
  sakura:     { variant: 'row',  cols: 'grid-cols-1 md:grid-cols-2', gap: 'gap-4',   sectionPad: 'px-5 py-6' },
  frost:      { variant: 'grid', cols: 'grid-cols-2 md:grid-cols-3', gap: 'gap-3',   sectionPad: 'px-4 py-6' },
  ember:      { variant: 'grid', cols: 'grid-cols-2 md:grid-cols-3', gap: 'gap-3',   sectionPad: 'px-4 py-6' },
  arcade:     { variant: 'grid', cols: 'grid-cols-2 md:grid-cols-3', gap: 'gap-3',   sectionPad: 'px-4 py-6' },
}

// Per-theme section heading style
const HEADING_STYLE: Partial<Record<Theme, React.CSSProperties>> = {
  provenance: { fontStyle: 'italic', textTransform: 'none', fontSize: 'clamp(1.3rem, 5vw, 1.8rem)', letterSpacing: '-0.01em' },
  terrain:    { fontWeight: 600, textTransform: 'none', fontSize: 'clamp(1.2rem, 4.5vw, 1.6rem)', letterSpacing: '-0.02em' },
  nocturne:   { fontStyle: 'italic', letterSpacing: '0.06em', textTransform: 'uppercase', fontSize: 'clamp(1rem, 4vw, 1.4rem)', color: 'var(--brand)' },
  coastal:    { fontStyle: 'italic', textTransform: 'none', letterSpacing: '-0.01em', fontSize: 'clamp(1.3rem, 5vw, 1.8rem)' },
  aether:     { fontWeight: 700, textTransform: 'none', letterSpacing: '-0.03em', fontSize: 'clamp(1.5rem, 6vw, 2.2rem)' },
  onyx:       { letterSpacing: '0.1em', fontSize: '0.7rem', fontFamily: 'var(--font-body)', textTransform: 'uppercase', color: 'var(--txt2)' },
  studio:     { fontWeight: 700, fontSize: '0.7rem', letterSpacing: '0.2em', textTransform: 'uppercase', fontFamily: 'var(--font-display)', color: 'var(--brand2)' },
}

export function ItemGrid({ categories, items, theme }: ItemGridProps) {
  const layout = THEME_LAYOUT[theme] ?? THEME_LAYOUT.mercado
  const headingOverride = HEADING_STYLE[theme] ?? {}

  const byCategory = (catId: string) =>
    items.filter((it) => it.category_id === catId).sort((a, b) => a.sort_order - b.sort_order)

  const isOnyx = theme === 'onyx'
  const isStudio = theme === 'studio'

  return (
    <div className="pb-28">
      {categories.map((cat) => {
        const catItems = byCategory(cat.id)

        // Onyx: full-width section with thick top rule
        if (isOnyx) {
          return (
            <section key={cat.id} id={`cat-${cat.id}`} className="scroll-mt-[96px]">
              <div
                className="border-t px-6 pb-1 pt-5"
                style={{ borderColor: 'var(--bdr2)' }}
              >
                <h2
                  style={{
                    fontFamily: 'var(--font-body)',
                    color: 'var(--txt2)',
                    ...headingOverride,
                  }}
                >
                  {cat.name}
                </h2>
              </div>
              {catItems.length === 0 ? (
                <p className="px-6 py-6 text-center text-sm" style={{ color: 'var(--txt2)' }}>
                  Nothing here yet.
                </p>
              ) : (
                <div>
                  {catItems.map((it) => (
                    <ItemCard key={it.id} item={it} category={cat} variant={layout.variant} theme={theme} />
                  ))}
                </div>
              )}
            </section>
          )
        }

        // Studio: borderless grid sections
        if (isStudio) {
          return (
            <section key={cat.id} id={`cat-${cat.id}`} className="scroll-mt-[96px]">
              <div className="border-b border-t px-4 py-3" style={{ borderColor: 'var(--bdr2)' }}>
                <h2
                  style={{
                    fontFamily: 'var(--font-display)',
                    color: 'var(--txt)',
                    ...headingOverride,
                  }}
                >
                  {cat.name}
                </h2>
              </div>
              {catItems.length === 0 ? (
                <p className="py-6 text-center text-sm" style={{ color: 'var(--txt2)' }}>
                  Nothing here yet.
                </p>
              ) : (
                <div className={`grid border-b ${layout.cols} ${layout.gap}`} style={{ borderColor: 'var(--bdr2)' }}>
                  {catItems.map((it) => (
                    <div key={it.id} className="border-r" style={{ borderColor: 'var(--bdr2)' }}>
                      <ItemCard item={it} category={cat} variant={layout.variant} theme={theme} />
                    </div>
                  ))}
                </div>
              )}
            </section>
          )
        }

        // All other themes
        return (
          <section key={cat.id} id={`cat-${cat.id}`} className={`scroll-mt-[96px] ${layout.sectionPad}`}>
            <div className="mb-4 flex items-baseline justify-between">
              <h2
                style={{
                  fontFamily: 'var(--font-display)',
                  color: 'var(--txt)',
                  fontSize: 'clamp(1.25rem, 5vw, 1.75rem)',
                  textTransform: 'uppercase',
                  letterSpacing: '0.02em',
                  ...headingOverride,
                }}
              >
                {cat.name}
              </h2>
              <span aria-hidden className="ml-3 h-px flex-1" style={{ background: 'var(--bdr)' }} />
            </div>

            {catItems.length === 0 ? (
              <p className="py-6 text-center text-sm" style={{ color: 'var(--txt2)' }}>
                Nothing here yet — check back soon!
              </p>
            ) : (
              <div className={`grid ${layout.cols} ${layout.gap}`}>
                {catItems.map((it) => (
                  <ItemCard key={it.id} item={it} category={cat} variant={layout.variant} theme={theme} />
                ))}
              </div>
            )}
          </section>
        )
      })}
    </div>
  )
}
