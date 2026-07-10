-- ════════════════════════════════════════════════════════════════════
-- Combined migration — concatenation of migrations/001 through 014.
-- Regenerate whenever a migration file is added.
-- ════════════════════════════════════════════════════════════════════

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


-- ════════════════════════════════════════════════════════════════════
-- Migration 002 — Row Level Security
-- Multi-tenant isolation: every policy checks business_id via is_staff_of().
-- Run AFTER 001_core.sql.
-- ════════════════════════════════════════════════════════════════════

-- Single helper function used by all staff-write policies.
CREATE OR REPLACE FUNCTION is_staff_of(bid uuid)
RETURNS boolean LANGUAGE sql SECURITY DEFINER AS $$
  SELECT EXISTS (
    SELECT 1 FROM staff_accounts
    WHERE business_id = bid
      AND user_id = auth.uid()
      AND is_active = true
  );
$$;

ALTER TABLE businesses       ENABLE ROW LEVEL SECURITY;
ALTER TABLE categories       ENABLE ROW LEVEL SECURITY;
ALTER TABLE items            ENABLE ROW LEVEL SECURITY;
ALTER TABLE stock_images     ENABLE ROW LEVEL SECURITY;
ALTER TABLE qr_codes         ENABLE ROW LEVEL SECURITY;
ALTER TABLE staff_accounts   ENABLE ROW LEVEL SECURITY;
ALTER TABLE analytics_events ENABLE ROW LEVEL SECURITY;

-- stock_images: public read (needed for CMS image picker)
CREATE POLICY "stock_public_read" ON stock_images FOR SELECT TO anon, authenticated USING (is_active = true);

-- businesses, categories, items: public read
CREATE POLICY "biz_pub_read"  ON businesses FOR SELECT TO anon USING (is_active = true);
CREATE POLICY "cat_pub_read"  ON categories FOR SELECT TO anon USING (is_active = true);
CREATE POLICY "item_pub_read" ON items      FOR SELECT TO anon USING (true);

-- Public insert on analytics (no auth needed to track events)
CREATE POLICY "events_pub_insert" ON analytics_events FOR INSERT TO anon WITH CHECK (true);

-- Staff write
CREATE POLICY "biz_staff_update"   ON businesses       FOR UPDATE    TO authenticated USING (is_staff_of(id));
CREATE POLICY "cat_staff_all"      ON categories       FOR ALL       TO authenticated USING (is_staff_of(business_id)) WITH CHECK (is_staff_of(business_id));
CREATE POLICY "item_staff_all"     ON items            FOR ALL       TO authenticated USING (is_staff_of(business_id)) WITH CHECK (is_staff_of(business_id));
CREATE POLICY "qr_staff_all"       ON qr_codes         FOR ALL       TO authenticated USING (is_staff_of(business_id)) WITH CHECK (is_staff_of(business_id));
CREATE POLICY "events_staff_read"  ON analytics_events FOR SELECT    TO authenticated USING (is_staff_of(business_id));

-- Staff accounts: owner manages, all staff read own
CREATE POLICY "staff_owner_manage" ON staff_accounts FOR ALL TO authenticated
  USING (EXISTS (SELECT 1 FROM staff_accounts sa WHERE sa.business_id = staff_accounts.business_id AND sa.user_id = auth.uid() AND sa.role = 'owner'));
CREATE POLICY "staff_self_read" ON staff_accounts FOR SELECT TO authenticated USING (user_id = auth.uid());


-- ════════════════════════════════════════════════════════════════════
-- Migration 003 — Advanced Tables (menus, banners)
-- Run before building Advanced-tier features (Phase 4 / Phase 5).
-- ════════════════════════════════════════════════════════════════════

-- Multiple scheduled menus (Breakfast/Lunch/Dinner)
CREATE TABLE menus (
  id             uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id    uuid NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
  name           text NOT NULL,
  is_default     boolean DEFAULT false,
  schedule_start time,
  schedule_end   time,
  is_active      boolean DEFAULT true,
  sort_order     integer DEFAULT 0,
  created_at     timestamptz DEFAULT now()
);

-- Wire categories.menu_id (declared nullable in 001) to menus.
ALTER TABLE categories ADD CONSTRAINT fk_cat_menu FOREIGN KEY (menu_id) REFERENCES menus(id) ON DELETE SET NULL;

-- Promo banners
CREATE TABLE banners (
  id           uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id  uuid NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
  title        text,
  subtitle     text,
  image_r2_key text,
  cta_text     text,
  cta_url      text,
  is_active    boolean DEFAULT true,
  sort_order   integer DEFAULT 0,
  starts_at    timestamptz,
  ends_at      timestamptz,
  created_at   timestamptz DEFAULT now()
);

-- RLS
ALTER TABLE menus   ENABLE ROW LEVEL SECURITY;
ALTER TABLE banners ENABLE ROW LEVEL SECURITY;
CREATE POLICY "menus_pub_read"   ON menus   FOR SELECT TO anon USING (is_active = true);
CREATE POLICY "banners_pub_read" ON banners FOR SELECT TO anon
  USING (is_active = true AND (starts_at IS NULL OR starts_at <= now()) AND (ends_at IS NULL OR ends_at >= now()));
CREATE POLICY "menus_staff"   ON menus   FOR ALL TO authenticated USING (is_staff_of(business_id)) WITH CHECK (is_staff_of(business_id));
CREATE POLICY "banners_staff" ON banners FOR ALL TO authenticated USING (is_staff_of(business_id)) WITH CHECK (is_staff_of(business_id));


-- ════════════════════════════════════════════════════════════════════
-- Migration 004 — Premium Tables (branches, reservations, translations)
-- Run before building Premium-tier features (Phase 4 / Phase 6).
-- ════════════════════════════════════════════════════════════════════

-- Multi-branch
CREATE TABLE branches (
  id           uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id  uuid NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
  name         text NOT NULL,
  address      text,
  phone        text,
  opening_hours jsonb,
  is_active    boolean DEFAULT true,
  sort_order   integer DEFAULT 0,
  created_at   timestamptz DEFAULT now()
);

-- Link items and qr_codes to a branch.
ALTER TABLE items    ADD COLUMN branch_id uuid REFERENCES branches(id) ON DELETE SET NULL;
ALTER TABLE qr_codes ADD CONSTRAINT fk_qr_branch FOREIGN KEY (branch_id) REFERENCES branches(id) ON DELETE SET NULL;

-- Reservations
CREATE TABLE reservations (
  id           uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id  uuid NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
  branch_id    uuid REFERENCES branches(id) ON DELETE SET NULL,
  name         text NOT NULL,
  phone        text NOT NULL,
  email        text,
  party_size   integer NOT NULL CHECK (party_size > 0),
  date         date NOT NULL,
  time         time NOT NULL,
  notes        text,
  status       text DEFAULT 'pending' CHECK (status IN ('pending','confirmed','cancelled')),
  staff_notes  text,
  created_at   timestamptz DEFAULT now(),
  updated_at   timestamptz DEFAULT now()
);

-- Bilingual translations
CREATE TABLE translations (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id uuid NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
  entity_type text NOT NULL CHECK (entity_type IN ('item','category','business')),
  entity_id   uuid NOT NULL,
  locale      text NOT NULL,  -- 'hi'|'mr'|'ta'|'te'|'kn'|'bn'|'gu'
  field       text NOT NULL,  -- 'name'|'description'|'tagline'
  value       text NOT NULL,
  UNIQUE(business_id, entity_type, entity_id, locale, field)
);

-- RLS
ALTER TABLE branches     ENABLE ROW LEVEL SECURITY;
ALTER TABLE reservations ENABLE ROW LEVEL SECURITY;
ALTER TABLE translations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "branches_pub_read"  ON branches FOR SELECT TO anon USING (is_active = true);
CREATE POLICY "branches_staff"     ON branches FOR ALL    TO authenticated USING (is_staff_of(business_id)) WITH CHECK (is_staff_of(business_id));

CREATE POLICY "reserv_pub_insert"  ON reservations FOR INSERT TO anon WITH CHECK (true);
CREATE POLICY "reserv_staff_all"   ON reservations FOR ALL    TO authenticated USING (is_staff_of(business_id));

CREATE POLICY "trans_pub_read"     ON translations FOR SELECT TO anon USING (true);
CREATE POLICY "trans_staff_all"    ON translations FOR ALL    TO authenticated USING (is_staff_of(business_id)) WITH CHECK (is_staff_of(business_id));


-- ════════════════════════════════════════════════════════════════════
-- Migration 005 — New Features: cart add-ons, daily specials, timed
--                 visibility, wait time, analytics event types
-- Safe to re-run (all statements use IF NOT EXISTS / IF EXISTS guards).
-- ════════════════════════════════════════════════════════════════════

-- ── items: add-ons (JSONB array of {id, name, price}) ────────────────
ALTER TABLE items ADD COLUMN IF NOT EXISTS add_ons jsonb DEFAULT '[]'::jsonb;

-- Ensure existing rows have the right default (not NULL)
UPDATE items SET add_ons = '[]'::jsonb WHERE add_ons IS NULL;

-- ── items: daily special flag ────────────────────────────────────────
ALTER TABLE items ADD COLUMN IF NOT EXISTS is_special boolean DEFAULT false;

UPDATE items SET is_special = false WHERE is_special IS NULL;

-- ── items: timed visibility (HH:MM, 24h format) ─────────────────────
ALTER TABLE items ADD COLUMN IF NOT EXISTS show_from text;
ALTER TABLE items ADD COLUMN IF NOT EXISTS show_until text;

-- Validate format constraint (only applied to non-null values)
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'items_show_from_format' AND conrelid = 'items'::regclass
  ) THEN
    ALTER TABLE items ADD CONSTRAINT items_show_from_format
      CHECK (show_from IS NULL OR show_from ~ '^([01][0-9]|2[0-3]):[0-5][0-9]$');
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'items_show_until_format' AND conrelid = 'items'::regclass
  ) THEN
    ALTER TABLE items ADD CONSTRAINT items_show_until_format
      CHECK (show_until IS NULL OR show_until ~ '^([01][0-9]|2[0-3]):[0-5][0-9]$');
  END IF;
END $$;

-- ── businesses: wait_time is stored inside social_links JSONB ────────
-- No column migration needed — the JSONB field handles it dynamically.
-- Ensure existing rows have a proper social_links JSON structure.
UPDATE businesses
SET social_links = social_links || '{"wait_time": null, "wait_time_label": null}'::jsonb
WHERE social_links IS NOT NULL
  AND NOT (social_links ? 'wait_time');

-- ── analytics_events: ensure the event_type column has no restrictive CHECK ──
-- The original schema had no CHECK on event_type (it's a free text column).
-- New event types 'add_to_cart' and 'cart_order' work automatically.
-- This comment documents the expanded event type vocabulary:
-- 'page_view' | 'item_view' | 'whatsapp_click' | 'call_click'
-- 'share' | 'maps_click' | 'reservation_submit' | 'category_tap'
-- 'add_to_cart' | 'cart_order'

-- ── Performance: index on is_special (for featured/specials carousels) ──
CREATE INDEX IF NOT EXISTS idx_items_biz_special
  ON items(business_id, is_special)
  WHERE is_special = true;

-- ── Performance: index on timed items ────────────────────────────────
CREATE INDEX IF NOT EXISTS idx_items_timed
  ON items(business_id, show_from, show_until)
  WHERE show_from IS NOT NULL;


-- ════════════════════════════════════════════════════════════════════
-- Migration 006 — item spice level (0=none, 1=mild, 2=medium, 3=hot)
-- Powers the on-menu chilli "spice meter". Safe to re-run.
-- ════════════════════════════════════════════════════════════════════
ALTER TABLE items ADD COLUMN IF NOT EXISTS spice_level smallint DEFAULT 0;
UPDATE items SET spice_level = 0 WHERE spice_level IS NULL;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'items_spice_level_range' AND conrelid = 'items'::regclass
  ) THEN
    ALTER TABLE items ADD CONSTRAINT items_spice_level_range
      CHECK (spice_level BETWEEN 0 AND 3);
  END IF;
END $$;


-- ════════════════════════════════════════════════════════════════════
-- Migration 007 — Strict RBAC
-- Restrict regular staff from deleting core entities and editing prices.
-- ════════════════════════════════════════════════════════════════════

-- Helper to check if user is an admin or owner
CREATE OR REPLACE FUNCTION is_admin_of(bid uuid)
RETURNS boolean LANGUAGE sql SECURITY DEFINER AS $$
  SELECT EXISTS (
    SELECT 1 FROM staff_accounts
    WHERE business_id = bid
      AND user_id = auth.uid()
      AND is_active = true
      AND role IN ('owner', 'admin')
  );
$$;

-- 1. DROP the overly permissive item policy
DROP POLICY IF EXISTS "item_staff_all" ON items;

-- 2. CREATE strictly scoped item policies
-- INSERT: Any staff can create items
CREATE POLICY "item_staff_insert" ON items FOR INSERT TO authenticated 
WITH CHECK (is_staff_of(business_id));

-- UPDATE: Any staff can update, BUT the trigger below restricts price changes.
CREATE POLICY "item_staff_update" ON items FOR UPDATE TO authenticated 
USING (is_staff_of(business_id))
WITH CHECK (is_staff_of(business_id));

-- Trigger to prevent regular staff from changing prices
CREATE OR REPLACE FUNCTION check_staff_item_update()
RETURNS TRIGGER AS $$
BEGIN
  -- If user is NOT an admin/owner
  IF NOT is_admin_of(NEW.business_id) THEN
    -- And they try to change the price
    IF NEW.price IS DISTINCT FROM OLD.price THEN
      RAISE EXCEPTION 'Access Denied: Regular staff cannot modify item prices.';
    END IF;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS trg_check_staff_item_update ON items;
CREATE TRIGGER trg_check_staff_item_update
BEFORE UPDATE ON items
FOR EACH ROW
EXECUTE FUNCTION check_staff_item_update();

-- DELETE: Only admins/owners can delete items
CREATE POLICY "item_admin_delete" ON items FOR DELETE TO authenticated 
USING (is_admin_of(business_id));


-- 3. DROP permissive categories policy
DROP POLICY IF EXISTS "cat_staff_all" ON categories;

-- 4. CREATE strictly scoped categories policies
CREATE POLICY "cat_staff_insert" ON categories FOR INSERT TO authenticated 
WITH CHECK (is_staff_of(business_id));

CREATE POLICY "cat_staff_update" ON categories FOR UPDATE TO authenticated 
USING (is_staff_of(business_id))
WITH CHECK (is_staff_of(business_id));

CREATE POLICY "cat_admin_delete" ON categories FOR DELETE TO authenticated 
USING (is_admin_of(business_id));


-- 5. Strict reservations policies
-- Ensure reservations table has RLS enabled
ALTER TABLE reservations ENABLE ROW LEVEL SECURITY;

-- Drop existing public read if any (reservations should be private)
DROP POLICY IF EXISTS "res_public_read" ON reservations;
DROP POLICY IF EXISTS "res_staff_all" ON reservations;

-- Public can insert (handled by API route anyway, but good to restrict)
CREATE POLICY "res_public_insert" ON reservations FOR INSERT TO anon, authenticated
WITH CHECK (true);

-- Staff can read and update (confirm, cancel)
CREATE POLICY "res_staff_select" ON reservations FOR SELECT TO authenticated
USING (is_staff_of(business_id));

CREATE POLICY "res_staff_update" ON reservations FOR UPDATE TO authenticated
USING (is_staff_of(business_id))
WITH CHECK (is_staff_of(business_id));

-- Only admin can delete reservations
CREATE POLICY "res_admin_delete" ON reservations FOR DELETE TO authenticated
USING (is_admin_of(business_id));



-- ════════════════════════════════════════════════════════════════════
-- Migration 008 — POS Core (tables, orders, order_items, KOT audit trail)
-- Orthogonal add-on module, gated by features.posEnabled (NEXT_PUBLIC_POS_ENABLED),
-- independent of tier. Run AFTER 007_strict_rbac.sql.
-- ════════════════════════════════════════════════════════════════════

-- ─────────────────────────────────────────────────────────────────
-- TABLE: tables — real floor entity. Replaces qr_codes.table_number
-- as the operational source of truth (that field remains as a label).
-- ─────────────────────────────────────────────────────────────────
CREATE TABLE tables (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id   uuid NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
  branch_id     uuid REFERENCES branches(id) ON DELETE SET NULL,

  label         text NOT NULL,          -- 'Table 5', 'Patio 2'
  code          text NOT NULL,          -- short public code embedded in the QR target_url, e.g. 't5'
  capacity      integer DEFAULT 4,
  zone          text,                   -- free-text grouping for the floor view: 'Indoor' | 'Patio' | 'Rooftop'

  status        text NOT NULL DEFAULT 'available'
                CHECK (status IN ('available','occupied','needs_cleaning','reserved')),

  is_active     boolean DEFAULT true,
  sort_order    integer DEFAULT 0,
  created_at    timestamptz DEFAULT now(),
  updated_at    timestamptz DEFAULT now(),
  UNIQUE(business_id, code)
);
CREATE INDEX idx_tables_biz ON tables(business_id, sort_order);

-- ─────────────────────────────────────────────────────────────────
-- TABLE: orders — one row per continuous dine-in "tab", or one row
-- per takeaway/counter transaction.
-- ─────────────────────────────────────────────────────────────────
CREATE TABLE orders (
  id                  uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id         uuid NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
  branch_id           uuid REFERENCES branches(id) ON DELETE SET NULL,
  table_id            uuid REFERENCES tables(id) ON DELETE SET NULL,

  order_type          text NOT NULL DEFAULT 'dine_in' CHECK (order_type IN ('dine_in','takeaway','counter')),
  source              text NOT NULL CHECK (source IN ('customer','staff')),

  status              text NOT NULL DEFAULT 'placed'
                      CHECK (status IN ('placed','confirmed','preparing','ready','served','billed','settled','cancelled')),

  placed_by_staff_id  uuid REFERENCES staff_accounts(id) ON DELETE SET NULL, -- null when source='customer'
  customer_name       text,
  customer_phone      text,
  customer_token      uuid NOT NULL DEFAULT gen_random_uuid(),
  -- Returned once at creation; lets the customer poll their own order status
  -- via /api/orders/[id]?token=... without any anon SELECT policy on this table.

  subtotal            numeric(10,2) NOT NULL DEFAULT 0,
  tax_amount          numeric(10,2) NOT NULL DEFAULT 0,
  discount_amount     numeric(10,2) NOT NULL DEFAULT 0,
  discount_reason     text,
  total_amount        numeric(10,2) NOT NULL DEFAULT 0,
  tax_rate_snapshot   jsonb,           -- e.g. {"label":"GST","percent":5} captured at bill time

  payment_method      text CHECK (payment_method IN ('cash','card','upi','other') OR payment_method IS NULL),
  settled_at          timestamptz,
  settled_by_staff_id uuid REFERENCES staff_accounts(id) ON DELETE SET NULL,

  notes               text,
  created_at          timestamptz DEFAULT now(),
  updated_at          timestamptz DEFAULT now()
);
CREATE INDEX idx_orders_biz_status  ON orders(business_id, status);
CREATE INDEX idx_orders_biz_table   ON orders(business_id, table_id) WHERE table_id IS NOT NULL;
CREATE INDEX idx_orders_biz_created ON orders(business_id, created_at DESC);
CREATE INDEX idx_orders_token       ON orders(id, customer_token);

-- ─────────────────────────────────────────────────────────────────
-- TABLE: order_items — line items with a permanently frozen price/name
-- snapshot, so bills survive later menu edits or deletions.
-- ─────────────────────────────────────────────────────────────────
CREATE TABLE order_items (
  id                   uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id             uuid NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  business_id          uuid NOT NULL REFERENCES businesses(id) ON DELETE CASCADE, -- denormalized for simple RLS
  item_id              uuid REFERENCES items(id) ON DELETE SET NULL,

  item_name_snapshot   text NOT NULL,
  unit_price_snapshot  numeric(10,2) NOT NULL,
  selected_add_ons     jsonb DEFAULT '[]'::jsonb,   -- [{id,name,price}] — same shape as items.add_ons
  note                 text,

  qty                  integer NOT NULL CHECK (qty > 0),
  line_total           numeric(10,2) NOT NULL,

  status               text NOT NULL DEFAULT 'placed'
                       CHECK (status IN ('placed','preparing','ready','served','cancelled')),

  created_at           timestamptz DEFAULT now(),
  updated_at           timestamptz DEFAULT now()
);
CREATE INDEX idx_order_items_order      ON order_items(order_id);
CREATE INDEX idx_order_items_biz_status ON order_items(business_id, status);

-- ─────────────────────────────────────────────────────────────────
-- TABLE: order_status_events — audit trail, populated entirely by
-- triggers below (not application code), so the log is complete
-- regardless of which surface changed a status.
-- ─────────────────────────────────────────────────────────────────
CREATE TABLE order_status_events (
  id                   uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id             uuid NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  business_id          uuid NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
  order_item_id        uuid REFERENCES order_items(id) ON DELETE CASCADE, -- null = order-level event
  from_status          text,
  to_status            text NOT NULL,
  changed_by_staff_id  uuid REFERENCES staff_accounts(id) ON DELETE SET NULL, -- null = customer/system action
  created_at           timestamptz DEFAULT now()
);
CREATE INDEX idx_order_status_events_order ON order_status_events(order_id, created_at);

-- ─────────────────────────────────────────────────────────────────
-- TRIGGERS
-- ─────────────────────────────────────────────────────────────────

-- Lock order_items snapshot fields against any UPDATE — corrections happen
-- by cancelling the line and adding a new one, never by editing history.
CREATE OR REPLACE FUNCTION lock_order_item_snapshot()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.item_name_snapshot IS DISTINCT FROM OLD.item_name_snapshot
     OR NEW.unit_price_snapshot IS DISTINCT FROM OLD.unit_price_snapshot THEN
    RAISE EXCEPTION 'Access Denied: order_items price/name snapshot is immutable.';
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER trg_lock_order_item_snapshot
BEFORE UPDATE ON order_items
FOR EACH ROW
EXECUTE FUNCTION lock_order_item_snapshot();

-- Block non-admins from authorizing a discount — mirrors check_staff_item_update() in 007.
CREATE OR REPLACE FUNCTION guard_order_discount()
RETURNS TRIGGER AS $$
BEGIN
  IF NOT is_admin_of(NEW.business_id) THEN
    IF NEW.discount_amount IS DISTINCT FROM OLD.discount_amount AND NEW.discount_amount <> 0 THEN
      RAISE EXCEPTION 'Access Denied: only owner/admin can set a discount.';
    END IF;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER trg_guard_order_discount
BEFORE UPDATE ON orders
FOR EACH ROW
EXECUTE FUNCTION guard_order_discount();

-- Auto-log order status transitions.
CREATE OR REPLACE FUNCTION log_order_status()
RETURNS TRIGGER AS $$
DECLARE
  v_staff_id uuid;
BEGIN
  IF NEW.status IS DISTINCT FROM OLD.status THEN
    SELECT id INTO v_staff_id FROM staff_accounts
      WHERE business_id = NEW.business_id AND user_id = auth.uid() AND is_active = true LIMIT 1;
    INSERT INTO order_status_events (order_id, business_id, from_status, to_status, changed_by_staff_id)
    VALUES (NEW.id, NEW.business_id, OLD.status, NEW.status, v_staff_id);
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER trg_log_order_status
AFTER UPDATE ON orders
FOR EACH ROW
EXECUTE FUNCTION log_order_status();

-- Auto-log order_item status transitions (drives the KOT board timeline).
CREATE OR REPLACE FUNCTION log_order_item_status()
RETURNS TRIGGER AS $$
DECLARE
  v_staff_id uuid;
BEGIN
  IF NEW.status IS DISTINCT FROM OLD.status THEN
    SELECT id INTO v_staff_id FROM staff_accounts
      WHERE business_id = NEW.business_id AND user_id = auth.uid() AND is_active = true LIMIT 1;
    INSERT INTO order_status_events (order_id, business_id, order_item_id, from_status, to_status, changed_by_staff_id)
    VALUES (NEW.order_id, NEW.business_id, NEW.id, OLD.status, NEW.status, v_staff_id);
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER trg_log_order_item_status
AFTER UPDATE ON order_items
FOR EACH ROW
EXECUTE FUNCTION log_order_item_status();

-- Sync tables.status from order lifecycle. Staff can still always manually
-- override (e.g. pre-mark 'reserved', or reset 'needs_cleaning' -> 'available'
-- after physically cleaning) — this trigger only *sets*, it never blocks a
-- manual UPDATE on the tables row itself.
CREATE OR REPLACE FUNCTION sync_table_status()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.table_id IS NOT NULL THEN
    IF NEW.status = 'settled' THEN
      UPDATE tables SET status = 'needs_cleaning', updated_at = now() WHERE id = NEW.table_id;
    ELSIF NEW.status NOT IN ('cancelled') AND (TG_OP = 'INSERT' OR OLD.status IS DISTINCT FROM NEW.status) THEN
      UPDATE tables SET status = 'occupied', updated_at = now() WHERE id = NEW.table_id AND status = 'available';
    END IF;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER trg_sync_table_status
AFTER INSERT OR UPDATE ON orders
FOR EACH ROW
EXECUTE FUNCTION sync_table_status();

-- ─────────────────────────────────────────────────────────────────
-- RPC: add_order_items — the ONLY code path that writes order_items.
--
-- SECURITY DEFINER (not INVOKER): the find-or-create "open tab" lookup
-- needs to SELECT an existing orders row, but orders has NO anon SELECT
-- policy at all (by design — see RLS section below), so an anonymous
-- customer placing a second round could never find their table's open
-- order under INVOKER semantics. DEFINER bypasses RLS entirely inside
-- this function, which means *this function* is now the security
-- boundary — every check RLS would have done is re-implemented below
-- explicitly:
--   - source='staff' requires is_staff_of(p_business_id) (re-checked
--     here since RLS is bypassed)
--   - source='customer' forces placed_by_staff_id to NULL regardless
--     of what's passed in
--   - p_table_id, if given, must actually belong to p_business_id
--   - price is never trusted from the caller — always re-read from
--     the live items row
-- SET search_path pins name resolution to public, standard practice
-- for SECURITY DEFINER functions taking caller-controlled input.
-- ─────────────────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION add_order_items(
  p_business_id uuid,
  p_table_id uuid,
  p_branch_id uuid,
  p_order_type text,
  p_source text,
  p_customer_name text,
  p_customer_phone text,
  p_items jsonb  -- [{item_id, qty, note, selected_add_on_ids}]
)
RETURNS orders
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_order   orders;
  v_item    jsonb;
  v_row     items%ROWTYPE;
  v_qty     integer;
  v_add_ons jsonb;
  v_add_on_total numeric(10,2);
  v_staff_id uuid;
BEGIN
  IF p_source NOT IN ('customer','staff') THEN
    RAISE EXCEPTION 'Invalid order source.';
  END IF;

  IF p_items IS NULL OR jsonb_array_length(p_items) = 0 THEN
    RAISE EXCEPTION 'At least one item is required.';
  END IF;

  IF p_branch_id IS NOT NULL AND NOT EXISTS (SELECT 1 FROM branches WHERE id = p_branch_id AND business_id = p_business_id) THEN
    RAISE EXCEPTION 'Branch not found for this business.';
  END IF;

  IF p_source = 'staff' THEN
    IF NOT is_staff_of(p_business_id) THEN
      RAISE EXCEPTION 'Access Denied: not an active staff member of this business.';
    END IF;
    SELECT id INTO v_staff_id FROM staff_accounts
      WHERE business_id = p_business_id AND user_id = auth.uid() AND is_active = true LIMIT 1;
  ELSE
    -- Anonymous customer path: never trust a caller-supplied staff id.
    v_staff_id := NULL;
  END IF;

  IF p_table_id IS NOT NULL THEN
    IF NOT EXISTS (SELECT 1 FROM tables WHERE id = p_table_id AND business_id = p_business_id AND is_active = true) THEN
      RAISE EXCEPTION 'Table not found for this business.';
    END IF;

    -- Find an existing open tab for this table, or start a new one.
    SELECT * INTO v_order FROM orders
      WHERE business_id = p_business_id AND table_id = p_table_id
        AND status NOT IN ('settled','cancelled')
      ORDER BY created_at DESC LIMIT 1;
  END IF;

  IF v_order.id IS NULL THEN
    INSERT INTO orders (business_id, branch_id, table_id, order_type, source, placed_by_staff_id, customer_name, customer_phone)
    VALUES (p_business_id, p_branch_id, p_table_id, COALESCE(p_order_type, 'dine_in'), p_source, v_staff_id, p_customer_name, p_customer_phone)
    RETURNING * INTO v_order;
  END IF;

  FOR v_item IN SELECT * FROM jsonb_array_elements(p_items)
  LOOP
    SELECT * INTO v_row FROM items WHERE id = (v_item->>'item_id')::uuid AND business_id = p_business_id;
    IF v_row.id IS NULL THEN
      RAISE EXCEPTION 'Item not found for this business.';
    END IF;
    IF NOT COALESCE(v_row.is_available, true) THEN
      RAISE EXCEPTION 'Item "%" is currently sold out.', v_row.name;
    END IF;

    v_qty := COALESCE((v_item->>'qty')::integer, 1);
    IF v_qty < 1 THEN
      RAISE EXCEPTION 'Quantity must be at least 1.';
    END IF;

    -- Resolve selected add-ons against the item's live add_ons list (price never trusted from caller).
    SELECT COALESCE(jsonb_agg(ao), '[]'::jsonb), COALESCE(SUM((ao->>'price')::numeric), 0)
      INTO v_add_ons, v_add_on_total
      FROM jsonb_array_elements(v_row.add_ons) ao
      WHERE (ao->>'id') IN (SELECT jsonb_array_elements_text(COALESCE(v_item->'selected_add_on_ids', '[]'::jsonb)));

    INSERT INTO order_items (order_id, business_id, item_id, item_name_snapshot, unit_price_snapshot, selected_add_ons, note, qty, line_total)
    VALUES (
      v_order.id, p_business_id, v_row.id, v_row.name, v_row.price, COALESCE(v_add_ons, '[]'::jsonb),
      NULLIF(v_item->>'note', ''), v_qty, (v_row.price + v_add_on_total) * v_qty
    );
  END LOOP;

  -- Recompute order totals from all non-cancelled lines.
  UPDATE orders SET
    subtotal = (SELECT COALESCE(SUM(line_total), 0) FROM order_items WHERE order_id = v_order.id AND status <> 'cancelled'),
    updated_at = now()
  WHERE id = v_order.id;

  UPDATE orders SET total_amount = subtotal + tax_amount - discount_amount WHERE id = v_order.id;

  SELECT * INTO v_order FROM orders WHERE id = v_order.id;
  RETURN v_order;
END;
$$;

-- Explicit grants (Postgres grants EXECUTE to PUBLIC by default on function
-- creation, but this is made explicit so it survives any future privilege
-- cleanup elsewhere in the project).
GRANT EXECUTE ON FUNCTION add_order_items TO anon, authenticated;

-- ─────────────────────────────────────────────────────────────────
-- RLS — follows the stricter split-by-operation pattern from
-- 007_strict_rbac.sql (separate INSERT/UPDATE/DELETE, DELETE gated to
-- is_admin_of) rather than the older monolithic FOR ALL style.
--
-- NOTE: add_order_items() above is SECURITY DEFINER and bypasses these
-- policies internally (it does its own explicit checks instead — see
-- the comment on that function). The INSERT policies below are a
-- defense-in-depth backstop for the unlikely case that something ever
-- writes to these tables directly instead of via the RPC.
-- ─────────────────────────────────────────────────────────────────
ALTER TABLE tables              ENABLE ROW LEVEL SECURITY;
ALTER TABLE orders              ENABLE ROW LEVEL SECURITY;
ALTER TABLE order_items         ENABLE ROW LEVEL SECURITY;
ALTER TABLE order_status_events ENABLE ROW LEVEL SECURITY;

-- tables: public read (needed to resolve a QR scan into table context before an order exists), staff write
CREATE POLICY "tables_pub_read"     ON tables FOR SELECT TO anon USING (is_active = true);
CREATE POLICY "tables_staff_select" ON tables FOR SELECT TO authenticated USING (is_staff_of(business_id));
CREATE POLICY "tables_staff_insert" ON tables FOR INSERT TO authenticated WITH CHECK (is_staff_of(business_id));
CREATE POLICY "tables_staff_update" ON tables FOR UPDATE TO authenticated USING (is_staff_of(business_id)) WITH CHECK (is_staff_of(business_id));
CREATE POLICY "tables_admin_delete" ON tables FOR DELETE TO authenticated USING (is_admin_of(business_id));

-- orders: NO anon SELECT — same private-by-default precedent as reservations post-007.
CREATE POLICY "orders_pub_insert" ON orders FOR INSERT TO anon, authenticated
  WITH CHECK (
    source = 'customer' AND placed_by_staff_id IS NULL
    AND status = 'placed' AND payment_method IS NULL AND settled_at IS NULL
  );
CREATE POLICY "orders_staff_select" ON orders FOR SELECT TO authenticated USING (is_staff_of(business_id));
CREATE POLICY "orders_staff_insert" ON orders FOR INSERT TO authenticated WITH CHECK (is_staff_of(business_id));
CREATE POLICY "orders_staff_update" ON orders FOR UPDATE TO authenticated USING (is_staff_of(business_id)) WITH CHECK (is_staff_of(business_id));
CREATE POLICY "orders_admin_delete" ON orders FOR DELETE TO authenticated USING (is_admin_of(business_id));

-- order_items: same shape, plus a defense-in-depth price check baked into the anon WITH CHECK
-- (on top of add_order_items()'s own live re-read of items.price/is_available).
CREATE POLICY "order_items_pub_insert" ON order_items FOR INSERT TO anon, authenticated
  WITH CHECK (
    status = 'placed'
    AND EXISTS (SELECT 1 FROM orders o WHERE o.id = order_items.order_id AND o.business_id = order_items.business_id AND o.source = 'customer')
    AND EXISTS (SELECT 1 FROM items i WHERE i.id = order_items.item_id AND i.business_id = order_items.business_id
                AND i.price = order_items.unit_price_snapshot AND i.is_available = true)
  );
CREATE POLICY "order_items_staff_select" ON order_items FOR SELECT TO authenticated USING (is_staff_of(business_id));
CREATE POLICY "order_items_staff_insert" ON order_items FOR INSERT TO authenticated WITH CHECK (is_staff_of(business_id));
CREATE POLICY "order_items_staff_update" ON order_items FOR UPDATE TO authenticated USING (is_staff_of(business_id)) WITH CHECK (is_staff_of(business_id));
CREATE POLICY "order_items_admin_delete" ON order_items FOR DELETE TO authenticated USING (is_admin_of(business_id));

-- order_status_events: staff-only read, no anon access at all — populated purely by triggers.
CREATE POLICY "order_status_events_staff_select" ON order_status_events FOR SELECT TO authenticated USING (is_staff_of(business_id));

-- ─────────────────────────────────────────────────────────────────
-- Realtime — without this, KitchenDisplay's postgres_changes subscriptions
-- connect successfully but never receive a single change event. Every
-- Supabase project ships a `supabase_realtime` publication by default;
-- tables must be added to it explicitly to be eligible for postgres_changes.
-- ─────────────────────────────────────────────────────────────────
ALTER PUBLICATION supabase_realtime ADD TABLE orders;
ALTER PUBLICATION supabase_realtime ADD TABLE order_items;
ALTER PUBLICATION supabase_realtime ADD TABLE tables;


-- ════════════════════════════════════════════════════════════════════
-- Migration 009 — POS roles, QR↔table linking, billing settings
-- Companion to 008_pos_core.sql. Run AFTER 008.
-- ════════════════════════════════════════════════════════════════════

-- Extend the staff role model for POS job titles. 'admin' already exists
-- in this constraint's predecessor role set as of 007_strict_rbac.sql's
-- is_admin_of() function, but was never added to the CHECK constraint
-- itself — closing that gap here alongside the new POS roles.
-- is_staff_of()/is_admin_of() need no changes: is_staff_of() only checks
-- row existence + is_active (any of these new roles count as staff),
-- and is_admin_of() already matches role IN ('owner','admin') which is
-- unaffected by adding waiter/kitchen/cashier.
ALTER TABLE staff_accounts DROP CONSTRAINT IF EXISTS staff_accounts_role_check;
ALTER TABLE staff_accounts ADD CONSTRAINT staff_accounts_role_check
  CHECK (role IN ('owner','admin','manager','staff','waiter','kitchen','cashier'));

-- QR ↔ table link — extends, does not replace, the existing table_number
-- label field. A QR's target_url can now resolve to a specific tables.code
-- so a scan lands the customer directly in ordering context for that table.
ALTER TABLE qr_codes ADD COLUMN IF NOT EXISTS table_id uuid REFERENCES tables(id) ON DELETE SET NULL;

-- Billing settings — typed columns, since this is financial config read by
-- the order-totals RPC, not a loosely-typed display toggle like social_links.
ALTER TABLE businesses ADD COLUMN IF NOT EXISTS tax_percent numeric(5,2) DEFAULT 5.00;
ALTER TABLE businesses ADD COLUMN IF NOT EXISTS pos_settings jsonb DEFAULT '{}'::jsonb;
-- pos_settings shape (all optional, filled in via CMS Settings in a later phase):
-- { "receipt_footer": text, "default_discount_reasons": string[] }


-- ════════════════════════════════════════════════════════════════════
-- Migration 010 — Real restaurant billing
-- GSTIN/FSSAI on receipts, sequential bill numbers assigned at settle,
-- and bar/liquor items billed separately (different tax regime: liquor
-- carries state VAT, not GST, and is typically issued as a separate bill
-- under the bar license). Run AFTER 009_pos_roles_settings.sql.
-- ════════════════════════════════════════════════════════════════════

-- Business billing identity — printed on every bill.
ALTER TABLE businesses ADD COLUMN IF NOT EXISTS gstin text;
ALTER TABLE businesses ADD COLUMN IF NOT EXISTS fssai_license text;
ALTER TABLE businesses ADD COLUMN IF NOT EXISTS bar_tax_percent numeric(5,2) DEFAULT 18.00; -- state VAT on liquor
ALTER TABLE businesses ADD COLUMN IF NOT EXISTS receipt_footer text; -- e.g. 'Thank you! Visit again.'
ALTER TABLE businesses ADD COLUMN IF NOT EXISTS next_bill_no integer NOT NULL DEFAULT 1;

-- Bar/liquor flag on items; snapshotted onto order lines so bills stay
-- correct even if the item is later reclassified or deleted.
ALTER TABLE items ADD COLUMN IF NOT EXISTS is_bar boolean DEFAULT false;
ALTER TABLE order_items ADD COLUMN IF NOT EXISTS is_bar boolean NOT NULL DEFAULT false;

ALTER TABLE orders ADD COLUMN IF NOT EXISTS bill_no integer;

-- ─────────────────────────────────────────────────────────────────
-- Sequential bill numbers, assigned atomically the moment an order is
-- settled. The UPDATE..RETURNING on businesses takes a row lock, so two
-- concurrent settles serialize and can never share a number.
-- ─────────────────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION assign_bill_number()
RETURNS TRIGGER AS $$
DECLARE
  v_no integer;
BEGIN
  IF NEW.status = 'settled' AND OLD.status IS DISTINCT FROM 'settled' AND NEW.bill_no IS NULL THEN
    UPDATE businesses SET next_bill_no = next_bill_no + 1
      WHERE id = NEW.business_id
      RETURNING next_bill_no - 1 INTO v_no;
    NEW.bill_no := v_no;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS trg_assign_bill_number ON orders;
CREATE TRIGGER trg_assign_bill_number
BEFORE UPDATE ON orders
FOR EACH ROW
EXECUTE FUNCTION assign_bill_number();

-- ─────────────────────────────────────────────────────────────────
-- add_order_items — same signature as 008, now also snapshots is_bar
-- onto each order line. Full re-declaration (CREATE OR REPLACE).
-- ─────────────────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION add_order_items(
  p_business_id uuid,
  p_table_id uuid,
  p_branch_id uuid,
  p_order_type text,
  p_source text,
  p_customer_name text,
  p_customer_phone text,
  p_items jsonb  -- [{item_id, qty, note, selected_add_on_ids}]
)
RETURNS orders
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_order   orders;
  v_item    jsonb;
  v_row     items%ROWTYPE;
  v_qty     integer;
  v_add_ons jsonb;
  v_add_on_total numeric(10,2);
  v_staff_id uuid;
BEGIN
  IF p_source NOT IN ('customer','staff') THEN
    RAISE EXCEPTION 'Invalid order source.';
  END IF;

  IF p_items IS NULL OR jsonb_array_length(p_items) = 0 THEN
    RAISE EXCEPTION 'At least one item is required.';
  END IF;

  IF p_branch_id IS NOT NULL AND NOT EXISTS (SELECT 1 FROM branches WHERE id = p_branch_id AND business_id = p_business_id) THEN
    RAISE EXCEPTION 'Branch not found for this business.';
  END IF;

  IF p_source = 'staff' THEN
    IF NOT is_staff_of(p_business_id) THEN
      RAISE EXCEPTION 'Access Denied: not an active staff member of this business.';
    END IF;
    SELECT id INTO v_staff_id FROM staff_accounts
      WHERE business_id = p_business_id AND user_id = auth.uid() AND is_active = true LIMIT 1;
  ELSE
    -- Anonymous customer path: never trust a caller-supplied staff id.
    v_staff_id := NULL;
  END IF;

  IF p_table_id IS NOT NULL THEN
    IF NOT EXISTS (SELECT 1 FROM tables WHERE id = p_table_id AND business_id = p_business_id AND is_active = true) THEN
      RAISE EXCEPTION 'Table not found for this business.';
    END IF;

    -- Find an existing open tab for this table, or start a new one.
    SELECT * INTO v_order FROM orders
      WHERE business_id = p_business_id AND table_id = p_table_id
        AND status NOT IN ('settled','cancelled')
      ORDER BY created_at DESC LIMIT 1;
  END IF;

  IF v_order.id IS NULL THEN
    INSERT INTO orders (business_id, branch_id, table_id, order_type, source, placed_by_staff_id, customer_name, customer_phone)
    VALUES (p_business_id, p_branch_id, p_table_id, COALESCE(p_order_type, 'dine_in'), p_source, v_staff_id, p_customer_name, p_customer_phone)
    RETURNING * INTO v_order;
  END IF;

  FOR v_item IN SELECT * FROM jsonb_array_elements(p_items)
  LOOP
    SELECT * INTO v_row FROM items WHERE id = (v_item->>'item_id')::uuid AND business_id = p_business_id;
    IF v_row.id IS NULL THEN
      RAISE EXCEPTION 'Item not found for this business.';
    END IF;
    IF NOT COALESCE(v_row.is_available, true) THEN
      RAISE EXCEPTION 'Item "%" is currently sold out.', v_row.name;
    END IF;

    v_qty := COALESCE((v_item->>'qty')::integer, 1);
    IF v_qty < 1 THEN
      RAISE EXCEPTION 'Quantity must be at least 1.';
    END IF;

    -- Resolve selected add-ons against the item's live add_ons list (price never trusted from caller).
    SELECT COALESCE(jsonb_agg(ao), '[]'::jsonb), COALESCE(SUM((ao->>'price')::numeric), 0)
      INTO v_add_ons, v_add_on_total
      FROM jsonb_array_elements(v_row.add_ons) ao
      WHERE (ao->>'id') IN (SELECT jsonb_array_elements_text(COALESCE(v_item->'selected_add_on_ids', '[]'::jsonb)));

    INSERT INTO order_items (order_id, business_id, item_id, item_name_snapshot, unit_price_snapshot, selected_add_ons, note, qty, line_total, is_bar)
    VALUES (
      v_order.id, p_business_id, v_row.id, v_row.name, v_row.price, COALESCE(v_add_ons, '[]'::jsonb),
      NULLIF(v_item->>'note', ''), v_qty, (v_row.price + v_add_on_total) * v_qty,
      COALESCE(v_row.is_bar, false)
    );
  END LOOP;

  -- Recompute order totals from all non-cancelled lines.
  UPDATE orders SET
    subtotal = (SELECT COALESCE(SUM(line_total), 0) FROM order_items WHERE order_id = v_order.id AND status <> 'cancelled'),
    updated_at = now()
  WHERE id = v_order.id;

  UPDATE orders SET total_amount = subtotal + tax_amount - discount_amount WHERE id = v_order.id;

  SELECT * INTO v_order FROM orders WHERE id = v_order.id;
  RETURN v_order;
END;
$$;

GRANT EXECUTE ON FUNCTION add_order_items TO anon, authenticated;


-- ════════════════════════════════════════════════════════════════════
-- Migration 011 — POS hardening
-- 1) Tamper-proof QR ordering: the QR now carries a random uuid token,
--    not the guessable table code. Editing ?t= to another table requires
--    guessing a uuid — infeasible. The token is also hidden from the
--    anonymous REST surface via column-level privileges, so it can't be
--    listed with the public anon key either.
-- 2) Cancel-safe money: cancelling an order line now recomputes the
--    parent order's totals automatically (previously the bill kept
--    charging for cancelled lines).
-- 3) Cancelling a whole order frees its table.
-- Run AFTER 010_pos_billing.sql.
-- ════════════════════════════════════════════════════════════════════

-- ─────────────────────────────────────────────────────────────────
-- 1) Unguessable per-table QR token
-- ─────────────────────────────────────────────────────────────────
ALTER TABLE tables ADD COLUMN IF NOT EXISTS qr_token uuid NOT NULL DEFAULT gen_random_uuid();
CREATE UNIQUE INDEX IF NOT EXISTS idx_tables_qr_token ON tables(qr_token);

-- Hide the token from the anonymous role entirely. RLS says which ROWS
-- anon may read (tables_pub_read); column privileges say which COLUMNS.
-- Postgres has no "revoke one column" — revoke the table grant, then
-- grant back everything except qr_token. Server-side code resolves a
-- scanned token with the service-role client, which is unaffected.
REVOKE SELECT ON tables FROM anon;
GRANT SELECT (id, business_id, branch_id, label, code, capacity, zone, status, is_active, sort_order, created_at, updated_at)
  ON tables TO anon;

-- ─────────────────────────────────────────────────────────────────
-- 2) Recompute order totals whenever a line's status changes.
-- Settled/cancelled orders are immutable bills — never touched.
-- No recursion: this updates orders, not order_items.
-- ─────────────────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION recompute_order_totals()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.status IS DISTINCT FROM OLD.status THEN
    UPDATE orders SET
      subtotal = (SELECT COALESCE(SUM(line_total), 0) FROM order_items WHERE order_id = NEW.order_id AND status <> 'cancelled'),
      updated_at = now()
    WHERE id = NEW.order_id AND status NOT IN ('settled','cancelled');

    UPDATE orders SET total_amount = subtotal + tax_amount - discount_amount
    WHERE id = NEW.order_id AND status NOT IN ('settled','cancelled');
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS trg_recompute_totals_on_line_change ON order_items;
CREATE TRIGGER trg_recompute_totals_on_line_change
AFTER UPDATE ON order_items
FOR EACH ROW
EXECUTE FUNCTION recompute_order_totals();

-- ─────────────────────────────────────────────────────────────────
-- 3) sync_table_status — full redefinition (replaces 008's version):
-- now also frees the table when an order is cancelled, provided no
-- other open order is still sitting on it.
-- ─────────────────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION sync_table_status()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.table_id IS NOT NULL THEN
    IF NEW.status = 'settled' THEN
      UPDATE tables SET status = 'needs_cleaning', updated_at = now() WHERE id = NEW.table_id;
    ELSIF NEW.status = 'cancelled' THEN
      UPDATE tables SET status = 'available', updated_at = now()
      WHERE id = NEW.table_id
        AND NOT EXISTS (
          SELECT 1 FROM orders
          WHERE table_id = NEW.table_id AND id <> NEW.id AND status NOT IN ('settled','cancelled')
        );
    ELSIF TG_OP = 'INSERT' OR OLD.status IS DISTINCT FROM NEW.status THEN
      UPDATE tables SET status = 'occupied', updated_at = now() WHERE id = NEW.table_id AND status = 'available';
    END IF;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;


-- ════════════════════════════════════════════════════════════════════
-- Migration 012 — Atomic, race-free bill settlement
-- Previously settle read a fresh subtotal but trusted a client-computed tax
-- amount. If a dine-in customer added items from their phone between the
-- waiter opening the bill and pressing Settle, the stored bill got a fresh
-- subtotal but stale tax → wrong total. This RPC recomputes everything from
-- the live order lines at settle time, the same way add_order_items() is the
-- single source of truth for pricing. Run AFTER 011_pos_hardening.sql.
-- ════════════════════════════════════════════════════════════════════

CREATE OR REPLACE FUNCTION settle_order(
  p_order_id uuid,
  p_payment_method text,
  p_discount_amount numeric,
  p_discount_reason text,
  p_food_tax_percent numeric,
  p_bar_tax_percent numeric
)
RETURNS orders
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_order    orders;
  v_staff_id uuid;
  v_food_sub numeric(10,2);
  v_bar_sub  numeric(10,2);
  v_subtotal numeric(10,2);
  v_tax      numeric(10,2);
  v_discount numeric(10,2);
BEGIN
  SELECT * INTO v_order FROM orders WHERE id = p_order_id;
  IF v_order.id IS NULL THEN
    RAISE EXCEPTION 'Order not found.';
  END IF;
  IF NOT is_staff_of(v_order.business_id) THEN
    RAISE EXCEPTION 'Access Denied: not an active staff member of this business.';
  END IF;
  IF v_order.status IN ('settled','cancelled') THEN
    RAISE EXCEPTION 'This order is already closed.';
  END IF;
  IF p_payment_method NOT IN ('cash','card','upi','other') THEN
    RAISE EXCEPTION 'Invalid payment method.';
  END IF;

  v_discount := COALESCE(p_discount_amount, 0);
  IF v_discount < 0 THEN
    RAISE EXCEPTION 'Discount cannot be negative.';
  END IF;
  -- Discounts are an owner/admin authority (also enforced by guard_order_discount).
  IF v_discount <> 0 AND NOT is_admin_of(v_order.business_id) THEN
    RAISE EXCEPTION 'Access Denied: only owner/admin can apply a discount.';
  END IF;

  SELECT id INTO v_staff_id FROM staff_accounts
    WHERE business_id = v_order.business_id AND user_id = auth.uid() AND is_active = true LIMIT 1;

  -- Fresh split of the live (non-cancelled) lines — this is the authoritative
  -- money, regardless of what the billing screen last rendered.
  SELECT
    COALESCE(SUM(line_total) FILTER (WHERE NOT COALESCE(is_bar, false)), 0),
    COALESCE(SUM(line_total) FILTER (WHERE COALESCE(is_bar, false)), 0)
    INTO v_food_sub, v_bar_sub
    FROM order_items WHERE order_id = p_order_id AND status <> 'cancelled';

  IF v_food_sub + v_bar_sub = 0 THEN
    RAISE EXCEPTION 'Cannot settle an empty order.';
  END IF;

  v_subtotal := v_food_sub + v_bar_sub;
  v_tax := round(v_food_sub * COALESCE(p_food_tax_percent, 0) / 100, 2)
         + round(v_bar_sub  * COALESCE(p_bar_tax_percent, 0) / 100, 2);

  IF v_discount > v_subtotal THEN
    RAISE EXCEPTION 'Discount exceeds the bill amount.';
  END IF;

  UPDATE orders SET
    subtotal          = v_subtotal,
    tax_amount        = v_tax,
    discount_amount   = v_discount,
    discount_reason   = NULLIF(p_discount_reason, ''),
    total_amount      = v_subtotal + v_tax - v_discount,
    tax_rate_snapshot = jsonb_build_object('food_percent', p_food_tax_percent, 'bar_percent', p_bar_tax_percent),
    payment_method    = p_payment_method,
    status            = 'settled',
    settled_at        = now(),
    settled_by_staff_id = v_staff_id,
    updated_at        = now()
  WHERE id = p_order_id
  RETURNING * INTO v_order;  -- bill_no assigned by the assign_bill_number trigger

  RETURN v_order;
END;
$$;

GRANT EXECUTE ON FUNCTION settle_order TO authenticated;


-- ════════════════════════════════════════════════════════════════════
-- Migration 013 — Owner modules: Expenses, Customer CRM + loyalty, Day Close
-- Turns the POS from "take orders" into "run the business": money-out
-- tracking, a customer book that builds itself from settled bills, and an
-- end-of-day Z-report snapshot. Run AFTER 012_settle_rpc.sql.
-- ════════════════════════════════════════════════════════════════════

-- ─────────────────────────────────────────────────────────────────
-- EXPENSES — money out, for a real P&L (sales − expenses = profit)
-- ─────────────────────────────────────────────────────────────────
CREATE TABLE expenses (
  id                  uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id         uuid NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
  branch_id           uuid REFERENCES branches(id) ON DELETE SET NULL,
  category            text NOT NULL,           -- rent | salaries | supplies | utilities | maintenance | misc
  vendor              text,
  amount              numeric(10,2) NOT NULL CHECK (amount >= 0),
  note                text,
  spent_on            date NOT NULL DEFAULT current_date,
  created_by_staff_id uuid REFERENCES staff_accounts(id) ON DELETE SET NULL,
  created_at          timestamptz DEFAULT now()
);
CREATE INDEX idx_expenses_biz_date ON expenses(business_id, spent_on DESC);

-- ─────────────────────────────────────────────────────────────────
-- CUSTOMERS — the CRM book, upserted automatically when a bill settles.
-- ─────────────────────────────────────────────────────────────────
CREATE TABLE customers (
  id             uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id    uuid NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
  phone          text NOT NULL,
  name           text,
  visit_count    integer NOT NULL DEFAULT 0,
  total_spent    numeric(12,2) NOT NULL DEFAULT 0,
  loyalty_points integer NOT NULL DEFAULT 0,
  first_seen     timestamptz DEFAULT now(),
  last_seen      timestamptz DEFAULT now(),
  UNIQUE(business_id, phone)
);
CREATE INDEX idx_customers_biz_spent ON customers(business_id, total_spent DESC);

-- Link a settled order to the customer it belongs to.
ALTER TABLE orders ADD COLUMN IF NOT EXISTS customer_id uuid REFERENCES customers(id) ON DELETE SET NULL;

-- ─────────────────────────────────────────────────────────────────
-- DAY CLOSES — Z-report snapshots (one per business per date)
-- ─────────────────────────────────────────────────────────────────
CREATE TABLE day_closes (
  id                 uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id        uuid NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
  branch_id          uuid REFERENCES branches(id) ON DELETE SET NULL,
  close_date         date NOT NULL,
  opening_cash       numeric(10,2) DEFAULT 0,
  expected_cash      numeric(10,2) DEFAULT 0,   -- opening + cash sales
  counted_cash       numeric(10,2) DEFAULT 0,
  variance           numeric(10,2) DEFAULT 0,   -- counted − expected
  totals             jsonb,                     -- full report snapshot
  closed_by_staff_id uuid REFERENCES staff_accounts(id) ON DELETE SET NULL,
  closed_at          timestamptz DEFAULT now(),
  UNIQUE(business_id, close_date)
);
CREATE INDEX idx_day_closes_biz_date ON day_closes(business_id, close_date DESC);

-- ─────────────────────────────────────────────────────────────────
-- Loyalty/CRM: on settle, upsert the customer and award 1 point per ₹100.
-- Additive trigger — leaves settle_order() (012) untouched. The inner
-- UPDATE that links order→customer re-fires this trigger, but the status
-- isn't transitioning to 'settled' the second time, so the guard below
-- stops the recursion after exactly one pass.
-- ─────────────────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION award_customer_on_settle()
RETURNS TRIGGER AS $$
DECLARE
  v_cid uuid;
BEGIN
  IF NEW.status = 'settled' AND OLD.status IS DISTINCT FROM 'settled'
     AND NEW.customer_phone IS NOT NULL AND length(trim(NEW.customer_phone)) > 0 THEN
    INSERT INTO customers (business_id, phone, name, visit_count, total_spent, loyalty_points, first_seen, last_seen)
    VALUES (NEW.business_id, trim(NEW.customer_phone), NULLIF(trim(COALESCE(NEW.customer_name,'')),''),
            1, NEW.total_amount, floor(NEW.total_amount / 100), now(), now())
    ON CONFLICT (business_id, phone) DO UPDATE SET
      visit_count    = customers.visit_count + 1,
      total_spent    = customers.total_spent + EXCLUDED.total_spent,
      loyalty_points = customers.loyalty_points + EXCLUDED.loyalty_points,
      name           = COALESCE(EXCLUDED.name, customers.name),
      last_seen      = now()
    RETURNING id INTO v_cid;

    UPDATE orders SET customer_id = v_cid WHERE id = NEW.id AND customer_id IS DISTINCT FROM v_cid;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS trg_award_customer_on_settle ON orders;
CREATE TRIGGER trg_award_customer_on_settle
AFTER UPDATE ON orders
FOR EACH ROW
EXECUTE FUNCTION award_customer_on_settle();

-- ─────────────────────────────────────────────────────────────────
-- RLS — 007 idiom: staff read/write, admin-only delete.
-- ─────────────────────────────────────────────────────────────────
ALTER TABLE expenses    ENABLE ROW LEVEL SECURITY;
ALTER TABLE customers   ENABLE ROW LEVEL SECURITY;
ALTER TABLE day_closes  ENABLE ROW LEVEL SECURITY;

CREATE POLICY "expenses_staff_select" ON expenses FOR SELECT TO authenticated USING (is_staff_of(business_id));
CREATE POLICY "expenses_staff_insert" ON expenses FOR INSERT TO authenticated WITH CHECK (is_staff_of(business_id));
CREATE POLICY "expenses_staff_update" ON expenses FOR UPDATE TO authenticated USING (is_staff_of(business_id)) WITH CHECK (is_staff_of(business_id));
CREATE POLICY "expenses_admin_delete" ON expenses FOR DELETE TO authenticated USING (is_admin_of(business_id));

CREATE POLICY "customers_staff_select" ON customers FOR SELECT TO authenticated USING (is_staff_of(business_id));
CREATE POLICY "customers_staff_insert" ON customers FOR INSERT TO authenticated WITH CHECK (is_staff_of(business_id));
CREATE POLICY "customers_staff_update" ON customers FOR UPDATE TO authenticated USING (is_staff_of(business_id)) WITH CHECK (is_staff_of(business_id));
CREATE POLICY "customers_admin_delete" ON customers FOR DELETE TO authenticated USING (is_admin_of(business_id));

CREATE POLICY "day_closes_staff_select" ON day_closes FOR SELECT TO authenticated USING (is_staff_of(business_id));
CREATE POLICY "day_closes_staff_insert" ON day_closes FOR INSERT TO authenticated WITH CHECK (is_staff_of(business_id));
CREATE POLICY "day_closes_admin_delete" ON day_closes FOR DELETE TO authenticated USING (is_admin_of(business_id));


-- ════════════════════════════════════════════════════════════════════
-- Migration 014 — Aggregator channels (Swiggy / Zomato) + unified orders
-- Makes delivery-aggregator orders first-class alongside dine-in/takeaway/QR
-- so one board can aggregate every channel. Real Swiggy/Zomato pull needs a
-- partner-API agreement (no public API); this provides the ingestion seam
-- (create_external_order, called by the /api/webhooks/aggregator route) plus
-- manual entry. Run AFTER 013_owner_modules.sql.
-- ════════════════════════════════════════════════════════════════════

-- New order source + a delivery order type for aggregator orders.
ALTER TABLE orders DROP CONSTRAINT IF EXISTS orders_source_check;
ALTER TABLE orders ADD CONSTRAINT orders_source_check CHECK (source IN ('customer','staff','aggregator'));

ALTER TABLE orders DROP CONSTRAINT IF EXISTS orders_order_type_check;
ALTER TABLE orders ADD CONSTRAINT orders_order_type_check CHECK (order_type IN ('dine_in','takeaway','counter','delivery'));

-- The channel a live order arrived through, and the aggregator's own order id.
ALTER TABLE orders ADD COLUMN IF NOT EXISTS channel text NOT NULL DEFAULT 'direct'
  CHECK (channel IN ('direct','swiggy','zomato','phone'));
ALTER TABLE orders ADD COLUMN IF NOT EXISTS external_ref text;
CREATE INDEX IF NOT EXISTS idx_orders_biz_channel ON orders(business_id, channel);

-- Our sequential bill numbers are for our OWN bills only — aggregator orders
-- carry the platform's bill, so they must not consume our number sequence.
CREATE OR REPLACE FUNCTION assign_bill_number()
RETURNS TRIGGER AS $$
DECLARE
  v_no integer;
BEGIN
  IF NEW.status = 'settled' AND OLD.status IS DISTINCT FROM 'settled'
     AND NEW.bill_no IS NULL AND NEW.channel = 'direct' THEN
    UPDATE businesses SET next_bill_no = next_bill_no + 1
      WHERE id = NEW.business_id
      RETURNING next_bill_no - 1 INTO v_no;
    NEW.bill_no := v_no;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ─────────────────────────────────────────────────────────────────
-- create_external_order — ingest a Swiggy/Zomato (or phone) order.
-- Unlike add_order_items, prices come FROM the platform payload: the
-- aggregator is the source of truth for its own order and its prices
-- already include its markup/tax, so we snapshot them as given rather
-- than re-reading our menu. Called by the webhook route (service role)
-- and by manual aggregator entry.
-- ─────────────────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION create_external_order(
  p_business_id uuid,
  p_channel text,
  p_external_ref text,
  p_order_type text,
  p_customer_name text,
  p_customer_phone text,
  p_items jsonb  -- [{name, price, qty, note}]
)
RETURNS orders
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_order orders;
  v_item  jsonb;
  v_qty   integer;
  v_price numeric(10,2);
  v_sub   numeric(10,2) := 0;
BEGIN
  IF p_channel NOT IN ('swiggy','zomato','phone') THEN
    RAISE EXCEPTION 'Invalid aggregator channel.';
  END IF;
  IF p_items IS NULL OR jsonb_array_length(p_items) = 0 THEN
    RAISE EXCEPTION 'At least one item is required.';
  END IF;
  -- Idempotency: never ingest the same platform order twice.
  IF p_external_ref IS NOT NULL AND EXISTS (
    SELECT 1 FROM orders WHERE business_id = p_business_id AND channel = p_channel AND external_ref = p_external_ref
  ) THEN
    SELECT * INTO v_order FROM orders WHERE business_id = p_business_id AND channel = p_channel AND external_ref = p_external_ref LIMIT 1;
    RETURN v_order;
  END IF;

  INSERT INTO orders (business_id, order_type, source, channel, external_ref, status, customer_name, customer_phone)
  VALUES (p_business_id, COALESCE(p_order_type, 'delivery'), 'aggregator', p_channel, NULLIF(p_external_ref, ''),
          'placed', NULLIF(trim(COALESCE(p_customer_name,'')), ''), NULLIF(trim(COALESCE(p_customer_phone,'')), ''))
  RETURNING * INTO v_order;

  FOR v_item IN SELECT * FROM jsonb_array_elements(p_items)
  LOOP
    v_qty := GREATEST(COALESCE((v_item->>'qty')::integer, 1), 1);
    v_price := COALESCE((v_item->>'price')::numeric, 0);
    INSERT INTO order_items (order_id, business_id, item_id, item_name_snapshot, unit_price_snapshot, note, qty, line_total, is_bar)
    VALUES (v_order.id, p_business_id, NULL,
            COALESCE(NULLIF(trim(v_item->>'name'), ''), 'Item'), v_price,
            NULLIF(v_item->>'note',''), v_qty, v_price * v_qty, false);
    v_sub := v_sub + v_price * v_qty;
  END LOOP;

  -- Aggregator totals are taken as-is (platform prices are tax-inclusive).
  UPDATE orders SET subtotal = v_sub, total_amount = v_sub, updated_at = now() WHERE id = v_order.id RETURNING * INTO v_order;
  RETURN v_order;
END;
$$;

GRANT EXECUTE ON FUNCTION create_external_order TO authenticated;


