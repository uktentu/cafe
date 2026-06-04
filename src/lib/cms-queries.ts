// Client-side CMS data access (browser Supabase client + RLS). Writes that
// affect the public menu call revalidateMenu() so ISR refreshes within 30s.
'use client'

import { createClient } from '@/lib/supabase/client'
import type { Category, Item, StockImage, Business, Banner, Menu as MenuRow, AnalyticsEvent } from '@/types/database'

let _client: ReturnType<typeof createClient> | null = null
function db() {
  if (!_client) _client = createClient()
  return _client
}

export const qk = {
  items: (bid: string) => ['items', bid] as const,
  categories: (bid: string) => ['categories', bid] as const,
  stock: () => ['stock-images'] as const,
  banners: (bid: string) => ['banners', bid] as const,
  menus: (bid: string) => ['menus', bid] as const,
  analytics: (bid: string) => ['analytics', bid] as const,
}

// ── Reads ───────────────────────────────────────────────────────────
export async function fetchItems(businessId: string): Promise<Item[]> {
  const { data, error } = await db()
    .from('items')
    .select('*')
    .eq('business_id', businessId)
    .order('sort_order', { ascending: true })
  if (error) throw error
  return (data ?? []).map(normaliseItem)
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function normaliseItem(raw: any): Item {
  let image_mode = (raw.image_mode ?? 'none') as Item['image_mode']
  let custom_r2_key: string | null = raw.custom_r2_key ?? null
  let custom_thumb_key: string | null = raw.custom_thumb_key ?? null
  if (!raw.image_mode) {
    const imgs = Array.isArray(raw.images) ? raw.images : []
    if (imgs.length > 0) { image_mode = 'custom'; custom_r2_key = imgs[0]; custom_thumb_key = imgs[0] }
  }
  return { ...raw, image_mode, stock_image_key: raw.stock_image_key ?? null, custom_r2_key, custom_thumb_key,
    compare_price: raw.compare_price ?? null, badge: raw.badge ?? null,
    allergens: raw.allergens ?? [], is_featured: raw.is_featured ?? false,
    dietary: raw.dietary ?? 'none' } as Item
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function normaliseCategory(raw: any): Category {
  return { ...raw, icon: raw.icon ?? null, menu_id: raw.menu_id ?? null, description: raw.description ?? null } as Category
}

export async function fetchItem(id: string): Promise<Item> {
  const { data, error } = await db().from('items').select('*').eq('id', id).single()
  if (error) throw error
  return normaliseItem(data)
}

export async function fetchCategories(businessId: string): Promise<Category[]> {
  const { data, error } = await db()
    .from('categories')
    .select('*')
    .eq('business_id', businessId)
    .order('sort_order', { ascending: true })
  if (error) throw error
  return (data ?? []).map(normaliseCategory)
}

export async function fetchStockImages(): Promise<StockImage[]> {
  const { data, error } = await db()
    .from('stock_images')
    .select('*')
    .eq('is_active', true)
    .order('sort_order', { ascending: true })
  if (error) throw error
  return (data ?? []) as StockImage[]
}

// ── Revalidation ────────────────────────────────────────────────────
export function revalidateMenu(): void {
  fetch('/api/revalidate', { method: 'POST' }).catch(() => {
    /* best-effort; ISR still refreshes within 30s */
  })
}

// ── Item writes ─────────────────────────────────────────────────────
export async function toggleAvailability(itemId: string, value: boolean): Promise<void> {
  const { error } = await db()
    .from('items')
    .update({ is_available: value, updated_at: new Date().toISOString() })
    .eq('id', itemId)
  if (error) throw error
  revalidateMenu()
}

export type ItemInput = Partial<Item> & { business_id: string; name: string; price: number }

export async function createItem(input: ItemInput): Promise<Item> {
  const { data, error } = await db().from('items').insert(input).select('*').single()
  if (error) throw error
  revalidateMenu()
  return data as Item
}

export async function updateItem(id: string, patch: Partial<Item>): Promise<Item> {
  const { data, error } = await db()
    .from('items')
    .update({ ...patch, updated_at: new Date().toISOString() })
    .eq('id', id)
    .select('*')
    .single()
  if (error) throw error
  revalidateMenu()
  return data as Item
}

export async function deleteItem(id: string): Promise<void> {
  const { error } = await db().from('items').delete().eq('id', id)
  if (error) throw error
  revalidateMenu()
}

// ── Category writes ─────────────────────────────────────────────────
export type CategoryInput = Partial<Category> & { business_id: string; name: string }

export async function createCategory(input: CategoryInput): Promise<Category> {
  const { data, error } = await db().from('categories').insert(input).select('*').single()
  if (error) throw error
  revalidateMenu()
  return data as Category
}

export async function updateCategory(id: string, patch: Partial<Category>): Promise<Category> {
  const { data, error } = await db().from('categories').update(patch).eq('id', id).select('*').single()
  if (error) throw error
  revalidateMenu()
  return data as Category
}

export async function deleteCategory(id: string): Promise<void> {
  const { error } = await db().from('categories').delete().eq('id', id)
  if (error) throw error
  revalidateMenu()
}

export async function reorderCategories(ordered: { id: string; sort_order: number }[]): Promise<void> {
  // Persist new sort_order one-by-one (small lists; categories are few).
  await Promise.all(
    ordered.map((c) => db().from('categories').update({ sort_order: c.sort_order }).eq('id', c.id)),
  )
  revalidateMenu()
}

// ── Business writes ─────────────────────────────────────────────────
export async function updateBusiness(id: string, patch: Partial<Business>): Promise<Business> {
  const { data, error } = await db()
    .from('businesses')
    .update({ ...patch, updated_at: new Date().toISOString() })
    .eq('id', id)
    .select('*')
    .single()
  if (error) throw error
  revalidateMenu()
  return data as Business
}

// ── Image upload (sharp → R2 via API) ───────────────────────────────
export interface UploadResult {
  image_mode?: 'custom'
  custom_r2_key?: string
  custom_thumb_key?: string
  r2_key?: string
}

export async function uploadImage(
  file: File,
  type: 'item' | 'logo' | 'cover' | 'banner',
  id?: string,
): Promise<UploadResult> {
  const form = new FormData()
  form.append('file', file)
  form.append('type', type)
  if (id) form.append('id', id)
  const res = await fetch('/api/upload', { method: 'POST', body: form })
  if (!res.ok) {
    const { error } = await res.json().catch(() => ({ error: 'Upload failed' }))
    throw new Error(error || 'Upload failed')
  }
  return res.json()
}

// ── Banner reads/writes ──────────────────────────────────────────────
export async function fetchBanners(businessId: string): Promise<Banner[]> {
  const { data, error } = await db()
    .from('banners')
    .select('*')
    .eq('business_id', businessId)
    .order('sort_order', { ascending: true })
  if (error) throw error
  return (data ?? []) as Banner[]
}

export type BannerInput = Partial<Banner> & { business_id: string }

export async function createBanner(input: BannerInput): Promise<Banner> {
  const { data, error } = await db().from('banners').insert(input).select('*').single()
  if (error) throw error
  revalidateMenu()
  return data as Banner
}

export async function updateBanner(id: string, patch: Partial<Banner>): Promise<Banner> {
  const { data, error } = await db().from('banners').update(patch).eq('id', id).select('*').single()
  if (error) throw error
  revalidateMenu()
  return data as Banner
}

export async function deleteBanner(id: string): Promise<void> {
  const { error } = await db().from('banners').delete().eq('id', id)
  if (error) throw error
  revalidateMenu()
}

// ── Menu reads/writes ────────────────────────────────────────────────
export async function fetchMenus(businessId: string): Promise<MenuRow[]> {
  const { data, error } = await db()
    .from('menus')
    .select('*')
    .eq('business_id', businessId)
    .order('sort_order', { ascending: true })
  if (error) throw error
  return (data ?? []) as MenuRow[]
}

export type MenuInput = Partial<MenuRow> & { business_id: string; name: string }

export async function createMenu(input: MenuInput): Promise<MenuRow> {
  const { data, error } = await db().from('menus').insert(input).select('*').single()
  if (error) throw error
  revalidateMenu()
  return data as MenuRow
}

export async function updateMenu(id: string, patch: Partial<MenuRow>): Promise<MenuRow> {
  const { data, error } = await db().from('menus').update(patch).eq('id', id).select('*').single()
  if (error) throw error
  revalidateMenu()
  return data as MenuRow
}

export async function deleteMenu(id: string): Promise<void> {
  const { error } = await db().from('menus').delete().eq('id', id)
  if (error) throw error
  revalidateMenu()
}

// ── Analytics reads ──────────────────────────────────────────────────
export interface AnalyticsSummary {
  events: AnalyticsEvent[]
  pageViews7d: { date: string; count: number }[]
  topItems: { item_id: string; count: number }[]
  totalPageViews: number
  totalWhatsappClicks: number
  totalItemViews: number
}

export async function fetchAnalyticsSummary(businessId: string): Promise<AnalyticsSummary> {
  const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString()
  const { data, error } = await db()
    .from('analytics_events')
    .select('*')
    .eq('business_id', businessId)
    .gte('created_at', sevenDaysAgo)
    .order('created_at', { ascending: true })
  if (error) throw error
  const events: AnalyticsEvent[] = (data ?? []) as AnalyticsEvent[]

  // Aggregate page views by day
  const dayMap: Record<string, number> = {}
  for (let i = 6; i >= 0; i--) {
    const d = new Date(Date.now() - i * 24 * 60 * 60 * 1000)
    dayMap[d.toISOString().slice(0, 10)] = 0
  }
  for (const ev of events) {
    if (ev.event_type === 'page_view') {
      const day = (ev.created_at ?? '').slice(0, 10)
      if (day in dayMap) dayMap[day] = (dayMap[day] ?? 0) + 1
    }
  }
  const pageViews7d = Object.entries(dayMap).map(([date, count]) => ({ date, count }))

  // Top items by view count
  const itemCount: Record<string, number> = {}
  for (const ev of events) {
    if (ev.event_type === 'item_view' && ev.item_id) {
      itemCount[ev.item_id] = (itemCount[ev.item_id] ?? 0) + 1
    }
  }
  const topItems = Object.entries(itemCount)
    .map(([item_id, count]) => ({ item_id, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 5)

  return {
    events,
    pageViews7d,
    topItems,
    totalPageViews: events.filter((e) => e.event_type === 'page_view').length,
    totalWhatsappClicks: events.filter((e) => e.event_type === 'whatsapp_click').length,
    totalItemViews: events.filter((e) => e.event_type === 'item_view').length,
  }
}
