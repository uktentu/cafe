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
