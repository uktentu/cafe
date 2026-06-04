/**
 * setup-client.ts — interactive CLI to onboard a new client restaurant.
 *
 * Usage:
 *   pnpm tsx scripts/setup-client.ts
 *
 * Steps performed:
 *   1. Insert a row into businesses (Supabase Admin / service role).
 *   2. Create the owner auth account (auth.admin.createUser).
 *   3. Create the staff_accounts record (role: 'owner').
 *   4. Seed 3 categories + a handful of items using stock images.
 *   5. Print the full set of Cloudflare Pages env vars to copy.
 *
 * Requires in .env.local: NEXT_PUBLIC_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY.
 *
 * NOTE: Tier limits stay env-driven — this script never hardcodes limits into
 * the DB. It only sets tier + theme; getConfig() resolves limits at runtime.
 */
import { createInterface } from 'node:readline/promises'
import { stdin as input, stdout as output } from 'node:process'
import { randomBytes } from 'node:crypto'
import { config as loadEnv } from 'dotenv'
import { createClient } from '@supabase/supabase-js'

loadEnv({ path: '.env.local' })

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL
const SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY

const THEMES_BY_TIER: Record<string, string[]> = {
  basic: ['mercado', 'provenance', 'terrain'],
  advanced: ['bazaar', 'nocturne', 'coastal'],
  premium: ['aether', 'onyx', 'studio'],
}

function slugify(s: string) {
  return s.toLowerCase().trim().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '')
}

async function main() {
  if (!SUPABASE_URL || !SERVICE_KEY) {
    console.error('✗ Set NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY in .env.local first.')
    process.exit(1)
  }
  const supabase = createClient(SUPABASE_URL, SERVICE_KEY, {
    auth: { autoRefreshToken: false, persistSession: false },
  })

  const rl = createInterface({ input, output })
  const ask = async (q: string, def = '') => {
    const a = (await rl.question(def ? `${q} [${def}]: ` : `${q}: `)).trim()
    return a || def
  }

  console.log('\n— MenuOS · New client setup —\n')
  const name = await ask('Client name')
  const slug = slugify(await ask('Client slug', slugify(name)))
  let tier = (await ask('Tier (basic/advanced/premium)', 'basic')).toLowerCase()
  if (!THEMES_BY_TIER[tier]) tier = 'basic'
  const theme = (await ask(`Theme (${THEMES_BY_TIER[tier].join('/')})`, THEMES_BY_TIER[tier][0])).toLowerCase()
  const ownerEmail = await ask('Owner email')
  const whatsapp = await ask('WhatsApp (e.g. 919876543210)')
  const phone = await ask('Phone', `+${whatsapp}`)
  const siteUrl = await ask('Site URL', `https://${slug}.yourdomain.in`)
  await rl.close()

  console.log('\nWorking…')

  // 1. business row
  const { data: biz, error: bizErr } = await supabase
    .from('businesses')
    .insert({ slug, name, tier, theme, whatsapp, phone, email: ownerEmail })
    .select('id')
    .single()
  if (bizErr) throw bizErr
  const businessId = biz.id as string
  console.log(`  ✓ business ${slug} (${businessId})`)

  // 2. owner auth account (random temp password — owner resets via email)
  const tempPassword = randomBytes(9).toString('base64url')
  const { data: userData, error: userErr } = await supabase.auth.admin.createUser({
    email: ownerEmail,
    password: tempPassword,
    email_confirm: true,
  })
  if (userErr) throw userErr
  const userId = userData.user.id
  console.log(`  ✓ owner auth user ${ownerEmail}`)

  // 3. staff record
  const { error: staffErr } = await supabase
    .from('staff_accounts')
    .insert({ business_id: businessId, user_id: userId, role: 'owner', name })
  if (staffErr) throw staffErr
  console.log('  ✓ staff_accounts (owner)')

  // 4. seed categories + items
  const cats = [
    { name: 'Starters', icon: 'Soup', sort_order: 1 },
    { name: 'Mains', icon: 'UtensilsCrossed', sort_order: 2 },
    { name: 'Drinks', icon: 'CupSoda', sort_order: 3 },
  ]
  const { data: catRows, error: catErr } = await supabase
    .from('categories')
    .insert(cats.map((c) => ({ ...c, business_id: businessId })))
    .select('id, name')
  if (catErr) throw catErr
  const catId = (n: string) => catRows!.find((c) => c.name === n)!.id

  const items = [
    { category_id: catId('Starters'), name: 'Paneer Tikka', price: 220, image_mode: 'stock', stock_image_key: 'stock/indian/paneer-tikka.webp', is_featured: true, badge: 'bestseller' },
    { category_id: catId('Starters'), name: 'Samosa (2 pcs)', price: 60, image_mode: 'stock', stock_image_key: 'stock/indian/samosa.webp' },
    { category_id: catId('Starters'), name: 'Garlic Bread', price: 120, image_mode: 'none' },
    { category_id: catId('Mains'), name: 'Chicken Biryani', price: 280, image_mode: 'stock', stock_image_key: 'stock/indian/biryani.webp', is_veg: false, is_featured: true, badge: 'bestseller' },
    { category_id: catId('Mains'), name: 'Dal Makhani', price: 190, image_mode: 'stock', stock_image_key: 'stock/indian/dal-makhani.webp', badge: 'chef_special' },
    { category_id: catId('Mains'), name: 'Veg Hakka Noodles', price: 170, image_mode: 'stock', stock_image_key: 'stock/chinese/hakka-noodles.webp' },
    { category_id: catId('Mains'), name: 'Margherita Pizza', price: 240, image_mode: 'none', badge: 'new' },
    { category_id: catId('Drinks'), name: 'Masala Chai', price: 40, image_mode: 'stock', stock_image_key: 'stock/drinks/chai.webp' },
    { category_id: catId('Drinks'), name: 'Cold Coffee', price: 130, image_mode: 'stock', stock_image_key: 'stock/drinks/cold-coffee.webp' },
    { category_id: catId('Drinks'), name: 'Sweet Lassi', price: 90, image_mode: 'none' },
  ]
  const { error: itemErr } = await supabase
    .from('items')
    .insert(items.map((it, i) => ({ ...it, business_id: businessId, sort_order: i + 1 })))
  if (itemErr) throw itemErr
  console.log(`  ✓ seeded ${cats.length} categories + ${items.length} items`)

  // 5. print env vars
  console.log('\n──────────── Cloudflare Pages env vars ────────────')
  console.log(`NEXT_PUBLIC_CLIENT_SLUG=${slug}`)
  console.log(`NEXT_PUBLIC_SITE_URL=${siteUrl}`)
  console.log(`NEXT_PUBLIC_TIER=${tier}`)
  console.log(`NEXT_PUBLIC_THEME=${theme}`)
  console.log(`NEXT_PUBLIC_WHATSAPP=${whatsapp}`)
  console.log(`NEXT_PUBLIC_PHONE=${phone}`)
  console.log(`OWNER_EMAIL=${ownerEmail}`)
  console.log('# (plus shared Supabase / R2 / Firebase / Brevo vars from .env.template)')
  console.log('───────────────────────────────────────────────────')
  console.log(`\nOwner temp password (share securely, ask them to reset): ${tempPassword}`)
  console.log('Done.')
}

main().catch((e) => {
  console.error('\n✗ setup-client failed:', e.message ?? e)
  process.exit(1)
})
