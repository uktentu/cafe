export const runtime = 'edge'
export const dynamic = 'force-dynamic'
// ════════════════════════════════════════════════════════════════════
// PATCH /api/items/[id]/avail — toggle sold-out, then revalidate the menu.
// RLS (cookie-bound client) enforces that the caller is staff of the business.
// revalidatePath('/') makes the price/availability change live in ≤ 30s.
// ════════════════════════════════════════════════════════════════════
import { NextResponse } from 'next/server'
import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import { supabaseConfigured } from '@/lib/env'

// API routes are excluded from static export, but Next.js still requires
// generateStaticParams for dynamic segments when output: 'export' is set.
// Placeholder so output:'export' doesn't fail — this route is excluded from
// static output anyway. The ID value is never actually used in static export.
export function generateStaticParams() { return [{ id: 'placeholder' }] }

export async function PATCH(
  request: Request,
  { params }: { params: { id: string } },
) {
  if (!supabaseConfigured()) {
    return NextResponse.json({ error: 'Supabase not configured' }, { status: 503 })
  }
  const supabase = createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  let body: { is_available?: boolean }
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 })
  }
  if (typeof body.is_available !== 'boolean') {
    return NextResponse.json({ error: 'is_available (boolean) required' }, { status: 400 })
  }

  const { data, error } = await supabase
    .from('items')
    .update({ is_available: body.is_available, updated_at: new Date().toISOString() })
    .eq('id', params.id)
    .select('id, is_available')
    .single()

  if (error) {
    // RLS denial surfaces here too (no matching row for this staff member).
    return NextResponse.json({ error: error.message }, { status: 403 })
  }

  // Push the change to the public menu's ISR cache immediately.
  revalidatePath('/')

  return NextResponse.json({ ok: true, item: data })
}
