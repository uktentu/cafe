// PATCH /api/items/avail?id=<item-uuid>
// Toggle sold-out status. Replaces the dynamic /api/items/[id]/avail endpoint
// with a static-segment route so output:'export' (GitHub Pages) doesn't require
// generateStaticParams — API routes are excluded from static export entirely.
import { NextRequest, NextResponse } from 'next/server'
import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import { supabaseConfigured } from '@/lib/env'

export const runtime = 'edge'

export async function PATCH(request: NextRequest) {
  if (!supabaseConfigured()) {
    return NextResponse.json({ error: 'Supabase not configured' }, { status: 503 })
  }

  const itemId = request.nextUrl.searchParams.get('id')
  if (!itemId) {
    return NextResponse.json({ error: 'id query param required' }, { status: 400 })
  }

  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  let body: { is_available?: boolean }
  try { body = await request.json() } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 })
  }
  if (typeof body.is_available !== 'boolean') {
    return NextResponse.json({ error: 'is_available (boolean) required' }, { status: 400 })
  }

  const { data, error } = await supabase
    .from('items')
    .update({ is_available: body.is_available, updated_at: new Date().toISOString() })
    .eq('id', itemId)
    .select('id, is_available')
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 403 })
  revalidatePath('/')
  return NextResponse.json({ ok: true, item: data })
}
