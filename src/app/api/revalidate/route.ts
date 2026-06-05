export const runtime = 'edge'
export const dynamic = 'force-dynamic'
// POST /api/revalidate — push the public menu's ISR cache after a CMS write
// done via the browser Supabase client. Auth required. Rule: every CMS mutation
// that affects the public menu calls this so changes go live in ≤ 30s.
import { NextResponse } from 'next/server'
import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import { supabaseConfigured } from '@/lib/env'


export async function POST() {
  if (!supabaseConfigured()) {
    return NextResponse.json({ error: 'Supabase not configured' }, { status: 503 })
  }
  const supabase = createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  revalidatePath('/', 'layout')
  return NextResponse.json({ ok: true })
}
