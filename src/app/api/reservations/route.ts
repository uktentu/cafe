export const runtime = 'edge'
export const dynamic = 'force-dynamic'
import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'


const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SECRET_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

const db = createClient(supabaseUrl, supabaseKey, {
  auth: { persistSession: false },
})

import { getConfig } from '@/lib/config'

export async function POST(req: Request) {
  if (!getConfig().features.reservations) {
    return NextResponse.json({ error: 'Reservations feature is not enabled for this tier' }, { status: 403 })
  }
  try {
    const body = await req.json()
    const { business_id, branch_id, name, phone, email, party_size, date, time, notes } = body

    if (!business_id || !name || !phone || !party_size || !date || !time) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    const { data, error } = await db.from('reservations').insert({
      business_id,
      branch_id: branch_id || null,
      name,
      phone,
      email: email || null,
      party_size: Number(party_size),
      date,
      time,
      notes: notes || null,
      status: 'pending'
    }).select('id').single()

    if (error) {
      console.error('Reservation insert error:', error)
      return NextResponse.json({ error: 'Failed to create reservation' }, { status: 500 })
    }

    // TODO: Integrate Brevo or Resend here to send a confirmation email
    // if (process.env.BREVO_API_KEY && email) { ... }

    return NextResponse.json({ success: true, id: data.id })
  } catch (error: unknown) {
    console.error('Reservation API error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
