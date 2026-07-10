-- ════════════════════════════════════════════════════════════════════
-- Migration 012 — Atomic, race-free bill settlement
-- Previously settle read a fresh subtotal but trusted a client-computed tax
-- amount. If a dine-in customer added items from their phone between the
-- waiter opening the bill and pressing Settle, the stored bill got a fresh
-- subtotal but stale tax → wrong total. This RPC recomputes everything from
-- the live order lines at settle time, the same way add_order_items() is the
-- single source of truth for pricing. Run AFTER 011_pos_hardening.sql.
-- ════════════════════════════════════════════════════════════════════

CREATE OR REPLACE FUNCTION settle_order(
  p_order_id uuid,
  p_payment_method text,
  p_discount_amount numeric,
  p_discount_reason text,
  p_food_tax_percent numeric,
  p_bar_tax_percent numeric
)
RETURNS orders
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_order    orders;
  v_staff_id uuid;
  v_food_sub numeric(10,2);
  v_bar_sub  numeric(10,2);
  v_subtotal numeric(10,2);
  v_tax      numeric(10,2);
  v_discount numeric(10,2);
BEGIN
  SELECT * INTO v_order FROM orders WHERE id = p_order_id;
  IF v_order.id IS NULL THEN
    RAISE EXCEPTION 'Order not found.';
  END IF;
  IF NOT is_staff_of(v_order.business_id) THEN
    RAISE EXCEPTION 'Access Denied: not an active staff member of this business.';
  END IF;
  IF v_order.status IN ('settled','cancelled') THEN
    RAISE EXCEPTION 'This order is already closed.';
  END IF;
  IF p_payment_method NOT IN ('cash','card','upi','other') THEN
    RAISE EXCEPTION 'Invalid payment method.';
  END IF;

  v_discount := COALESCE(p_discount_amount, 0);
  IF v_discount < 0 THEN
    RAISE EXCEPTION 'Discount cannot be negative.';
  END IF;
  -- Discounts are an owner/admin authority (also enforced by guard_order_discount).
  IF v_discount <> 0 AND NOT is_admin_of(v_order.business_id) THEN
    RAISE EXCEPTION 'Access Denied: only owner/admin can apply a discount.';
  END IF;

  SELECT id INTO v_staff_id FROM staff_accounts
    WHERE business_id = v_order.business_id AND user_id = auth.uid() AND is_active = true LIMIT 1;

  -- Fresh split of the live (non-cancelled) lines — this is the authoritative
  -- money, regardless of what the billing screen last rendered.
  SELECT
    COALESCE(SUM(line_total) FILTER (WHERE NOT COALESCE(is_bar, false)), 0),
    COALESCE(SUM(line_total) FILTER (WHERE COALESCE(is_bar, false)), 0)
    INTO v_food_sub, v_bar_sub
    FROM order_items WHERE order_id = p_order_id AND status <> 'cancelled';

  IF v_food_sub + v_bar_sub = 0 THEN
    RAISE EXCEPTION 'Cannot settle an empty order.';
  END IF;

  v_subtotal := v_food_sub + v_bar_sub;
  v_tax := round(v_food_sub * COALESCE(p_food_tax_percent, 0) / 100, 2)
         + round(v_bar_sub  * COALESCE(p_bar_tax_percent, 0) / 100, 2);

  IF v_discount > v_subtotal THEN
    RAISE EXCEPTION 'Discount exceeds the bill amount.';
  END IF;

  UPDATE orders SET
    subtotal          = v_subtotal,
    tax_amount        = v_tax,
    discount_amount   = v_discount,
    discount_reason   = NULLIF(p_discount_reason, ''),
    total_amount      = v_subtotal + v_tax - v_discount,
    tax_rate_snapshot = jsonb_build_object('food_percent', p_food_tax_percent, 'bar_percent', p_bar_tax_percent),
    payment_method    = p_payment_method,
    status            = 'settled',
    settled_at        = now(),
    settled_by_staff_id = v_staff_id,
    updated_at        = now()
  WHERE id = p_order_id
  RETURNING * INTO v_order;  -- bill_no assigned by the assign_bill_number trigger

  RETURN v_order;
END;
$$;

GRANT EXECUTE ON FUNCTION settle_order TO authenticated;
