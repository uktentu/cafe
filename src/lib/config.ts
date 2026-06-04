// ════════════════════════════════════════════════════════════════════
// getConfig() — the single source of truth for tier limits, feature gates,
// and motion flags. NEVER read process.env.NEXT_PUBLIC_TIER in components;
// always go through getConfig().
//
// Limits come from env vars (NEXT_PUBLIC_MAX_*) and fall back to per-tier
// defaults. Changing a client's limit = edit one Cloudflare env var, no code,
// no redeploy logic. Safe to call on server and client (NEXT_PUBLIC_* inlined).
// ════════════════════════════════════════════════════════════════════
import { cache } from 'react'
import type { Tier, Theme } from '@/types/database'

export interface Limits {
  items: number
  categories: number
  qrCodes: number
  staff: number
  branches: number
  photosPerItem: number
  banners: number
}

export interface Features {
  analytics: boolean        // full analytics dashboard (Advanced+)
  banners: boolean          // promo banners (Advanced+)
  menus: boolean            // multiple scheduled menus (Advanced+)
  featuredCarousel: boolean // bestsellers strip (Advanced+)
  socialLinks: boolean      // social links block (Advanced+)
  dragReorder: boolean      // dnd-kit reorder (Advanced+)
  staffAccounts: boolean    // invite staff (Advanced+)
  reservations: boolean     // Premium + env toggle
  multiBranch: boolean      // Premium + env toggle
  bilingual: boolean        // Premium + env toggle
  customDomain: boolean     // Premium
  dynamicQr: boolean        // Premium
  seo: boolean              // Premium
  pdfReports: boolean       // Premium
}

export interface Motion {
  framer: boolean   // all tiers
  gsap: boolean     // Advanced+ — dynamic-import guard
  lenis: boolean    // Advanced+
  customEase: boolean // Premium
}

export interface AppConfig {
  slug: string
  tier: Tier
  theme: Theme
  siteUrl: string
  whatsapp: string
  phone: string
  limits: Limits
  features: Features
  motion: Motion
  secondaryLocale: string
}

const TIER_LIMITS: Record<Tier, Limits> = {
  basic:    { items: 30,   categories: 3,  qrCodes: 1,  staff: 1, branches: 1, photosPerItem: 1, banners: 0  },
  advanced: { items: 100,  categories: 99, qrCodes: 5,  staff: 2, branches: 1, photosPerItem: 3, banners: 5  },
  premium:  { items: 9999, categories: 99, qrCodes: 99, staff: 5, branches: 3, photosPerItem: 9, banners: 20 },
}

const TIER_RANK: Record<Tier, number> = { basic: 0, advanced: 1, premium: 2 }

/** Parse an env override; blank/invalid falls back to the tier default. */
function envInt(value: string | undefined, fallback: number): number {
  if (value == null || value.trim() === '') return fallback
  const n = Number.parseInt(value, 10)
  return Number.isFinite(n) ? n : fallback
}

function envBool(value: string | undefined): boolean {
  return value === 'true' || value === '1'
}

function resolveLimits(tier: Tier): Limits {
  const d = TIER_LIMITS[tier]
  return {
    items:         envInt(process.env.NEXT_PUBLIC_MAX_ITEMS, d.items),
    categories:    envInt(process.env.NEXT_PUBLIC_MAX_CATEGORIES, d.categories),
    qrCodes:       envInt(process.env.NEXT_PUBLIC_MAX_QR_CODES, d.qrCodes),
    staff:         envInt(process.env.NEXT_PUBLIC_MAX_STAFF, d.staff),
    branches:      envInt(process.env.NEXT_PUBLIC_MAX_BRANCHES, d.branches),
    photosPerItem: envInt(process.env.NEXT_PUBLIC_MAX_PHOTOS_PER_ITEM, d.photosPerItem),
    banners:       envInt(process.env.NEXT_PUBLIC_MAX_BANNERS, d.banners),
  }
}

function resolveFeatures(tier: Tier): Features {
  const advancedUp = TIER_RANK[tier] >= TIER_RANK.advanced
  const premium = tier === 'premium'
  return {
    analytics: advancedUp,
    banners: advancedUp,
    menus: advancedUp,
    featuredCarousel: advancedUp,
    socialLinks: advancedUp,
    dragReorder: advancedUp,
    staffAccounts: advancedUp,
    // Premium features are opt-in via env toggle (default false even on premium).
    reservations: premium && envBool(process.env.NEXT_PUBLIC_RESERVATIONS),
    multiBranch: premium && envBool(process.env.NEXT_PUBLIC_MULTI_BRANCH),
    bilingual: premium && envBool(process.env.NEXT_PUBLIC_BILINGUAL),
    customDomain: premium,
    dynamicQr: premium,
    seo: premium,
    pdfReports: premium,
  }
}

function resolveMotion(tier: Tier): Motion {
  const advancedUp = TIER_RANK[tier] >= TIER_RANK.advanced
  return {
    framer: true,
    gsap: advancedUp,
    lenis: advancedUp,
    customEase: tier === 'premium',
  }
}

function readTier(): Tier {
  const t = process.env.NEXT_PUBLIC_TIER as Tier | undefined
  return t === 'advanced' || t === 'premium' ? t : 'basic'
}

function _buildConfig(): AppConfig {
  const tier = readTier()
  return {
    slug: process.env.NEXT_PUBLIC_CLIENT_SLUG ?? '',
    tier,
    theme: (process.env.NEXT_PUBLIC_THEME as Theme) ?? 'mercado',
    siteUrl: process.env.NEXT_PUBLIC_SITE_URL ?? '',
    whatsapp: process.env.NEXT_PUBLIC_WHATSAPP ?? '',
    phone: process.env.NEXT_PUBLIC_PHONE ?? '',
    limits: resolveLimits(tier),
    features: resolveFeatures(tier),
    motion: resolveMotion(tier),
    secondaryLocale: process.env.NEXT_PUBLIC_SECONDARY_LOCALE ?? 'hi',
  }
}

// React.cache deduplicates calls within the same server request and resets
// between requests, preventing cross-request data leakage. On the client the
// module is per-page so a simple module-level memo is safe.
export const getConfig: () => AppConfig =
  typeof window === 'undefined' ? cache(_buildConfig) : (() => {
    let c: AppConfig | null = null
    return () => { if (!c) c = _buildConfig(); return c }
  })()

/** Test helper — only works in non-cached (client-side) context. */
export function __resetConfig() {
  // no-op in server context (React.cache resets per request automatically)
}

export const tierRank = (tier: Tier) => TIER_RANK[tier]
