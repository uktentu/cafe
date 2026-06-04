-- ════════════════════════════════════════════════════════════════════
-- Migration 001 — Core Tables (All Tiers)
-- Run in Supabase SQL editor (or via supabase db push) BEFORE 002_rls.sql
-- ════════════════════════════════════════════════════════════════════

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ─────────────────────────────────────────────────────────────────
-- TABLE: businesses — one row per deployed client restaurant.
-- ─────────────────────────────────────────────────────────────────
CREATE TABLE businesses (
  id               uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  slug             text UNIQUE NOT NULL,
  -- Must match NEXT_PUBLIC_CLIENT_SLUG env var. URL-safe, lowercase, hyphens only.

  name             text NOT NULL,
  tagline          text,
  address          text,
  city             text,
  phone            text,
  whatsapp         text,
  email            text,

  logo_r2_key      text,    -- e.g. 'clients/taj-cafe/logo.webp'
  cover_r2_key     text,    -- e.g. 'clients/taj-cafe/cover.webp'
  -- Full URL at runtime: ${CDN_URL}/{r2_key}

  tier             text NOT NULL DEFAULT 'basic'
                   CHECK (tier IN ('basic','advanced','premium')),

  theme            text NOT NULL DEFAULT 'mercado',
  -- Values: mercado|provenance|terrain|bazaar|nocturne|coastal|aether|onyx|studio

  theme_color      text DEFAULT '#F59E0B',
  -- Optional: overrides template's default --brand colour

  is_active        boolean DEFAULT true,

  opening_hours    jsonb DEFAULT '{
    "mon": {"open":"09:00","close":"22:00","closed":false},
    "tue": {"open":"09:00","close":"22:00","closed":false},
    "wed": {"open":"09:00","close":"22:00","closed":false},
    "thu": {"open":"09:00","close":"22:00","closed":false},
    "fri": {"open":"09:00","close":"22:00","closed":false},
    "sat": {"open":"09:00","close":"23:00","closed":false},
    "sun": {"open":"10:00","close":"22:00","closed":false}
  }'::jsonb,

  social_links     jsonb DEFAULT '{"instagram":null,"swiggy":null,"zomato":null,"google_maps":null}'::jsonb,

  -- SEO (Premium only — populated via CMS)
  seo_title        text,
  seo_description  text,
  seo_og_r2_key    text,

  -- Analytics
  firebase_measurement_id text,
  -- Each client's own GA4 Web App measurement ID. One Firebase project, many web apps.

  created_at       timestamptz DEFAULT now(),
  updated_at       timestamptz DEFAULT now()
);

-- ─────────────────────────────────────────────────────────────────
-- TABLE: categories
-- ─────────────────────────────────────────────────────────────────
CREATE TABLE categories (
  id           uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id  uuid NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
  menu_id      uuid,  -- NULL = all menus. Set for Advanced+ scheduled menus.

  name         text NOT NULL,
  description  text,
  icon         text,          -- Lucide icon name, displayed in text-only mode
  sort_order   integer DEFAULT 0,
  is_active    boolean DEFAULT true,
  created_at   timestamptz DEFAULT now()
);

CREATE INDEX idx_cat_business ON categories(business_id, sort_order);

-- ─────────────────────────────────────────────────────────────────
-- TABLE: items — core menu content. Up to 10M rows at 5000 restaurants.
-- ─────────────────────────────────────────────────────────────────
CREATE TABLE items (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id     uuid NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
  category_id     uuid REFERENCES categories(id) ON DELETE SET NULL,

  name            text NOT NULL,
  description     text,

  price           numeric(10,2) NOT NULL,
  compare_price   numeric(10,2),  -- Shows strikethrough "was" price if set

  -- Image: one of three modes
  image_mode      text DEFAULT 'none' CHECK (image_mode IN ('none','stock','custom')),
  stock_image_key text,            -- Key from stock_images table. E.g. 'stock/indian/biryani.webp'
  custom_r2_key   text,            -- E.g. 'clients/taj-cafe/items/{id}/full.webp'
  custom_thumb_key text,           -- E.g. 'clients/taj-cafe/items/{id}/thumb.webp'

  -- Dietary
  is_veg          boolean DEFAULT true,
  is_vegan        boolean DEFAULT false,
  is_jain         boolean DEFAULT false,
  is_gluten_free  boolean DEFAULT false,

  allergens       text[] DEFAULT '{}',

  badge           text CHECK (badge IN ('bestseller','chef_special','new','spicy',NULL)),

  is_available    boolean DEFAULT true,  -- Sold-out toggle
  is_featured     boolean DEFAULT false, -- Appears in Bestsellers strip

  sort_order      integer DEFAULT 0,
  view_count      integer DEFAULT 0,     -- Incremented by Firebase event, read from here

  created_at      timestamptz DEFAULT now(),
  updated_at      timestamptz DEFAULT now()
);

-- Scale-critical indexes
CREATE INDEX idx_items_biz_sort    ON items(business_id, sort_order);
CREATE INDEX idx_items_biz_avail   ON items(business_id, is_available);
CREATE INDEX idx_items_biz_cat     ON items(business_id, category_id);
CREATE INDEX idx_items_biz_feat    ON items(business_id, is_featured) WHERE is_featured = true;
-- Partial index: only featured items (usually < 10% of total)

-- ─────────────────────────────────────────────────────────────────
-- TABLE: stock_images — curated library hosted on R2 public bucket.
-- Pre-populated via scripts/upload-stock.ts + seed/stock-images.sql
-- ─────────────────────────────────────────────────────────────────
CREATE TABLE stock_images (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  r2_key      text UNIQUE NOT NULL,     -- e.g. 'stock/indian/biryani.webp'  Full URL: ${CDN_URL}/{r2_key}
  category    text NOT NULL,            -- 'indian'|'chinese'|'continental'|'drinks'|'desserts'|'street'|'hero'
  name        text NOT NULL,            -- display name: "Biryani"
  tags        text[] DEFAULT '{}',      -- ['rice','biryani','north-indian','mughlai'] — for search/filter
  is_active   boolean DEFAULT true,
  sort_order  integer DEFAULT 0
);

-- ─────────────────────────────────────────────────────────────────
-- TABLE: qr_codes
-- ─────────────────────────────────────────────────────────────────
CREATE TABLE qr_codes (
  id           uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id  uuid NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,

  label        text NOT NULL DEFAULT 'Main',   -- e.g. 'Table 1', 'Counter', 'Takeaway'

  target_url   text NOT NULL,
  -- Static QR: https://client.yourdomain.in
  -- Dynamic QR (Premium): /api/qr/{id} → redirects to target_url

  is_dynamic   boolean DEFAULT false,
  qr_color     text DEFAULT '#000000',
  qr_bg_color  text DEFAULT '#FFFFFF',
  include_logo boolean DEFAULT true,

  branch_id    uuid,    -- Premium: link to specific branch (FK added in 004)
  table_number text,    -- e.g. 'T-12'

  downloads    integer DEFAULT 0,
  created_at   timestamptz DEFAULT now()
);

-- ─────────────────────────────────────────────────────────────────
-- TABLE: staff_accounts
-- ─────────────────────────────────────────────────────────────────
CREATE TABLE staff_accounts (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id uuid NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
  user_id     uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,

  role        text NOT NULL DEFAULT 'owner'
              CHECK (role IN ('owner','manager','staff')),
  name        text,
  is_active   boolean DEFAULT true,
  created_at  timestamptz DEFAULT now(),

  UNIQUE(business_id, user_id)
);

-- ─────────────────────────────────────────────────────────────────
-- TABLE: analytics_events — subset of Firebase GA4 events mirrored for CMS charts.
-- Cleanup: delete events older than 90 days (GitHub Actions weekly).
-- ─────────────────────────────────────────────────────────────────
CREATE TABLE analytics_events (
  id           uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id  uuid NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,

  event_type   text NOT NULL,
  -- 'page_view'|'item_view'|'whatsapp_click'|'call_click'|'share'|'maps_click'|'reservation_submit'|'category_tap'

  item_id      uuid REFERENCES items(id) ON DELETE SET NULL,
  session_id   text,   -- anonymous, generated per browser session
  created_at   timestamptz DEFAULT now()
);

CREATE INDEX idx_events_biz_type ON analytics_events(business_id, event_type, created_at DESC);
