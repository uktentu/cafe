export const dynamic = process.env.STATIC_EXPORT === '1' ? 'force-static' : 'force-dynamic'
// ════════════════════════════════════════════════════════════════════
// GET /api/orders/[id]?token=... — anonymous customer order-status polling.
// Deliberately uses the service-role client and does the token match in
// application code: orders has NO anon SELECT policy at all (see 008_pos_core.sql),
// so this is the only way an anonymous customer can read their own order
// status. The token comparison below is the entire security boundary for
// this route — it must never be skipped or short-circuited.
// ════════════════════════════════════════════════════════════════════
import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SECRET_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

const db = createClient(supabaseUrl, supabaseKey, {
  auth: { persistSession: false },
})

// API routes are excluded from static export, but Next.js still requires
// generateStaticParams for dynamic segments when output: 'export' is set.
export function generateStaticParams() { return [{ id: 'placeholder' }] }

export async function GET(request: Request, { params }: { params: { id: string } }) {
  const token = new URL(request.url).searchParams.get('token')
  if (!token) {
    return NextResponse.json({ error: 'Missing token' }, { status: 401 })
  }

  const { data: order, error } = await db
    .from('orders')
    .select('id, status, subtotal, tax_amount, discount_amount, total_amount, table_id, customer_token, created_at, updated_at')
    .eq('id', params.id)
    .eq('customer_token', token)
    .maybeSingle()

  if (error || !order) {
    return NextResponse.json({ error: 'Order not found' }, { status: 401 })
  }

  const { data: items } = await db
    .from('order_items')
    .select('id, item_name_snapshot, qty, unit_price_snapshot, line_total, status')
    .eq('order_id', order.id)
    .order('created_at', { ascending: true })

  const { customer_token: _customer_token, ...safeOrder } = order

  return NextResponse.json({ ...safeOrder, items: items ?? [] })
}

export const runtime = "edge";
