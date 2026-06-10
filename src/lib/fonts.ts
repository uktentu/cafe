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

/** className that registers all font variables + emits the @font-face/preload. */
export const FONT_VARS_CLASS = ALL_FONTS.map((f) => f.variable).join(' ')

// We map each theme to the *concrete* family name next/font generates
// (e.g. "__Bebas_Neue_abc123", "__Bebas_Neue_Fallback_abc123") via `.style.fontFamily`,
// NOT to `var(--font-x)`. CSS custom-property substitution resolves `var()` on the
// element where the property is *declared* — and we declare --font-display on :root,
// where the next/font `--font-x` variables (defined on the wrapper) don't exist.
// Using the concrete family name sidesteps that cascade trap entirely.
type FontFamilySource = { style: { fontFamily: string } }
interface ThemeFontPair { display: FontFamilySource; body: FontFamilySource }

const THEME_FONTS: Record<Theme, ThemeFontPair> = {
  // Basic
  mercado:    { display: bebas,        body: dmSans },
  provenance: { display: dmSerif,      body: dmSans },
  terrain:    { display: spaceGrotesk, body: inter },
  // Advanced
  bazaar:     { display: anton,        body: dmSans },
  nocturne:   { display: cormorant,    body: outfit },
  coastal:    { display: fraunces,     body: plusJakarta },
  // Premium
  aether:     { display: syne,         body: inter },
  onyx:       { display: playfair,     body: jost },
  studio:     { display: spaceMono,    body: inter },
  // Specialty
  sakura:     { display: cormorant,    body: dmSans },
  frost:      { display: spaceGrotesk, body: dmSans },
  ember:      { display: playfair,     body: jost },
  arcade:     { display: spaceGrotesk, body: dmSans },
}

/** Concrete font-family stacks (with a system fallback) for a theme. */
export function themeFontFamilies(theme: Theme): { display: string; body: string } {
  const pair = THEME_FONTS[theme] ?? THEME_FONTS.mercado
  return {
    display: `${pair.display.style.fontFamily}, system-ui, sans-serif`,
    body: `${pair.body.style.fontFamily}, system-ui, sans-serif`,
  }
}

/** CSS vars to set so components can use var(--font-display) / var(--font-body). */
export function themeFontVars(theme: Theme): Record<string, string> {
  const { display, body } = themeFontFamilies(theme)
  return { '--font-display': display, '--font-body': body }
}
