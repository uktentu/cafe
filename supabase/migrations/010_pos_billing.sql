-- ════════════════════════════════════════════════════════════════════
-- Migration 010 — Real restaurant billing
-- GSTIN/FSSAI on receipts, sequential bill numbers assigned at settle,
-- and bar/liquor items billed separately (different tax regime: liquor
-- carries state VAT, not GST, and is typically issued as a separate bill
-- under the bar license). Run AFTER 009_pos_roles_settings.sql.
-- ════════════════════════════════════════════════════════════════════

-- Business billing identity — printed on every bill.
ALTER TABLE businesses ADD COLUMN IF NOT EXISTS gstin text;
ALTER TABLE businesses ADD COLUMN IF NOT EXISTS fssai_license text;
ALTER TABLE businesses ADD COLUMN IF NOT EXISTS bar_tax_percent numeric(5,2) DEFAULT 18.00; -- state VAT on liquor
ALTER TABLE businesses ADD COLUMN IF NOT EXISTS receipt_footer text; -- e.g. 'Thank you! Visit again.'
ALTER TABLE businesses ADD COLUMN IF NOT EXISTS next_bill_no integer NOT NULL DEFAULT 1;

-- Bar/liquor flag on items; snapshotted onto order lines so bills stay
-- correct even if the item is later reclassified or deleted.
ALTER TABLE items ADD COLUMN IF NOT EXISTS is_bar boolean DEFAULT false;
ALTER TABLE order_items ADD COLUMN IF NOT EXISTS is_bar boolean NOT NULL DEFAULT false;

ALTER TABLE orders ADD COLUMN IF NOT EXISTS bill_no integer;

-- ─────────────────────────────────────────────────────────────────
-- Sequential bill numbers, assigned atomically the moment an order is
-- settled. The UPDATE..RETURNING on businesses takes a row lock, so two
-- concurrent settles serialize and can never share a number.
-- ─────────────────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION assign_bill_number()
RETURNS TRIGGER AS $$
DECLARE
  v_no integer;
BEGIN
  IF NEW.status = 'settled' AND OLD.status IS DISTINCT FROM 'settled' AND NEW.bill_no IS NULL THEN
    UPDATE businesses SET next_bill_no = next_bill_no + 1
      WHERE id = NEW.business_id
      RETURNING next_bill_no - 1 INTO v_no;
    NEW.bill_no := v_no;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS trg_assign_bill_number ON orders;
CREATE TRIGGER trg_assign_bill_number
BEFORE UPDATE ON orders
FOR EACH ROW
EXECUTE FUNCTION assign_bill_number();

-- ─────────────────────────────────────────────────────────────────
-- add_order_items — same signature as 008, now also snapshots is_bar
-- onto each order line. Full re-declaration (CREATE OR REPLACE).
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

    INSERT INTO order_items (order_id, business_id, item_id, item_name_snapshot, unit_price_snapshot, selected_add_ons, note, qty, line_total, is_bar)
    VALUES (
      v_order.id, p_business_id, v_row.id, v_row.name, v_row.price, COALESCE(v_add_ons, '[]'::jsonb),
      NULLIF(v_item->>'note', ''), v_qty, (v_row.price + v_add_on_total) * v_qty,
      COALESCE(v_row.is_bar, false)
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

GRANT EXECUTE ON FUNCTION add_order_items TO anon, authenticated;
