-- ════════════════════════════════════════════════════════════════════
-- Seed — Demo business (slug: demo-cafe) with categories + items.
-- Matches NEXT_PUBLIC_CLIENT_SLUG=demo-cafe in .env.local.
-- Idempotent: deletes + re-creates the demo business each run (cascades).
-- Run AFTER 001_core.sql, 002_rls.sql, and seed/stock-images.sql.
-- ════════════════════════════════════════════════════════════════════

DELETE FROM businesses WHERE slug = 'demo-cafe';

DO $$
DECLARE
  biz     uuid;
  cat_str uuid;  -- Starters
  cat_mn  uuid;  -- Mains
  cat_drk uuid;  -- Drinks
BEGIN
  -- Business ---------------------------------------------------------
  INSERT INTO businesses (slug, name, tagline, city, phone, whatsapp, email, tier, theme, theme_color)
  VALUES ('demo-cafe', 'Demo Cafe', 'Good food, good vibes.', 'Bengaluru',
          '+91-98765-43210', '919876543210', 'owner@democafe.in', 'basic', 'mercado', '#E5292A')
  RETURNING id INTO biz;

  -- Categories -------------------------------------------------------
  INSERT INTO categories (business_id, name, icon, sort_order)
  VALUES (biz, 'Starters', 'Soup', 1) RETURNING id INTO cat_str;
  INSERT INTO categories (business_id, name, icon, sort_order)
  VALUES (biz, 'Mains', 'UtensilsCrossed', 2) RETURNING id INTO cat_mn;
  INSERT INTO categories (business_id, name, icon, sort_order)
  VALUES (biz, 'Drinks', 'CupSoda', 3) RETURNING id INTO cat_drk;

  -- Items: mix of all three image modes -----------------------------
  -- Starters
  INSERT INTO items (business_id, category_id, name, description, price, image_mode, stock_image_key, is_veg, badge, is_featured, sort_order) VALUES
    (biz, cat_str, 'Paneer Tikka',     'Char-grilled cottage cheese, mint chutney.',       220.00, 'stock', 'stock/indian/paneer-tikka.webp', true,  'bestseller',   true,  1),
    (biz, cat_str, 'Samosa (2 pcs)',   'Crisp pastry, spiced potato filling.',              60.00, 'stock', 'stock/indian/samosa.webp',       true,  NULL,           false, 2),
    (biz, cat_str, 'Chilli Paneer',    'Indo-Chinese, sweet & spicy.',                     210.00, 'stock', 'stock/chinese/chilli-paneer.webp', true, 'spicy',        false, 3),
    (biz, cat_str, 'Garlic Bread',     'Toasted, herb butter.',                            120.00, 'none',  NULL,                             true,  NULL,           false, 4);

  -- Mains
  INSERT INTO items (business_id, category_id, name, description, price, compare_price, image_mode, stock_image_key, is_veg, badge, is_featured, sort_order) VALUES
    (biz, cat_mn, 'Chicken Biryani',   'Dum-cooked basmati, tender chicken, raita.',       280.00, 320.00, 'stock', 'stock/indian/biryani.webp',        false, 'bestseller',  true,  1),
    (biz, cat_mn, 'Dal Makhani',       'Slow-cooked black lentils, cream.',                190.00, NULL,    'stock', 'stock/indian/dal-makhani.webp',    true,  'chef_special', false, 2),
    (biz, cat_mn, 'Butter Chicken',    'Tomato-butter gravy, charred chicken.',            290.00, NULL,    'stock', 'stock/indian/butter-chicken.webp', false, NULL,          false, 3),
    (biz, cat_mn, 'Veg Hakka Noodles', 'Wok-tossed noodles, crunchy veg.',                 170.00, NULL,    'stock', 'stock/chinese/hakka-noodles.webp', true,  NULL,          false, 4),
    (biz, cat_mn, 'Margherita Pizza',  '8-inch, San Marzano, fresh basil.',                240.00, NULL,    'none',  NULL,                              true,  'new',         false, 5);

  -- Drinks
  INSERT INTO items (business_id, category_id, name, description, price, image_mode, stock_image_key, is_veg, sort_order) VALUES
    (biz, cat_drk, 'Masala Chai',      'Cutting chai, ginger & cardamom.',   40.00,  'stock', 'stock/drinks/chai.webp',        true, 1),
    (biz, cat_drk, 'Cold Coffee',      'Blended, thick, chocolate drizzle.', 130.00, 'stock', 'stock/drinks/cold-coffee.webp', true, 2),
    (biz, cat_drk, 'Sweet Lassi',      'Whisked yogurt, house special.',      90.00, 'none',  NULL,                            true, 3);
END $$;
