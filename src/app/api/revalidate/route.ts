
export const dynamic = process.env.STATIC_EXPORT === '1' ? 'force-static' : 'force-dynamic'
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
  
  const { data: staff } = await supabase.from('staff_accounts').select('business_id').eq('user_id', user.id).single()
  if (staff?.business_id) {
    const { data: business } = await supabase.from('businesses').select('slug').eq('id', staff.business_id).single()
    if (business?.slug) {
       // eslint-disable-next-line @typescript-eslint/no-explicit-any
       const cfCaches = typeof caches !== 'undefined' ? (caches as any) : null;
       if (cfCaches?.default) {
         const cacheUrl = `https://internal-cache.local/menu-data/${business.slug}`
         await cfCaches.default.delete(new Request(cacheUrl))
       }
    }
  }

  return NextResponse.json({ ok: true })
}

export const runtime = "edge";
