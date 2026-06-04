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
