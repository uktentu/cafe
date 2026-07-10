// Client-side POS data access (browser Supabase client + RLS). Deliberately
// separate from cms-queries.ts: POS writes never call revalidateMenu() — that
// function refreshes the KV-cached public menu (branding/items), and order/
// table/KOT data must never go through that cache (see CLAUDE.md POS rule).
'use client'

import { createClient } from '@/lib/supabase/client'
import type { RestaurantTable, Order, OrderItem, OrderItemStatus, OrderStatus, PaymentMethod, OrderType, OrderChannel } from '@/types/database'

let _client: ReturnType<typeof createClient> | null = null
function db() {
  if (!_client) _client = createClient()
  return _client
}

export const posQk = {
  tables: (bid: string) => ['pos-tables', bid] as const,
  orders: (bid: string) => ['pos-orders', bid] as const,
  orderItems: (orderId: string) => ['pos-order-items', orderId] as const,
  kot: (bid: string) => ['pos-kot', bid] as const,
  sales: (bid: string, fromIso: string) => ['pos-sales', bid, fromIso] as const,
  board: (bid: string) => ['pos-board', bid] as const,
}

export interface BoardOrder extends Order {
  item_count: number
}

/** Active orders across every channel, with a line count, for the kanban board. */
export async function fetchBoardOrders(businessId: string): Promise<BoardOrder[]> {
  const { data, error } = await db()
    .from('orders')
    .select('*, order_items(id)')
    .eq('business_id', businessId)
    .in('status', ['placed', 'confirmed', 'preparing', 'ready', 'served'])
    .order('created_at', { ascending: true })
  if (error) throw error
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return (data ?? []).map((o: any) => ({ ...o, item_count: Array.isArray(o.order_items) ? o.order_items.length : 0 })) as BoardOrder[]
}

// ── Tables reads/writes ─────────────────────────────────────────────
export async function fetchTables(businessId: string): Promise<RestaurantTable[]> {
  const { data, error } = await db()
    .from('tables')
    .select('*')
    .eq('business_id', businessId)
    .order('sort_order', { ascending: true })
  if (error) throw error
  return (data ?? []) as RestaurantTable[]
}

export type TableInput = Partial<RestaurantTable> & { business_id: string; label: string; code: string }

export async function createTable(input: TableInput): Promise<RestaurantTable> {
  const { data, error } = await db().from('tables').insert(input).select('*').single()
  if (error) throw error
  return data as RestaurantTable
}

export async function updateTable(id: string, patch: Partial<RestaurantTable>): Promise<RestaurantTable> {
  const { data, error } = await db()
    .from('tables')
    .update({ ...patch, updated_at: new Date().toISOString() })
    .eq('id', id)
    .select('*')
    .single()
  if (error) throw error
  return data as RestaurantTable
}

export async function deleteTable(id: string): Promise<void> {
  const { error } = await db().from('tables').delete().eq('id', id)
  if (error) throw error
}

// ── Orders reads/writes ──────────────────────────────────────────────
export async function fetchActiveOrders(businessId: string): Promise<Order[]> {
  const { data, error } = await db()
    .from('orders')
    .select('*')
    .eq('business_id', businessId)
    .in('status', ['placed', 'confirmed', 'preparing', 'ready', 'served', 'billed'])
    .order('created_at', { ascending: false })
  if (error) throw error
  return (data ?? []) as Order[]
}

export async function fetchOrderItems(orderId: string): Promise<OrderItem[]> {
  const { data, error } = await db()
    .from('order_items')
    .select('*')
    .eq('order_id', orderId)
    .order('created_at', { ascending: true })
  if (error) throw error
  return (data ?? []) as OrderItem[]
}

// ── Kitchen Display (KOT) ────────────────────────────────────────────
export interface KotTicketItem extends OrderItem {
  table_label: string | null
  order_type: OrderType
  channel: OrderChannel
  external_ref: string | null
}

/** Active tickets (placed/preparing/ready), joined to their table label. */
export async function fetchKotItems(businessId: string): Promise<KotTicketItem[]> {
  const base = 'id, order_id, business_id, item_id, item_name_snapshot, unit_price_snapshot, selected_add_ons, note, qty, line_total, status, created_at, updated_at'
  const run = (orderCols: string) => db()
    .from('order_items')
    .select(`${base}, orders!inner(${orderCols})`)
    .eq('business_id', businessId)
    .in('status', ['placed', 'preparing', 'ready'])
    .order('created_at', { ascending: true })

  // Prefer the channel-aware join; fall back to the pre-014 shape so the
  // kitchen keeps working before migration 014 adds orders.channel.
  let { data, error } = await run('table_id, order_type, channel, external_ref, tables(label)')
  if (error) {
    ;({ data, error } = await run('table_id, order_type, tables(label)'))
  }
  if (error) throw error
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return (data ?? []).map((row: any) => ({
    id: row.id,
    order_id: row.order_id,
    business_id: row.business_id,
    item_id: row.item_id,
    item_name_snapshot: row.item_name_snapshot,
    unit_price_snapshot: row.unit_price_snapshot,
    selected_add_ons: row.selected_add_ons ?? [],
    note: row.note,
    qty: row.qty,
    line_total: row.line_total,
    status: row.status,
    created_at: row.created_at,
    updated_at: row.updated_at,
    table_label: row.orders?.tables?.label ?? null,
    order_type: row.orders?.order_type ?? 'dine_in',
    channel: row.orders?.channel ?? 'direct',
    external_ref: row.orders?.external_ref ?? null,
  }))
}

export interface AddOrderItemInput {
  item_id: string
  qty: number
  note?: string | null
  selected_add_on_ids?: string[]
}

/**
 * Staff order-taking entry point — calls the same add_order_items() RPC the
 * anonymous customer path uses (via /api/orders). One price-integrity code
 * path: the RPC always re-reads price/availability from `items` itself and
 * never trusts a price from this call. Requires an authenticated staff
 * session — RLS (is_staff_of) is checked *inside* the RPC since it runs
 * SECURITY DEFINER (see supabase/migrations/008_pos_core.sql).
 */
export async function addOrderItemsAsStaff(params: {
  business_id: string
  table_id?: string | null
  branch_id?: string | null
  order_type?: 'dine_in' | 'takeaway' | 'counter'
  items: AddOrderItemInput[]
}): Promise<Order> {
  const { data, error } = await db().rpc('add_order_items', {
    p_business_id: params.business_id,
    p_table_id: params.table_id ?? null,
    p_branch_id: params.branch_id ?? null,
    p_order_type: params.order_type ?? 'dine_in',
    p_source: 'staff',
    p_customer_name: null,
    p_customer_phone: null,
    p_items: params.items.map((i) => ({
      item_id: i.item_id,
      qty: i.qty,
      note: i.note ?? null,
      selected_add_on_ids: i.selected_add_on_ids ?? [],
    })),
  })
  if (error) throw error
  return data as Order
}

/** Settled bills since `fromIso` — the financial record for the Sales screen. */
export async function fetchSettledOrders(businessId: string, fromIso: string): Promise<Order[]> {
  const { data, error } = await db()
    .from('orders')
    .select('*')
    .eq('business_id', businessId)
    .eq('status', 'settled')
    .gte('settled_at', fromIso)
    .order('settled_at', { ascending: false })
    .limit(500)
  if (error) throw error
  return (data ?? []) as Order[]
}

export async function updateOrderStatus(id: string, status: OrderStatus): Promise<void> {
  const { error } = await db().from('orders').update({ status, updated_at: new Date().toISOString() }).eq('id', id)
  if (error) throw error
}

export async function updateOrderItemStatus(id: string, status: OrderItemStatus): Promise<void> {
  const { error } = await db().from('order_items').update({ status, updated_at: new Date().toISOString() }).eq('id', id)
  if (error) throw error
}

export async function updateOrder(id: string, patch: Partial<Pick<Order, 'channel' | 'external_ref' | 'customer_name' | 'customer_phone' | 'order_type'>>): Promise<void> {
  const { error } = await db().from('orders').update({ ...patch, updated_at: new Date().toISOString() }).eq('id', id)
  if (error) throw error
}

export interface ExternalOrderItemInput {
  name: string
  price: number
  qty: number
  note?: string | null
}

/**
 * Ingest a Swiggy/Zomato/phone order via create_external_order (migration 014).
 * Prices are taken from the payload — the aggregator is the source of truth for
 * its own order — so, unlike add_order_items, our menu prices aren't re-read.
 */
export async function createExternalOrder(params: {
  business_id: string
  channel: Exclude<OrderChannel, 'direct'>
  external_ref?: string | null
  order_type?: OrderType
  customer_name?: string | null
  customer_phone?: string | null
  items: ExternalOrderItemInput[]
}): Promise<Order> {
  const { data, error } = await db().rpc('create_external_order', {
    p_business_id: params.business_id,
    p_channel: params.channel,
    p_external_ref: params.external_ref ?? null,
    p_order_type: params.order_type ?? 'delivery',
    p_customer_name: params.customer_name ?? null,
    p_customer_phone: params.customer_phone ?? null,
    p_items: params.items.map((i) => ({ name: i.name, price: i.price, qty: i.qty, note: i.note ?? null })),
  })
  if (error) throw error
  return data as Order
}

export async function settleOrder(
  id: string,
  patch: {
    payment_method: PaymentMethod
    discount_amount?: number
    discount_reason?: string | null
    food_tax_percent: number
    bar_tax_percent: number
  }
): Promise<Order> {
  // settle_order() (migration 012) recomputes subtotal/tax from the LIVE order
  // lines server-side, so a customer adding items mid-settle can't produce a
  // wrong total. bill_no is assigned atomically by the DB trigger.
  const { data, error } = await db().rpc('settle_order', {
    p_order_id: id,
    p_payment_method: patch.payment_method,
    p_discount_amount: patch.discount_amount ?? 0,
    p_discount_reason: patch.discount_reason ?? null,
    p_food_tax_percent: patch.food_tax_percent,
    p_bar_tax_percent: patch.bar_tax_percent,
  })
  if (error) throw error
  return data as Order
}
