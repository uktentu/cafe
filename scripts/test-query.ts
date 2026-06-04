import { config as loadEnv } from 'dotenv'
import { createClient } from '@supabase/supabase-js'

loadEnv({ path: '.env.local' })

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!
const SERVICE_KEY =
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SECRET_KEY || ''

const supabase = createClient(SUPABASE_URL, SERVICE_KEY)

async function test() {
  const email = 'owner@democafe.in'
  
  // 1. Get user
  const { data: { users } } = await supabase.auth.admin.listUsers()
  const user = users.find(u => u.email === email)
  console.log('User ID:', user?.id)

  // 2. Get business
  const { data: biz } = await supabase.from('businesses').select('*').eq('slug', 'demo-cafe').single()
  console.log('Business ID:', biz?.id)

  // 3. Get staff account
  const { data: staff } = await supabase.from('staff_accounts').select('*').eq('user_id', user?.id)
  console.log('Staff accounts:', staff)
}

test()
