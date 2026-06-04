-- ════════════════════════════════════════════════════════════════════
-- MenuOS schema patch — run ONCE in the Supabase SQL editor.
-- This adds the columns MenuOS needs alongside the existing menuos
-- columns (nothing is removed, so both apps keep working).
-- ════════════════════════════════════════════════════════════════════

-- ── businesses: add missing MenuOS columns ───────────────────────────
ALTER TABLE businesses ADD COLUMN IF NOT EXISTS theme          text DEFAULT 'mercado';
ALTER TABLE businesses ADD COLUMN IF NOT EXISTS logo_r2_key    text;
ALTER TABLE businesses ADD COLUMN IF NOT EXISTS cover_r2_key   text;
ALTER TABLE businesses ADD COLUMN IF NOT EXISTS firebase_measurement_id text;
ALTER TABLE businesses ADD COLUMN IF NOT EXISTS seo_og_r2_key  text;
ALTER TABLE businesses ADD COLUMN IF NOT EXISTS seo_title       text;
ALTER TABLE businesses ADD COLUMN IF NOT EXISTS seo_description text;

-- Copy theme_preset → theme (so existing data shows up correctly)
UPDATE businesses SET theme = theme_preset WHERE theme IS NULL AND theme_preset IS NOT NULL;
UPDATE businesses SET theme = 'mercado'   WHERE theme IS NULL;

-- ── items: add MenuOS image columns ────────────────────────────────
ALTER TABLE items ADD COLUMN IF NOT EXISTS image_mode       text DEFAULT 'none' CHECK (image_mode IN ('none','stock','custom'));
ALTER TABLE items ADD COLUMN IF NOT EXISTS stock_image_key  text;
ALTER TABLE items ADD COLUMN IF NOT EXISTS custom_r2_key    text;
ALTER TABLE items ADD COLUMN IF NOT EXISTS custom_thumb_key text;

-- Mark existing items that have images as custom mode
UPDATE items SET image_mode = 'custom' WHERE image_mode IS NULL AND images IS NOT NULL AND images != '{}';
UPDATE items SET image_mode = 'none'   WHERE image_mode IS NULL;

-- ── categories: add icon column ──────────────────────────────────────
ALTER TABLE categories ADD COLUMN IF NOT EXISTS icon text;

-- ── stock_images: create table if missing ────────────────────────────
CREATE TABLE IF NOT EXISTS stock_images (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  r2_key      text UNIQUE NOT NULL,
  category    text NOT NULL,
  name        text NOT NULL,
  tags        text[] DEFAULT '{}',
  is_active   boolean DEFAULT true,
  sort_order  integer DEFAULT 0
);

ALTER TABLE stock_images ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename='stock_images' AND policyname='stock_public_read'
  ) THEN
    CREATE POLICY "stock_public_read" ON stock_images
      FOR SELECT TO anon, authenticated USING (is_active = true);
  END IF;
END $$;
