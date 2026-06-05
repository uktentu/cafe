// Dietary marks, item badges, and dietary flag chips.
// All marks use the Indian food-safety standard square + symbol system.
// Colour is NEVER used alone — always paired with an icon/shape for accessibility.
import type { Badge, Item, DietaryPreference } from '@/types/database'
import { cn } from '@/lib/utils'

// ── Veg Mark (FSSAI standard) ──────────────────────────────────────────────

interface VegMarkProps {
  dietary: DietaryPreference
  className?: string
  size?: 'xs' | 'sm' | 'md'
}

const SIZE_MAP = {
  xs: { box: 13, dot: 5.5, label: 'text-[9px]' },
  sm: { box: 16, dot: 7,   label: 'text-[10px]' },
  md: { box: 20, dot: 9,   label: 'text-xs' },
}

/**
 * FSSAI-style food category marks:
 * - Veg: green square + green circle
 * - Non-veg: brown/red square + filled downward triangle
 * - Egg: yellow square + egg symbol
 * - Vegan: green square + green leaf
 */
export function VegMark({ dietary, className, size = 'sm' }: VegMarkProps) {
  if (dietary === 'none') return null
  const s = SIZE_MAP[size]

  const configs: Record<Exclude<DietaryPreference, 'none'>, { border: string; label: string; symbol: React.ReactNode }> = {
    veg: {
      border: '#2D8A4E',
      label: 'Vegetarian',
      symbol: (
        <svg width={s.dot} height={s.dot} viewBox="0 0 8 8" aria-hidden>
          <circle cx="4" cy="4" r="3.5" fill="#2D8A4E" />
        </svg>
      ),
    },
    'non-veg': {
      border: '#8B1A1A',
      label: 'Non-vegetarian',
      symbol: (
        <svg width={s.dot} height={s.dot} viewBox="0 0 8 8" aria-hidden>
          <polygon points="4,0.5 7.5,7.5 0.5,7.5" fill="#8B1A1A" />
        </svg>
      ),
    },
    egg: {
      border: '#B8860B',
      label: 'Contains egg',
      symbol: (
        <svg width={s.dot} height={s.dot + 1} viewBox="0 0 10 11" aria-hidden>
          {/* Full egg outline */}
          <ellipse cx="5" cy="6.2" rx="3.8" ry="4.8" fill="#B8860B" opacity="0.18" stroke="#B8860B" strokeWidth="0.8"/>
          {/* Top half filled (the visible half-cut portion) */}
          <path d="M1.2 6.2 A3.8 4.8 0 0 1 8.8 6.2 Z" fill="#B8860B"/>
          {/* Yolk circle */}
          <circle cx="5" cy="6.2" r="1.5" fill="#DAA520"/>
        </svg>
      ),
    },
    vegan: {
      border: '#1A6B3C',
      label: 'Vegan',
      symbol: (
        <svg width={s.dot} height={s.dot} viewBox="0 0 8 8" aria-hidden>
          {/* leaf shape */}
          <path d="M4 7 C4 7 1 5 1 3 C1 1.5 2.5 1 4 2 C5.5 1 7 1.5 7 3 C7 5 4 7 4 7Z" fill="#1A6B3C" />
        </svg>
      ),
    },
  }

  const config = configs[dietary as Exclude<DietaryPreference, 'none'>]
  if (!config) return null

  return (
    <span
      role="img"
      aria-label={config.label}
      className={cn('dietary-badge inline-flex shrink-0 items-center justify-center border-[1.5px]', className)}
      style={{
        width: s.box,
        height: s.box,
        borderColor: config.border,
        borderRadius: 3,
        background: 'rgba(255,255,255,0.08)',
      }}
    >
      {config.symbol}
    </span>
  )
}

// ── Full dietary tag chip (for cards that have room) ──────────────────────

export function DietaryTag({ dietary, className }: { dietary: DietaryPreference; className?: string }) {
  if (dietary === 'none') return null
  const map: Record<Exclude<DietaryPreference, 'none'>, { label: string; color: string; bg: string }> = {
    veg:       { label: 'Veg',     color: '#2D8A4E', bg: 'rgba(45,138,78,0.12)' },
    'non-veg': { label: 'Non-Veg', color: '#8B1A1A', bg: 'rgba(139,26,26,0.12)' },
    egg:       { label: 'Egg',     color: '#B8860B', bg: 'rgba(184,134,11,0.12)' },
    vegan:     { label: 'Vegan',   color: '#1A6B3C', bg: 'rgba(26,107,60,0.12)' },
  }
  const m = map[dietary as Exclude<DietaryPreference, 'none'>]
  if (!m) return null
  return (
    <span
      className={cn('inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-semibold', className)}
      style={{ color: m.color, background: m.bg }}
    >
      <VegMark dietary={dietary} size="xs" />
      {m.label}
    </span>
  )
}

// ── Item badge chips ───────────────────────────────────────────────────────

const BADGE_LABEL: Record<Badge, string> = {
  bestseller:  '★',
  chef_special: '♥',
  new:         'New',
  spicy:       '🌶',
}

// Removed separate BADGE_ICON — labels are now the icon for compact display

const BADGE_STYLE: Record<Badge, { bg: string; fg: string }> = {
  bestseller:  { bg: '#EAB308', fg: '#fff' }, // Solid gold for bestseller star
  chef_special: { bg: 'var(--brand)',              fg: '#fff' },
  new:         { bg: 'var(--brand3, #22C55E)',     fg: '#fff' },
  spicy:       { bg: '#C0392B',                    fg: '#fff' },
}

export function ItemBadge({ badge, className }: { badge: Badge; className?: string }) {
  const style = BADGE_STYLE[badge]
  // Compact: just the symbol or very short label — never wide
  return (
    <span
      className={cn(
        'inline-flex shrink-0 items-center rounded-full px-1.5 py-0.5 text-[9px] font-bold leading-none',
        className,
      )}
      style={{ background: style.bg, color: style.fg, letterSpacing: '0.02em' }}
      title={badge === 'bestseller' ? 'Bestseller' : badge === 'chef_special' ? "Chef's Special" : badge === 'new' ? 'New' : 'Spicy'}
    >
      {BADGE_LABEL[badge]}
    </span>
  )
}

// ── Dietary flags row (modal) ─────────────────────────────────────────────

export function DietaryFlags({ item }: { item: Item }) {
  return (
    <div className="flex flex-wrap items-center gap-1.5">
      {item.dietary !== 'none' && <DietaryTag dietary={item.dietary} />}
      {item.is_jain && (
        <span className="inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-semibold"
          style={{ color: '#7C3AED', background: 'rgba(124,58,237,0.1)' }}>
          <span aria-hidden>🔷</span> Jain
        </span>
      )}
      {item.is_gluten_free && (
        <span className="inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-semibold"
          style={{ color: '#0369A1', background: 'rgba(3,105,161,0.1)' }}>
          <span aria-hidden>🌾</span> Gluten-free
        </span>
      )}
    </div>
  )
}

// ── Compact dietary row for cards ─────────────────────────────────────────

export function CardDietaryRow({ item, className }: { item: Item; className?: string }) {
  return (
    <div className={cn('flex items-center gap-1.5', className)}>
      {item.dietary !== 'none' && <VegMark dietary={item.dietary} size="sm" />}
      {item.is_jain && (
        <span className="text-[9px] font-bold uppercase tracking-wide" style={{ color: '#7C3AED' }}>Jain</span>
      )}
      {item.is_gluten_free && (
        <span className="text-[9px] font-bold uppercase tracking-wide" style={{ color: '#0369A1' }}>GF</span>
      )}
      {item.allergens && item.allergens.length > 0 && (
        <span className="text-[9px]" style={{ color: 'var(--txt3)' }} title={`Contains: ${item.allergens.join(', ')}`}>
          ⚠
        </span>
      )}
    </div>
  )
}
