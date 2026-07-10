
export const dynamic = process.env.STATIC_EXPORT === '1' ? 'force-static' : 'force-dynamic'
import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'


const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SECRET_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

const db = createClient(supabaseUrl, supabaseKey, {
  auth: { persistSession: false },
})

import { getConfig } from '@/lib/config'
import { rateLimiter, getIp } from '@/lib/rate-limit'
import { orderSchema } from '@/lib/validations'

// Anonymous customer entry point. add_order_items() is SECURITY DEFINER and
// does its own explicit checks (see supabase/migrations/008_pos_core.sql) —
// this route uses the service-role client purely to reach the RPC, the same
// way /api/reservations does; the RPC itself is the real trust boundary, not
// row-level RLS on this connection.
export async function POST(req: Request) {
  if (!getConfig().features.selfOrder) {
    return NextResponse.json({ error: 'Ordering is not enabled for this business' }, { status: 403 })
  }

  // 1. Rate limiting
  const ip = getIp(req)
  if (rateLimiter.orders) {
    const { success } = await rateLimiter.orders.limit(ip)
    if (!success) {
      return NextResponse.json({ error: 'Too many requests. Please try again later.' }, { status: 429 })
    }
  }

  try {
    const body = await req.json()

    // 2. Zod validation
    const parseResult = orderSchema.safeParse(body)
    if (!parseResult.success) {
      return NextResponse.json({ error: parseResult.error.errors[0].message }, { status: 400 })
    }
    const { business_id, table_token, branch_id, order_type, customer_name, customer_phone, items, turnstileToken } = parseResult.data

    // 3. Turnstile verification (optional — only enforced if configured AND a token was sent)
    if (process.env.TURNSTILE_SECRET_KEY && turnstileToken) {
      const turnstileRes = await fetch('https://challenges.cloudflare.com/turnstile/v0/siteverify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: `secret=${encodeURIComponent(process.env.TURNSTILE_SECRET_KEY)}&response=${encodeURIComponent(turnstileToken)}&remoteip=${encodeURIComponent(ip)}`,
      })
      const turnstileData = await turnstileRes.json()
      if (!turnstileData.success) {
        return NextResponse.json({ error: 'CAPTCHA verification failed. Are you a bot?' }, { status: 400 })
      }
    }

    // 4. Resolve the table (if any) from its secret QR token. The friendly
    // table code is deliberately not accepted — it's guessable, the uuid
    // token is not, and anon column privileges keep tokens unlistable.
    let tableId: string | null = null
    if (table_token) {
      const { data: table } = await db
        .from('tables')
        .select('id')
        .eq('business_id', business_id)
        .eq('qr_token', table_token)
        .eq('is_active', true)
        .maybeSingle()
      if (!table) {
        return NextResponse.json({ error: 'Table not found' }, { status: 400 })
      }
      tableId = table.id
    }

    // 5. Place the order — price/availability is re-read live inside the RPC,
    // never trusted from this request body.
    const { data: order, error } = await db.rpc('add_order_items', {
      p_business_id: business_id,
      p_table_id: tableId,
      p_branch_id: branch_id || null,
      p_order_type: order_type,
      p_source: 'customer',
      p_customer_name: customer_name || null,
      p_customer_phone: customer_phone || null,
      p_items: items.map((i) => ({
        item_id: i.item_id,
        qty: i.qty,
        note: i.note ?? null,
        selected_add_on_ids: i.selected_add_on_ids ?? [],
      })),
    })

    if (error) {
      console.error('Order RPC error:', error)
      return NextResponse.json({ error: error.message || 'Failed to place order' }, { status: 400 })
    }

    const { data: orderItems } = await db
      .from('order_items')
      .select('id, item_name_snapshot, qty, unit_price_snapshot, line_total, status')
      .eq('order_id', order.id)
      .order('created_at', { ascending: true })

    return NextResponse.json({
      order_id: order.id,
      customer_token: order.customer_token,
      status: order.status,
      subtotal: order.subtotal,
      tax_amount: order.tax_amount,
      total_amount: order.total_amount,
      items: orderItems ?? [],
    })
  } catch (error: unknown) {
    console.error('Order API error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export const runtime = "edge";
