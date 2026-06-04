import { config as loadEnv } from 'dotenv'
import { createClient } from '@supabase/supabase-js'

loadEnv({ path: '.env.local' })

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!
const SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY!

async function test() {
  const response = await fetch(`${SUPABASE_URL}/rest/v1/rpc/exec_sql`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${SERVICE_KEY}`,
      'apikey': SERVICE_KEY,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ query: "SELECT * FROM pg_policies WHERE tablename = 'staff_accounts'" })
  })
  
  // Actually, exec_sql might not exist. Let's just query pg_policies using PostgREST if it is exposed.
  // Oh, pg_policies is typically not exposed via PostgREST.
}
test()
