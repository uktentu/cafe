'use client'

// Ambient per-theme background motifs. Each theme gets a signature, *subtle*
// particle effect built entirely from CSS (see globals.css .amb-* classes), so
// it inherits the theme's colour tokens and costs ~no JS. Positions/timings are
// derived deterministically from the particle index so server and client render
// identical markup (no hydration mismatch). Disabled under reduced-motion via CSS.
import { useMemo } from 'react'
import type { Theme } from '@/types/database'

type Ambience = 'petals' | 'snow' | 'embers' | 'bubbles' | 'motes' | 'blobs' | 'neon' | 'none'

const THEME_AMBIENCE: Record<Theme, { kind: Ambience; count: number; opacity: number }> = {
  // Bold/minimal themes stay clean — ambience would fight their design.
  mercado:    { kind: 'none',    count: 0,  opacity: 0 },
  provenance: { kind: 'none',    count: 0,  opacity: 0 },
  terrain:    { kind: 'none',    count: 0,  opacity: 0 },
  studio:     { kind: 'none',    count: 0,  opacity: 0 },
  onyx:       { kind: 'motes',   count: 10, opacity: 0.35 }, // faint gold dust
  // Signature ambience
  bazaar:     { kind: 'motes',   count: 14, opacity: 0.45 },
  nocturne:   { kind: 'motes',   count: 12, opacity: 0.4 },
  coastal:    { kind: 'bubbles', count: 12, opacity: 0.4 },
  aether:     { kind: 'blobs',   count: 6,  opacity: 0.3 },
  sakura:     { kind: 'petals',  count: 14, opacity: 0.7 },
  frost:      { kind: 'snow',    count: 18, opacity: 0.8 },
  ember:      { kind: 'embers',  count: 16, opacity: 0.7 },
  arcade:     { kind: 'neon',    count: 16, opacity: 0.7 },
}

const PARTICLE_CLASS: Record<Exclude<Ambience, 'none'>, string> = {
  petals: 'amb-petal',
  snow: 'amb-snow',
  embers: 'amb-ember',
  bubbles: 'amb-bubble',
  motes: 'amb-mote',
  blobs: 'amb-blob',
  neon: 'amb-neon',
}

// Deterministic pseudo-random in [0,1) from an integer seed — keeps SSR/CSR in sync.
function rand(seed: number): number {
  const x = Math.sin(seed * 12.9898) * 43758.5453
  return x - Math.floor(x)
}

export function ThemeAmbience({ theme }: { theme: Theme }) {
  const cfg = THEME_AMBIENCE[theme] ?? THEME_AMBIENCE.mercado

  const particles = useMemo(() => {
    if (cfg.kind === 'none' || cfg.count === 0) return []
    const cls = PARTICLE_CLASS[cfg.kind]
    return Array.from({ length: cfg.count }, (_, i) => {
      const left = Math.round(rand(i + 1) * 100)
      const duration = 8 + Math.round(rand(i + 2) * 12) // 8–20s
      const delay = -Math.round(rand(i + 3) * duration) // negative = mid-flight at load
      const scale = 0.6 + rand(i + 4) * 0.9
      const isBlob = cfg.kind === 'blobs'
      const size = isBlob ? 80 + Math.round(rand(i + 5) * 120) : undefined
      const top = isBlob ? Math.round(rand(i + 6) * 100) : undefined
      const style: React.CSSProperties = {
        left: `${left}%`,
        animationDuration: `${duration}s`,
        animationDelay: `${delay}s`,
        transform: `scale(${scale.toFixed(2)})`,
      }
      if (isBlob && size != null) {
        style.width = `${size}px`
        style.height = `${size}px`
        style.top = `${top}%`
      }
      return { key: i, cls, style }
    })
  }, [cfg.kind, cfg.count])

  if (particles.length === 0) return null

  return (
    <div className="ambience-layer z-[2]" aria-hidden="true" style={{ opacity: cfg.opacity }}>
      {particles.map((p) => (
        <span key={p.key} className={`ambience-particle ${p.cls}`} style={p.style} />
      ))}
    </div>
  )
}
