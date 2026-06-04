// ════════════════════════════════════════════════════════════════════
// fonts.ts — next/font/google loaders for all 9 templates.
// Each font family registers a CSS variable. Components use
// var(--font-display) / var(--font-body) — set per-theme by themeFontVars().
// next/font only fetches the glyphs the browser actually uses, so declaring
// all font families here costs nothing for inactive templates.
// ════════════════════════════════════════════════════════════════════
import {
  // Basic
  Bebas_Neue, DM_Sans, DM_Serif_Display, Space_Grotesk, Inter,
  // Advanced
  Anton, Cormorant_Garamond, Outfit, Fraunces, Plus_Jakarta_Sans,
  // Premium
  Syne, Playfair_Display, Jost, Space_Mono,
} from 'next/font/google'
import type { Theme } from '@/types/database'

// ── Basic ─────────────────────────────────────────────────────────
const bebas = Bebas_Neue({
  weight: '400', subsets: ['latin'], variable: '--font-bebas', display: 'swap',
})
const dmSans = DM_Sans({
  subsets: ['latin'], variable: '--font-dm-sans', display: 'swap',
})
const dmSerif = DM_Serif_Display({
  weight: ['400'], style: ['normal', 'italic'], subsets: ['latin'],
  variable: '--font-dm-serif', display: 'swap',
})
const spaceGrotesk = Space_Grotesk({
  subsets: ['latin'], variable: '--font-space-grotesk', display: 'swap',
})
const inter = Inter({
  subsets: ['latin'], variable: '--font-inter', display: 'swap',
})

// ── Advanced ──────────────────────────────────────────────────────
const anton = Anton({
  weight: '400', subsets: ['latin'], variable: '--font-anton', display: 'swap',
})
const cormorant = Cormorant_Garamond({
  weight: ['300', '400', '600'], style: ['normal', 'italic'], subsets: ['latin'],
  variable: '--font-cormorant', display: 'swap',
})
const outfit = Outfit({
  subsets: ['latin'], variable: '--font-outfit', display: 'swap',
})
const fraunces = Fraunces({
  subsets: ['latin'], variable: '--font-fraunces', display: 'swap',
  axes: ['SOFT', 'WONK'], style: ['normal', 'italic'],
})
const plusJakarta = Plus_Jakarta_Sans({
  subsets: ['latin'], variable: '--font-plus-jakarta', display: 'swap',
})

// ── Premium ───────────────────────────────────────────────────────
const syne = Syne({
  subsets: ['latin'], variable: '--font-syne', display: 'swap',
})
const playfair = Playfair_Display({
  subsets: ['latin'], variable: '--font-playfair', display: 'swap',
  style: ['normal', 'italic'],
})
const jost = Jost({
  subsets: ['latin'], variable: '--font-jost', display: 'swap',
})
const spaceMono = Space_Mono({
  weight: ['400', '700'], subsets: ['latin'], variable: '--font-space-mono', display: 'swap',
})

const ALL_FONTS = [
  bebas, dmSans, dmSerif, spaceGrotesk, inter,
  anton, cormorant, outfit, fraunces, plusJakarta,
  syne, playfair, jost, spaceMono,
]

/** className that registers all font variables on the wrapper element. */
export const FONT_VARS_CLASS = ALL_FONTS.map((f) => f.variable).join(' ')

interface ThemeFontPair { display: string; body: string }

const THEME_FONTS: Record<Theme, ThemeFontPair> = {
  // Basic
  mercado:    { display: 'var(--font-bebas)',        body: 'var(--font-dm-sans)' },
  provenance: { display: 'var(--font-dm-serif)',     body: 'var(--font-dm-sans)' },
  terrain:    { display: 'var(--font-space-grotesk)', body: 'var(--font-inter)' },
  // Advanced
  bazaar:     { display: 'var(--font-anton)',        body: 'var(--font-dm-sans)' },
  nocturne:   { display: 'var(--font-cormorant)',    body: 'var(--font-outfit)' },
  coastal:    { display: 'var(--font-fraunces)',     body: 'var(--font-plus-jakarta)' },
  // Premium
  aether:     { display: 'var(--font-syne)',         body: 'var(--font-inter)' },
  onyx:       { display: 'var(--font-playfair)',     body: 'var(--font-jost)' },
  studio:     { display: 'var(--font-space-mono)',   body: 'var(--font-inter)' },
  // Specialty
  sakura:     { display: 'var(--font-cormorant)',    body: 'var(--font-dm-sans)' },
  frost:      { display: 'var(--font-space-grotesk)', body: 'var(--font-dm-sans)' },
  ember:      { display: 'var(--font-playfair)',     body: 'var(--font-jost)' },
  arcade:     { display: 'var(--font-space-grotesk)', body: 'var(--font-dm-sans)' },
}

/** CSS vars to set on the menu wrapper so components can use var(--font-display). */
export function themeFontVars(theme: Theme): Record<string, string> {
  const pair = THEME_FONTS[theme] ?? THEME_FONTS.mercado
  return { '--font-display': pair.display, '--font-body': pair.body }
}
