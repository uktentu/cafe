// ════════════════════════════════════════════════════════════════════
// order-data.ts — server-side helpers for the in-app POS ordering flow.
// The themed menu page renders items from the (KV-cached) getMenuData; the
// customer orders off that, and add_order_items() re-reads live prices at
// write time so a cached price can never mis-charge.
// ════════════════════════════════════════════════════════════════════
import { createAdminClient } from '@/lib/supabase/server'
import type { RestaurantTable } from '@/types/database'

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

/**
 * Resolve a scanned QR token into a table. Uses the service-role client on
 * purpose: qr_token is column-revoked from the anon role (migration 011) so
 * an attacker can't enumerate tokens through the public REST API, which
 * means the anon client can't filter on it either. Server-only code path.
 * Anything that isn't a uuid is rejected outright — the friendly table
 * `code` is deliberately NOT accepted here, since it's guessable.
 */
export async function resolveTableByToken(businessId: string, token: string): Promise<RestaurantTable | null> {
  if (!UUID_RE.test(token)) return null
  const supabase = createAdminClient()
  const { data, error } = await supabase
    .from('tables')
    .select('*')
    .eq('business_id', businessId)
    .eq('qr_token', token)
    .eq('is_active', true)
    .maybeSingle()
  if (error) {
    // Most likely qr_token doesn't exist yet (migration 011 not applied).
    // Degrade to a table-less order page rather than crashing the customer.
    console.warn('resolveTableByToken failed:', error.message)
    return null
  }
  return (data as RestaurantTable) ?? null
}
