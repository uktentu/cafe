import { config as loadEnv } from 'dotenv'
import { createClient } from '@supabase/supabase-js'

loadEnv({ path: '.env.local' })

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!
const ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

const supabase = createClient(SUPABASE_URL, ANON_KEY)

async function test() {
  const email = 'owner@democafe.in'
  const password = 'MenuOS#2024'
  
  const { data: auth, error: authErr } = await supabase.auth.signInWithPassword({ email, password })
  if (authErr) {
    console.error('Login error:', authErr)
    return
  }
  
  console.log('Logged in user:', auth.user.id)

  const { data: biz, error: bizErr } = await supabase.from('businesses').select('*').eq('slug', 'demo-cafe').single()
  console.log('Business:', biz?.id, 'Error:', bizErr)

  if (biz) {
    const { data: staff, error: staffErr } = await supabase.from('staff_accounts').select('*').eq('business_id', biz.id).eq('user_id', auth.user.id).eq('is_active', true)
    console.log('Staff accounts:', staff, 'Error:', staffErr)
  }
}

test()
