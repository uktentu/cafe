-- ════════════════════════════════════════════════════════════════════
-- Migration 009 — POS roles, QR↔table linking, billing settings
-- Companion to 008_pos_core.sql. Run AFTER 008.
-- ════════════════════════════════════════════════════════════════════

-- Extend the staff role model for POS job titles. 'admin' already exists
-- in this constraint's predecessor role set as of 007_strict_rbac.sql's
-- is_admin_of() function, but was never added to the CHECK constraint
-- itself — closing that gap here alongside the new POS roles.
-- is_staff_of()/is_admin_of() need no changes: is_staff_of() only checks
-- row existence + is_active (any of these new roles count as staff),
-- and is_admin_of() already matches role IN ('owner','admin') which is
-- unaffected by adding waiter/kitchen/cashier.
ALTER TABLE staff_accounts DROP CONSTRAINT IF EXISTS staff_accounts_role_check;
ALTER TABLE staff_accounts ADD CONSTRAINT staff_accounts_role_check
  CHECK (role IN ('owner','admin','manager','staff','waiter','kitchen','cashier'));

-- QR ↔ table link — extends, does not replace, the existing table_number
-- label field. A QR's target_url can now resolve to a specific tables.code
-- so a scan lands the customer directly in ordering context for that table.
ALTER TABLE qr_codes ADD COLUMN IF NOT EXISTS table_id uuid REFERENCES tables(id) ON DELETE SET NULL;

-- Billing settings — typed columns, since this is financial config read by
-- the order-totals RPC, not a loosely-typed display toggle like social_links.
ALTER TABLE businesses ADD COLUMN IF NOT EXISTS tax_percent numeric(5,2) DEFAULT 5.00;
ALTER TABLE businesses ADD COLUMN IF NOT EXISTS pos_settings jsonb DEFAULT '{}'::jsonb;
-- pos_settings shape (all optional, filled in via CMS Settings in a later phase):
-- { "receipt_footer": text, "default_discount_reasons": string[] }
