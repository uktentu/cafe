-- ════════════════════════════════════════════════════════════════════
-- Migration 008 — POS Core (tables, orders, order_items, KOT audit trail)
-- Orthogonal add-on module, gated by features.posEnabled (NEXT_PUBLIC_POS_ENABLED),
-- independent of tier. Run AFTER 007_strict_rbac.sql.
-- ════════════════════════════════════════════════════════════════════

-- ─────────────────────────────────────────────────────────────────
-- TABLE: tables — real floor entity. Replaces qr_codes.table_number
-- as the operational source of truth (that field remains as a label).
-- ─────────────────────────────────────────────────────────────────
CREATE TABLE tables (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id   uuid NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
  branch_id     uuid REFERENCES branches(id) ON DELETE SET NULL,

  label         text NOT NULL,          -- 'Table 5', 'Patio 2'
  code          text NOT NULL,          -- short public code embedded in the QR target_url, e.g. 't5'
  capacity      integer DEFAULT 4,
  zone          text,                   -- free-text grouping for the floor view: 'Indoor' | 'Patio' | 'Rooftop'

  status        text NOT NULL DEFAULT 'available'
                CHECK (status IN ('available','occupied','needs_cleaning','reserved')),

  is_active     boolean DEFAULT true,
  sort_order    integer DEFAULT 0,
  created_at    timestamptz DEFAULT now(),
  updated_at    timestamptz DEFAULT now(),
  UNIQUE(business_id, code)
);
CREATE INDEX idx_tables_biz ON tables(business_id, sort_order);

-- ─────────────────────────────────────────────────────────────────
-- TABLE: orders — one row per continuous dine-in "tab", or one row
-- per takeaway/counter transaction.
-- ─────────────────────────────────────────────────────────────────
CREATE TABLE orders (
  id                  uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id         uuid NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
  branch_id           uuid REFERENCES branches(id) ON DELETE SET NULL,
  table_id            uuid REFERENCES tables(id) ON DELETE SET NULL,

  order_type          text NOT NULL DEFAULT 'dine_in' CHECK (order_type IN ('dine_in','takeaway','counter')),
  source              text NOT NULL CHECK (source IN ('customer','staff')),

  status              text NOT NULL DEFAULT 'placed'
                      CHECK (status IN ('placed','confirmed','preparing','ready','served','billed','settled','cancelled')),

  placed_by_staff_id  uuid REFERENCES staff_accounts(id) ON DELETE SET NULL, -- null when source='customer'
  customer_name       text,
  customer_phone      text,
  customer_token      uuid NOT NULL DEFAULT gen_random_uuid(),
  -- Returned once at creation; lets the customer poll their own order status
  -- via /api/orders/[id]?token=... without any anon SELECT policy on this table.

  subtotal            numeric(10,2) NOT NULL DEFAULT 0,
  tax_amount          numeric(10,2) NOT NULL DEFAULT 0,
  discount_amount     numeric(10,2) NOT NULL DEFAULT 0,
  discount_reason     text,
  total_amount        numeric(10,2) NOT NULL DEFAULT 0,
  tax_rate_snapshot   jsonb,           -- e.g. {"label":"GST","percent":5} captured at bill time

  payment_method      text CHECK (payment_method IN ('cash','card','upi','other') OR payment_method IS NULL),
  settled_at          timestamptz,
  settled_by_staff_id uuid REFERENCES staff_accounts(id) ON DELETE SET NULL,

  notes               text,
  created_at          timestamptz DEFAULT now(),
  updated_at          timestamptz DEFAULT now()
);
CREATE INDEX idx_orders_biz_status  ON orders(business_id, status);
CREATE INDEX idx_orders_biz_table   ON orders(business_id, table_id) WHERE table_id IS NOT NULL;
CREATE INDEX idx_orders_biz_created ON orders(business_id, created_at DESC);
CREATE INDEX idx_orders_token       ON orders(id, customer_token);

-- ─────────────────────────────────────────────────────────────────
-- TABLE: order_items — line items with a permanently frozen price/name
-- snapshot, so bills survive later menu edits or deletions.
-- ─────────────────────────────────────────────────────────────────
CREATE TABLE order_items (
  id                   uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id             uuid NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  business_id          uuid NOT NULL REFERENCES businesses(id) ON DELETE CASCADE, -- denormalized for simple RLS
  item_id              uuid REFERENCES items(id) ON DELETE SET NULL,

  item_name_snapshot   text NOT NULL,
  unit_price_snapshot  numeric(10,2) NOT NULL,
  selected_add_ons     jsonb DEFAULT '[]'::jsonb,   -- [{id,name,price}] — same shape as items.add_ons
  note                 text,

  qty                  integer NOT NULL CHECK (qty > 0),
  line_total           numeric(10,2) NOT NULL,

  status               text NOT NULL DEFAULT 'placed'
                       CHECK (status IN ('placed','preparing','ready','served','cancelled')),

  created_at           timestamptz DEFAULT now(),
  updated_at           timestamptz DEFAULT now()
);
CREATE INDEX idx_order_items_order      ON order_items(order_id);
CREATE INDEX idx_order_items_biz_status ON order_items(business_id, status);

-- ─────────────────────────────────────────────────────────────────
-- TABLE: order_status_events — audit trail, populated entirely by
-- triggers below (not application code), so the log is complete
-- regardless of which surface changed a status.
-- ─────────────────────────────────────────────────────────────────
CREATE TABLE order_status_events (
  id                   uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id             uuid NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  business_id          uuid NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
  order_item_id        uuid REFERENCES order_items(id) ON DELETE CASCADE, -- null = order-level event
  from_status          text,
  to_status            text NOT NULL,
  changed_by_staff_id  uuid REFERENCES staff_accounts(id) ON DELETE SET NULL, -- null = customer/system action
  created_at           timestamptz DEFAULT now()
);
CREATE INDEX idx_order_status_events_order ON order_status_events(order_id, created_at);

-- ─────────────────────────────────────────────────────────────────
-- TRIGGERS
-- ─────────────────────────────────────────────────────────────────

-- Lock order_items snapshot fields against any UPDATE — corrections happen
-- by cancelling the line and adding a new one, never by editing history.
CREATE OR REPLACE FUNCTION lock_order_item_snapshot()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.item_name_snapshot IS DISTINCT FROM OLD.item_name_snapshot
     OR NEW.unit_price_snapshot IS DISTINCT FROM OLD.unit_price_snapshot THEN
    RAISE EXCEPTION 'Access Denied: order_items price/name snapshot is immutable.';
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER trg_lock_order_item_snapshot
BEFORE UPDATE ON order_items
FOR EACH ROW
EXECUTE FUNCTION lock_order_item_snapshot();

-- Block non-admins from authorizing a discount — mirrors check_staff_item_update() in 007.
CREATE OR REPLACE FUNCTION guard_order_discount()
RETURNS TRIGGER AS $$
BEGIN
  IF NOT is_admin_of(NEW.business_id) THEN
    IF NEW.discount_amount IS DISTINCT FROM OLD.discount_amount AND NEW.discount_amount <> 0 THEN
      RAISE EXCEPTION 'Access Denied: only owner/admin can set a discount.';
    END IF;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER trg_guard_order_discount
BEFORE UPDATE ON orders
FOR EACH ROW
EXECUTE FUNCTION guard_order_discount();

-- Auto-log order status transitions.
CREATE OR REPLACE FUNCTION log_order_status()
RETURNS TRIGGER AS $$
DECLARE
  v_staff_id uuid;
BEGIN
  IF NEW.status IS DISTINCT FROM OLD.status THEN
    SELECT id INTO v_staff_id FROM staff_accounts
      WHERE business_id = NEW.business_id AND user_id = auth.uid() AND is_active = true LIMIT 1;
    INSERT INTO order_status_events (order_id, business_id, from_status, to_status, changed_by_staff_id)
    VALUES (NEW.id, NEW.business_id, OLD.status, NEW.status, v_staff_id);
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER trg_log_order_status
AFTER UPDATE ON orders
FOR EACH ROW
EXECUTE FUNCTION log_order_status();

-- Auto-log order_item status transitions (drives the KOT board timeline).
CREATE OR REPLACE FUNCTION log_order_item_status()
RETURNS TRIGGER AS $$
DECLARE
  v_staff_id uuid;
BEGIN
  IF NEW.status IS DISTINCT FROM OLD.status THEN
    SELECT id INTO v_staff_id FROM staff_accounts
      WHERE business_id = NEW.business_id AND user_id = auth.uid() AND is_active = true LIMIT 1;
    INSERT INTO order_status_events (order_id, business_id, order_item_id, from_status, to_status, changed_by_staff_id)
    VALUES (NEW.order_id, NEW.business_id, NEW.id, OLD.status, NEW.status, v_staff_id);
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER trg_log_order_item_status
AFTER UPDATE ON order_items
FOR EACH ROW
EXECUTE FUNCTION log_order_item_status();

-- Sync tables.status from order lifecycle. Staff can still always manually
-- override (e.g. pre-mark 'reserved', or reset 'needs_cleaning' -> 'available'
-- after physically cleaning) — this trigger only *sets*, it never blocks a
-- manual UPDATE on the tables row itself.
CREATE OR REPLACE FUNCTION sync_table_status()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.table_id IS NOT NULL THEN
    IF NEW.status = 'settled' THEN
      UPDATE tables SET status = 'needs_cleaning', updated_at = now() WHERE id = NEW.table_id;
    ELSIF NEW.status NOT IN ('cancelled') AND (TG_OP = 'INSERT' OR OLD.status IS DISTINCT FROM NEW.status) THEN
      UPDATE tables SET status = 'occupied', updated_at = now() WHERE id = NEW.table_id AND status = 'available';
    END IF;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER trg_sync_table_status
AFTER INSERT OR UPDATE ON orders
FOR EACH ROW
EXECUTE FUNCTION sync_table_status();

-- ─────────────────────────────────────────────────────────────────
-- RPC: add_order_items — the ONLY code path that writes order_items.
--
-- SECURITY DEFINER (not INVOKER): the find-or-create "open tab" lookup
-- needs to SELECT an existing orders row, but orders has NO anon SELECT
-- policy at all (by design — see RLS section below), so an anonymous
-- customer placing a second round could never find their table's open
-- order under INVOKER semantics. DEFINER bypasses RLS entirely inside
-- this function, which means *this function* is now the security
-- boundary — every check RLS would have done is re-implemented below
-- explicitly:
--   - source='staff' requires is_staff_of(p_business_id) (re-checked
--     here since RLS is bypassed)
--   - source='customer' forces placed_by_staff_id to NULL regardless
--     of what's passed in
--   - p_table_id, if given, must actually belong to p_business_id
--   - price is never trusted from the caller — always re-read from
--     the live items row
-- SET search_path pins name resolution to public, standard practice
-- for SECURITY DEFINER functions taking caller-controlled input.
-- ─────────────────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION add_order_items(
  p_business_id uuid,
  p_table_id uuid,
  p_branch_id uuid,
  p_order_type text,
  p_source text,
  p_customer_name text,
  p_customer_phone text,
  p_items jsonb  -- [{item_id, qty, note, selected_add_on_ids}]
)
RETURNS orders
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_order   orders;
  v_item    jsonb;
  v_row     items%ROWTYPE;
  v_qty     integer;
  v_add_ons jsonb;
  v_add_on_total numeric(10,2);
  v_staff_id uuid;
BEGIN
  IF p_source NOT IN ('customer','staff') THEN
    RAISE EXCEPTION 'Invalid order source.';
  END IF;

  IF p_items IS NULL OR jsonb_array_length(p_items) = 0 THEN
    RAISE EXCEPTION 'At least one item is required.';
  END IF;

  IF p_branch_id IS NOT NULL AND NOT EXISTS (SELECT 1 FROM branches WHERE id = p_branch_id AND business_id = p_business_id) THEN
    RAISE EXCEPTION 'Branch not found for this business.';
  END IF;

  IF p_source = 'staff' THEN
    IF NOT is_staff_of(p_business_id) THEN
      RAISE EXCEPTION 'Access Denied: not an active staff member of this business.';
    END IF;
    SELECT id INTO v_staff_id FROM staff_accounts
      WHERE business_id = p_business_id AND user_id = auth.uid() AND is_active = true LIMIT 1;
  ELSE
    -- Anonymous customer path: never trust a caller-supplied staff id.
    v_staff_id := NULL;
  END IF;

  IF p_table_id IS NOT NULL THEN
    IF NOT EXISTS (SELECT 1 FROM tables WHERE id = p_table_id AND business_id = p_business_id AND is_active = true) THEN
      RAISE EXCEPTION 'Table not found for this business.';
    END IF;

    -- Find an existing open tab for this table, or start a new one.
    SELECT * INTO v_order FROM orders
      WHERE business_id = p_business_id AND table_id = p_table_id
        AND status NOT IN ('settled','cancelled')
      ORDER BY created_at DESC LIMIT 1;
  END IF;

  IF v_order.id IS NULL THEN
    INSERT INTO orders (business_id, branch_id, table_id, order_type, source, placed_by_staff_id, customer_name, customer_phone)
    VALUES (p_business_id, p_branch_id, p_table_id, COALESCE(p_order_type, 'dine_in'), p_source, v_staff_id, p_customer_name, p_customer_phone)
    RETURNING * INTO v_order;
  END IF;

  FOR v_item IN SELECT * FROM jsonb_array_elements(p_items)
  LOOP
    SELECT * INTO v_row FROM items WHERE id = (v_item->>'item_id')::uuid AND business_id = p_business_id;
    IF v_row.id IS NULL THEN
      RAISE EXCEPTION 'Item not found for this business.';
    END IF;
    IF NOT COALESCE(v_row.is_available, true) THEN
      RAISE EXCEPTION 'Item "%" is currently sold out.', v_row.name;
    END IF;

    v_qty := COALESCE((v_item->>'qty')::integer, 1);
    IF v_qty < 1 THEN
      RAISE EXCEPTION 'Quantity must be at least 1.';
    END IF;

    -- Resolve selected add-ons against the item's live add_ons list (price never trusted from caller).
    SELECT COALESCE(jsonb_agg(ao), '[]'::jsonb), COALESCE(SUM((ao->>'price')::numeric), 0)
      INTO v_add_ons, v_add_on_total
      FROM jsonb_array_elements(v_row.add_ons) ao
      WHERE (ao->>'id') IN (SELECT jsonb_array_elements_text(COALESCE(v_item->'selected_add_on_ids', '[]'::jsonb)));

    INSERT INTO order_items (order_id, business_id, item_id, item_name_snapshot, unit_price_snapshot, selected_add_ons, note, qty, line_total)
    VALUES (
      v_order.id, p_business_id, v_row.id, v_row.name, v_row.price, COALESCE(v_add_ons, '[]'::jsonb),
      NULLIF(v_item->>'note', ''), v_qty, (v_row.price + v_add_on_total) * v_qty
    );
  END LOOP;

  -- Recompute order totals from all non-cancelled lines.
  UPDATE orders SET
    subtotal = (SELECT COALESCE(SUM(line_total), 0) FROM order_items WHERE order_id = v_order.id AND status <> 'cancelled'),
    updated_at = now()
  WHERE id = v_order.id;

  UPDATE orders SET total_amount = subtotal + tax_amount - discount_amount WHERE id = v_order.id;

  SELECT * INTO v_order FROM orders WHERE id = v_order.id;
  RETURN v_order;
END;
$$;

-- Explicit grants (Postgres grants EXECUTE to PUBLIC by default on function
-- creation, but this is made explicit so it survives any future privilege
-- cleanup elsewhere in the project).
GRANT EXECUTE ON FUNCTION add_order_items TO anon, authenticated;

-- ─────────────────────────────────────────────────────────────────
-- RLS — follows the stricter split-by-operation pattern from
-- 007_strict_rbac.sql (separate INSERT/UPDATE/DELETE, DELETE gated to
-- is_admin_of) rather than the older monolithic FOR ALL style.
--
-- NOTE: add_order_items() above is SECURITY DEFINER and bypasses these
-- policies internally (it does its own explicit checks instead — see
-- the comment on that function). The INSERT policies below are a
-- defense-in-depth backstop for the unlikely case that something ever
-- writes to these tables directly instead of via the RPC.
-- ─────────────────────────────────────────────────────────────────
ALTER TABLE tables              ENABLE ROW LEVEL SECURITY;
ALTER TABLE orders              ENABLE ROW LEVEL SECURITY;
ALTER TABLE order_items         ENABLE ROW LEVEL SECURITY;
ALTER TABLE order_status_events ENABLE ROW LEVEL SECURITY;

-- tables: public read (needed to resolve a QR scan into table context before an order exists), staff write
CREATE POLICY "tables_pub_read"     ON tables FOR SELECT TO anon USING (is_active = true);
CREATE POLICY "tables_staff_select" ON tables FOR SELECT TO authenticated USING (is_staff_of(business_id));
CREATE POLICY "tables_staff_insert" ON tables FOR INSERT TO authenticated WITH CHECK (is_staff_of(business_id));
CREATE POLICY "tables_staff_update" ON tables FOR UPDATE TO authenticated USING (is_staff_of(business_id)) WITH CHECK (is_staff_of(business_id));
CREATE POLICY "tables_admin_delete" ON tables FOR DELETE TO authenticated USING (is_admin_of(business_id));

-- orders: NO anon SELECT — same private-by-default precedent as reservations post-007.
CREATE POLICY "orders_pub_insert" ON orders FOR INSERT TO anon, authenticated
  WITH CHECK (
    source = 'customer' AND placed_by_staff_id IS NULL
    AND status = 'placed' AND payment_method IS NULL AND settled_at IS NULL
  );
CREATE POLICY "orders_staff_select" ON orders FOR SELECT TO authenticated USING (is_staff_of(business_id));
CREATE POLICY "orders_staff_insert" ON orders FOR INSERT TO authenticated WITH CHECK (is_staff_of(business_id));
CREATE POLICY "orders_staff_update" ON orders FOR UPDATE TO authenticated USING (is_staff_of(business_id)) WITH CHECK (is_staff_of(business_id));
CREATE POLICY "orders_admin_delete" ON orders FOR DELETE TO authenticated USING (is_admin_of(business_id));

-- order_items: same shape, plus a defense-in-depth price check baked into the anon WITH CHECK
-- (on top of add_order_items()'s own live re-read of items.price/is_available).
CREATE POLICY "order_items_pub_insert" ON order_items FOR INSERT TO anon, authenticated
  WITH CHECK (
    status = 'placed'
    AND EXISTS (SELECT 1 FROM orders o WHERE o.id = order_items.order_id AND o.business_id = order_items.business_id AND o.source = 'customer')
    AND EXISTS (SELECT 1 FROM items i WHERE i.id = order_items.item_id AND i.business_id = order_items.business_id
                AND i.price = order_items.unit_price_snapshot AND i.is_available = true)
  );
CREATE POLICY "order_items_staff_select" ON order_items FOR SELECT TO authenticated USING (is_staff_of(business_id));
CREATE POLICY "order_items_staff_insert" ON order_items FOR INSERT TO authenticated WITH CHECK (is_staff_of(business_id));
CREATE POLICY "order_items_staff_update" ON order_items FOR UPDATE TO authenticated USING (is_staff_of(business_id)) WITH CHECK (is_staff_of(business_id));
CREATE POLICY "order_items_admin_delete" ON order_items FOR DELETE TO authenticated USING (is_admin_of(business_id));

-- order_status_events: staff-only read, no anon access at all — populated purely by triggers.
CREATE POLICY "order_status_events_staff_select" ON order_status_events FOR SELECT TO authenticated USING (is_staff_of(business_id));

-- ─────────────────────────────────────────────────────────────────
-- Realtime — without this, KitchenDisplay's postgres_changes subscriptions
-- connect successfully but never receive a single change event. Every
-- Supabase project ships a `supabase_realtime` publication by default;
-- tables must be added to it explicitly to be eligible for postgres_changes.
-- ─────────────────────────────────────────────────────────────────
ALTER PUBLICATION supabase_realtime ADD TABLE orders;
ALTER PUBLICATION supabase_realtime ADD TABLE order_items;
ALTER PUBLICATION supabase_realtime ADD TABLE tables;
