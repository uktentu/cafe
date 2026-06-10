import { config as loadEnv } from 'dotenv'
import { createClient } from '@supabase/supabase-js'
import ws from 'ws'

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
  realtime: { transport: ws as any },
})

async function main() {
  console.log('🧹 Starting analytics cleanup cron...')
  const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString()
  console.log(`Deleting events older than: ${thirtyDaysAgo}`)

  const { data, error, count } = await supabase
    .from('analytics_events')
    .delete({ count: 'exact' })
    .lt('created_at', thirtyDaysAgo)

  if (error) {
    console.error('✗ Cleanup failed:', error.message)
    process.exit(1)
  }

  console.log(`✓ Cleanup successful. Deleted ${count ?? 0} events.`)
}

main().catch((e) => {
  console.error('✗ Unhandled error:', e.message ?? e)
  process.exit(1)
})
