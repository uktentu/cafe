import { NextRequest, NextResponse } from 'next/server'
import { createClient, createAdminClient } from '@/lib/supabase/server'

export const runtime = 'edge'

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
  const { error } = await admin
    .from('businesses')
    .update({ is_active: isActive })
    .eq('id', businessId)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ ok: true })
}
