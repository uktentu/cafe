// ════════════════════════════════════════════════════════════════════
// design-tokens.ts — per-theme CSS custom properties + metadata.
// Injected onto <html> in the (menu) layout based on NEXT_PUBLIC_THEME.
// Colours transcribed from docs/04-UI-UX-BRIEF.md. Every theme is designed
// to look award-winning text-only (no photos).
// ════════════════════════════════════════════════════════════════════
import type { Theme, Tier } from '@/types/database'
import { themeFontFamilies } from '@/lib/fonts'

export type CategoryNavStyle = 'pills' | 'text' | 'sections' | 'blocks' | 'vertical'
export type ColorScheme = 'dark' | 'light'

export interface ThemeMeta {
  tier: Tier
  scheme: ColorScheme
  /** Core CSS vars (without the leading `--`). Merged over base tokens. */
  colors: Record<string, string>
  displayFont: string
  bodyFont: string
  categoryNav: CategoryNavStyle
  /** Splash duration in ms (drives the SplashScreen timeout). */
  splashMs: number
  /** Lenis smooth-scroll duration; null = no Lenis (Basic tier). */
  lenis: number | null
  /** Default GSAP ease for item reveals (Advanced+). */
  gsapEase: string
  reference: string
}

// Shared motion + structural tokens (same across every theme).
const BASE_VARS: Record<string, string> = {
  'ease-smooth': 'cubic-bezier(0.65, 0, 0.35, 1)',
  'ease-spring': 'cubic-bezier(0.34, 1.56, 0.64, 1)',
  'ease-pop': 'cubic-bezier(0.22, 1, 0.36, 1)',
  'dur-fast': '150ms',
  'dur-base': '280ms',
  'dur-slow': '450ms',
}

export const THEMES: Record<Theme, ThemeMeta> = {
  // ── BASIC ─────────────────────────────────────────────────────────
  mercado: {
    tier: 'basic', scheme: 'dark', categoryNav: 'pills', splashMs: 1300, lenis: null,
    gsapEase: 'power2.out', reference: 'TMG / Tacos My Guey',
    displayFont: 'Bebas Neue', bodyFont: 'DM Sans',
    colors: {
      bg: '#0E0B09', sf1: '#1C1410', sf2: '#231E18', sf3: '#2E2820',
      brand: '#E5292A', brand2: '#F5A623',
      txt: '#F7EFE7', txt2: '#9A8878', txt3: '#5A4E44',
      bdr: 'rgba(247,239,231,0.08)', bdr2: 'rgba(247,239,231,0.14)',
      glass: 'rgba(13,11,8,0.85)',
    },
  },
  provenance: {
    tier: 'basic', scheme: 'light', categoryNav: 'text', splashMs: 1000, lenis: null,
    gsapEase: 'power2.out', reference: 'Elevare Market',
    displayFont: 'DM Serif Display', bodyFont: 'DM Sans',
    colors: {
      bg: '#FAFAF7', sf1: '#FFFFFF', sf2: '#F4F3EE', sf3: '#FFFFFF',
      brand: '#1A2E22', brand2: '#8A6840',
      txt: '#0D1A12', txt2: '#6B7A6E', txt3: '#A8B0A8',
      bdr: '#E0DDD5', bdr2: '#D2CFC5',
      glass: 'rgba(250,250,247,0.85)',
    },
  },
  terrain: {
    tier: 'basic', scheme: 'light', categoryNav: 'sections', splashMs: 1400, lenis: null,
    gsapEase: 'power2.out', reference: 'Platse',
    displayFont: 'Space Grotesk', bodyFont: 'Inter',
    colors: {
      bg: '#F2EDE6', sf1: '#EAE3D9', sf2: '#FFFFFF', sf3: '#FFFFFF',
      brand: '#2C2218', brand2: '#B85C2A',
      txt: '#1E160E', txt2: '#7A6A58', txt3: '#Ada08c',
      bdr: '#D4C9B8', bdr2: '#C2B6A2',
      glass: 'rgba(242,237,230,0.85)',
    },
  },
  // ── ADVANCED ──────────────────────────────────────────────────────
  bazaar: {
    tier: 'advanced', scheme: 'dark', categoryNav: 'blocks', splashMs: 1800, lenis: 1.0,
    gsapEase: 'power2.inOut', reference: 'Gourou Indian Food',
    displayFont: 'Anton', bodyFont: 'DM Sans',
    colors: {
      bg: '#0D0800', sf1: '#1A0E00', sf2: '#241400', sf3: '#2E1B02',
      brand: '#F5A623', brand2: '#E84A2F', brand3: '#2A9D8F',
      txt: '#FFF5E8', txt2: '#B89060', txt3: '#6E5230',
      bdr: 'rgba(245,166,35,0.16)', bdr2: 'rgba(245,166,35,0.28)',
      glass: 'rgba(13,8,0,0.85)',
    },
  },
  nocturne: {
    tier: 'advanced', scheme: 'dark', categoryNav: 'text', splashMs: 2000, lenis: 1.4,
    gsapEase: 'power3.out', reference: 'Timeless Club',
    displayFont: 'Cormorant Garamond', bodyFont: 'Outfit',
    colors: {
      bg: '#080A0C', sf1: '#10131A', sf2: '#18202B', sf3: '#1F2835',
      brand: '#C9A84C', brand2: '#C9A84C',
      txt: '#EDE8DA', txt2: '#6E7280', txt3: '#454A54',
      bdr: 'rgba(201,168,76,0.18)', bdr2: 'rgba(201,168,76,0.30)',
      glass: 'rgba(8,10,12,0.82)',
    },
  },
  coastal: {
    tier: 'advanced', scheme: 'light', categoryNav: 'pills', splashMs: 1200, lenis: 1.2,
    gsapEase: 'power2.out', reference: 'Single Fin',
    displayFont: 'Fraunces', bodyFont: 'Plus Jakarta Sans',
    colors: {
      bg: '#F5F8F5', sf1: '#FFFFFF', sf2: '#ECF3F0', sf3: '#FFFFFF',
      brand: '#1B5E8A', brand2: '#E07B39', brand3: '#4A9B6F',
      txt: '#162030', txt2: '#6A8090', txt3: '#A2B2BC',
      bdr: '#C8D8D0', bdr2: '#B0C6BC',
      glass: 'rgba(245,248,245,0.85)',
    },
  },
  // ── PREMIUM ───────────────────────────────────────────────────────
  aether: {
    tier: 'premium', scheme: 'light', categoryNav: 'text', splashMs: 2000, lenis: 1.5,
    gsapEase: 'power2.inOut', reference: 'Nube / Espacio La Nube',
    displayFont: 'Syne', bodyFont: 'Inter',
    colors: {
      bg: '#F8F7F3', sf1: '#EEECEA', sf2: '#FFFFFF', sf3: '#FFFFFF',
      brand: '#1A1208', brand2: '#7C5C3A', accent: '#C4A86A',
      txt: '#1A1208', txt2: '#8A7E6E', txt3: '#B8AE9E',
      bdr: 'rgba(26,18,8,0.10)', bdr2: 'rgba(26,18,8,0.18)',
      glass: 'rgba(248,247,243,0.82)',
    },
  },
  onyx: {
    tier: 'premium', scheme: 'dark', categoryNav: 'vertical', splashMs: 2500, lenis: 1.6,
    gsapEase: 'power3.out', reference: 'Onyx Restaurant Paris',
    displayFont: 'Playfair Display', bodyFont: 'Jost',
    colors: {
      bg: '#060606', sf1: '#0E0E0E', sf2: '#181818', sf3: '#202020',
      brand: '#FAFAF5', brand2: '#C9A35A',
      txt: '#FAFAF5', txt2: '#6A6660', txt3: '#403D38',
      bdr: 'rgba(250,250,245,0.08)', bdr2: 'rgba(250,250,245,0.16)',
      glass: 'rgba(6,6,6,0.82)',
    },
  },
  studio: {
    tier: 'premium', scheme: 'light', categoryNav: 'sections', splashMs: 1800, lenis: 1.1,
    gsapEase: 'power2.out', reference: 'RabenRifaie Studio',
    displayFont: 'Space Mono', bodyFont: 'Inter',
    colors: {
      bg: '#F0EEE8', sf1: '#FFFFFF', sf2: '#F7F6F1', sf3: '#FFFFFF',
      brand: '#0A0A0A', brand2: '#FF4500',
      txt: '#0A0A0A', txt2: '#888880', txt3: '#B8B8B0',
      bdr: 'rgba(10,10,10,0.1)', bdr2: 'rgba(10,10,10,0.2)',
      glass: 'rgba(240,238,232,0.85)',
    },
  },

  // ── SPECIALTY ──────────────────────────────────────────────────────
  sakura: {
    // Girly cafes · women's cafes · brunch spots · floral tea rooms
    tier: 'advanced', scheme: 'light', categoryNav: 'text', splashMs: 1600, lenis: 1.2,
    gsapEase: 'power2.out', reference: 'Girly / Women\'s Cafe',
    displayFont: 'Cormorant Garamond', bodyFont: 'DM Sans',
    colors: {
      bg: '#FFF8F9', sf1: '#FFFFFF', sf2: '#FFF0F3', sf3: '#FDE8EE',
      brand: '#A0243E', brand2: '#C4728A', brand3: '#E8B4C2',
      txt: '#3D0A18', txt2: '#9B5B6E', txt3: '#C4A3AE',
      bdr: 'rgba(160,36,62,0.12)', bdr2: 'rgba(160,36,62,0.22)',
      glass: 'rgba(255,248,249,0.88)',
    },
  },

  frost: {
    // Ice cream parlours · dessert cafes · sweet shops · gelato bars
    tier: 'basic', scheme: 'light', categoryNav: 'pills', splashMs: 1400, lenis: null,
    gsapEase: 'power2.out', reference: 'Ice Cream / Sweet Cafe',
    displayFont: 'Space Grotesk', bodyFont: 'DM Sans',
    colors: {
      bg: '#F0F9FF', sf1: '#FFFFFF', sf2: '#E0F2FE', sf3: '#BAE6FD',
      brand: '#0369A1', brand2: '#EC4899', brand3: '#A855F7',
      txt: '#0C2D4E', txt2: '#4D7A9B', txt3: '#94BDD4',
      bdr: 'rgba(3,105,161,0.15)', bdr2: 'rgba(3,105,161,0.28)',
      glass: 'rgba(240,249,255,0.90)',
    },
  },

  ember: {
    // Chinese restaurants · Asian fine dining · dim sum · noodle bars
    tier: 'advanced', scheme: 'dark', categoryNav: 'blocks', splashMs: 2000, lenis: 1.2,
    gsapEase: 'power2.inOut', reference: 'Chinese / Asian Restaurant',
    displayFont: 'Playfair Display', bodyFont: 'Jost',
    colors: {
      bg: '#0A0000', sf1: '#180000', sf2: '#220000', sf3: '#2C0002',
      brand: '#DC2626', brand2: '#F59E0B', brand3: '#B45309',
      txt: '#FEF2F2', txt2: '#B0837C', txt3: '#7A4D49',
      bdr: 'rgba(220,38,38,0.2)', bdr2: 'rgba(220,38,38,0.35)',
      glass: 'rgba(10,0,0,0.88)',
    },
  },

  arcade: {
    // Board game cafes · gaming lounges · fun cafes · esports bars
    tier: 'advanced', scheme: 'dark', categoryNav: 'pills', splashMs: 1500, lenis: 1.0,
    gsapEase: 'power2.out', reference: 'Board Game / Gaming Cafe',
    displayFont: 'Space Grotesk', bodyFont: 'DM Sans',
    colors: {
      bg: '#0F0A1E', sf1: '#1A1230', sf2: '#221A3C', sf3: '#2E2450',
      brand: '#8B5CF6', brand2: '#EC4899', brand3: '#F59E0B',
      txt: '#F5F3FF', txt2: '#8B80A8', txt3: '#5B5080',
      bdr: 'rgba(139,92,246,0.2)', bdr2: 'rgba(139,92,246,0.38)',
      glass: 'rgba(15,10,30,0.85)',
    },
  },
}

/**
 * Parse "#RRGGBB" → "r,g,b" so we can build rgba() shades from --brand.
 * Returns null for non-hex (e.g. rgba already), where derived shades are skipped.
 */
function hexToRgb(hex: string): string | null {
  const m = /^#([0-9a-f]{6})$/i.exec(hex.trim())
  if (!m) return null
  const int = Number.parseInt(m[1], 16)
  return `${(int >> 16) & 255},${(int >> 8) & 255},${int & 255}`
}

/**
 * Full CSS-var map for a theme. Merges base motion tokens, theme colours, and
 * derived --brand-dim / --brand-glow. `brandOverride` (businesses.theme_color)
 * lets a restaurant swap the brand colour without a new template.
 */
export function themeCssVars(theme: Theme, brandOverride?: string | null): Record<string, string> {
  const meta = THEMES[theme] ?? THEMES.mercado
  const colors = { ...meta.colors }
  if (brandOverride && /^#([0-9a-f]{3}|[0-9a-f]{6})$/i.test(brandOverride)) {
    colors.brand = brandOverride
  }
  const vars: Record<string, string> = {}
  for (const [k, v] of Object.entries(BASE_VARS)) vars[`--${k}`] = v
  for (const [k, v] of Object.entries(colors)) vars[`--${k}`] = v

  // Concrete next/font family names (NOT "Bebas Neue" literals — those never match
  // next/font's hashed family names, and NOT var(--font-x) which breaks at :root).
  const fonts = themeFontFamilies(theme)
  vars['--font-display'] = fonts.display
  vars['--font-body'] = fonts.body

  const rgb = hexToRgb(colors.brand)
  if (rgb) {
    vars['--brand-dim'] = `rgba(${rgb},0.12)`
    vars['--brand-glow'] = `rgba(${rgb},0.06)`
    vars['--brand-rgb'] = rgb
  }
  return vars
}

/** Serialise theme vars into a `style` string for inline injection on <html>. */
export function themeStyleString(theme: Theme, brandOverride?: string | null): string {
  return Object.entries(themeCssVars(theme, brandOverride))
    .map(([k, v]) => `${k}:${v}`)
    .join(';')
}

/** 
 * Enforce tier-based theme locks for the live menu.
 * Returns the requested theme if allowed, otherwise falls back to 'mercado'.
 */
export function resolveTheme(userTier: Tier, requestedTheme: Theme | null | undefined): Theme {
  if (!requestedTheme) return 'mercado'
  const meta = THEMES[requestedTheme]
  if (!meta) return 'mercado'
  
  const TIER_RANK: Record<Tier, number> = { basic: 0, advanced: 1, premium: 2 }
  if (TIER_RANK[meta.tier] > TIER_RANK[userTier]) {
    return 'mercado'
  }
  return requestedTheme
}

/** Predefined inverse pairs for light/dark mode overrides */
export const INVERSE_THEMES: Record<Theme, Theme> = {
  mercado: 'provenance',
  provenance: 'mercado',
  terrain: 'mercado',
  bazaar: 'coastal',
  nocturne: 'aether',
  coastal: 'bazaar',
  aether: 'nocturne',
  onyx: 'studio',
  studio: 'onyx',
  sakura: 'ember',
  frost: 'arcade',
  ember: 'sakura',
  arcade: 'frost',
}
