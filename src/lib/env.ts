// Supabase renamed anon→publishable and service_role→secret in their new key
// format (sb_publishable_... / sb_secret_...). Support both so the code works
// with old JWT keys and new-format keys without any changes to call sites.

export const supabaseAnonKey = (): string =>
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
  process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ||
  ''

export const supabaseServiceKey = (): string =>
  process.env.SUPABASE_SERVICE_ROLE_KEY ||
  process.env.SUPABASE_SECRET_KEY ||
  ''

export function supabaseConfigured(): boolean {
  return Boolean(process.env.NEXT_PUBLIC_SUPABASE_URL && supabaseAnonKey())
}

export function supabaseAdminConfigured(): boolean {
  return supabaseConfigured() && Boolean(supabaseServiceKey())
}
