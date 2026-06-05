export const runtime = 'edge'
export const dynamic = 'force-dynamic'
import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'


const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SECRET_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

const db = createClient(supabaseUrl, supabaseKey, {
  auth: { persistSession: false },
})

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url)
    const businessId = searchParams.get('businessId')

    if (!businessId) {
      return NextResponse.json({ error: 'Missing businessId' }, { status: 400 })
    }

    // Fetch all related data
    const [business, categories, items, branches] = await Promise.all([
      db.from('businesses').select('*').eq('id', businessId).single(),
      db.from('categories').select('*').eq('business_id', businessId),
      db.from('items').select('*').eq('business_id', businessId),
      db.from('branches').select('*').eq('business_id', businessId),
    ])

    if (business.error) throw business.error

    const exportData = {
      timestamp: new Date().toISOString(),
      business: business.data,
      branches: branches.data || [],
      categories: categories.data || [],
      items: items.data || [],
    }

    // Return as a downloadable JSON file
    return new NextResponse(JSON.stringify(exportData, null, 2), {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
        'Content-Disposition': `attachment; filename="menu-export-${businessId}.json"`,
      },
    })
  } catch (error: unknown) {
    console.error('Export API error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
