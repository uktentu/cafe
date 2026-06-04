-- ════════════════════════════════════════════════════════════════════
-- Seed — Stock Image Library metadata
-- The .webp files themselves are uploaded to R2 by scripts/upload-stock.ts.
-- This table powers the CMS StockImagePicker (public read, anon).
-- Idempotent: re-running upserts on r2_key.
-- ════════════════════════════════════════════════════════════════════

INSERT INTO stock_images (r2_key, category, name, tags, sort_order) VALUES
  -- ── Indian ──────────────────────────────────────────────────────
  ('stock/indian/biryani.webp',           'indian',      'Biryani',          ARRAY['rice','biryani','north-indian','mughlai'], 1),
  ('stock/indian/butter-chicken.webp',    'indian',      'Butter Chicken',   ARRAY['curry','chicken','north-indian'], 2),
  ('stock/indian/dal-makhani.webp',       'indian',      'Dal Makhani',      ARRAY['dal','veg','north-indian'], 3),
  ('stock/indian/paneer-tikka.webp',      'indian',      'Paneer Tikka',     ARRAY['paneer','veg','starter'], 4),
  ('stock/indian/samosa.webp',            'indian',      'Samosa',           ARRAY['snack','veg','street'], 5),
  ('stock/indian/naan.webp',              'indian',      'Naan',             ARRAY['bread','veg'], 6),
  ('stock/indian/masala-dosa.webp',       'indian',      'Masala Dosa',      ARRAY['south-indian','veg','breakfast'], 7),
  ('stock/indian/chole-bhature.webp',     'indian',      'Chole Bhature',    ARRAY['veg','north-indian','street'], 8),
  ('stock/indian/tandoori-chicken.webp',  'indian',      'Tandoori Chicken', ARRAY['chicken','tandoor','starter'], 9),
  ('stock/indian/thali.webp',             'indian',      'Thali',            ARRAY['veg','combo','meal'], 10),

  -- ── Chinese ─────────────────────────────────────────────────────
  ('stock/chinese/hakka-noodles.webp',    'chinese',     'Hakka Noodles',    ARRAY['noodles','indo-chinese','veg'], 1),
  ('stock/chinese/manchurian.webp',       'chinese',     'Manchurian',       ARRAY['indo-chinese','veg','starter'], 2),
  ('stock/chinese/fried-rice.webp',       'chinese',     'Fried Rice',       ARRAY['rice','indo-chinese'], 3),
  ('stock/chinese/spring-roll.webp',      'chinese',     'Spring Roll',      ARRAY['starter','veg','crispy'], 4),
  ('stock/chinese/chilli-paneer.webp',    'chinese',     'Chilli Paneer',    ARRAY['paneer','veg','indo-chinese'], 5),

  -- ── Continental ─────────────────────────────────────────────────
  ('stock/continental/pasta.webp',        'continental', 'Pasta',            ARRAY['italian','veg','mains'], 1),
  ('stock/continental/pizza.webp',        'continental', 'Pizza',            ARRAY['italian','baked'], 2),
  ('stock/continental/burger.webp',       'continental', 'Burger',           ARRAY['fast-food','snack'], 3),
  ('stock/continental/sandwich.webp',     'continental', 'Sandwich',         ARRAY['snack','veg','grilled'], 4),
  ('stock/continental/salad.webp',        'continental', 'Garden Salad',     ARRAY['healthy','veg','cold'], 5),
  ('stock/continental/fries.webp',        'continental', 'French Fries',     ARRAY['snack','sides','fried'], 6),

  -- ── Drinks ──────────────────────────────────────────────────────
  ('stock/drinks/chai.webp',              'drinks',      'Chai',             ARRAY['hot','tea','indian'], 1),
  ('stock/drinks/coffee.webp',            'drinks',      'Coffee',           ARRAY['hot','coffee'], 2),
  ('stock/drinks/lassi.webp',             'drinks',      'Lassi',            ARRAY['cold','dairy','indian'], 3),
  ('stock/drinks/juice.webp',             'drinks',      'Fresh Juice',      ARRAY['cold','fruit','healthy'], 4),
  ('stock/drinks/cold-coffee.webp',       'drinks',      'Cold Coffee',      ARRAY['cold','coffee','dairy'], 5),
  ('stock/drinks/mojito.webp',            'drinks',      'Mojito',           ARRAY['cold','mocktail','mint'], 6),
  ('stock/drinks/masala-soda.webp',       'drinks',      'Masala Soda',      ARRAY['cold','fizzy','indian'], 7),

  -- ── Desserts ────────────────────────────────────────────────────
  ('stock/desserts/gulab-jamun.webp',     'desserts',    'Gulab Jamun',      ARRAY['sweet','indian','fried'], 1),
  ('stock/desserts/ice-cream.webp',       'desserts',    'Ice Cream',        ARRAY['cold','sweet'], 2),
  ('stock/desserts/brownie.webp',         'desserts',    'Brownie',          ARRAY['sweet','chocolate','baked'], 3),
  ('stock/desserts/rasmalai.webp',        'desserts',    'Rasmalai',         ARRAY['sweet','indian','dairy'], 4),

  -- ── Street ──────────────────────────────────────────────────────
  ('stock/street/pav-bhaji.webp',         'street',      'Pav Bhaji',        ARRAY['street','veg','mumbai'], 1),
  ('stock/street/vada-pav.webp',          'street',      'Vada Pav',         ARRAY['street','veg','mumbai'], 2),
  ('stock/street/pani-puri.webp',         'street',      'Pani Puri',        ARRAY['street','veg','chaat'], 3),
  ('stock/street/momos.webp',             'street',      'Momos',            ARRAY['street','steamed','snack'], 4),
  ('stock/street/kathi-roll.webp',        'street',      'Kathi Roll',       ARRAY['street','wrap','snack'], 5),

  -- ── Hero / ambience ─────────────────────────────────────────────
  ('stock/hero/restaurant-interior.webp', 'hero',        'Restaurant',       ARRAY['interior','ambience'], 1),
  ('stock/hero/cafe-interior.webp',       'hero',        'Cafe Interior',    ARRAY['cafe','light','interior'], 2),
  ('stock/hero/dark-lounge.webp',         'hero',        'Lounge',           ARRAY['dark','lounge','ambience'], 3),
  ('stock/hero/coastal-deck.webp',        'hero',        'Coastal Deck',     ARRAY['ocean','outdoor','ambience'], 4)
ON CONFLICT (r2_key) DO UPDATE
  SET category = EXCLUDED.category,
      name     = EXCLUDED.name,
      tags     = EXCLUDED.tags,
      sort_order = EXCLUDED.sort_order,
      is_active = true;
