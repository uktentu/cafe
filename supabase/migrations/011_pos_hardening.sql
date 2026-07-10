-- ════════════════════════════════════════════════════════════════════
-- Migration 011 — POS hardening
-- 1) Tamper-proof QR ordering: the QR now carries a random uuid token,
--    not the guessable table code. Editing ?t= to another table requires
--    guessing a uuid — infeasible. The token is also hidden from the
--    anonymous REST surface via column-level privileges, so it can't be
--    listed with the public anon key either.
-- 2) Cancel-safe money: cancelling an order line now recomputes the
--    parent order's totals automatically (previously the bill kept
--    charging for cancelled lines).
-- 3) Cancelling a whole order frees its table.
-- Run AFTER 010_pos_billing.sql.
-- ════════════════════════════════════════════════════════════════════

-- ─────────────────────────────────────────────────────────────────
-- 1) Unguessable per-table QR token
-- ─────────────────────────────────────────────────────────────────
ALTER TABLE tables ADD COLUMN IF NOT EXISTS qr_token uuid NOT NULL DEFAULT gen_random_uuid();
CREATE UNIQUE INDEX IF NOT EXISTS idx_tables_qr_token ON tables(qr_token);

-- Hide the token from the anonymous role entirely. RLS says which ROWS
-- anon may read (tables_pub_read); column privileges say which COLUMNS.
-- Postgres has no "revoke one column" — revoke the table grant, then
-- grant back everything except qr_token. Server-side code resolves a
-- scanned token with the service-role client, which is unaffected.
REVOKE SELECT ON tables FROM anon;
GRANT SELECT (id, business_id, branch_id, label, code, capacity, zone, status, is_active, sort_order, created_at, updated_at)
  ON tables TO anon;

-- ─────────────────────────────────────────────────────────────────
-- 2) Recompute order totals whenever a line's status changes.
-- Settled/cancelled orders are immutable bills — never touched.
-- No recursion: this updates orders, not order_items.
-- ─────────────────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION recompute_order_totals()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.status IS DISTINCT FROM OLD.status THEN
    UPDATE orders SET
      subtotal = (SELECT COALESCE(SUM(line_total), 0) FROM order_items WHERE order_id = NEW.order_id AND status <> 'cancelled'),
      updated_at = now()
    WHERE id = NEW.order_id AND status NOT IN ('settled','cancelled');

    UPDATE orders SET total_amount = subtotal + tax_amount - discount_amount
    WHERE id = NEW.order_id AND status NOT IN ('settled','cancelled');
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS trg_recompute_totals_on_line_change ON order_items;
CREATE TRIGGER trg_recompute_totals_on_line_change
AFTER UPDATE ON order_items
FOR EACH ROW
EXECUTE FUNCTION recompute_order_totals();

-- ─────────────────────────────────────────────────────────────────
-- 3) sync_table_status — full redefinition (replaces 008's version):
-- now also frees the table when an order is cancelled, provided no
-- other open order is still sitting on it.
-- ─────────────────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION sync_table_status()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.table_id IS NOT NULL THEN
    IF NEW.status = 'settled' THEN
      UPDATE tables SET status = 'needs_cleaning', updated_at = now() WHERE id = NEW.table_id;
    ELSIF NEW.status = 'cancelled' THEN
      UPDATE tables SET status = 'available', updated_at = now()
      WHERE id = NEW.table_id
        AND NOT EXISTS (
          SELECT 1 FROM orders
          WHERE table_id = NEW.table_id AND id <> NEW.id AND status NOT IN ('settled','cancelled')
        );
    ELSIF TG_OP = 'INSERT' OR OLD.status IS DISTINCT FROM NEW.status THEN
      UPDATE tables SET status = 'occupied', updated_at = now() WHERE id = NEW.table_id AND status = 'available';
    END IF;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
