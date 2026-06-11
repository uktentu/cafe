
export const dynamic = process.env.STATIC_EXPORT === '1' ? 'force-static' : 'force-dynamic'
import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'


const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SECRET_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

const db = createClient(supabaseUrl, supabaseKey, {
  auth: { persistSession: false },
})

import { getConfig } from '@/lib/config'
import { rateLimiter, getIp } from '@/lib/rate-limit'
import { reservationSchema } from '@/lib/validations'

export async function POST(req: Request) {
  if (!getConfig().features.reservations) {
    return NextResponse.json({ error: 'Reservations feature is not enabled for this tier' }, { status: 403 })
  }

  // 1. Rate Limiting
  const ip = getIp(req)
  if (rateLimiter.reservations) {
    const { success } = await rateLimiter.reservations.limit(ip)
    if (!success) {
      return NextResponse.json({ error: 'Too many requests. Please try again later.' }, { status: 429 })
    }
  }

  try {
    const body = await req.json()
    
    // 2. Zod Validation
    const parseResult = reservationSchema.safeParse(body)
    if (!parseResult.success) {
      return NextResponse.json({ error: parseResult.error.errors[0].message }, { status: 400 })
    }
    const { business_id, branch_id, name, phone, email, party_size, date, time, notes, turnstileToken } = parseResult.data

    // 3. Turnstile Verification
    if (process.env.TURNSTILE_SECRET_KEY) {
      const turnstileRes = await fetch('https://challenges.cloudflare.com/turnstile/v0/siteverify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: `secret=${encodeURIComponent(process.env.TURNSTILE_SECRET_KEY)}&response=${encodeURIComponent(turnstileToken)}&remoteip=${encodeURIComponent(ip)}`,
      })
      const turnstileData = await turnstileRes.json()
      if (!turnstileData.success) {
        return NextResponse.json({ error: 'CAPTCHA verification failed. Are you a bot?' }, { status: 400 })
      }
    }

    // 4. Insert into Supabase
    const { data, error } = await db.from('reservations').insert({
      business_id,
      branch_id: branch_id || null,
      name,
      phone,
      email: email || null,
      party_size,
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

export const runtime = "edge";
