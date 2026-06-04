-- ════════════════════════════════════════════════════════════════════
-- MenuOS — COMPLETE SETUP (paste entirely into Supabase SQL editor)
-- Run once. Safe to re-run (uses IF NOT EXISTS / ON CONFLICT).
-- ════════════════════════════════════════════════════════════════════

-- ── 1. Extensions ────────────────────────────────────────────────────
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ── 2. Core tables ───────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS businesses (
  id               uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  slug             text UNIQUE NOT NULL,
  name             text NOT NULL,
  tagline          text,
  address          text,
  city             text,
  phone            text,
  whatsapp         text,
  email            text,
  logo_r2_key      text,
  cover_r2_key     text,
  tier             text NOT NULL DEFAULT 'basic' CHECK (tier IN ('basic','advanced','premium')),
  theme            text NOT NULL DEFAULT 'mercado',
  theme_color      text DEFAULT '#F59E0B',
  is_active        boolean DEFAULT true,
  opening_hours    jsonb DEFAULT '{"mon":{"open":"09:00","close":"22:00","closed":false},"tue":{"open":"09:00","close":"22:00","closed":false},"wed":{"open":"09:00","close":"22:00","closed":false},"thu":{"open":"09:00","close":"22:00","closed":false},"fri":{"open":"09:00","close":"22:00","closed":false},"sat":{"open":"09:00","close":"23:00","closed":false},"sun":{"open":"10:00","close":"22:00","closed":false}}'::jsonb,
  social_links     jsonb DEFAULT '{"instagram":null,"swiggy":null,"zomato":null,"google_maps":null}'::jsonb,
  seo_title        text,
  seo_description  text,
  seo_og_r2_key    text,
  firebase_measurement_id text,
  created_at       timestamptz DEFAULT now(),
  updated_at       timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS categories (
  id           uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id  uuid NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
  menu_id      uuid,
  name         text NOT NULL,
  description  text,
  icon         text,
  sort_order   integer DEFAULT 0,
  is_active    boolean DEFAULT true,
  created_at   timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_cat_business ON categories(business_id, sort_order);

CREATE TABLE IF NOT EXISTS items (
  id               uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id      uuid NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
  category_id      uuid REFERENCES categories(id) ON DELETE SET NULL,
  name             text NOT NULL,
  description      text,
  price            numeric(10,2) NOT NULL,
  compare_price    numeric(10,2),
  image_mode       text DEFAULT 'none' CHECK (image_mode IN ('none','stock','custom')),
  stock_image_key  text,
  custom_r2_key    text,
  custom_thumb_key text,
  dietary          text DEFAULT 'none' CHECK (dietary IN ('none','veg','non-veg','egg','vegan')),
  is_veg           boolean DEFAULT true,
  is_vegan         boolean DEFAULT false,
  is_jain          boolean DEFAULT false,
  is_gluten_free   boolean DEFAULT false,
  allergens        text[] DEFAULT '{}',
  badge            text CHECK (badge IN ('bestseller','chef_special','new','spicy',NULL)),
  is_available     boolean DEFAULT true,
  is_featured      boolean DEFAULT false,
  sort_order       integer DEFAULT 0,
  view_count       integer DEFAULT 0,
  created_at       timestamptz DEFAULT now(),
  updated_at       timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_items_biz_sort  ON items(business_id, sort_order);
CREATE INDEX IF NOT EXISTS idx_items_biz_avail ON items(business_id, is_available);
CREATE INDEX IF NOT EXISTS idx_items_biz_cat   ON items(business_id, category_id);
CREATE INDEX IF NOT EXISTS idx_items_biz_feat  ON items(business_id, is_featured) WHERE is_featured = true;

CREATE TABLE IF NOT EXISTS stock_images (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  r2_key      text UNIQUE NOT NULL,
  category    text NOT NULL,
  name        text NOT NULL,
  tags        text[] DEFAULT '{}',
  is_active   boolean DEFAULT true,
  sort_order  integer DEFAULT 0
);

CREATE TABLE IF NOT EXISTS qr_codes (
  id           uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id  uuid NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
  label        text NOT NULL DEFAULT 'Main',
  target_url   text NOT NULL,
  is_dynamic   boolean DEFAULT false,
  qr_color     text DEFAULT '#000000',
  qr_bg_color  text DEFAULT '#FFFFFF',
  include_logo boolean DEFAULT true,
  branch_id    uuid,
  table_number text,
  downloads    integer DEFAULT 0,
  created_at   timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS staff_accounts (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id uuid NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
  user_id     uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role        text NOT NULL DEFAULT 'owner' CHECK (role IN ('owner','manager','staff')),
  name        text,
  is_active   boolean DEFAULT true,
  created_at  timestamptz DEFAULT now(),
  UNIQUE(business_id, user_id)
);

CREATE TABLE IF NOT EXISTS analytics_events (
  id           uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id  uuid NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
  event_type   text NOT NULL,
  item_id      uuid REFERENCES items(id) ON DELETE SET NULL,
  session_id   text,
  created_at   timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_events_biz_type ON analytics_events(business_id, event_type, created_at DESC);

-- ── 3. RLS ───────────────────────────────────────────────────────────

CREATE OR REPLACE FUNCTION is_staff_of(bid uuid)
RETURNS boolean LANGUAGE sql SECURITY DEFINER AS $$
  SELECT EXISTS (
    SELECT 1 FROM staff_accounts
    WHERE business_id = bid AND user_id = auth.uid() AND is_active = true
  );
$$;

ALTER TABLE businesses       ENABLE ROW LEVEL SECURITY;
ALTER TABLE categories       ENABLE ROW LEVEL SECURITY;
ALTER TABLE items            ENABLE ROW LEVEL SECURITY;
ALTER TABLE stock_images     ENABLE ROW LEVEL SECURITY;
ALTER TABLE qr_codes         ENABLE ROW LEVEL SECURITY;
ALTER TABLE staff_accounts   ENABLE ROW LEVEL SECURITY;
ALTER TABLE analytics_events ENABLE ROW LEVEL SECURITY;

-- Drop old policies if re-running
DO $$ BEGIN
  DROP POLICY IF EXISTS "stock_public_read" ON stock_images;
  DROP POLICY IF EXISTS "biz_pub_read"      ON businesses;
  DROP POLICY IF EXISTS "cat_pub_read"      ON categories;
  DROP POLICY IF EXISTS "item_pub_read"     ON items;
  DROP POLICY IF EXISTS "events_pub_insert" ON analytics_events;
  DROP POLICY IF EXISTS "biz_staff_update"  ON businesses;
  DROP POLICY IF EXISTS "cat_staff_all"     ON categories;
  DROP POLICY IF EXISTS "item_staff_all"    ON items;
  DROP POLICY IF EXISTS "qr_staff_all"      ON qr_codes;
  DROP POLICY IF EXISTS "events_staff_read" ON analytics_events;
  DROP POLICY IF EXISTS "staff_owner_manage" ON staff_accounts;
  DROP POLICY IF EXISTS "staff_self_read"   ON staff_accounts;
END $$;

CREATE POLICY "stock_public_read"  ON stock_images     FOR SELECT TO anon, authenticated USING (is_active = true);
CREATE POLICY "biz_pub_read"       ON businesses       FOR SELECT TO anon USING (is_active = true);
CREATE POLICY "cat_pub_read"       ON categories       FOR SELECT TO anon USING (is_active = true);
CREATE POLICY "item_pub_read"      ON items            FOR SELECT TO anon USING (true);
CREATE POLICY "events_pub_insert"  ON analytics_events FOR INSERT TO anon WITH CHECK (true);
CREATE POLICY "biz_staff_update"   ON businesses       FOR UPDATE TO authenticated USING (is_staff_of(id));
CREATE POLICY "cat_staff_all"      ON categories       FOR ALL    TO authenticated USING (is_staff_of(business_id)) WITH CHECK (is_staff_of(business_id));
CREATE POLICY "item_staff_all"     ON items            FOR ALL    TO authenticated USING (is_staff_of(business_id)) WITH CHECK (is_staff_of(business_id));
CREATE POLICY "qr_staff_all"       ON qr_codes         FOR ALL    TO authenticated USING (is_staff_of(business_id)) WITH CHECK (is_staff_of(business_id));
CREATE POLICY "events_staff_read"  ON analytics_events FOR SELECT TO authenticated USING (is_staff_of(business_id));
CREATE POLICY "staff_owner_manage" ON staff_accounts   FOR ALL    TO authenticated
  USING (EXISTS (SELECT 1 FROM staff_accounts sa WHERE sa.business_id = staff_accounts.business_id AND sa.user_id = auth.uid() AND sa.role = 'owner'));
CREATE POLICY "staff_self_read"    ON staff_accounts   FOR SELECT TO authenticated USING (user_id = auth.uid());

-- ── 4. Demo business + categories + items ───────────────────────────
-- Upsert so re-running is safe.

INSERT INTO businesses (
  slug, name, tagline, address, city, phone, whatsapp, email,
  tier, theme, theme_color, is_active,
  opening_hours, social_links
) VALUES (
  'demo-cafe',
  'The Grand Spice',
  'Where every bite tells a story.',
  '12, MG Road', 'Bengaluru',
  '+91-98765-43210', '919876543210', 'owner@democafe.in',
  'advanced', 'bazaar', '#F5A623', true,
  '{"mon":{"open":"11:00","close":"23:00","closed":false},"tue":{"open":"11:00","close":"23:00","closed":false},"wed":{"open":"11:00","close":"23:00","closed":false},"thu":{"open":"11:00","close":"23:00","closed":false},"fri":{"open":"11:00","close":"23:30","closed":false},"sat":{"open":"10:00","close":"23:30","closed":false},"sun":{"open":"10:00","close":"22:00","closed":false}}'::jsonb,
  '{"instagram":"grandspice_blr","swiggy":null,"zomato":null,"google_maps":null}'::jsonb
) ON CONFLICT (slug) DO UPDATE SET
  name = EXCLUDED.name, tagline = EXCLUDED.tagline, tier = EXCLUDED.tier,
  theme = EXCLUDED.theme, theme_color = EXCLUDED.theme_color, updated_at = now();

-- Categories (delete old ones for demo-cafe to avoid duplicates on re-run)
DELETE FROM categories WHERE business_id = (SELECT id FROM businesses WHERE slug = 'demo-cafe');

INSERT INTO categories (business_id, name, description, icon, sort_order) VALUES
  ((SELECT id FROM businesses WHERE slug='demo-cafe'), 'Starters',       'Small plates to begin your journey',   'Soup',           1),
  ((SELECT id FROM businesses WHERE slug='demo-cafe'), 'Mains',          'Hearty dishes from our tandoor & wok', 'UtensilsCrossed', 2),
  ((SELECT id FROM businesses WHERE slug='demo-cafe'), 'Breads & Rice',  'Fresh from the tandoor',               'Wheat',          3),
  ((SELECT id FROM businesses WHERE slug='demo-cafe'), 'Desserts',       'Sweet endings',                         'IceCream',       4),
  ((SELECT id FROM businesses WHERE slug='demo-cafe'), 'Drinks',         'Refreshing beverages & lassis',         'CupSoda',        5);

-- Items (delete old ones for demo-cafe to avoid duplicates)
DELETE FROM items WHERE business_id = (SELECT id FROM businesses WHERE slug = 'demo-cafe');

-- Helper: reference category ids
DO $$
DECLARE
  bid uuid := (SELECT id FROM businesses WHERE slug = 'demo-cafe');
  cat1 uuid := (SELECT id FROM categories WHERE business_id = bid AND name = 'Starters');
  cat2 uuid := (SELECT id FROM categories WHERE business_id = bid AND name = 'Mains');
  cat3 uuid := (SELECT id FROM categories WHERE business_id = bid AND name = 'Breads & Rice');
  cat4 uuid := (SELECT id FROM categories WHERE business_id = bid AND name = 'Desserts');
  cat5 uuid := (SELECT id FROM categories WHERE business_id = bid AND name = 'Drinks');
BEGIN

INSERT INTO items (business_id, category_id, name, description, price, compare_price, dietary, badge, is_featured, image_mode, sort_order) VALUES
-- Starters
(bid, cat1, 'Paneer Tikka',       'Char-grilled cottage cheese marinated in hung curd & spices, served with mint chutney.',    320, 380, 'veg',     'bestseller',  true,  'none', 1),
(bid, cat1, 'Samosa (2 pcs)',     'Crisp pastry shells filled with spiced potato & peas. Tamarind chutney.',                   80,  null,'veg',     null,          false, 'none', 2),
(bid, cat1, 'Chilli Paneer',      'Indo-Chinese tossed in a sweet, sour & fiery sauce with bell peppers.',                     290, null,'veg',     'spicy',       false, 'none', 3),
(bid, cat1, 'Chicken Seekh Kebab','Minced chicken with herbs & aromatics, grilled on skewers in the tandoor.',                 380, null,'non-veg', 'chef_special', true, 'none', 4),
(bid, cat1, 'Crispy Corn Chaat',  'Flash-fried sweet corn tossed with spices, onion, and tangy masala.',                       190, null,'veg',     'new',         false, 'none', 5),
(bid, cat1, 'Veg Spring Rolls',   'Crispy golden rolls stuffed with spiced vegetables, sweet chilli sauce.',                   160, null,'vegan',   null,          false, 'none', 6),
(bid, cat1, 'Egg Bhurji Pav',     'Street-style scrambled eggs with onion, tomato & chilli. Served with buttered pav.',       140, null,'egg',     null,          false, 'none', 7),

-- Mains
(bid, cat2, 'Chicken Biryani',    'Dum-cooked basmati rice with tender chicken, whole spices & caramelised onions. Raita.',   380, 440, 'non-veg', 'bestseller',  true,  'none', 1),
(bid, cat2, 'Dal Makhani',        'Slow-cooked black lentils simmered overnight with butter & cream. Signature dish.',         250, null,'veg',     'chef_special', false,'none', 2),
(bid, cat2, 'Butter Chicken',     'Charred chicken in a velvety tomato-cream sauce. Mild, aromatic & buttery.',                390, null,'non-veg', null,          false, 'none', 3),
(bid, cat2, 'Palak Paneer',       'Fresh cottage cheese in a vibrant spinach gravy with a hint of cream.',                     280, null,'veg',     null,          false, 'none', 4),
(bid, cat2, 'Veg Hakka Noodles',  'Wok-tossed noodles with crunchy vegetables in a light soy glaze.',                         220, null,'vegan',   null,          false, 'none', 5),
(bid, cat2, 'Mutton Rogan Josh',  'Slow-braised Kashmiri lamb in aromatic spices. Rich, bold & deeply satisfying.',            480, null,'non-veg', 'chef_special', true, 'none', 6),
(bid, cat2, 'Chole Bhature',      'Spiced chickpea curry served with fluffy deep-fried bhature.',                              180, null,'veg',     null,          false, 'none', 7),
(bid, cat2, 'Vegan Tofu Curry',   'Silken tofu in a coconut-tomato gravy with fresh curry leaves. 100% plant-based.',          310, null,'vegan',   'new',         false, 'none', 8),
(bid, cat2, 'Egg Curry',          'Boiled eggs in a spiced onion-tomato masala. Homestyle and comforting.',                    210, null,'egg',     null,          false, 'none', 9),

-- Breads & Rice
(bid, cat3, 'Butter Naan',        'Soft leavened bread slathered in butter, baked fresh in the tandoor.',                      60,  null,'veg',     null,          false, 'none', 1),
(bid, cat3, 'Garlic Naan',        'Tandoor-baked naan finished with roasted garlic butter and fresh coriander.',               80,  null,'veg',     'bestseller',  false, 'none', 2),
(bid, cat3, 'Laccha Paratha',     'Layered whole-wheat bread with a flaky, crispy texture.',                                    70,  null,'veg',     null,          false, 'none', 3),
(bid, cat3, 'Jeera Rice',         'Basmati rice tempered with cumin seeds and green cardamom.',                                120, null,'vegan',   null,          false, 'none', 4),
(bid, cat3, 'Cheese Stuffed Kulcha','Soft bread stuffed with melted cheese and mild spices, cooked in the tandoor.',           130, null,'veg',     'new',         false, 'none', 5),

-- Desserts
(bid, cat4, 'Gulab Jamun',        'Soft milk-solid dumplings soaked in rose-scented sugar syrup. Served warm.',                90,  110, 'veg',     'bestseller',  false, 'none', 1),
(bid, cat4, 'Kulfi Falooda',      'Traditional dense ice cream with vermicelli, rose syrup & basil seeds.',                   160, null,'veg',     null,          true,  'none', 2),
(bid, cat4, 'Chocolate Brownie',  'Warm fudgy brownie with a scoop of vanilla ice cream and chocolate sauce.',                 180, null,'egg',     null,          false, 'none', 3),
(bid, cat4, 'Vegan Mango Sorbet', 'Pure Alphonso mango sorbet with a touch of chilli salt. Dairy-free.',                      140, null,'vegan',   'new',         false, 'none', 4),
(bid, cat4, 'Rasmalai',           'Soft cottage cheese patties soaked in saffron-flavoured thickened milk.',                   130, null,'veg',     null,          false, 'none', 5),

-- Drinks
(bid, cat5, 'Masala Chai',        'Cutting chai with ginger, cardamom & our secret masala blend.',                             50,  null,'veg',     null,          false, 'none', 1),
(bid, cat5, 'Mango Lassi',        'Thick blended yogurt with Alphonso mango pulp. Chilled & refreshing.',                     120, null,'veg',     'bestseller',  true,  'none', 2),
(bid, cat5, 'Cold Coffee',        'Blended iced coffee with cream and a chocolate drizzle.',                                   150, null,'veg',     null,          false, 'none', 3),
(bid, cat5, 'Virgin Mojito',      'Muddled mint, lime juice, soda water & a hint of sugar. Alcohol-free.',                    130, null,'vegan',   null,          false, 'none', 4),
(bid, cat5, 'Rose Sharbat',       'Chilled rose-flavoured drink with basil seeds. Old Delhi Irani-cafe classic.',              90,  null,'vegan',   null,          false, 'none', 5),
(bid, cat5, 'Fresh Lime Soda',    'Freshly squeezed lime with soda — sweet, salted, or mixed.',                                70,  null,'vegan',   null,          false, 'none', 6);

-- Mark one item as sold out for testing
UPDATE items SET is_available = false
WHERE business_id = bid AND name IN ('Chole Bhature', 'Rasmalai');

END $$;

-- ── 5. Staff account ─────────────────────────────────────────────────
-- IMPORTANT: You must first create the auth user in Supabase Dashboard →
--   Authentication → Users → "Add user" with:
--   Email: owner@democafe.in   Password: MenuOS#2024
-- Then run this block (it links the auth user to the business).

-- After creating the user, run:
INSERT INTO staff_accounts (business_id, user_id, role, name, is_active)
SELECT
  b.id,
  u.id,
  'owner',
  'Demo Owner',
  true
FROM businesses b, auth.users u
WHERE b.slug = 'demo-cafe'
  AND u.email = 'owner@democafe.in'
ON CONFLICT (business_id, user_id) DO NOTHING;

-- ════════════════════════════════════════════════════════════════════
-- Done. Visit http://localhost:3000 to see the menu.
-- Visit http://localhost:3000/cms/login to log into the CMS.
-- ════════════════════════════════════════════════════════════════════
