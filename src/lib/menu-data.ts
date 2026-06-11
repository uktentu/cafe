// ════════════════════════════════════════════════════════════════════
// menu-data.ts — server-side fetch for the public QR menu.
// Queried once per ISR window (revalidate: 30) then served from edge cache.
// Uses a cookie-free anon client so the route stays ○ Static (ISR).
//
// normalise*() functions handle both the MenuOS schema (after patch) and
// the legacy menuos schema that may still be in place.
// ════════════════════════════════════════════════════════════════════

import { cache } from 'react'
import { createAnonClient } from '@/lib/supabase/server'
import { supabaseConfigured } from '@/lib/env'
import { demoBusiness, demoCategories, demoItems } from '@/lib/demo-data'
import { getConfig } from '@/lib/config'
import type { Business, Category, Item, Theme, ImageMode, Translation, Banner, Branch, Menu } from '@/types/database'

export interface MenuData {
  business: Business
  categories: Category[]
  items: Item[]
  translations: Translation[]
  banners: Banner[]
  branches: Branch[]
  menus: Menu[]
  demo: boolean
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function normaliseBusiness(raw: any): Business {
  return {
    ...raw,
    // Handle both new column name (theme) and old (theme_preset)
    theme: (raw.theme || raw.theme_preset || 'mercado') as Theme,
    // Handle both new column names and old (logo_url / cover_image_url)
    logo_r2_key: raw.logo_r2_key ?? null,
    cover_r2_key: raw.cover_r2_key ?? null,
    firebase_measurement_id: raw.firebase_measurement_id ?? null,
    seo_title: raw.seo_title ?? null,
    seo_description: raw.seo_description ?? null,
    seo_og_r2_key: raw.seo_og_r2_key ?? null,
    // Preserve the full social_links blob (about, wait_time, *_enabled flags, …)
    // while guaranteeing the known keys have sane defaults. Whitelisting here
    // previously dropped fields like multiple_branches_enabled and about.
    social_links: {
      instagram: null,
      swiggy: null,
      zomato: null,
      google_maps: null,
      multiple_menus_enabled: false,
      ...(raw.social_links ?? {}),
    },
  } as Business
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function normaliseItem(raw: any): Item {
  // Old schema uses an `images` array; new uses image_mode + *_key columns.
  let image_mode: ImageMode = (raw.image_mode as ImageMode) ?? 'none'
  const stock_image_key: string | null = raw.stock_image_key ?? null
  let custom_r2_key: string | null = raw.custom_r2_key ?? null
  let custom_thumb_key: string | null = raw.custom_thumb_key ?? null

  if (!raw.image_mode) {
    const imgs = Array.isArray(raw.images) ? raw.images : []
    if (imgs.length > 0) {
      image_mode = 'custom'
      custom_r2_key = imgs[0]
      custom_thumb_key = imgs[0]
    }
  }

  return {
    ...raw,
    image_mode,
    stock_image_key,
    custom_r2_key,
    custom_thumb_key,
    compare_price: raw.compare_price ?? null,
    allergens: raw.allergens ?? [],
    dietary: raw.dietary ?? 'none',
    is_jain: raw.is_jain ?? false,
    is_gluten_free: raw.is_gluten_free ?? false,
    badge: raw.badge ?? null,
    is_featured: raw.is_featured ?? false,
    spice_level: raw.spice_level ?? 0,
  } as Item
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function normaliseCategory(raw: any): Category {
  return {
    ...raw,
    icon: raw.icon ?? null,
    description: raw.description ?? null,
    menu_id: raw.menu_id ?? null,
  } as Category
}

// Minimal KV interface — avoids importing @cloudflare/workers-types globally
// which conflicts with DOM lib types.
interface MenuCacheKV {
  get(key: string, type: 'json'): Promise<unknown>
  put(key: string, value: string, options?: { expirationTtl?: number }): Promise<void>
  delete(key: string): Promise<void>
}

function getKV(): MenuCacheKV | null {
  try {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const { getRequestContext } = require('@cloudflare/next-on-pages')
    const { env } = getRequestContext() as { env: Record<string, unknown> }
    return (env.MENU_CACHE as MenuCacheKV) ?? null
  } catch {
    return null
  }
}

// cache() deduplicates within a single render — generateMetadata() and MenuPage()
// both call getMenuData(); without this they'd each independently hit KV/Supabase.
export const getMenuData = cache(async (slug: string): Promise<MenuData> => {
  const kv = getKV()

  if (kv) {
    try {
      const cached = await kv.get(`menu:${slug}`, 'json')
      if (cached) return cached as MenuData
    } catch (e) {
      console.warn('KV read error', e)
    }
  }

  // KV miss (cold start or first deploy) — fetch from Supabase then warm KV
  const data = await _getMenuData(slug)
  if (kv && data) {
    // 24h TTL is a safety net; the revalidate route overwrites on every CMS save
    await kv.put(`menu:${slug}`, JSON.stringify(data), { expirationTtl: 86400 }).catch(() => {})
  }
  return data as MenuData
})

// Exported for the /api/revalidate route so it can write fresh data into KV
// without going through the React.cache() memoization layer.
export async function fetchFreshMenuData(slug: string): Promise<MenuData | null> {
  return _getMenuData(slug)
}

export { getKV }

async function _getMenuData(slug: string): Promise<MenuData | null> {
  if (!supabaseConfigured()) {
    return { business: demoBusiness, categories: demoCategories, items: demoItems, translations: [], banners: [], branches: [], menus: [], demo: true }
  }

  const supabase = createAnonClient()

  // Single PostgREST round-trip: embed all related tables in one request.
  // Client-side sort/filter replaces per-table .order()/.eq() calls.
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: raw, error } = await (supabase as any)
    .from('businesses')
    .select('*, categories(*), items(*), translations(*), banners(*), branches(*), menus(*)')
    .eq('slug', slug)
    .eq('is_active', true)
    .maybeSingle()

  if (!raw) return { _error: error, _slug: slug, _supabaseUrl: process.env.NEXT_PUBLIC_SUPABASE_URL } as unknown as MenuData
  const business = normaliseBusiness(raw)

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const byOrder = (a: any, b: any) => (a.sort_order ?? 0) - (b.sort_order ?? 0)
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const rawCats = ((raw.categories ?? []) as any[]).filter((c) => c.is_active).sort(byOrder)
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const rawItems = ((raw.items ?? []) as any[]).sort(byOrder)
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const rawTrans = (raw.translations ?? []) as any[]
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const rawBanners = ((raw.banners ?? []) as any[]).filter((b) => b.is_active).sort(byOrder)
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const rawBranches = (raw.branches ?? []) as any[]
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const rawMenus = ((raw.menus ?? []) as any[]).filter((m) => m.is_active)

  const { limits, features } = getConfig()

  // Enforce tier limits for live menu rendering
  const limitedCategories = (rawCats ?? []).map(normaliseCategory).slice(0, limits.categories)
  const limitedItems = (rawItems ?? []).map(normaliseItem).slice(0, limits.items)
  const activeBanners = features.banners ? (rawBanners ?? []).slice(0, limits.banners) : []
  const isBranchesEnabled = features.multiBranch && business.social_links?.multiple_branches_enabled === true
  const activeBranches = isBranchesEnabled ? (rawBranches ?? []) : []
  const activeMenus = features.menus ? (rawMenus ?? []) : []

  return {
    business,
    categories: limitedCategories,
    items: limitedItems,
    translations: rawTrans ?? [],
    banners: activeBanners,
    branches: activeBranches,
    menus: activeMenus,
    demo: false,
  }
}
