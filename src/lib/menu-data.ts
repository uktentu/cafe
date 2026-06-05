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
    // Ensure social_links matches our type (old schema may have extra fields)
    social_links: {
      instagram: raw.social_links?.instagram ?? null,
      swiggy: raw.social_links?.swiggy ?? null,
      zomato: raw.social_links?.zomato ?? null,
      google_maps: raw.social_links?.google_maps ?? null,
      multiple_menus_enabled: raw.social_links?.multiple_menus_enabled ?? false,
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

export const getMenuData = cache(_getMenuData)

async function _getMenuData(slug: string): Promise<MenuData | null> {
  if (!supabaseConfigured()) {
    return { business: demoBusiness, categories: demoCategories, items: demoItems, translations: [], banners: [], branches: [], menus: [], demo: true }
  }

  const supabase = createAnonClient()

  const { data: raw } = await supabase
    .from('businesses')
    .select('*')
    .eq('slug', slug)
    .eq('is_active', true)
    .maybeSingle()

  if (!raw) return null
  const business = normaliseBusiness(raw)

  const [{ data: rawCats }, { data: rawItems }, { data: rawTrans }, { data: rawBanners }, { data: rawBranches }, { data: rawMenus }] = await Promise.all([
    supabase
      .from('categories')
      .select('*')
      .eq('business_id', business.id)
      .eq('is_active', true)
      .order('sort_order', { ascending: true }),
    supabase
      .from('items')
      .select('*')
      .eq('business_id', business.id)
      .order('sort_order', { ascending: true }),
    supabase
      .from('translations')
      .select('*')
      .eq('business_id', business.id),
    supabase
      .from('banners')
      .select('*')
      .eq('business_id', business.id)
      .eq('is_active', true)
      .order('sort_order', { ascending: true }),
    supabase
      .from('branches')
      .select('*')
      .eq('business_id', business.id),
    supabase
      .from('menus')
      .select('*')
      .eq('business_id', business.id)
      .eq('is_active', true),
  ])

  const { limits, features } = getConfig()

  // Enforce tier limits for live menu rendering
  const limitedCategories = (rawCats ?? []).map(normaliseCategory).slice(0, limits.categories)
  const limitedItems = (rawItems ?? []).map(normaliseItem).slice(0, limits.items)
  const activeBanners = features.banners ? (rawBanners ?? []).slice(0, limits.banners) : []
  const activeBranches = features.multiBranch ? (rawBranches ?? []) : []
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
