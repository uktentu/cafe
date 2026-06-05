import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

async function run() {
  const { error } = await supabase.rpc('execute_sql', { sql: 'ALTER TABLE businesses ADD COLUMN IF NOT EXISTS multiple_menus_enabled boolean DEFAULT true;' })
  if (error) console.log('RPC failed, trying raw query via a dummy insert if possible... error:', error)
}
run()
