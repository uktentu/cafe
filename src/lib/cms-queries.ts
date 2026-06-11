// Client-side CMS data access (browser Supabase client + RLS). Writes that
// affect the public menu call revalidateMenu() so ISR refreshes within 30s.
'use client'

import { createClient } from '@/lib/supabase/client'
import type { Category, Item, StockImage, Business, Banner, Menu as MenuRow, AnalyticsEvent, QrCode, StaffRole, Branch, Reservation, Translation } from '@/types/database'

let _client: ReturnType<typeof createClient> | null = null
function db() {
  if (!_client) _client = createClient()
  return _client
}

export const qk = {
  items: (bid: string, branchId?: string | null) => ['items', bid, branchId] as const,
  categories: (bid: string) => ['categories', bid] as const,
  stock: () => ['stock-images'] as const,
  banners: (bid: string) => ['banners', bid] as const,
  menus: (bid: string) => ['menus', bid] as const,
  analytics: (bid: string) => ['analytics', bid] as const,
  qrs: (bid: string) => ['qr_codes', bid] as const,
  staff: (bid: string) => ['staff', bid] as const,
  branches: (bid: string) => ['branches', bid] as const,
  reservations: (bid: string, branchId?: string | null) => ['reservations', bid, branchId] as const,
  translations: (bid: string) => ['translations', bid] as const,
}

// ── Reads ───────────────────────────────────────────────────────────
export async function fetchItems(businessId: string, branchId?: string | null): Promise<Item[]> {
  let q = db().from('items').select('*').eq('business_id', businessId)
  
  if (branchId) {
    q = q.or(`branch_id.eq.${branchId},branch_id.is.null`)
  }
  
  const { data, error } = await q.order('sort_order', { ascending: true })
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
    is_special: raw.is_special ?? false,
    show_from: raw.show_from ?? null, show_until: raw.show_until ?? null,
    add_ons: raw.add_ons ?? [],
    spice_level: raw.spice_level ?? 0,
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

export async function reorderItems(ordered: { id: string; sort_order: number }[]): Promise<void> {
  await Promise.all(
    ordered.map((i) => db().from('items').update({ sort_order: i.sort_order }).eq('id', i.id)),
  )
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

// ── Branches writes/reads ───────────────────────────────────────────
export async function fetchBranches(businessId: string): Promise<Branch[]> {
  const { data, error } = await db()
    .from('branches')
    .select('*')
    .eq('business_id', businessId)
    .order('sort_order', { ascending: true })
  if (error) throw error
  return (data ?? []) as Branch[]
}

export type BranchInput = Partial<Branch> & { business_id: string; name: string }

export async function createBranch(input: BranchInput): Promise<Branch> {
  const { data, error } = await db().from('branches').insert(input).select('*').single()
  if (error) throw error
  revalidateMenu()
  return data as Branch
}

export async function updateBranch(id: string, patch: Partial<Branch>): Promise<Branch> {
  const { data, error } = await db().from('branches').update(patch).eq('id', id).select('*').single()
  if (error) throw error
  revalidateMenu()
  return data as Branch
}

export async function deleteBranch(id: string): Promise<void> {
  const { error } = await db().from('branches').delete().eq('id', id)
  if (error) throw error
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

function compressImage(file: File): Promise<File> {
  return new Promise((resolve) => {
    // Only compress massive images (e.g., > 1MB) and only JPEG/PNG/WebP
    if (!file.type.startsWith('image/') || file.type.includes('svg') || file.type.includes('gif') || file.size < 1024 * 1024) {
      return resolve(file)
    }
    const img = new Image()
    img.src = URL.createObjectURL(file)
    img.onload = () => {
      URL.revokeObjectURL(img.src)
      const canvas = document.createElement('canvas')
      const ctx = canvas.getContext('2d')
      if (!ctx) return resolve(file)

      const MAX = 1600
      let { width, height } = img
      if (width > height && width > MAX) {
        height = Math.round(height * (MAX / width))
        width = MAX
      } else if (height > MAX) {
        width = Math.round(width * (MAX / height))
        height = MAX
      }

      canvas.width = width
      canvas.height = height
      ctx.drawImage(img, 0, 0, width, height)

      canvas.toBlob((blob) => {
        if (blob) {
          const newName = file.name.replace(/\.[^/.]+$/, '') + '.webp'
          resolve(new File([blob], newName, { type: 'image/webp' }))
        } else resolve(file)
      }, 'image/webp', 0.8)
    }
    img.onerror = () => resolve(file)
  })
}

export async function uploadImage(
  file: File,
  type: 'item' | 'logo' | 'cover' | 'banner' | 'seo_og',
  id?: string,
): Promise<UploadResult> {
  const compressedFile = await compressImage(file)
  const form = new FormData()
  form.append('file', compressedFile)
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
  const { count } = await db()
    .from('menus')
    .select('id', { count: 'exact', head: true })
    .eq('business_id', input.business_id)
    
  const isFirstMenu = count === 0

  const { data, error } = await db().from('menus').insert(input).select('*').single()
  if (error) throw error

  if (isFirstMenu && data) {
    // Automatically tag all existing categories to this first menu
    await db().from('categories').update({ menu_id: data.id }).eq('business_id', input.business_id)
  }

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

// ── QR Code reads/writes ─────────────────────────────────────────────
export async function fetchQrCodes(businessId: string): Promise<QrCode[]> {
  const { data, error } = await db()
    .from('qr_codes')
    .select('*')
    .eq('business_id', businessId)
    .order('created_at', { ascending: true })
  if (error) throw error
  return (data ?? []) as QrCode[]
}

export type QrCodeInput = Partial<QrCode> & { business_id: string; target_url: string; label: string }

export async function createQrCode(input: QrCodeInput): Promise<QrCode> {
  const { data, error } = await db().from('qr_codes').insert(input).select('*').single()
  if (error) throw error
  return data as QrCode
}

export async function updateQrCode(id: string, patch: Partial<QrCode>): Promise<QrCode> {
  const { data, error } = await db().from('qr_codes').update(patch).eq('id', id).select('*').single()
  if (error) throw error
  return data as QrCode
}

export async function deleteQrCode(id: string): Promise<void> {
  const { error } = await db().from('qr_codes').delete().eq('id', id)
  if (error) throw error
}

// ── Staff Accounts reads/writes ──────────────────────────────────────
export interface StaffAccount {
  id: string; business_id: string; user_id: string; role: StaffRole; name: string | null; is_active: boolean; created_at: string;
}

export async function fetchStaff(businessId: string): Promise<StaffAccount[]> {
  const { data, error } = await db()
    .from('staff_accounts')
    .select('*')
    .eq('business_id', businessId)
    .order('id', { ascending: true })
  if (error) throw error
  return (data ?? []) as StaffAccount[]
}

export async function updateStaffRole(id: string, role: StaffRole): Promise<void> {
  const { error } = await db().from('staff_accounts').update({ role }).eq('id', id)
  if (error) throw error
}

export async function deleteStaff(id: string): Promise<void> {
  const { error } = await db().from('staff_accounts').delete().eq('id', id)
  if (error) throw error
}

// ── Analytics reads ──────────────────────────────────────────────────
export interface AnalyticsSummary {
  events: AnalyticsEvent[]
  pageViews7d: { date: string; count: number }[]
  topItems: { item_id: string; name?: string; count: number }[]
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
    .order('created_at', { ascending: false })
    .limit(1000)
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
  let topItems: { item_id: string; count: number; name?: string }[] = Object.entries(itemCount)
    .map(([item_id, count]) => ({ item_id, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 5)

  if (topItems.length > 0) {
    const itemIds = topItems.map(t => t.item_id)
    const { data: itemsData, error: itemsError } = await db()
      .from('items')
      .select('id, name')
      .eq('business_id', businessId)
      .in('id', itemIds)
    
    if (itemsError) {
      console.error('Analytics items fetch error:', itemsError)
    }

    if (itemsData) {
      const nameMap = new Map(itemsData.map(i => [i.id, i.name]))
      topItems = topItems.map(t => ({ ...t, name: nameMap.get(t.item_id) }))
    }
  }

  return {
    events,
    pageViews7d,
    topItems,
    totalPageViews: events.filter((e) => e.event_type === 'page_view').length,
    totalWhatsappClicks: events.filter((e) => e.event_type === 'whatsapp_click').length,
    totalItemViews: events.filter((e) => e.event_type === 'item_view').length,
  }
}

// ── Reservations writes/reads ───────────────────────────────────────────


export async function fetchTranslations(businessId: string): Promise<Translation[]> {
  const { data, error } = await db()
    .from('translations')
    .select('*')
    .eq('business_id', businessId)
  if (error) throw error
  return data ?? []
}

export async function fetchSecondaryLocale(businessId: string): Promise<string | null> {
  const { data, error } = await db()
    .from('translations')
    .select('value')
    .eq('business_id', businessId)
    .eq('entity_type', 'business')
    .eq('field', '_system_secondary_locale')
    .maybeSingle()
  if (error) throw error
  return data?.value ?? null
}

export async function fetchReservations(businessId: string, branchId?: string | null): Promise<Reservation[]> {
  let q = db().from('reservations').select('*').eq('business_id', businessId)
  if (branchId) {
    q = q.eq('branch_id', branchId)
  }
  const { data, error } = await q.order('created_at', { ascending: false })
  if (error) throw error
  return (data ?? []) as Reservation[]
}

export async function updateReservation(id: string, patch: Partial<Reservation>): Promise<void> {
  const { error } = await db().from('reservations').update(patch).eq('id', id)
  if (error) throw error
}

// ── Translations ──────────────────────────────────────────────────────────

export async function setSecondaryLocale(businessId: string, localeCode: string | null): Promise<void> {
  if (localeCode === null) {
    const { error } = await db()
      .from('translations')
      .delete()
      .eq('business_id', businessId)
      .eq('entity_type', 'business')
      .eq('field', '_system_secondary_locale')
    if (error) throw error
    revalidateMenu()
    return
  }

  const { error } = await db()
    .from('translations')
    .upsert({
      business_id: businessId,
      entity_type: 'business',
      entity_id: businessId,
      locale: 'en',
      field: '_system_secondary_locale',
      value: localeCode
    }, { onConflict: 'business_id, entity_type, entity_id, locale, field' })
  if (error) throw error
  revalidateMenu()
}

export async function upsertTranslation(
  businessId: string,
  entityType: 'item' | 'category' | 'business',
  entityId: string,
  locale: string,
  field: string,
  value: string
): Promise<void> {
  if (!value.trim()) {
    const { error } = await db()
      .from('translations')
      .delete()
      .eq('business_id', businessId)
      .eq('entity_type', entityType)
      .eq('entity_id', entityId)
      .eq('locale', locale)
      .eq('field', field)
    if (error) throw error
    revalidateMenu()
    return
  }

  const { error } = await db()
    .from('translations')
    .upsert({
      business_id: businessId,
      entity_type: entityType,
      entity_id: entityId,
      locale,
      field,
      value
    }, { onConflict: 'business_id, entity_type, entity_id, locale, field' })
  
  if (error) throw error
  revalidateMenu()
}

export async function deleteReservation(id: string): Promise<void> {
  const { error } = await db().from('reservations').delete().eq('id', id)
  if (error) throw error
}
