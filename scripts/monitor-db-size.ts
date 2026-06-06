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

const ALERT_THRESHOLD_MB = 400
const ALERT_THRESHOLD_BYTES = ALERT_THRESHOLD_MB * 1024 * 1024

async function main() {
  console.log('📊 Checking Supabase DB size...')

  const { data: sizeBytes, error } = await supabase.rpc('get_db_size_bytes')

  if (error) {
    if (error.code === 'PGRST202') {
      console.error('✗ RPC function "get_db_size_bytes" not found.')
      console.error('  Please run the supabase/rpc_db_size.sql script in your Supabase SQL editor.')
      process.exit(1)
    }
    console.error('✗ Failed to fetch DB size:', error.message)
    process.exit(1)
  }

  const sizeMb = (Number(sizeBytes) / (1024 * 1024)).toFixed(2)
  console.log(`Current Database Size: ${sizeMb} MB`)

  if (Number(sizeBytes) > ALERT_THRESHOLD_BYTES) {
    console.error(`\n🚨 CRITICAL ALERT: Database size (${sizeMb} MB) has exceeded the threshold of ${ALERT_THRESHOLD_MB} MB!`)
    console.error(`   You are approaching the 500 MB free tier limit.`)
    console.error(`   Action required: Upgrade your Supabase project to the Pro tier or aggressively prune data.`)
    // Exiting with 1 causes the GitHub action to fail, sending an email alert to the repo owner.
    process.exit(1)
  }

  console.log(`✓ Database size is healthy (under ${ALERT_THRESHOLD_MB} MB).`)
}

main().catch((e) => {
  console.error('✗ Unhandled error:', e.message ?? e)
  process.exit(1)
})
