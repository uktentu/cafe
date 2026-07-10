/* eslint-disable @typescript-eslint/no-explicit-any */


export const dynamic = process.env.STATIC_EXPORT === '1' ? 'force-static' : 'force-dynamic'
// POST /api/track — persist a subset of analytics events server-side so the
// public menu bundle never ships @supabase/supabase-js (~65KB). Called via
// navigator.sendBeacon from lib/firebase.ts. Fire-and-forget: always 204.
import { createAdminClient } from '@/lib/supabase/server'
import type { AnalyticsEventType } from '@/types/database'


const ALLOWED: ReadonlySet<string> = new Set<AnalyticsEventType>([
  'page_view', 'item_view', 'whatsapp_click', 'call_click',
  'maps_click', 'reservation_submit', 'category_tap', 'share',
  'order_placed', 'order_settled',
])

import { rateLimiter, getIp } from '@/lib/rate-limit'

export async function POST(request: Request) {
  try {
    const ip = getIp(request)
    if (rateLimiter.analytics) {
      const { success } = await rateLimiter.analytics.limit(ip)
      if (!success) {
        return new Response(null, { status: 429 }) // Too many requests
      }
    }
    if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
      return new Response(null, { status: 204 })
    }
    const body = (await request.json()) as any
    const eventsRaw = Array.isArray(body) ? body : [body]
    
    const validEvents = eventsRaw.filter((e: any) => 
      e.business_id && e.event_type && ALLOWED.has(e.event_type)
    ).map((e: any) => ({
      business_id: e.business_id,
      event_type: e.event_type,
      item_id: e.item_id ?? null,
      session_id: e.session_id ?? null,
    }))

    if (validEvents.length === 0) {
      return new Response(null, { status: 204 })
    }

    await createAdminClient()
      .from('analytics_events')
      .insert(validEvents)
  } catch {
    /* analytics must never error */
  }
  return new Response(null, { status: 204 })
}


export const runtime = "edge";
