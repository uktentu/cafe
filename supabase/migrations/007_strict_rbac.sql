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

-- UPDATE: Admins can update anything. Regular staff can update if they don't change the price.
CREATE POLICY "item_staff_update" ON items FOR UPDATE TO authenticated 
USING (is_staff_of(business_id))
WITH CHECK (
  is_admin_of(business_id) 
  OR 
  (is_staff_of(business_id) AND price = OLD.price)
);

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

