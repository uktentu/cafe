'use client'

import { useState } from 'react'
import Image from 'next/image'
import { m } from 'framer-motion'
import { cdnUrl, itemImageKey, type Category, type Item, type Theme } from '@/types/database'
import { getCategoryIcon } from './categoryIcon'
import { VegMark, ItemBadge } from './badges'
import { useMenuStore } from '@/stores/menu'
import { track } from '@/lib/firebase'
import { cn, formatPrice } from '@/lib/utils'

export type CardVariant = 'grid' | 'row'

interface ItemCardProps {
  item: Item
  category?: Pick<Category, 'icon'> | null
  variant?: CardVariant
  theme?: Theme
  priority?: boolean
}

// Themes that force uppercase name
const UPPERCASE_THEMES = new Set<Theme>(['mercado', 'bazaar', 'onyx', 'studio'])

// Per-theme card style overrides
interface CardStyle {
  /** Outer border radius override */
  radius?: string
  /** Name style overrides */
  nameClass?: string
  /** Extra hover animation */
  hoverY?: number
  hoverScale?: number
  tapScale?: number
  /** Whether to show a themed accent on the image overlay */
  imageAccent?: boolean
}

const THEME_CARD_STYLE: Record<Theme, CardStyle> = {
  mercado:    { radius: 'rounded-xl',   hoverY: -3, tapScale: 0.97, imageAccent: true },
  provenance: { radius: 'rounded-2xl',  hoverY: -4, tapScale: 0.98, imageAccent: false },
  terrain:    { radius: 'rounded-xl',   hoverY: -2, tapScale: 0.98, imageAccent: false },
  bazaar:     { radius: 'rounded-lg',   hoverY: 0,  tapScale: 0.96, imageAccent: true },
  nocturne:   { radius: 'rounded-2xl',  hoverY: -3, tapScale: 0.97, imageAccent: true },
  coastal:    { radius: 'rounded-3xl',  hoverY: -4, tapScale: 0.97, imageAccent: false },
  aether:     { radius: 'rounded-3xl',  hoverY: -5, tapScale: 0.98, imageAccent: false },
  onyx:       { radius: 'rounded-none', hoverY: 0,  tapScale: 0.98, imageAccent: true },
  studio:     { radius: 'rounded-none', hoverY: 0,  tapScale: 0.97, imageAccent: true },
  sakura:     { radius: 'rounded-3xl',  hoverY: -4, tapScale: 0.98, imageAccent: false },
  frost:      { radius: 'rounded-3xl',  hoverY: -3, tapScale: 0.97, imageAccent: false },
  ember:      { radius: 'rounded-lg',   hoverY: 0,  tapScale: 0.96, imageAccent: true },
  arcade:     { radius: 'rounded-xl',   hoverY: -2, tapScale: 0.96, imageAccent: true },
}

export function ItemCard({ item, category, variant = 'grid', theme = 'mercado', priority = false }: ItemCardProps) {
  const openItem = useMenuStore((s) => s.openItem)
  const [imgError, setImgError] = useState(false)

  const key = itemImageKey(item)
  const src = cdnUrl(key)
  const hasImage = item.image_mode !== 'none' && Boolean(src) && !imgError
  const Icon = getCategoryIcon(category?.icon)
  const soldOut = !item.is_available
  const upper = UPPERCASE_THEMES.has(theme)
  const style = THEME_CARD_STYLE[theme] ?? THEME_CARD_STYLE.mercado

  function onClick() {
    openItem(item)
    track('item_view', { business_id: item.business_id, item_id: item.id })
  }

  const nameStyle: React.CSSProperties = {
    fontFamily: 'var(--font-display)',
    color: 'var(--txt)',
    textTransform: upper ? 'uppercase' : 'none',
    letterSpacing: upper ? '0.01em' : '0',
  }
  const priceStyle: React.CSSProperties = {
    color: 'var(--brand2, var(--brand))',
    fontFamily: 'var(--font-body)',
  }

  // ── image / icon block ─────────────────────────────────────────
  const media = (rounded: string) => {
    if (!hasImage) return null
    return (
      <div className={cn('relative overflow-hidden', rounded)} style={{ background: 'var(--sf2)' }}>
        <Image
          src={src!}
          alt={item.name}
          fill
          priority={priority}
          sizes={variant === 'row' ? '88px' : '(min-width:768px) 30vw, 45vw'}
          className={cn('object-cover transition-transform duration-500', soldOut && 'grayscale', 'group-hover:scale-105')}
          onError={() => setImgError(true)}
        />
        {item.badge && (
          <ItemBadge badge={item.badge} className="absolute left-2 top-2 shadow-sm" />
        )}
        {soldOut && (
          <span
            className="absolute bottom-2 left-2 rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide"
            style={{ background: '#C0392B', color: '#fff' }}
          >
            Sold Out
          </span>
        )}
        {theme === 'nocturne' && (
          <div
            className="pointer-events-none absolute inset-0 opacity-0 transition-opacity duration-300 group-hover:opacity-100"
            style={{ boxShadow: 'inset 0 0 0 1px var(--brand)', borderRadius: 'inherit' }}
          />
        )}
      </div>
    )
  }

  const BadgeFallback = () => {
    if (hasImage) return null
    return (
      <div className="flex gap-2 mt-2">
        {item.badge && <ItemBadge badge={item.badge} />}
        {soldOut && (
          <span className="rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide" style={{ background: '#C0392B', color: '#fff' }}>
            Sold Out
          </span>
        )}
      </div>
    )
  }

  const PriceRow = (
    <div className="flex items-baseline gap-2">
      <span
        className={cn('font-semibold', theme === 'studio' ? 'font-mono text-sm' : 'text-[15px]')}
        style={priceStyle}
      >
        {formatPrice(item.price)}
      </span>
      {item.compare_price != null && item.compare_price > item.price && (
        <span className="text-xs line-through" style={{ color: 'var(--txt3)' }}>
          {formatPrice(item.compare_price)}
        </span>
      )}
    </div>
  )

  // ── Onyx: full-bleed editorial row ─────────────────────────────
  if (theme === 'onyx' && variant === 'row') {
    return (
      <m.button
        type="button"
        onClick={onClick}
        whileTap={{ scale: style.tapScale }}
        className={cn(
          'group item-card flex w-full items-stretch border-b text-left',
          soldOut && 'opacity-60',
        )}
        style={{ borderColor: 'var(--bdr)' }}
      >
        {hasImage && (
          <div className="relative h-[120px] w-[120px] shrink-0 overflow-hidden">
            {media('h-full w-full')}
          </div>
        )}
        <div className="flex min-w-0 flex-1 flex-col justify-between px-4 py-3">
          <div>
            <div className="flex items-center gap-2">
              <VegMark dietary={item.dietary} />
              {!hasImage && <Icon className="h-4 w-4 shrink-0 text-neutral-400" />}
              <h3 style={{ ...nameStyle, fontSize: '1rem', lineHeight: 1.2 }}>{item.name}</h3>
            </div>
            {item.description && (
              <p className="mt-1 line-clamp-1 text-xs" style={{ color: 'var(--txt2)', fontFamily: 'var(--font-body)' }}>
                {item.description}
              </p>
            )}
            <BadgeFallback />
          </div>
          {PriceRow}
        </div>
      </m.button>
    )
  }

  // ── ROW variant ────────────────────────────────────────────────
  if (variant === 'row') {
    return (
      <m.button
        type="button"
        onClick={onClick}
        whileHover={{ y: style.hoverY, transition: { duration: 0.2 } }}
        whileTap={{ scale: style.tapScale }}
        className={cn(
          'group item-card flex w-full gap-3 border p-3 text-left',
          style.radius,
          soldOut && 'opacity-70',
        )}
        style={{ background: 'var(--sf1)', borderColor: 'var(--bdr)' }}
      >
        {hasImage && (
          <div className="h-[88px] w-[88px] shrink-0">
            {media(cn(style.radius, 'h-full w-full'))}
          </div>
        )}
        <div className="flex min-w-0 flex-1 flex-col gap-1">
          <div className="flex items-start gap-2">
            {!hasImage && (
              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-black/5">
                <Icon className="h-4 w-4 opacity-60" style={{ color: 'var(--brand)' }} />
              </div>
            )}
            <div className="flex-1">
              <div className="flex items-center gap-1.5">
                <VegMark dietary={item.dietary} />
                <h3 className="truncate text-[15px]" style={nameStyle}>{item.name}</h3>
              </div>
              {item.description && (
                <p className="line-clamp-2 text-xs mt-1" style={{ color: 'var(--txt2)', fontFamily: 'var(--font-body)' }}>
                  {item.description}
                </p>
              )}
            </div>
          </div>
          <BadgeFallback />
          <div className="mt-auto pt-1">{PriceRow}</div>
        </div>
      </m.button>
    )
  }

  // ── Studio: asymmetric card with tag ──────────────────────────
  if (theme === 'studio') {
    return (
      <m.button
        type="button"
        onClick={onClick}
        whileTap={{ scale: style.tapScale }}
        className={cn(
          'group item-card flex w-full flex-col overflow-hidden border-2 text-left',
          style.radius,
          soldOut && 'opacity-70',
        )}
        style={{ background: 'var(--sf1)', borderColor: 'var(--bdr2)' }}
      >
        {hasImage && (
          <div className="aspect-square w-full">
            {media('h-full w-full')}
          </div>
        )}
        <div className="flex flex-1 flex-col gap-1 border-t p-3" style={{ borderColor: hasImage ? 'var(--bdr2)' : 'transparent' }}>
          <div className="flex items-start gap-1.5">
            <VegMark dietary={item.dietary} className="mt-1 shrink-0" />
            {!hasImage && <Icon className="mt-0.5 h-4 w-4 shrink-0 opacity-60" style={{ color: 'var(--brand)' }} />}
            <h3 className="text-[13px] font-bold leading-tight" style={nameStyle}>{item.name}</h3>
          </div>
          <BadgeFallback />
          <div className="mt-auto pt-1">
            <span
              className="inline-block border px-1.5 py-0.5 font-mono text-[11px] font-bold"
              style={{ borderColor: 'var(--brand2)', color: 'var(--brand2)' }}
            >
              {formatPrice(item.price)}
            </span>
          </div>
        </div>
      </m.button>
    )
  }

  // ── GRID variant (default) ─────────────────────────────────────
  return (
    <m.button
      type="button"
      onClick={onClick}
      whileHover={{ y: style.hoverY, transition: { duration: 0.2 } }}
      whileTap={{ scale: style.tapScale }}
      className={cn(
        'group item-card flex w-full flex-col overflow-hidden border text-left',
        style.radius,
        soldOut && 'opacity-70',
      )}
      style={{ background: 'var(--sf1)', borderColor: 'var(--bdr)' }}
    >
      {hasImage && (
        <div className="aspect-[4/3] w-full">
          {media('h-full w-full')}
        </div>
      )}
      <div className="flex flex-1 flex-col gap-1 p-3">
        <div className="flex items-start gap-1.5">
          <VegMark dietary={item.dietary} className="mt-1 shrink-0" />
          {!hasImage && (
            <div className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded bg-black/5">
              <Icon className="h-3 w-3 opacity-70" style={{ color: 'var(--brand)' }} />
            </div>
          )}
          <h3 className="text-[15px] leading-tight flex-1" style={nameStyle}>{item.name}</h3>
        </div>
        {item.description && (
          <p className="line-clamp-2 text-xs mt-1" style={{ color: 'var(--txt2)', fontFamily: 'var(--font-body)' }}>
            {item.description}
          </p>
        )}
        <BadgeFallback />
        <div className="mt-auto pt-2">{PriceRow}</div>
      </div>
    </m.button>
  )
}
