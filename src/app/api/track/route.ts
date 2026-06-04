// POST /api/track — persist a subset of analytics events server-side so the
// public menu bundle never ships @supabase/supabase-js (~65KB). Called via
// navigator.sendBeacon from lib/firebase.ts. Fire-and-forget: always 204.
import { createAdminClient } from '@/lib/supabase/server'
import type { AnalyticsEventType } from '@/types/database'

export const runtime = 'edge'

const ALLOWED: ReadonlySet<string> = new Set<AnalyticsEventType>([
  'page_view', 'item_view', 'whatsapp_click', 'call_click',
  'maps_click', 'reservation_submit', 'category_tap', 'share',
])

export async function POST(request: Request) {
  try {
    if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
      return new Response(null, { status: 204 })
    }
    const body = (await request.json()) as {
      business_id?: string
      event_type?: string
      item_id?: string | null
      session_id?: string | null
    }
    if (!body.business_id || !body.event_type || !ALLOWED.has(body.event_type)) {
      return new Response(null, { status: 204 })
    }
    await createAdminClient()
      .from('analytics_events')
      .insert({
        business_id: body.business_id,
        event_type: body.event_type,
        item_id: body.item_id ?? null,
        session_id: body.session_id ?? null,
      })
  } catch {
    /* analytics must never error */
  }
  return new Response(null, { status: 204 })
}
