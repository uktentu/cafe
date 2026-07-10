// Browser Supabase client (CMS 'use client' components). Anon/publishable key
// only — RLS protects every row. Never import the service role key here.
//
// True module-level singleton: every call site (cms-queries, owner-queries,
// pos-queries, Sidebar, KitchenDisplay, OrdersBoard, ...) gets the exact same
// client/auth instance instead of each spinning up its own GoTrueClient —
// fewer duplicate auth-state listeners and token-refresh timers per page.
import { createBrowserClient } from '@supabase/ssr'
import { supabaseAnonKey } from '@/lib/env'

let _browserClient: ReturnType<typeof createBrowserClient> | null = null

export function createClient() {
  if (!_browserClient) {
    _browserClient = createBrowserClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      supabaseAnonKey(),
    )
  }
  return _browserClient
}
