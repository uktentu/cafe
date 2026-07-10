-- ════════════════════════════════════════════════════════════════════
-- Migration 013 — Owner modules: Expenses, Customer CRM + loyalty, Day Close
-- Turns the POS from "take orders" into "run the business": money-out
-- tracking, a customer book that builds itself from settled bills, and an
-- end-of-day Z-report snapshot. Run AFTER 012_settle_rpc.sql.
-- ════════════════════════════════════════════════════════════════════

-- ─────────────────────────────────────────────────────────────────
-- EXPENSES — money out, for a real P&L (sales − expenses = profit)
-- ─────────────────────────────────────────────────────────────────
CREATE TABLE expenses (
  id                  uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id         uuid NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
  branch_id           uuid REFERENCES branches(id) ON DELETE SET NULL,
  category            text NOT NULL,           -- rent | salaries | supplies | utilities | maintenance | misc
  vendor              text,
  amount              numeric(10,2) NOT NULL CHECK (amount >= 0),
  note                text,
  spent_on            date NOT NULL DEFAULT current_date,
  created_by_staff_id uuid REFERENCES staff_accounts(id) ON DELETE SET NULL,
  created_at          timestamptz DEFAULT now()
);
CREATE INDEX idx_expenses_biz_date ON expenses(business_id, spent_on DESC);

-- ─────────────────────────────────────────────────────────────────
-- CUSTOMERS — the CRM book, upserted automatically when a bill settles.
-- ─────────────────────────────────────────────────────────────────
CREATE TABLE customers (
  id             uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id    uuid NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
  phone          text NOT NULL,
  name           text,
  visit_count    integer NOT NULL DEFAULT 0,
  total_spent    numeric(12,2) NOT NULL DEFAULT 0,
  loyalty_points integer NOT NULL DEFAULT 0,
  first_seen     timestamptz DEFAULT now(),
  last_seen      timestamptz DEFAULT now(),
  UNIQUE(business_id, phone)
);
CREATE INDEX idx_customers_biz_spent ON customers(business_id, total_spent DESC);

-- Link a settled order to the customer it belongs to.
ALTER TABLE orders ADD COLUMN IF NOT EXISTS customer_id uuid REFERENCES customers(id) ON DELETE SET NULL;

-- ─────────────────────────────────────────────────────────────────
-- DAY CLOSES — Z-report snapshots (one per business per date)
-- ─────────────────────────────────────────────────────────────────
CREATE TABLE day_closes (
  id                 uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id        uuid NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
  branch_id          uuid REFERENCES branches(id) ON DELETE SET NULL,
  close_date         date NOT NULL,
  opening_cash       numeric(10,2) DEFAULT 0,
  expected_cash      numeric(10,2) DEFAULT 0,   -- opening + cash sales
  counted_cash       numeric(10,2) DEFAULT 0,
  variance           numeric(10,2) DEFAULT 0,   -- counted − expected
  totals             jsonb,                     -- full report snapshot
  closed_by_staff_id uuid REFERENCES staff_accounts(id) ON DELETE SET NULL,
  closed_at          timestamptz DEFAULT now(),
  UNIQUE(business_id, close_date)
);
CREATE INDEX idx_day_closes_biz_date ON day_closes(business_id, close_date DESC);

-- ─────────────────────────────────────────────────────────────────
-- Loyalty/CRM: on settle, upsert the customer and award 1 point per ₹100.
-- Additive trigger — leaves settle_order() (012) untouched. The inner
-- UPDATE that links order→customer re-fires this trigger, but the status
-- isn't transitioning to 'settled' the second time, so the guard below
-- stops the recursion after exactly one pass.
-- ─────────────────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION award_customer_on_settle()
RETURNS TRIGGER AS $$
DECLARE
  v_cid uuid;
BEGIN
  IF NEW.status = 'settled' AND OLD.status IS DISTINCT FROM 'settled'
     AND NEW.customer_phone IS NOT NULL AND length(trim(NEW.customer_phone)) > 0 THEN
    INSERT INTO customers (business_id, phone, name, visit_count, total_spent, loyalty_points, first_seen, last_seen)
    VALUES (NEW.business_id, trim(NEW.customer_phone), NULLIF(trim(COALESCE(NEW.customer_name,'')),''),
            1, NEW.total_amount, floor(NEW.total_amount / 100), now(), now())
    ON CONFLICT (business_id, phone) DO UPDATE SET
      visit_count    = customers.visit_count + 1,
      total_spent    = customers.total_spent + EXCLUDED.total_spent,
      loyalty_points = customers.loyalty_points + EXCLUDED.loyalty_points,
      name           = COALESCE(EXCLUDED.name, customers.name),
      last_seen      = now()
    RETURNING id INTO v_cid;

    UPDATE orders SET customer_id = v_cid WHERE id = NEW.id AND customer_id IS DISTINCT FROM v_cid;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS trg_award_customer_on_settle ON orders;
CREATE TRIGGER trg_award_customer_on_settle
AFTER UPDATE ON orders
FOR EACH ROW
EXECUTE FUNCTION award_customer_on_settle();

-- ─────────────────────────────────────────────────────────────────
-- RLS — 007 idiom: staff read/write, admin-only delete.
-- ─────────────────────────────────────────────────────────────────
ALTER TABLE expenses    ENABLE ROW LEVEL SECURITY;
ALTER TABLE customers   ENABLE ROW LEVEL SECURITY;
ALTER TABLE day_closes  ENABLE ROW LEVEL SECURITY;

CREATE POLICY "expenses_staff_select" ON expenses FOR SELECT TO authenticated USING (is_staff_of(business_id));
CREATE POLICY "expenses_staff_insert" ON expenses FOR INSERT TO authenticated WITH CHECK (is_staff_of(business_id));
CREATE POLICY "expenses_staff_update" ON expenses FOR UPDATE TO authenticated USING (is_staff_of(business_id)) WITH CHECK (is_staff_of(business_id));
CREATE POLICY "expenses_admin_delete" ON expenses FOR DELETE TO authenticated USING (is_admin_of(business_id));

CREATE POLICY "customers_staff_select" ON customers FOR SELECT TO authenticated USING (is_staff_of(business_id));
CREATE POLICY "customers_staff_insert" ON customers FOR INSERT TO authenticated WITH CHECK (is_staff_of(business_id));
CREATE POLICY "customers_staff_update" ON customers FOR UPDATE TO authenticated USING (is_staff_of(business_id)) WITH CHECK (is_staff_of(business_id));
CREATE POLICY "customers_admin_delete" ON customers FOR DELETE TO authenticated USING (is_admin_of(business_id));

CREATE POLICY "day_closes_staff_select" ON day_closes FOR SELECT TO authenticated USING (is_staff_of(business_id));
CREATE POLICY "day_closes_staff_insert" ON day_closes FOR INSERT TO authenticated WITH CHECK (is_staff_of(business_id));
CREATE POLICY "day_closes_admin_delete" ON day_closes FOR DELETE TO authenticated USING (is_admin_of(business_id));
