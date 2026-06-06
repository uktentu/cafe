import { config as loadEnv } from 'dotenv'
import { createClient } from '@supabase/supabase-js'

loadEnv({ path: '.env.local' })

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!
const SERVICE_KEY =
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SECRET_KEY || ''

if (!SUPABASE_URL || !SERVICE_KEY) {
  console.error('✗ NEXT_PUBLIC_SUPABASE_URL or service key not set')
  process.exit(1)
}

const supabase = createClient(SUPABASE_URL, SERVICE_KEY, {
  auth: { autoRefreshToken: false, persistSession: false },
})

const NUM_BUSINESSES = 500
const ITEMS_PER_BUSINESS = 100
const TOTAL_ITEMS = NUM_BUSINESSES * ITEMS_PER_BUSINESS

async function main() {
  if (process.argv.includes('--cleanup')) {
    console.log(`\n🧹 Cleaning up load-testing data...`)
    const { error, count } = await supabase
      .from('businesses')
      .delete({ count: 'exact' })
      .like('slug', 'scale-biz-%')

    if (error) {
      console.error('✗ Cleanup failed:', error.message)
      process.exit(1)
    }
    console.log(`✓ Cleanup complete. Deleted ${count ?? 0} scale businesses (and all cascading items/categories).\n`)
    return
  }

  console.log(`\n🚀 Starting Massive Scale Seed (50k items)...`)
  console.log(`Target: ${NUM_BUSINESSES} businesses | ${ITEMS_PER_BUSINESS} items/biz | ${TOTAL_ITEMS} total items\n`)
  console.log(`(Run with --cleanup to delete this data later)\n`)

  // 1. Generate Businesses
  console.log('1️⃣ Generating 500 businesses...')
  const businesses = []
  for (let i = 1; i <= NUM_BUSINESSES; i++) {
    businesses.push({
      slug: `scale-biz-${i}`,
      name: `Scale Business ${i}`,
      tagline: 'Built for scale testing.',
      city: 'Load City',
      phone: `+1-555-000-${String(i).padStart(4, '0')}`,
      tier: 'premium',
      theme: 'nocturne', // Test complex themes
      theme_color: '#3b82f6',
    })
  }

  // Insert businesses in batches of 100
  for (let i = 0; i < businesses.length; i += 100) {
    const batch = businesses.slice(i, i + 100)
    const { error } = await supabase.from('businesses').upsert(batch, { onConflict: 'slug' })
    if (error) {
      console.error(`✗ Failed to insert businesses (batch ${i}):`, error.message)
      process.exit(1)
    }
  }

  // Fetch inserted business IDs mapped by slug
  const { data: bData, error: bErr } = await supabase.from('businesses').select('id, slug').like('slug', 'scale-biz-%')
  if (bErr || !bData) {
    console.error('✗ Failed to fetch business IDs:', bErr?.message)
    process.exit(1)
  }
  const bizMap = new Map(bData.map((b) => [b.slug, b.id]))
  console.log(`✓ Inserted/fetched ${bizMap.size} businesses.`)

  // 2. Generate Categories
  console.log('\n2️⃣ Generating categories (3 per business)...')
  const categories = []
  for (let i = 1; i <= NUM_BUSINESSES; i++) {
    const bid = bizMap.get(`scale-biz-${i}`)
    if (!bid) continue
    categories.push({ business_id: bid, name: 'Starters', icon: 'Soup', sort_order: 1 })
    categories.push({ business_id: bid, name: 'Mains', icon: 'UtensilsCrossed', sort_order: 2 })
    categories.push({ business_id: bid, name: 'Desserts', icon: 'IceCream', sort_order: 3 })
  }

  for (let i = 0; i < categories.length; i += 500) {
    const batch = categories.slice(i, i + 500)
    const { error } = await supabase.from('categories').insert(batch)
    // Ignore duplicate errors if re-running
    if (error && error.code !== '23505') {
      console.error(`✗ Failed to insert categories:`, error.message)
    }
  }

  // Fetch categories mapped by business_id
  const { data: cData, error: cErr } = await supabase.from('categories').select('id, business_id, name')
  if (cErr || !cData) {
    console.error('✗ Failed to fetch categories:', cErr?.message)
    process.exit(1)
  }
  
  const catMap = new Map() // business_id -> { 'Starters': id, ... }
  for (const c of cData) {
    if (!catMap.has(c.business_id)) catMap.set(c.business_id, {})
    catMap.get(c.business_id)[c.name] = c.id
  }
  console.log(`✓ Generated categories.`)

  // 3. Generate Items (50,000 total)
  console.log(`\n3️⃣ Generating ${TOTAL_ITEMS} items (100 per business)...`)
  let allItems = []
  for (let i = 1; i <= NUM_BUSINESSES; i++) {
    const bid = bizMap.get(`scale-biz-${i}`)
    const cats = catMap.get(bid)
    if (!bid || !cats) continue

    for (let j = 1; j <= ITEMS_PER_BUSINESS; j++) {
      let catId = cats['Starters']
      if (j > 30) catId = cats['Mains']
      if (j > 80) catId = cats['Desserts']

      allItems.push({
        business_id: bid,
        category_id: catId,
        name: `Scale Item ${i}-${j}`,
        description: `This is a randomly generated item for load testing. Item number ${j} for business ${i}.`,
        price: Math.floor(Math.random() * 500) + 50,
        image_mode: 'none',
        dietary: Math.random() > 0.5 ? 'veg' : 'non-veg',
        badge: Math.random() > 0.8 ? 'bestseller' : null,
        is_featured: Math.random() > 0.9,
        sort_order: j,
      })
    }
  }

  // Insert in batches of 2000
  const BATCH_SIZE = 2000
  let inserted = 0
  for (let i = 0; i < allItems.length; i += BATCH_SIZE) {
    const batch = allItems.slice(i, i + BATCH_SIZE)
    const { error } = await supabase.from('items').insert(batch)
    if (error && error.code !== '23505') {
      console.error(`\n✗ Failed at batch ${i}:`, error.message)
      process.exit(1)
    }
    inserted += batch.length
    process.stdout.write(`\r  Progress: ${Math.min(inserted, TOTAL_ITEMS)} / ${TOTAL_ITEMS} items inserted.`)
  }

  console.log(`\n\n🎉 Done! Database is now seeded with 50,000 load-testing items.`)
  console.log(`   To test query performance for one of these menus:`)
  console.log(`   1. Open .env.local`)
  console.log(`   2. Set NEXT_PUBLIC_CLIENT_SLUG=scale-biz-1`)
  console.log(`   3. Restart the Next.js server (pnpm dev) and visit http://localhost:3000`)
}

main().catch((e) => {
  console.error('\n✗ Scale seed failed:', e.message ?? e)
  process.exit(1)
})
