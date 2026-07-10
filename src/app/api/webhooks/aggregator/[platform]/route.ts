export const dynamic = process.env.STATIC_EXPORT === '1' ? 'force-static' : 'force-dynamic'
// ════════════════════════════════════════════════════════════════════
// POST /api/webhooks/aggregator/[platform]  (platform = swiggy | zomato)
//
// The real ingestion seam for delivery aggregators. When you're onboarded to
// Swiggy/Zomato's partner API, point their order webhook at this URL. Each
// request must carry the shared secret in `x-webhook-secret` matching
// AGGREGATOR_WEBHOOK_SECRET. The order is scoped to THIS deployment's business
// (NEXT_PUBLIC_CLIENT_SLUG) — never taken from the body — and created via the
// create_external_order RPC (prices taken as-is from the platform payload).
//
// Expected body (normalise the platform's payload to this shape in your
// middleware, or send it directly if the platform allows a custom webhook):
//   { "external_ref": "SW-12345", "order_type": "delivery",
//     "customer_name": "…", "customer_phone": "…",
//     "items": [{ "name": "Paneer Tikka", "price": 220, "qty": 1, "note": "" }] }
// ════════════════════════════════════════════════════════════════════
import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SECRET_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
const db = createClient(supabaseUrl, supabaseKey, { auth: { persistSession: false } })

export function generateStaticParams() { return [{ platform: 'swiggy' }, { platform: 'zomato' }] }

export async function POST(req: Request, { params }: { params: { platform: string } }) {
  const platform = params.platform
  if (platform !== 'swiggy' && platform !== 'zomato') {
    return NextResponse.json({ error: 'Unknown platform' }, { status: 404 })
  }

  // Shared-secret gate. If unset, the webhook is not configured — reject all.
  const secret = process.env.AGGREGATOR_WEBHOOK_SECRET
  if (!secret || req.headers.get('x-webhook-secret') !== secret) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const slug = process.env.NEXT_PUBLIC_CLIENT_SLUG
  if (!slug) {
    return NextResponse.json({ error: 'Deployment not configured' }, { status: 503 })
  }

  let body: {
    external_ref?: string
    order_type?: string
    customer_name?: string
    customer_phone?: string
    items?: { name?: string; price?: number; qty?: number; note?: string }[]
  }
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 })
  }

  const items = (body.items ?? []).filter((i) => i && i.name && Number(i.price) >= 0 && Number(i.qty) > 0)
  if (items.length === 0) {
    return NextResponse.json({ error: 'No valid items' }, { status: 400 })
  }

  const { data: biz } = await db.from('businesses').select('id').eq('slug', slug).maybeSingle()
  if (!biz) {
    return NextResponse.json({ error: 'Business not found' }, { status: 404 })
  }

  const { data: order, error } = await db.rpc('create_external_order', {
    p_business_id: biz.id,
    p_channel: platform,
    p_external_ref: body.external_ref ?? null,
    p_order_type: body.order_type ?? 'delivery',
    p_customer_name: body.customer_name ?? null,
    p_customer_phone: body.customer_phone ?? null,
    p_items: items.map((i) => ({ name: i.name, price: Number(i.price), qty: Number(i.qty), note: i.note ?? null })),
  })

  if (error) {
    console.error('Aggregator webhook RPC error:', error)
    return NextResponse.json({ error: error.message || 'Failed to create order' }, { status: 400 })
  }

  return NextResponse.json({ ok: true, order_id: order.id, channel: platform })
}

export const runtime = 'edge'
