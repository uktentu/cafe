// Server Supabase clients.
//   createClient()      — cookie-bound, respects the signed-in CMS user + RLS.
//   createAdminClient() — service/secret role, bypasses RLS. Server-only.
//   createAnonClient()  — cookie-free anon client for ISR menu pages.
import { createServerClient } from '@supabase/ssr'
import { createClient as createSupabaseClient } from '@supabase/supabase-js'
import { cookies } from 'next/headers'
import { supabaseAnonKey, supabaseServiceKey } from '@/lib/env'

export function createClient() {
  const cookieStore = cookies()
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    supabaseAnonKey(),
    {
      cookies: {
        getAll() {
          return cookieStore.getAll()
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options),
            )
          } catch {
            /* called from a Server Component — ignore */
          }
        },
      },
    },
  )
}

export function createAdminClient() {
  return createSupabaseClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    supabaseServiceKey(),
    { auth: { autoRefreshToken: false, persistSession: false } },
  )
}

// Cookie-FREE anon client for the public menu. The menu is dynamically rendered
// (Cloudflare can't run Next ISR), so reads MUST bypass Next's fetch Data Cache —
// otherwise the menu serves stale data and CMS edits never appear. `cache: 'no-store'`
// guarantees a fresh DB read on every render; CDN caching (s-maxage=30) handles load.
export function createAnonClient() {
  return createSupabaseClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    supabaseAnonKey(),
    {
      auth: { autoRefreshToken: false, persistSession: false },
      global: {
        fetch: (input, init) =>
          fetch(input, { ...init, cache: 'no-store' }),
      },
    },
  )
}
