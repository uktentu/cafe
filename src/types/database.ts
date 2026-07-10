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
export type StaffRole = 'owner' | 'admin' | 'manager' | 'staff' | 'waiter' | 'kitchen' | 'cashier'
export type StockCategory =
  | 'indian' | 'chinese' | 'continental' | 'drinks' | 'desserts' | 'street' | 'hero'

export interface DayHours {
  open: string
  close: string
  closed: boolean
}
export type OpeningHours = Record<string, DayHours>

export interface AddOn {
  id: string
  name: string
  price: number
}

export interface SocialLinks {
  instagram?: string | null
  swiggy?: string | null
  zomato?: string | null
  google_maps?: string | null
  google_maps_query?: string | null
  google_reviews?: string | null
  multiple_menus_enabled?: boolean
  reservations_enabled?: boolean
  multiple_branches_enabled?: boolean
  wait_time?: string | null
  wait_time_label?: string | null
  /** "Our Story" / about text shown on the public menu. */
  about?: string | null
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
  /** GST/tax percent applied at bill time (POS add-on). Default 5.00. */
  tax_percent?: number
  /** POS billing config: { default_discount_reasons? } */
  pos_settings?: Record<string, unknown>
  /** GST identification number, printed on bills (POS add-on). */
  gstin?: string | null
  /** FSSAI license number, printed on bills (POS add-on). */
  fssai_license?: string | null
  /** State VAT percent applied to bar/liquor lines at bill time. Default 18.00. */
  bar_tax_percent?: number
  /** Footer line printed at the bottom of every bill. */
  receipt_footer?: string | null
  /** Next sequential bill number — assigned by DB trigger at settle, never by the client. */
  next_bill_no?: number
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
  /** 0 = not spicy, 1 = mild, 2 = medium, 3 = hot. Optional until migration 006 runs. */
  spice_level?: number
  allergens: string[]
  badge: Badge | null
  is_available: boolean
  is_featured: boolean
  is_special: boolean
  show_from: string | null
  show_until: string | null
  /** POS add-on: liquor/bar item — billed separately under state VAT, not GST. */
  is_bar?: boolean
  add_ons: AddOn[]
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
  /** POS add-on: links this QR to an operational tables row. */
  table_id?: string | null
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
  | 'add_to_cart' | 'cart_order' | 'reviews_click' | 'maps_embed_click'
  | 'order_placed' | 'order_settled'

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

// ── POS (add-on, orthogonal to tier — gated by features.posEnabled) ──
export type TableStatus = 'available' | 'occupied' | 'needs_cleaning' | 'reserved'
export type OrderType = 'dine_in' | 'takeaway' | 'counter' | 'delivery'
export type OrderSource = 'customer' | 'staff' | 'aggregator'
/** Where a live order arrived from. 'direct' = our own dine-in/takeaway/QR. */
export type OrderChannel = 'direct' | 'swiggy' | 'zomato' | 'phone'
export type OrderStatus =
  | 'placed' | 'confirmed' | 'preparing' | 'ready' | 'served' | 'billed' | 'settled' | 'cancelled'
export type OrderItemStatus = 'placed' | 'preparing' | 'ready' | 'served' | 'cancelled'
export type PaymentMethod = 'cash' | 'card' | 'upi' | 'other'

export interface RestaurantTable {
  id: string
  business_id: string
  branch_id: string | null
  label: string
  code: string
  /**
   * Random uuid embedded in the table's QR URL (?t=<qr_token>) — the only
   * value that resolves to a table for ordering. Unlike `code` it cannot be
   * guessed, and column privileges hide it from the anonymous REST role.
   * Only present when read with an authenticated/staff or service client.
   */
  qr_token?: string
  capacity: number
  zone: string | null
  status: TableStatus
  is_active: boolean
  sort_order: number
  created_at?: string
  updated_at?: string
}

export interface Order {
  id: string
  business_id: string
  branch_id: string | null
  table_id: string | null
  order_type: OrderType
  source: OrderSource
  channel?: OrderChannel
  external_ref?: string | null
  status: OrderStatus
  placed_by_staff_id: string | null
  customer_name: string | null
  customer_phone: string | null
  customer_token: string
  subtotal: number
  tax_amount: number
  discount_amount: number
  discount_reason: string | null
  total_amount: number
  tax_rate_snapshot: { label: string; percent: number } | null
  payment_method: PaymentMethod | null
  settled_at: string | null
  settled_by_staff_id: string | null
  /** Sequential bill number, assigned by DB trigger when the order settles. */
  bill_no?: number | null
  /** CRM link, set by the award_customer_on_settle trigger at settle time. */
  customer_id?: string | null
  notes: string | null
  created_at?: string
  updated_at?: string
}

export interface OrderItem {
  id: string
  order_id: string
  business_id: string
  item_id: string | null
  item_name_snapshot: string
  unit_price_snapshot: number
  selected_add_ons: AddOn[]
  note: string | null
  qty: number
  line_total: number
  status: OrderItemStatus
  /** Snapshot of items.is_bar at order time — drives the separate bar bill. */
  is_bar?: boolean
  created_at?: string
  updated_at?: string
}

export interface OrderStatusEvent {
  id: string
  order_id: string
  business_id: string
  order_item_id: string | null
  from_status: string | null
  to_status: string
  changed_by_staff_id: string | null
  created_at?: string
}

// ── Owner modules (POS add-on) ──────────────────────────────────────
export type ExpenseCategory = 'rent' | 'salaries' | 'supplies' | 'utilities' | 'maintenance' | 'misc'

export interface Expense {
  id: string
  business_id: string
  branch_id: string | null
  category: ExpenseCategory
  vendor: string | null
  amount: number
  note: string | null
  spent_on: string
  created_by_staff_id: string | null
  created_at?: string
}

export interface Customer {
  id: string
  business_id: string
  phone: string
  name: string | null
  visit_count: number
  total_spent: number
  loyalty_points: number
  first_seen?: string
  last_seen?: string
}

export interface DayClose {
  id: string
  business_id: string
  branch_id: string | null
  close_date: string
  opening_cash: number
  expected_cash: number
  counted_cash: number
  variance: number
  totals: Record<string, unknown> | null
  closed_by_staff_id: string | null
  closed_at?: string
}

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
