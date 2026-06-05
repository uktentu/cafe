import { createClient } from '@supabase/supabase-js'
import dotenv from 'dotenv'

dotenv.config({ path: '.env.local' })

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!)

async function check() {
  const { data: business } = await supabase.from('businesses').select('id, slug').limit(1).single()
  console.log("Business:", business?.id, business?.slug)

  const { count, error } = await supabase.from('analytics_events').select('*', { count: 'exact', head: true }).eq('business_id', business?.id)
  console.log("True Analytics Events count:", count, error)
}

check()
