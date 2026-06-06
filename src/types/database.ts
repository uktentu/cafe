// ════════════════════════════════════════════════════════════════════
// Database types — mirror of the Supabase schema (docs/05-BACKEND-SCHEMA.md).
// R2 keys are stored in the DB; full URLs are derived at runtime via cdnUrl().
// ════════════════════════════════════════════════════════════════════

export type Tier = 'basic' | 'advanced' | 'premium'

export type Theme =
  | 'mercado' | 'provenance' | 'terrain'         // basic
  | 'bazaar' | 'nocturne' | 'coastal'            // advanced
  | 'aether' | 'onyx' | 'studio'                 // premium
  | 'sakura' | 'frost' | 'ember' | 'arcade'      // specialty

export type ImageMode = 'none' | 'stock' | 'custom'
export type Badge = 'bestseller' | 'chef_special' | 'new' | 'spicy'
export type DietaryPreference = 'none' | 'veg' | 'non-veg' | 'egg' | 'vegan'
export type StaffRole = 'owner' | 'manager' | 'staff'
export type StockCategory =
  | 'indian' | 'chinese' | 'continental' | 'drinks' | 'desserts' | 'street' | 'hero'

export interface DayHours {
  open: string
  close: string
  closed: boolean
}
export type OpeningHours = Record<string, DayHours>

export interface SocialLinks {
  instagram?: string | null
  swiggy?: string | null
  zomato?: string | null
  google_maps?: string | null
  multiple_menus_enabled?: boolean
  reservations_enabled?: boolean
  multiple_branches_enabled?: boolean
}

export interface Business {
  id: string
  slug: string
  name: string
  tagline: string | null
  address: string | null
  city: string | null
  phone: string | null
  whatsapp: string | null
  email: string | null
  logo_r2_key: string | null
  cover_r2_key: string | null
  tier: Tier
  theme: Theme
  theme_color: string
  is_active: boolean
  opening_hours: OpeningHours
  social_links: SocialLinks
  seo_title: string | null
  seo_description: string | null
  seo_og_r2_key: string | null
  firebase_measurement_id: string | null
  created_at?: string
  updated_at?: string
}

export interface Category {
  id: string
  business_id: string
  menu_id: string | null
  name: string
  description: string | null
  icon: string | null
  sort_order: number
  is_active: boolean
  created_at?: string
}

export interface Item {
  id: string
  business_id: string
  category_id: string
  branch_id: string | null
  name: string
  description: string | null
  price: number
  compare_price: number | null
  image_mode: ImageMode
  stock_image_key: string | null
  custom_r2_key: string | null
  custom_thumb_key: string | null
  dietary: DietaryPreference
  is_jain: boolean
  is_gluten_free: boolean
  allergens: string[]
  badge: Badge | null
  is_available: boolean
  is_featured: boolean
  sort_order: number
  view_count: number
  created_at?: string
  updated_at?: string
}

export interface StockImage {
  id: string
  r2_key: string
  category: StockCategory
  name: string
  tags: string[]
  is_active: boolean
  sort_order: number
}

export interface QrCode {
  id: string
  business_id: string
  label: string
  target_url: string
  is_dynamic: boolean
  qr_color: string
  qr_bg_color: string
  include_logo: boolean
  branch_id: string | null
  table_number: string | null
  downloads: number
  created_at?: string
}

export interface StaffAccount {
  id: string
  business_id: string
  user_id: string
  role: StaffRole
  name: string | null
  is_active: boolean
  created_at?: string
}

export interface Branch {
  id: string
  business_id: string
  name: string
  address: string | null
  phone: string | null
  opening_hours: OpeningHours | null
  is_active: boolean
  sort_order: number
  created_at?: string
}

export interface Reservation {
  id: string
  business_id: string
  branch_id: string | null
  name: string
  phone: string
  email: string | null
  party_size: number
  date: string
  time: string
  notes: string | null
  status: 'pending' | 'confirmed' | 'cancelled'
  staff_notes: string | null
  created_at?: string
  updated_at?: string
}

export const SUPPORTED_LOCALES = [
  { code: 'hi', name: 'Hindi (हिंदी)', dir: 'ltr' },
  { code: 'ar', name: 'Arabic (العربية)', dir: 'rtl' },
  { code: 'es', name: 'Spanish (Español)', dir: 'ltr' },
  { code: 'fr', name: 'French (Français)', dir: 'ltr' },
  { code: 'ta', name: 'Tamil (தமிழ்)', dir: 'ltr' },
  { code: 'te', name: 'Telugu (తెలుగు)', dir: 'ltr' },
] as const

export type LocaleCode = typeof SUPPORTED_LOCALES[number]['code']

export interface Translation {
  id: string
  business_id: string
  entity_type: 'item' | 'category' | 'business'
  entity_id: string
  locale: string
  field: string
  value: string
}

export type AnalyticsEventType =
  | 'page_view' | 'item_view' | 'whatsapp_click' | 'call_click'
  | 'share' | 'maps_click' | 'reservation_submit' | 'category_tap'

export interface AnalyticsEvent {
  id: string
  business_id: string
  event_type: AnalyticsEventType
  item_id: string | null
  session_id: string | null
  created_at?: string
}

// ── Advanced ──────────────────────────────────────────────────────
export interface Menu {
  id: string
  business_id: string
  name: string
  is_default: boolean
  schedule_start: string | null
  schedule_end: string | null
  is_active: boolean
  sort_order: number
}

export interface Banner {
  id: string
  business_id: string
  title: string | null
  subtitle: string | null
  image_r2_key: string | null
  cta_text: string | null
  cta_url: string | null
  is_active: boolean
  sort_order: number
  starts_at: string | null
  ends_at: string | null
}

// Duplicates removed

// ════════════════════════════════════════════════════════════════════
// Helper — derive the full CDN URL from an R2 key.
// Keys (not URLs) are stored in the DB: if the CDN domain changes we update
// one env var (NEXT_PUBLIC_CDN_URL), never a migration.
// ════════════════════════════════════════════════════════════════════
export const cdnUrl = (key: string | null | undefined): string | null =>
  key ? `${process.env.NEXT_PUBLIC_CDN_URL}/${key}` : null

// The image key actually shown for an item, given its mode.
export const itemImageKey = (item: Pick<Item, 'image_mode' | 'stock_image_key' | 'custom_thumb_key' | 'custom_r2_key'>, full = false): string | null => {
  if (item.image_mode === 'stock') return item.stock_image_key
  if (item.image_mode === 'custom') return full ? item.custom_r2_key : item.custom_thumb_key
  return null
}
