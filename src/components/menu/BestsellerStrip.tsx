'use client'

// Featured-items strip. Native horizontal scroll-snap (zero JS, great on mobile)
// — only rendered when at least one item is featured. Server component.
import { ItemCard } from './ItemCard'
import type { Category, Item, Theme } from '@/types/database'
import { useLanguage } from './LanguageProvider'

interface BestsellerStripProps {
  items: Item[]
  categories: Category[]
  theme: Theme
  title?: string
}

export function BestsellerStrip({ items, categories, theme, title = 'Bestsellers' }: BestsellerStripProps) {
  const { t, tUi } = useLanguage()
  const translatedTitle = tUi('Bestsellers', title)
  const featured = items.filter((it) => it.is_featured && it.is_available)
  if (featured.length === 0) return null

  const catOf = (id: string | null) => categories.find((c) => c.id === id) ?? null

  return (
    <section aria-label={title} className="px-4 pt-6 lg:px-6">
      <h2
        className="mb-3"
        style={{
          fontFamily: 'var(--font-display)',
          color: 'var(--txt)',
          fontSize: 'clamp(1.1rem, 4.5vw, 1.5rem)',
          textTransform: 'uppercase',
          letterSpacing: '0.02em',
        }}
      >
        {translatedTitle}
      </h2>
      <div className="-mx-4 flex snap-x snap-mandatory gap-3 overflow-x-auto px-4 pb-2 lg:-mx-6 lg:px-6 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        {featured.map((it, idx) => {
          const cat = catOf(it.category_id)
          const translatedItem = {
            ...it,
            name: t('item', it.id, 'name', it.name),
            description: it.description ? t('item', it.id, 'description', it.description) : it.description
          }
          const translatedCat = cat ? {
            ...cat,
            name: t('category', cat.id, 'name', cat.name),
            description: cat.description ? t('category', cat.id, 'description', cat.description) : cat.description
          } : null

          return (
            <div key={it.id} className="w-[160px] shrink-0 snap-start lg:w-[200px]">
              <ItemCard item={translatedItem} category={translatedCat} variant="grid" theme={theme} priority={idx < 2} />
            </div>
          )
        })}
      </div>
    </section>
  )
}
