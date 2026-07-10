// Client-side data access for the owner modules: expenses (P&L), customer
// CRM/loyalty, and day-close / Z-reports. Browser Supabase client + RLS.
'use client'

import { createClient } from '@/lib/supabase/client'
import type { Expense, ExpenseCategory, Customer, DayClose } from '@/types/database'

let _client: ReturnType<typeof createClient> | null = null
function db() {
  if (!_client) _client = createClient()
  return _client
}

export const ownerQk = {
  expenses: (bid: string, fromIso: string) => ['owner-expenses', bid, fromIso] as const,
  customers: (bid: string) => ['owner-customers', bid] as const,
  dayReport: (bid: string, day: string) => ['owner-day-report', bid, day] as const,
  dayCloses: (bid: string) => ['owner-day-closes', bid] as const,
}

// ── Expenses ────────────────────────────────────────────────────────
export async function fetchExpenses(businessId: string, fromIso: string): Promise<Expense[]> {
  const { data, error } = await db()
    .from('expenses')
    .select('*')
    .eq('business_id', businessId)
    .gte('spent_on', fromIso)
    .order('spent_on', { ascending: false })
    .order('created_at', { ascending: false })
  if (error) throw error
  return (data ?? []) as Expense[]
}

export type ExpenseInput = {
  business_id: string
  category: ExpenseCategory
  vendor?: string | null
  amount: number
  note?: string | null
  spent_on: string
}

export async function createExpense(input: ExpenseInput): Promise<Expense> {
  const { data, error } = await db().from('expenses').insert(input).select('*').single()
  if (error) throw error
  return data as Expense
}

export async function deleteExpense(id: string): Promise<void> {
  const { error } = await db().from('expenses').delete().eq('id', id)
  if (error) throw error
}

// ── Customers (CRM) ─────────────────────────────────────────────────
export async function fetchCustomers(businessId: string): Promise<Customer[]> {
  const { data, error } = await db()
    .from('customers')
    .select('*')
    .eq('business_id', businessId)
    .order('total_spent', { ascending: false })
    .limit(1000)
  if (error) throw error
  return (data ?? []) as Customer[]
}

export async function updateCustomer(id: string, patch: Partial<Pick<Customer, 'name'>>): Promise<void> {
  const { error } = await db().from('customers').update(patch).eq('id', id)
  if (error) throw error
}

// ── Day report / Z-report ───────────────────────────────────────────
export interface DayReport {
  grossSales: number   // sum of subtotals (pre-tax, pre-discount)
  discount: number
  netRevenue: number   // gross − discount (excl. tax)
  tax: number          // tax collected (payable to govt)
  collected: number    // net revenue + tax = actual money in
  billCount: number
  byMethod: Record<string, number>
  cashSales: number
  items: { name: string; qty: number; revenue: number }[]
  expensesTotal: number
  profit: number       // netRevenue − expenses
}

/** Aggregate a single day's settled bills + expenses into a Z-report. */
export async function fetchDayReport(businessId: string, dayStartIso: string, dayEndIso: string): Promise<DayReport> {
  const client = db()

  const [{ data: orders, error: oErr }, { data: lines, error: lErr }, { data: exp, error: eErr }] = await Promise.all([
    client
      .from('orders')
      .select('subtotal, tax_amount, discount_amount, total_amount, payment_method')
      .eq('business_id', businessId)
      .eq('status', 'settled')
      .gte('settled_at', dayStartIso)
      .lt('settled_at', dayEndIso),
    // Lines of that day's settled orders, for item-wise sales.
    client
      .from('order_items')
      .select('item_name_snapshot, qty, line_total, status, orders!inner(status, settled_at, business_id)')
      .eq('business_id', businessId)
      .eq('orders.status', 'settled')
      .gte('orders.settled_at', dayStartIso)
      .lt('orders.settled_at', dayEndIso),
    client
      .from('expenses')
      .select('amount')
      .eq('business_id', businessId)
      .gte('spent_on', dayStartIso.slice(0, 10))
      .lte('spent_on', dayEndIso.slice(0, 10)),
  ])
  if (oErr) throw oErr
  if (lErr) throw lErr
  if (eErr) throw eErr

  const os = (orders ?? []) as { subtotal: number; tax_amount: number; discount_amount: number; total_amount: number; payment_method: string | null }[]
  const grossSales = os.reduce((s, o) => s + o.subtotal, 0)
  const discount = os.reduce((s, o) => s + o.discount_amount, 0)
  const tax = os.reduce((s, o) => s + o.tax_amount, 0)
  const collected = os.reduce((s, o) => s + o.total_amount, 0)
  const byMethod = os.reduce<Record<string, number>>((acc, o) => {
    const m = o.payment_method ?? 'other'
    acc[m] = (acc[m] ?? 0) + o.total_amount
    return acc
  }, {})

  const itemMap = new Map<string, { qty: number; revenue: number }>()
  for (const l of (lines ?? []) as { item_name_snapshot: string; qty: number; line_total: number; status: string }[]) {
    if (l.status === 'cancelled') continue
    const e = itemMap.get(l.item_name_snapshot) ?? { qty: 0, revenue: 0 }
    e.qty += l.qty
    e.revenue += l.line_total
    itemMap.set(l.item_name_snapshot, e)
  }
  const items = Array.from(itemMap.entries())
    .map(([name, v]) => ({ name, qty: v.qty, revenue: v.revenue }))
    .sort((a, b) => b.revenue - a.revenue)

  const expensesTotal = ((exp ?? []) as { amount: number }[]).reduce((s, e) => s + e.amount, 0)
  const netRevenue = grossSales - discount

  return {
    grossSales,
    discount,
    netRevenue,
    tax,
    collected,
    billCount: os.length,
    byMethod,
    cashSales: byMethod.cash ?? 0,
    items,
    expensesTotal,
    profit: netRevenue - expensesTotal,
  }
}

// ── Day close ───────────────────────────────────────────────────────
export async function fetchDayCloses(businessId: string): Promise<DayClose[]> {
  const { data, error } = await db()
    .from('day_closes')
    .select('*')
    .eq('business_id', businessId)
    .order('close_date', { ascending: false })
    .limit(90)
  if (error) throw error
  return (data ?? []) as DayClose[]
}

export async function fetchDayClose(businessId: string, closeDate: string): Promise<DayClose | null> {
  const { data, error } = await db()
    .from('day_closes')
    .select('*')
    .eq('business_id', businessId)
    .eq('close_date', closeDate)
    .maybeSingle()
  if (error) throw error
  return (data as DayClose) ?? null
}

export async function closeDay(input: {
  business_id: string
  close_date: string
  opening_cash: number
  counted_cash: number
  expected_cash: number
  totals: Record<string, unknown>
}): Promise<DayClose> {
  const variance = input.counted_cash - input.expected_cash
  const { data, error } = await db()
    .from('day_closes')
    .upsert({ ...input, variance }, { onConflict: 'business_id, close_date' })
    .select('*')
    .single()
  if (error) throw error
  return data as DayClose
}
