-- ════════════════════════════════════════════════════════════════════
-- Migration 002 — Row Level Security
-- Multi-tenant isolation: every policy checks business_id via is_staff_of().
-- Run AFTER 001_core.sql.
-- ════════════════════════════════════════════════════════════════════

-- Single helper function used by all staff-write policies.
CREATE OR REPLACE FUNCTION is_staff_of(bid uuid)
RETURNS boolean LANGUAGE sql SECURITY DEFINER AS $$
  SELECT EXISTS (
    SELECT 1 FROM staff_accounts
    WHERE business_id = bid
      AND user_id = auth.uid()
      AND is_active = true
  );
$$;

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
