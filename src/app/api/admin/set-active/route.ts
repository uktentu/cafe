import { NextRequest, NextResponse } from 'next/server'
import { createClient, createAdminClient } from '@/lib/supabase/server'
import { getKV } from '@/lib/menu-data'

export async function PATCH(req: NextRequest) {
  const adminEmail = process.env.ADMIN_EMAIL
  if (!adminEmail) return NextResponse.json({ error: 'Not configured' }, { status: 403 })

  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user || user.email !== adminEmail) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const { businessId, isActive } = await req.json()
  if (!businessId || typeof isActive !== 'boolean') {
    return NextResponse.json({ error: 'Invalid input' }, { status: 400 })
  }

  const admin = createAdminClient()

  // Fetch slug before update so we can clear KV
  const { data: business } = await admin
    .from('businesses')
    .select('slug')
    .eq('id', businessId)
    .single()

  const { error } = await admin
    .from('businesses')
    .update({ is_active: isActive })
    .eq('id', businessId)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  // Clear KV cache so the status change is effective immediately.
  // Suspend: cached menu would otherwise stay live for the next visitor.
  // Reactivate: stale "inactive" state in cache would block the menu.
  if (business?.slug) {
    const kv = getKV()
    if (kv) await kv.delete(`menu:${business.slug}`).catch(() => {})
  }

  return NextResponse.json({ ok: true })
}

export const runtime = 'edge'
