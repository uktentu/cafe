-- 1. Add the new 'dietary' column
ALTER TABLE items ADD COLUMN IF NOT EXISTS dietary text DEFAULT 'none' CHECK (dietary IN ('none', 'veg', 'non-veg', 'egg', 'vegan'));

-- 2. Backfill existing data based on the old boolean columns
UPDATE items 
SET dietary = 'vegan' 
WHERE is_vegan = true;

UPDATE items 
SET dietary = 'veg' 
WHERE is_veg = true AND (is_vegan IS NULL OR is_vegan = false);

-- 3. (Optional) Once everything works perfectly, we could drop the old columns:
-- ALTER TABLE items DROP COLUMN is_veg, DROP COLUMN is_vegan;
-- But it's safer to leave them for now to avoid breaking any other unmigrated systems.
