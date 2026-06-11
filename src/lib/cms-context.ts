// Server-side CMS auth/business resolution. One deployment manages exactly one
// business (NEXT_PUBLIC_CLIENT_SLUG); the signed-in user must be active staff
// of it. Returns a discriminated state the CMS layout renders accordingly.
import { cache } from 'react'
import { createClient, createAdminClient } from '@/lib/supabase/server'
import { getConfig } from '@/lib/config'
import { supabaseConfigured } from '@/lib/env'
import type { Business, StaffRole, Theme } from '@/types/database'

export type CmsContext =
  | { state: 'unconfigured' }
  | { state: 'unauthed' }
  | { state: 'no-business' }
  | { state: 'forbidden' }
  | { state: 'ok'; business: Business; userEmail: string; role: StaffRole; isAdmin: boolean }

// Cached per request so the (app) layout and the page share one resolution.
export const getCmsContext = cache(_getCmsContext)

async function _getCmsContext(): Promise<CmsContext> {
  if (!supabaseConfigured()) return { state: 'unconfigured' }

  const supabase = createClient()
  // Validate the JWT with the Supabase API. We must use getUser() here instead
  // of getSession() because Cloudflare Pages Edge Runtime strictly enforces
  // Fetch API standards and strips middleware-mutated request headers, meaning
  // Server Components cannot reliably receive synced cookies from middleware.
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return { state: 'unauthed' }

  const { slug } = getConfig()
  const { data: rawBiz } = await supabase
    .from('businesses')
    .select('*')
    .eq('slug', slug)
    .maybeSingle()
  if (!rawBiz) return { state: 'no-business' }

  // Normalise legacy column names (theme_preset → theme etc.)
  const business: Business = {
    ...rawBiz,
    theme: (rawBiz.theme || rawBiz.theme_preset || 'mercado') as Theme,
    logo_r2_key: rawBiz.logo_r2_key ?? null,
    cover_r2_key: rawBiz.cover_r2_key ?? null,
    firebase_measurement_id: rawBiz.firebase_measurement_id ?? null,
    seo_title: rawBiz.seo_title ?? null,
    seo_description: rawBiz.seo_description ?? null,
    seo_og_r2_key: rawBiz.seo_og_r2_key ?? null,
    // Preserve the FULL social_links blob. Whitelisting here silently dropped
    // wait_time / about / reservations_enabled / multiple_branches_enabled, so the
    // settings form loaded them blank and overwrote them with null/false on save.
    social_links: {
      instagram: null,
      swiggy: null,
      zomato: null,
      google_maps: null,
      multiple_menus_enabled: false,
      ...(rawBiz.social_links ?? {}),
    },
  } as Business

  const adminClient = createAdminClient()

  const { data: staff } = await adminClient
    .from('staff_accounts')
    .select('role')
    .eq('business_id', business.id)
    .eq('user_id', user.id)
    .eq('is_active', true)
    .maybeSingle<{ role: StaffRole }>()
  if (!staff) return { state: 'forbidden' }

  const adminEmail = process.env.ADMIN_EMAIL
  const isAdmin = Boolean(adminEmail && user.email === adminEmail)
  return { state: 'ok', business, userEmail: user.email ?? '', role: staff.role, isAdmin }
}
