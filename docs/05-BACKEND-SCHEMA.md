# 05 — Backend Schema

---

## Auth Provider

**Supabase Auth** — email + password, httpOnly cookies via `@supabase/ssr`.

One owner account per restaurant (created by developer via Admin API during setup).
Staff accounts created by owner in CMS.

User roles stored in `staff_accounts` table (not in auth.users metadata).
RLS uses `staff_accounts` lookup, not auth metadata.

---

## Row Level Security Model

Single helper function used by all policies:

```sql
CREATE FUNCTION is_staff_of(bid uuid)
RETURNS boolean LANGUAGE sql SECURITY DEFINER AS $$
  SELECT EXISTS (
    SELECT 1 FROM staff_accounts
    WHERE business_id = bid
      AND user_id = auth.uid()
      AND is_active = true
  );
$$;
```

Pattern applied to all tables:
```sql
-- Public read (anon = customers scanning QR)
CREATE POLICY "public_read" ON {table} FOR SELECT TO anon USING ({condition});

-- Staff write (authenticated = CMS users)
CREATE POLICY "staff_write" ON {table} FOR ALL TO authenticated
  USING (is_staff_of(business_id))
  WITH CHECK (is_staff_of(business_id));
```

---

## Migration 001 — Core Tables (All Tiers)

```sql
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ─────────────────────────────────────────────────────────────────
-- TABLE: businesses
-- One row per deployed client restaurant.
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
-- TABLE: items
-- Core menu content. Scale target: up to 10M rows total at 5000 restaurants.
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
  stock_image_key text,
  -- Key from stock_images table. E.g. 'stock/indian/biryani.webp'
  custom_r2_key   text,
  -- E.g. 'clients/taj-cafe/items/{id}/full.webp'
  custom_thumb_key text,
  -- E.g. 'clients/taj-cafe/items/{id}/thumb.webp'

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
  view_count      integer DEFAULT 0,    -- Incremented by Firebase event, read from here

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
-- TABLE: stock_images
-- Curated library of food images hosted on R2 public bucket.
-- Pre-populated via scripts/upload-stock.ts
-- ─────────────────────────────────────────────────────────────────
CREATE TABLE stock_images (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  r2_key      text UNIQUE NOT NULL,
  -- e.g. 'stock/indian/biryani.webp'
  -- Full URL: ${CDN_URL}/{r2_key}

  category    text NOT NULL,
  -- 'indian' | 'chinese' | 'continental' | 'drinks' | 'desserts' | 'street' | 'hero'

  name        text NOT NULL,            -- display name: "Biryani"
  tags        text[] DEFAULT '{}',      -- ['rice','biryani','north-indian','mughlai']
  -- For search/filter in StockImagePicker CMS component

  is_active   boolean DEFAULT true,
  sort_order  integer DEFAULT 0
);

-- ─────────────────────────────────────────────────────────────────
-- TABLE: qr_codes
-- ─────────────────────────────────────────────────────────────────
CREATE TABLE qr_codes (
  id           uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id  uuid NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,

  label        text NOT NULL DEFAULT 'Main',
  -- e.g. 'Table 1', 'Counter', 'Takeaway'

  target_url   text NOT NULL,
  -- For static QR: https://client.yourdomain.in
  -- For dynamic QR (Premium): /api/qr/{id} → redirects to target_url

  is_dynamic   boolean DEFAULT false,
  -- Premium: QR points to /api/qr/{id}. Can change target_url without reprinting.

  qr_color     text DEFAULT '#000000',
  qr_bg_color  text DEFAULT '#FFFFFF',
  include_logo boolean DEFAULT true,

  branch_id    uuid,    -- Premium: link to specific branch
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
-- TABLE: analytics_events
-- Custom events tracked client-side via Firebase, with subset mirrored here.
-- Primary analytics: Firebase GA4. This table is for CMS charts.
-- Cleanup strategy: delete events older than 90 days (GitHub Actions weekly).
-- ─────────────────────────────────────────────────────────────────
CREATE TABLE analytics_events (
  id           uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id  uuid NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,

  event_type   text NOT NULL,
  -- 'page_view' | 'item_view' | 'whatsapp_click' | 'call_click' | 'share'
  -- | 'maps_click' | 'reservation_submit' | 'category_tap'

  item_id      uuid REFERENCES items(id) ON DELETE SET NULL,
  session_id   text,   -- anonymous, generated per browser session
  created_at   timestamptz DEFAULT now()
);

CREATE INDEX idx_events_biz_type ON analytics_events(business_id, event_type, created_at DESC);
-- Compound index supports: WHERE business_id=? AND created_at >= ? queries efficiently

-- Auto-cleanup (run weekly via GitHub Actions):
-- DELETE FROM analytics_events WHERE created_at < NOW() - INTERVAL '90 days';
```

---

## Migration 002 — RLS Policies

```sql
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
```

---

## Migration 003 — Advanced Tables

```sql
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

-- Add menu_id to categories (already declared as nullable)
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
ALTER TABLE menus ENABLE ROW LEVEL SECURITY;
ALTER TABLE banners ENABLE ROW LEVEL SECURITY;
CREATE POLICY "menus_pub_read" ON menus FOR SELECT TO anon USING (is_active = true);
CREATE POLICY "banners_pub_read" ON banners FOR SELECT TO anon
  USING (is_active = true AND (starts_at IS NULL OR starts_at <= now()) AND (ends_at IS NULL OR ends_at >= now()));
CREATE POLICY "menus_staff"   ON menus   FOR ALL TO authenticated USING (is_staff_of(business_id)) WITH CHECK (is_staff_of(business_id));
CREATE POLICY "banners_staff" ON banners FOR ALL TO authenticated USING (is_staff_of(business_id)) WITH CHECK (is_staff_of(business_id));
```

---

## Migration 004 — Premium Tables

```sql
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

-- Add branch_id to items and qr_codes
ALTER TABLE items     ADD COLUMN branch_id uuid REFERENCES branches(id) ON DELETE SET NULL;
ALTER TABLE qr_codes  ADD COLUMN branch_id uuid REFERENCES branches(id) ON DELETE SET NULL;

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
  locale      text NOT NULL,  -- 'hi' | 'mr' | 'ta' | 'te' | 'kn' | 'bn' | 'gu'
  field       text NOT NULL,  -- 'name' | 'description' | 'tagline'
  value       text NOT NULL,
  UNIQUE(business_id, entity_type, entity_id, locale, field)
);

-- RLS
ALTER TABLE branches ENABLE ROW LEVEL SECURITY;
ALTER TABLE reservations ENABLE ROW LEVEL SECURITY;
ALTER TABLE translations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "branches_pub_read"  ON branches FOR SELECT TO anon USING (is_active = true);
CREATE POLICY "branches_staff"     ON branches FOR ALL    TO authenticated USING (is_staff_of(business_id)) WITH CHECK (is_staff_of(business_id));

CREATE POLICY "reserv_pub_insert"  ON reservations FOR INSERT TO anon WITH CHECK (true);
CREATE POLICY "reserv_staff_all"   ON reservations FOR ALL    TO authenticated USING (is_staff_of(business_id));

CREATE POLICY "trans_pub_read"     ON translations FOR SELECT TO anon USING (true);
CREATE POLICY "trans_staff_all"    ON translations FOR ALL    TO authenticated USING (is_staff_of(business_id)) WITH CHECK (is_staff_of(business_id));
```

---

## Seed — Stock Images

```sql
-- Initial stock image library (a subset — full list in supabase/seed/stock-images.sql)
INSERT INTO stock_images (r2_key, category, name, tags) VALUES
  ('stock/indian/biryani.webp',         'indian',      'Biryani',          ARRAY['rice','biryani','north-indian']),
  ('stock/indian/butter-chicken.webp',  'indian',      'Butter Chicken',   ARRAY['curry','chicken','north-indian']),
  ('stock/indian/dal-makhani.webp',     'indian',      'Dal Makhani',      ARRAY['dal','veg','north-indian']),
  ('stock/indian/paneer-tikka.webp',    'indian',      'Paneer Tikka',     ARRAY['paneer','veg','starter']),
  ('stock/indian/samosa.webp',          'indian',      'Samosa',           ARRAY['snack','veg','street']),
  ('stock/indian/naan.webp',            'indian',      'Naan',             ARRAY['bread','veg']),
  ('stock/drinks/chai.webp',            'drinks',      'Chai',             ARRAY['hot','tea','indian']),
  ('stock/drinks/coffee.webp',          'drinks',      'Coffee',           ARRAY['hot','coffee']),
  ('stock/drinks/lassi.webp',           'drinks',      'Lassi',            ARRAY['cold','dairy','indian']),
  ('stock/drinks/juice.webp',           'drinks',      'Fresh Juice',      ARRAY['cold','fruit','healthy']),
  ('stock/desserts/gulab-jamun.webp',   'desserts',    'Gulab Jamun',      ARRAY['sweet','indian','fried']),
  ('stock/desserts/ice-cream.webp',     'desserts',    'Ice Cream',        ARRAY['cold','sweet']),
  ('stock/continental/pasta.webp',      'continental', 'Pasta',            ARRAY['italian','veg','mains']),
  ('stock/continental/pizza.webp',      'continental', 'Pizza',            ARRAY['italian','baked']),
  ('stock/continental/burger.webp',     'continental', 'Burger',           ARRAY['fast-food','snack']),
  ('stock/street/pav-bhaji.webp',       'street',      'Pav Bhaji',        ARRAY['street','veg','mumbai']),
  ('stock/street/vada-pav.webp',        'street',      'Vada Pav',         ARRAY['street','veg','mumbai']),
  ('stock/hero/restaurant-interior.webp','hero',       'Restaurant',       ARRAY['interior','ambience']),
  ('stock/hero/cafe-interior.webp',     'hero',        'Cafe Interior',    ARRAY['cafe','light','interior']);
-- Full library: ~100 images. See supabase/seed/stock-images.sql
```

---

## TypeScript Interfaces

```typescript
// /src/types/database.ts

export type Tier = 'basic' | 'advanced' | 'premium'
export type Theme = 'mercado' | 'provenance' | 'terrain' | 'bazaar' | 'nocturne' | 'coastal' | 'aether' | 'onyx' | 'studio'
export type ImageMode = 'none' | 'stock' | 'custom'
export type Badge = 'bestseller' | 'chef_special' | 'new' | 'spicy'
export type StaffRole = 'owner' | 'manager' | 'staff'

export interface Business {
  id: string; slug: string; name: string; tagline: string | null
  tier: Tier; theme: Theme; theme_color: string; is_active: boolean
  logo_r2_key: string | null; cover_r2_key: string | null
  opening_hours: Record<string, { open: string; close: string; closed: boolean }>
  social_links: { instagram?: string; swiggy?: string; zomato?: string; google_maps?: string }
  firebase_measurement_id: string | null
  seo_title: string | null; seo_description: string | null
}

export interface Item {
  id: string; business_id: string; category_id: string | null
  name: string; description: string | null
  price: number; compare_price: number | null
  image_mode: ImageMode; stock_image_key: string | null
  custom_r2_key: string | null; custom_thumb_key: string | null
  is_veg: boolean; is_vegan: boolean; is_jain: boolean; is_gluten_free: boolean
  allergens: string[]; badge: Badge | null
  is_available: boolean; is_featured: boolean
  sort_order: number; view_count: number
}

// Helper — derive full CDN URL from R2 key
export const cdnUrl = (key: string | null) =>
  key ? `${process.env.NEXT_PUBLIC_CDN_URL}/${key}` : null
```

---

## Connections

```
Supabase DB (PostgreSQL 15):
  Direct:    postgresql://...@db.{project}.supabase.co:5432/{db}    ← migrations only
  Pooler:    postgresql://...@aws-0-{region}.pooler.supabase.com:6543/{db}  ← app queries

NEXT_PUBLIC_SUPABASE_URL = https://{project}.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY = eyJhbG...   ← safe to expose (RLS protects data)
SUPABASE_SERVICE_ROLE_KEY = eyJhbG...        ← server-side only
```

---

## File Storage (Cloudflare R2)

| Bucket | Access | Purpose |
|--------|--------|---------|
| `menuos-prod` | Public (via custom CDN domain) | All images — stock + client uploads |

Custom domain: `cdn.yourdomain.in` → CNAME → R2 public bucket URL.

R2 keys follow the convention: `/stock/{category}/{name}.webp` and `/clients/{slug}/{type}/{...}.webp`.

`sharp` processes all client uploads: max 1200px width, WebP 80% quality (full), 320px WebP 70% (thumb).
Sharp runs in the Next.js API route — server-side only, never client.
