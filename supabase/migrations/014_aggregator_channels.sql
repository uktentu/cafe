-- ════════════════════════════════════════════════════════════════════
-- Migration 014 — Aggregator channels (Swiggy / Zomato) + unified orders
-- Makes delivery-aggregator orders first-class alongside dine-in/takeaway/QR
-- so one board can aggregate every channel. Real Swiggy/Zomato pull needs a
-- partner-API agreement (no public API); this provides the ingestion seam
-- (create_external_order, called by the /api/webhooks/aggregator route) plus
-- manual entry. Run AFTER 013_owner_modules.sql.
-- ════════════════════════════════════════════════════════════════════

-- New order source + a delivery order type for aggregator orders.
ALTER TABLE orders DROP CONSTRAINT IF EXISTS orders_source_check;
ALTER TABLE orders ADD CONSTRAINT orders_source_check CHECK (source IN ('customer','staff','aggregator'));

ALTER TABLE orders DROP CONSTRAINT IF EXISTS orders_order_type_check;
ALTER TABLE orders ADD CONSTRAINT orders_order_type_check CHECK (order_type IN ('dine_in','takeaway','counter','delivery'));

-- The channel a live order arrived through, and the aggregator's own order id.
ALTER TABLE orders ADD COLUMN IF NOT EXISTS channel text NOT NULL DEFAULT 'direct'
  CHECK (channel IN ('direct','swiggy','zomato','phone'));
ALTER TABLE orders ADD COLUMN IF NOT EXISTS external_ref text;
CREATE INDEX IF NOT EXISTS idx_orders_biz_channel ON orders(business_id, channel);

-- Our sequential bill numbers are for our OWN bills only — aggregator orders
-- carry the platform's bill, so they must not consume our number sequence.
CREATE OR REPLACE FUNCTION assign_bill_number()
RETURNS TRIGGER AS $$
DECLARE
  v_no integer;
BEGIN
  IF NEW.status = 'settled' AND OLD.status IS DISTINCT FROM 'settled'
     AND NEW.bill_no IS NULL AND NEW.channel = 'direct' THEN
    UPDATE businesses SET next_bill_no = next_bill_no + 1
      WHERE id = NEW.business_id
      RETURNING next_bill_no - 1 INTO v_no;
    NEW.bill_no := v_no;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ─────────────────────────────────────────────────────────────────
-- create_external_order — ingest a Swiggy/Zomato (or phone) order.
-- Unlike add_order_items, prices come FROM the platform payload: the
-- aggregator is the source of truth for its own order and its prices
-- already include its markup/tax, so we snapshot them as given rather
-- than re-reading our menu. Called by the webhook route (service role)
-- and by manual aggregator entry.
-- ─────────────────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION create_external_order(
  p_business_id uuid,
  p_channel text,
  p_external_ref text,
  p_order_type text,
  p_customer_name text,
  p_customer_phone text,
  p_items jsonb  -- [{name, price, qty, note}]
)
RETURNS orders
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_order orders;
  v_item  jsonb;
  v_qty   integer;
  v_price numeric(10,2);
  v_sub   numeric(10,2) := 0;
BEGIN
  IF p_channel NOT IN ('swiggy','zomato','phone') THEN
    RAISE EXCEPTION 'Invalid aggregator channel.';
  END IF;
  IF p_items IS NULL OR jsonb_array_length(p_items) = 0 THEN
    RAISE EXCEPTION 'At least one item is required.';
  END IF;
  -- Idempotency: never ingest the same platform order twice.
  IF p_external_ref IS NOT NULL AND EXISTS (
    SELECT 1 FROM orders WHERE business_id = p_business_id AND channel = p_channel AND external_ref = p_external_ref
  ) THEN
    SELECT * INTO v_order FROM orders WHERE business_id = p_business_id AND channel = p_channel AND external_ref = p_external_ref LIMIT 1;
    RETURN v_order;
  END IF;

  INSERT INTO orders (business_id, order_type, source, channel, external_ref, status, customer_name, customer_phone)
  VALUES (p_business_id, COALESCE(p_order_type, 'delivery'), 'aggregator', p_channel, NULLIF(p_external_ref, ''),
          'placed', NULLIF(trim(COALESCE(p_customer_name,'')), ''), NULLIF(trim(COALESCE(p_customer_phone,'')), ''))
  RETURNING * INTO v_order;

  FOR v_item IN SELECT * FROM jsonb_array_elements(p_items)
  LOOP
    v_qty := GREATEST(COALESCE((v_item->>'qty')::integer, 1), 1);
    v_price := COALESCE((v_item->>'price')::numeric, 0);
    INSERT INTO order_items (order_id, business_id, item_id, item_name_snapshot, unit_price_snapshot, note, qty, line_total, is_bar)
    VALUES (v_order.id, p_business_id, NULL,
            COALESCE(NULLIF(trim(v_item->>'name'), ''), 'Item'), v_price,
            NULLIF(v_item->>'note',''), v_qty, v_price * v_qty, false);
    v_sub := v_sub + v_price * v_qty;
  END LOOP;

  -- Aggregator totals are taken as-is (platform prices are tax-inclusive).
  UPDATE orders SET subtotal = v_sub, total_amount = v_sub, updated_at = now() WHERE id = v_order.id RETURNING * INTO v_order;
  RETURN v_order;
END;
$$;

GRANT EXECUTE ON FUNCTION create_external_order TO authenticated;
