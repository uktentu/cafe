export const dynamic = process.env.STATIC_EXPORT === '1' ? 'force-static' : 'force-dynamic'
// POST /api/revalidate — on every CMS write that affects the public menu:
//   1. Fetches fresh data from Supabase
//   2. Writes it into Cloudflare KV (MENU_CACHE binding)
//
// KV is globally replicated — all PoPs worldwide read the new data immediately.
// No per-PoP cache invalidation needed; no stale data window.
import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { supabaseConfigured } from '@/lib/env'
import { fetchFreshMenuData, getKV } from '@/lib/menu-data'

export async function POST() {
  if (!supabaseConfigured()) {
    return NextResponse.json({ error: 'Supabase not configured' }, { status: 503 })
  }
  const supabase = createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { data: staff } = await supabase
    .from('staff_accounts')
    .select('business_id')
    .eq('user_id', user.id)
    .single()

  if (staff?.business_id) {
    const { data: business } = await supabase
      .from('businesses')
      .select('slug')
      .eq('id', staff.business_id)
      .single()

    if (business?.slug) {
      const kv = getKV()
      if (kv) {
        // Write-through: fetch fresh data and push directly into KV.
        // All edge nodes globally read the new value on their next request.
        const freshData = await fetchFreshMenuData(business.slug)
        if (freshData) {
          await kv.put(`menu:${business.slug}`, JSON.stringify(freshData))
        }
      }
    }
  }

  return NextResponse.json({ ok: true })
}

export const runtime = 'edge'
