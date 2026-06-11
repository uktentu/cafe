'use client'

// Chef's Special spotlight — surfaces items flagged `is_special` in a prominent,
// per-theme-styled block. The label treatment (stamp / plaque / ribbon / glow /
// mono) changes per theme so it feels native everywhere, while colours and fonts
// come straight from the theme tokens. Only renders when a special exists.
import { Sparkles } from 'lucide-react'
import { ItemCard } from './ItemCard'
import type { Category, Item, Theme } from '@/types/database'
import { useLanguage } from './LanguageProvider'

type LabelStyle = 'stamp' | 'plaque' | 'ribbon' | 'glow' | 'mono'

const THEME_LABEL: Record<Theme, LabelStyle> = {
  mercado: 'stamp',   bazaar: 'stamp',
  onyx: 'plaque',     aether: 'plaque',   nocturne: 'plaque',
  sakura: 'ribbon',   provenance: 'ribbon', coastal: 'ribbon',
  ember: 'glow',      arcade: 'glow',     frost: 'glow',
  studio: 'mono',     terrain: 'mono',
}

function SpecialLabel({ theme, text }: { theme: Theme; text: string }) {
  const style = THEME_LABEL[theme] ?? 'stamp'
  const common = 'inline-flex items-center gap-1.5 text-xs font-bold uppercase'

  if (style === 'stamp') {
    return (
      <span
        className={`${common} -rotate-2 rounded px-2.5 py-1 tracking-[0.12em]`}
        style={{ background: 'var(--brand)', color: 'var(--bg)', boxShadow: '2px 2px 0 var(--brand2, var(--txt))' }}
      >
        <Sparkles className="h-3.5 w-3.5" /> {text}
      </span>
    )
  }
  if (style === 'plaque') {
    return (
      <span
        className={`${common} rounded-sm px-3 py-1 tracking-[0.2em]`}
        style={{ border: '1px solid var(--brand2, var(--brand))', color: 'var(--brand2, var(--brand))', background: 'var(--sf1)' }}
      >
        <Sparkles className="h-3.5 w-3.5" /> {text}
      </span>
    )
  }
  if (style === 'ribbon') {
    return (
      <span
        className={`${common} rounded-full px-3 py-1 tracking-[0.08em] normal-case`}
        style={{ background: 'var(--brand3, var(--brand))', color: 'var(--bg)' }}
      >
        <Sparkles className="h-3.5 w-3.5" /> {text}
      </span>
    )
  }
  if (style === 'glow') {
    return (
      <span
        className={`${common} rounded-full px-3 py-1 tracking-[0.1em]`}
        style={{ color: 'var(--brand)', border: '1px solid var(--brand)', boxShadow: '0 0 16px -2px var(--brand)', background: 'var(--sf1)' }}
      >
        <Sparkles className="h-3.5 w-3.5" /> {text}
      </span>
    )
  }
  // mono
  return (
    <span className={`${common} tracking-[0.25em]`} style={{ color: 'var(--brand)' }}>
      <span style={{ width: 18, height: 1, background: 'var(--brand)' }} className="inline-block" /> {text}
    </span>
  )
}

interface ChefsSpecialProps {
  items: Item[]
  categories: Category[]
  theme: Theme
}

export function ChefsSpecial({ items, categories, theme }: ChefsSpecialProps) {
  const { t, tUi } = useLanguage()
  const specials = items.filter((it) => it.is_special && it.is_available)
  if (specials.length === 0) return null

  const label = tUi("Chef's Special", "Chef's Special")
  const catOf = (id: string | null) => categories.find((c) => c.id === id) ?? null
  const single = specials.length === 1

  const translate = (it: Item) => ({
    ...it,
    name: t('item', it.id, 'name', it.name),
    description: it.description ? t('item', it.id, 'description', it.description) : it.description,
  })

  return (
    <section
      aria-label="Chef's Special"
      className="mx-4 mt-6 rounded-2xl p-4 lg:mx-6"
      style={{ background: 'var(--sf1)', border: '1px solid var(--bdr)' }}
    >
      <div className="mb-3 flex items-center justify-between">
        <SpecialLabel theme={theme} text={label} />
        {!single && (
          <span className="text-xs" style={{ color: 'var(--txt2)' }}>{specials.length} picks</span>
        )}
      </div>

      {single ? (
        <ItemCard item={translate(specials[0])} category={catOf(specials[0].category_id)} variant="row" theme={theme} priority />
      ) : (
        <div className="-mx-1 flex snap-x snap-mandatory gap-3 overflow-x-auto px-1 pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          {specials.map((it, idx) => (
            <div key={it.id} className="w-[170px] shrink-0 snap-start lg:w-[210px]">
              <ItemCard item={translate(it)} category={catOf(it.category_id)} variant="grid" theme={theme} priority={idx < 2} />
            </div>
          ))}
        </div>
      )}
    </section>
  )
}
