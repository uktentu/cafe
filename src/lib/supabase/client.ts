// Browser Supabase client (CMS 'use client' components). Anon/publishable key
// only — RLS protects every row. Never import the service role key here.
import { createBrowserClient } from '@supabase/ssr'
import { supabaseAnonKey } from '@/lib/env'

export function createClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    supabaseAnonKey(),
  )
}
