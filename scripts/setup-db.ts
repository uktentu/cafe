/**
 * setup-db.ts — bootstrap the Supabase database for MenuOS.
 *
 * What it does:
 *   1. Tries to run the core schema migrations via Supabase Management API.
 *   2. If that fails (no access token), prints the combined SQL to paste into
 *      the Supabase SQL editor and exits gracefully.
 *   3. Seeds stock images, demo business, categories, items, and auth user.
 *
 * Usage:
 *   pnpm tsx scripts/setup-db.ts
 *   pnpm tsx scripts/setup-db.ts --seed-only   (if tables already exist)
 */
import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import { config as loadEnv } from 'dotenv'
import { createClient } from '@supabase/supabase-js'
import ws from 'ws'

loadEnv({ path: '.env.local' })

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!
const SERVICE_KEY =
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SECRET_KEY || ''
const PROJECT_REF = SUPABASE_URL?.match(/https:\/\/([^.]+)\.supabase\.co/)?.[1] ?? ''

function db() {
  return createClient(SUPABASE_URL, SERVICE_KEY, {
    auth: { autoRefreshToken: false, persistSession: false },
    realtime: { transport: ws as any },
  })
}

async function tablesExist(): Promise<boolean> {
  const { error } = await db().from('businesses').select('id').limit(1)
  // PGRST116 = table not found; any other error means table exists
  return !error || error.code !== '42P01'
}

async function tryRunMigrations(): Promise<boolean> {
  const ACCESS_TOKEN = process.env.SUPABASE_ACCESS_TOKEN
  if (!ACCESS_TOKEN) return false

  const sql = readFileSync(
    join(process.cwd(), 'supabase/combined_migration.sql'),
    'utf-8',
  )
  const res = await fetch(
    `https://api.supabase.com/v1/projects/${PROJECT_REF}/database/query`,
    {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${ACCESS_TOKEN}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ query: sql }),
    },
  )
  return res.ok
}

async function seed() {
  const supabase = db()

  console.log('\n  Seeding stock images...')
  const { error: siErr } = await supabase.from('stock_images').upsert([
    { r2_key: 'stock/indian/biryani.webp',         category: 'indian',      name: 'Biryani',          tags: ['rice','biryani','north-indian'], sort_order: 1 },
    { r2_key: 'stock/indian/butter-chicken.webp',  category: 'indian',      name: 'Butter Chicken',   tags: ['curry','chicken','north-indian'], sort_order: 2 },
    { r2_key: 'stock/indian/dal-makhani.webp',     category: 'indian',      name: 'Dal Makhani',      tags: ['dal','veg','north-indian'], sort_order: 3 },
    { r2_key: 'stock/indian/paneer-tikka.webp',    category: 'indian',      name: 'Paneer Tikka',     tags: ['paneer','veg','starter'], sort_order: 4 },
    { r2_key: 'stock/indian/samosa.webp',          category: 'indian',      name: 'Samosa',           tags: ['snack','veg','street'], sort_order: 5 },
    { r2_key: 'stock/indian/naan.webp',            category: 'indian',      name: 'Naan',             tags: ['bread','veg'], sort_order: 6 },
    { r2_key: 'stock/chinese/hakka-noodles.webp',  category: 'chinese',     name: 'Hakka Noodles',    tags: ['noodles','indo-chinese'], sort_order: 1 },
    { r2_key: 'stock/chinese/chilli-paneer.webp',  category: 'chinese',     name: 'Chilli Paneer',    tags: ['paneer','veg','indo-chinese'], sort_order: 2 },
    { r2_key: 'stock/continental/pizza.webp',      category: 'continental', name: 'Pizza',            tags: ['italian','baked'], sort_order: 1 },
    { r2_key: 'stock/continental/burger.webp',     category: 'continental', name: 'Burger',           tags: ['fast-food','snack'], sort_order: 2 },
    { r2_key: 'stock/drinks/chai.webp',            category: 'drinks',      name: 'Chai',             tags: ['hot','tea','indian'], sort_order: 1 },
    { r2_key: 'stock/drinks/coffee.webp',          category: 'drinks',      name: 'Coffee',           tags: ['hot','coffee'], sort_order: 2 },
    { r2_key: 'stock/drinks/cold-coffee.webp',     category: 'drinks',      name: 'Cold Coffee',      tags: ['cold','coffee'], sort_order: 3 },
    { r2_key: 'stock/drinks/lassi.webp',           category: 'drinks',      name: 'Lassi',            tags: ['cold','dairy','indian'], sort_order: 4 },
    { r2_key: 'stock/desserts/gulab-jamun.webp',   category: 'desserts',    name: 'Gulab Jamun',      tags: ['sweet','indian'], sort_order: 1 },
    { r2_key: 'stock/desserts/ice-cream.webp',     category: 'desserts',    name: 'Ice Cream',        tags: ['cold','sweet'], sort_order: 2 },
    { r2_key: 'stock/street/pav-bhaji.webp',       category: 'street',      name: 'Pav Bhaji',        tags: ['street','veg','mumbai'], sort_order: 1 },
    { r2_key: 'stock/street/vada-pav.webp',        category: 'street',      name: 'Vada Pav',         tags: ['street','veg','mumbai'], sort_order: 2 },
    { r2_key: 'stock/hero/restaurant-interior.webp', category: 'hero',      name: 'Restaurant',       tags: ['interior','ambience'], sort_order: 1 },
    { r2_key: 'stock/hero/cafe-interior.webp',     category: 'hero',        name: 'Cafe Interior',    tags: ['cafe','light'], sort_order: 2 },
  ], { onConflict: 'r2_key' })
  if (siErr) throw new Error(`stock_images: ${siErr.message}`)
  console.log('  ✓ stock images')

  console.log('  Seeding demo business...')
  const { data: biz, error: bizErr } = await supabase
    .from('businesses')
    .upsert({
      slug: 'demo-cafe',
      name: 'Demo Cafe',
      tagline: 'Good food, good vibes.',
      city: 'Bengaluru',
      phone: '+91-98765-43210',
      whatsapp: '919876543210',
      email: 'owner@democafe.in',
      tier: 'basic',
      theme: 'mercado',
      theme_color: '#E5292A',
    }, { onConflict: 'slug' })
    .select('id')
    .single()
  if (bizErr) throw new Error(`business: ${bizErr.message}`)
  const bid = biz.id as string
  console.log(`  ✓ business (id: ${bid})`)

  console.log('  Seeding categories...')
  // Delete and re-insert categories (clean state)
  await supabase.from('categories').delete().eq('business_id', bid)
  const { data: cats, error: catErr } = await supabase.from('categories').insert([
    { business_id: bid, name: 'Starters', icon: 'Soup', sort_order: 1 },
    { business_id: bid, name: 'Mains', icon: 'UtensilsCrossed', sort_order: 2 },
    { business_id: bid, name: 'Drinks', icon: 'CupSoda', sort_order: 3 },
  ]).select('id, name')
  if (catErr) throw new Error(`categories: ${catErr.message}`)
  const cid = (name: string) => cats!.find((c) => c.name === name)!.id

  console.log('  Seeding items...')
  await supabase.from('items').delete().eq('business_id', bid)
  const items = [
    // Starters
    { business_id: bid, category_id: cid('Starters'), name: 'Paneer Tikka',    description: 'Char-grilled cottage cheese, mint chutney.',     price: 220, image_mode: 'stock', stock_image_key: 'stock/indian/paneer-tikka.webp',    dietary: 'veg',  badge: 'bestseller',  is_featured: true,  sort_order: 1 },
    { business_id: bid, category_id: cid('Starters'), name: 'Samosa (2 pcs)',  description: 'Crisp pastry, spiced potato filling.',           price: 60,  image_mode: 'stock', stock_image_key: 'stock/indian/samosa.webp',          dietary: 'veg',  badge: null,          is_featured: false, sort_order: 2 },
    { business_id: bid, category_id: cid('Starters'), name: 'Chilli Paneer',   description: 'Indo-Chinese, sweet & spicy.',                   price: 210, image_mode: 'stock', stock_image_key: 'stock/chinese/chilli-paneer.webp',  dietary: 'veg',  badge: 'spicy',       is_featured: false, sort_order: 3 },
    { business_id: bid, category_id: cid('Starters'), name: 'Garlic Bread',    description: 'Toasted, herb butter.',                          price: 120, image_mode: 'none',  stock_image_key: null,                                dietary: 'veg',  badge: null,          is_featured: false, sort_order: 4 },
    // Mains
    { business_id: bid, category_id: cid('Mains'),    name: 'Chicken Biryani', description: 'Dum-cooked basmati, tender chicken, raita.',     price: 280, image_mode: 'stock', stock_image_key: 'stock/indian/biryani.webp',         dietary: 'non-veg', badge: 'bestseller',  is_featured: true,  sort_order: 1, compare_price: 320 },
    { business_id: bid, category_id: cid('Mains'),    name: 'Dal Makhani',     description: 'Slow-cooked black lentils, cream.',              price: 190, image_mode: 'stock', stock_image_key: 'stock/indian/dal-makhani.webp',    dietary: 'veg',  badge: 'chef_special', is_featured: false, sort_order: 2 },
    { business_id: bid, category_id: cid('Mains'),    name: 'Butter Chicken',  description: 'Tomato-butter gravy, charred chicken.',          price: 290, image_mode: 'stock', stock_image_key: 'stock/indian/butter-chicken.webp', dietary: 'non-veg', badge: null,          is_featured: false, sort_order: 3 },
    { business_id: bid, category_id: cid('Mains'),    name: 'Veg Hakka Noodles', description: 'Wok-tossed noodles, crunchy veg.',            price: 170, image_mode: 'stock', stock_image_key: 'stock/chinese/hakka-noodles.webp', dietary: 'veg',  badge: null,          is_featured: false, sort_order: 4 },
    { business_id: bid, category_id: cid('Mains'),    name: 'Margherita Pizza', description: '8-inch, San Marzano, fresh basil.',            price: 240, image_mode: 'none',  stock_image_key: null,                                dietary: 'veg',  badge: 'new',         is_featured: false, sort_order: 5 },
    // Drinks
    { business_id: bid, category_id: cid('Drinks'),   name: 'Masala Chai',     description: 'Cutting chai, ginger & cardamom.',              price: 40,  image_mode: 'stock', stock_image_key: 'stock/drinks/chai.webp',            dietary: 'veg',  badge: null,          is_featured: false, sort_order: 1 },
    { business_id: bid, category_id: cid('Drinks'),   name: 'Cold Coffee',     description: 'Blended, thick, chocolate drizzle.',            price: 130, image_mode: 'stock', stock_image_key: 'stock/drinks/cold-coffee.webp',     dietary: 'veg',  badge: null,          is_featured: false, sort_order: 2 },
    { business_id: bid, category_id: cid('Drinks'),   name: 'Sweet Lassi',     description: 'Whisked yogurt, house special.',                price: 90,  image_mode: 'none',  stock_image_key: null,                                dietary: 'veg',  badge: null,          is_featured: false, sort_order: 3 },
  ]
  const { error: itemErr } = await supabase.from('items').insert(items)
  if (itemErr) throw new Error(`items: ${itemErr.message}`)
  console.log(`  ✓ ${items.length} items`)

  console.log('  Creating owner auth account...')
  const OWNER_EMAIL = 'owner@democafe.in'
  const OWNER_PASSWORD = 'MenuOS#2024'
  // Try to delete existing user first (upsert-style)
  const { data: existing } = await supabase.auth.admin.listUsers()
  const existingUser = existing?.users?.find((u) => u.email === OWNER_EMAIL)
  if (existingUser) {
    await supabase.auth.admin.updateUserById(existingUser.id, { password: OWNER_PASSWORD })
    console.log('  ✓ owner auth (updated existing)')
    // Ensure staff record
    await supabase.from('staff_accounts').upsert(
      { business_id: bid, user_id: existingUser.id, role: 'owner', name: 'Demo Owner', is_active: true },
      { onConflict: 'business_id,user_id' },
    )
  } else {
    const { data: newUser, error: authErr } = await supabase.auth.admin.createUser({
      email: OWNER_EMAIL,
      password: OWNER_PASSWORD,
      email_confirm: true,
    })
    if (authErr) throw new Error(`auth.createUser: ${authErr.message}`)
    await supabase.from('staff_accounts').insert({
      business_id: bid,
      user_id: newUser.user.id,
      role: 'owner',
      name: 'Demo Owner',
    })
    console.log('  ✓ owner auth (created)')
  }
}

async function main() {
  const seedOnly = process.argv.includes('--seed-only')
  console.log('\n═══════════════════════════════════════════')
  console.log('  MenuOS — Database Setup')
  console.log('═══════════════════════════════════════════\n')

  if (!SUPABASE_URL || !SERVICE_KEY) {
    console.error('✗  NEXT_PUBLIC_SUPABASE_URL or service key not set in .env.local')
    process.exit(1)
  }
  console.log(`  Project: ${PROJECT_REF}`)

  if (!seedOnly) {
    const already = await tablesExist()
    if (already) {
      console.log('  Tables already exist — skipping migrations.\n')
    } else {
      console.log('  Tables not found. Trying Management API migration...')
      const ok = await tryRunMigrations()
      if (ok) {
        console.log('  ✓ Migrations applied via Management API\n')
      } else {
        console.log('\n  ─────────────────────────────────────────────────────')
        console.log('  Tables do not exist. Run this SQL in the Supabase')
        console.log('  dashboard (https://supabase.com/dashboard):')
        console.log('  → Select your project → SQL editor → New query')
        console.log('  → Paste the contents of:')
        console.log('      supabase/combined_migration.sql')
        console.log('  → Click "Run"')
        console.log('  Then re-run:  pnpm tsx scripts/setup-db.ts\n')
        console.log('  ─────────────────────────────────────────────────────\n')
        process.exit(1)
      }
    }
  }

  console.log('  Seeding database...')
  await seed()

  console.log('\n  ✓ Setup complete!')
  console.log('\n  ┌─────────────────────────────────────────┐')
  console.log('  │  CMS login: http://localhost:3000/cms/login')
  console.log('  │  Email:     owner@democafe.in')
  console.log('  │  Password:  MenuOS#2024')
  console.log('  └─────────────────────────────────────────┘\n')
}

main().catch((e) => {
  console.error('\n✗ setup-db failed:', e.message ?? e)
  process.exit(1)
})
