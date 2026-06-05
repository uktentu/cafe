
export const dynamic = process.env.STATIC_EXPORT === '1' ? 'force-static' : 'force-dynamic'
import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'


const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SECRET_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

const db = createClient(supabaseUrl, supabaseKey, {
  auth: { persistSession: false },
})

export async function GET(req: Request, { params }: { params: { id: string } }) {
  try {
    const { data, error } = await db.from('qr_codes').select('target_url').eq('id', params.id).single()
    
    if (error || !data) {
      // Fallback to homepage if QR is deleted/invalid
      return NextResponse.redirect(new URL('/', req.url))
    }

    // Redirect to the target URL
    return NextResponse.redirect(new URL(data.target_url, req.url))
  } catch {
    return NextResponse.redirect(new URL('/', req.url))
  }
}

export function generateStaticParams() { return [{ id: 'placeholder' }] }

export const runtime = "edge";
