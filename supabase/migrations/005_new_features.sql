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
