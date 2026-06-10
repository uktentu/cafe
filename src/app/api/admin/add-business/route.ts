import { NextRequest, NextResponse } from 'next/server'
import { createClient, createAdminClient } from '@/lib/supabase/server'
import type { Tier } from '@/types/database'

export const runtime = 'edge'

const SEED_CATEGORIES = [
  { name: 'Starters', icon: 'soup', sort_order: 1 },
  { name: 'Main Course', icon: 'utensils', sort_order: 2 },
  { name: 'Beverages', icon: 'coffee', sort_order: 3 },
]

export async function POST(req: NextRequest) {
  const adminEmail = process.env.ADMIN_EMAIL
  if (!adminEmail) return NextResponse.json({ error: 'Not configured' }, { status: 403 })

  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user || user.email !== adminEmail) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const { name, slug, city, phone, email, tier } = await req.json() as {
    name: string; slug: string; city: string; phone: string; email: string; tier: Tier
  }

  if (!name || !slug || !email || !tier) {
    return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
  }

  const admin = createAdminClient()

  // 1. Create business row
  const { data: biz, error: bizErr } = await admin
    .from('businesses')
    .insert({
      name,
      slug,
      city: city || null,
      phone: phone || null,
      email,
      tier,
      theme: 'mercado',
      theme_color: '#E84B1A',
      is_active: true,
      tagline: `Welcome to ${name}`,
      social_links: {},
      opening_hours: {},
    })
    .select('id')
    .single()

  if (bizErr) return NextResponse.json({ error: bizErr.message }, { status: 500 })

  // 2. Create owner auth user
  const { data: authUser, error: authErr } = await admin.auth.admin.createUser({
    email,
    password: generatePassword(),
    email_confirm: true,
  })
  if (authErr && !authErr.message.includes('already registered')) {
    return NextResponse.json({ error: authErr.message }, { status: 500 })
  }

  const ownerId = authUser?.user?.id
  if (ownerId) {
    // 3. Link staff_accounts
    await admin.from('staff_accounts').insert({
      business_id: biz.id,
      user_id: ownerId,
      role: 'owner',
      is_active: true,
    })
  }

  // 4. Seed categories
  const { data: cats } = await admin
    .from('categories')
    .insert(SEED_CATEGORIES.map(c => ({ ...c, business_id: biz.id, is_active: true })))
    .select('id, name')

  // 5. Seed a sample item in each category
  if (cats && cats.length > 0) {
    const sampleItems = cats.map((cat, i) => ({
      business_id: biz.id,
      category_id: cat.id,
      name: i === 0 ? 'Paneer Tikka' : i === 1 ? 'Dal Makhani' : 'Masala Chai',
      description: 'A delicious item to get started.',
      price: i === 0 ? 220 : i === 1 ? 180 : 40,
      is_active: true,
      is_available: true,
      image_mode: 'none',
      sort_order: 1,
      dietary: 'veg',
    }))
    await admin.from('items').insert(sampleItems)
  }

  // 6. Build env vars string for the developer to copy into Cloudflare Pages
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseAnon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  const cdnUrl = process.env.NEXT_PUBLIC_CDN_URL || 'https://cdn.yourdomain.in'
  const devContact = process.env.NEXT_PUBLIC_DEVELOPER_CONTACT || ''

  const envVars = [
    `# MenuOS — ${name}`,
    `# Copy these into Cloudflare Pages → Settings → Environment variables`,
    ``,
    `NEXT_PUBLIC_CLIENT_SLUG=${slug}`,
    `NEXT_PUBLIC_SITE_URL=https://${slug}.menuos.in`,
    `NEXT_PUBLIC_TIER=${tier}`,
    ``,
    `NEXT_PUBLIC_SUPABASE_URL=${supabaseUrl}`,
    `NEXT_PUBLIC_SUPABASE_ANON_KEY=${supabaseAnon}`,
    `SUPABASE_SERVICE_ROLE_KEY=<your-service-role-key>`,
    ``,
    `NEXT_PUBLIC_CDN_URL=${cdnUrl}`,
    ``,
    `NEXT_PUBLIC_WHATSAPP=${phone?.replace(/[^0-9]/g, '') || ''}`,
    `NEXT_PUBLIC_PHONE=${phone || ''}`,
    ``,
    `OWNER_EMAIL=${email}`,
    `ADMIN_EMAIL=${adminEmail}`,
    ``,
    `NEXT_PUBLIC_DEVELOPER_CONTACT=${devContact}`,
    ``,
    `NEXT_PUBLIC_THEME=mercado`,
    `NEXT_PUBLIC_RESERVATIONS=false`,
    `NEXT_PUBLIC_MULTI_BRANCH=false`,
    `NEXT_PUBLIC_BILINGUAL=false`,
    ``,
    `# Business ID (for reference): ${biz.id}`,
    `# Owner Email: ${email}`,
    `# Tier: ${tier}`,
  ].join('\n')

  return NextResponse.json({ ok: true, businessId: biz.id, envVars })
}

function generatePassword() {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789!@#$'
  return Array.from({ length: 16 }, () => chars[Math.floor(Math.random() * chars.length)]).join('')
}
