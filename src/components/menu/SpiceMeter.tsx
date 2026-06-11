'use client'

// Spice meter — up to 3 chillies tinted with the theme's accent colour, so it
// reads as native to every template. Filled chillies use --brand2 (falls back to
// --brand); empty ones are faint. Renders nothing when spice_level is 0/undefined.
import { Flame } from 'lucide-react'

const LABELS = ['', 'Mild', 'Medium', 'Hot'] as const

export function SpiceMeter({ level, size = 13, showLabel = false }: { level?: number; size?: number; showLabel?: boolean }) {
  const lvl = Math.max(0, Math.min(3, Math.round(level ?? 0)))
  if (lvl === 0) return null

  return (
    <span className="inline-flex items-center gap-1" aria-label={`Spice level: ${LABELS[lvl]}`}>
      <span className="inline-flex items-center gap-0.5">
        {[1, 2, 3].map((i) => (
          <Flame
            key={i}
            style={{
              width: size,
              height: size,
              color: i <= lvl ? 'var(--brand2, var(--brand))' : 'var(--txt3)',
              fill: i <= lvl ? 'var(--brand2, var(--brand))' : 'transparent',
              opacity: i <= lvl ? 1 : 0.4,
            }}
          />
        ))}
      </span>
      {showLabel && (
        <span className="text-[11px] font-semibold uppercase tracking-wide" style={{ color: 'var(--brand2, var(--brand))' }}>
          {LABELS[lvl]}
        </span>
      )}
    </span>
  )
}
