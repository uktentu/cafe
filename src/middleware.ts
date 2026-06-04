// ════════════════════════════════════════════════════════════════════
// middleware.ts — refresh the Supabase session on every request and gate
// /cms/* behind auth. Unauthenticated → /cms/login?next=<path>.
// All Supabase calls are wrapped in try-catch so a transient network error
// never turns the login page itself into a 500.
// ════════════════════════════════════════════════════════════════════
import { NextResponse, type NextRequest } from 'next/server'
import { createServerClient } from '@supabase/ssr'
import { supabaseConfigured, supabaseAnonKey } from '@/lib/env'

const PUBLIC_CMS_PATHS = ['/cms/login', '/cms/reset-password']

export async function middleware(request: NextRequest) {
  // Before Supabase is configured (local dev), don't try to auth — let routes
  // render so the login page and a "not configured" notice are reachable.
  if (!supabaseConfigured()) return NextResponse.next()

  let response = NextResponse.next({ request })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    supabaseAnonKey(),
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value))
          response = NextResponse.next({ request })
          cookiesToSet.forEach(({ name, value, options }) =>
            response.cookies.set(name, value, options),
          )
        },
      },
    },
  )

  const { pathname } = request.nextUrl
  const isPublic = PUBLIC_CMS_PATHS.some((p) => pathname.startsWith(p))

  // IMPORTANT: getUser() validates the JWT with Supabase Auth. Wrapped in
  // try-catch so a transient Supabase outage doesn't produce a 500 — instead
  // it redirects to login (safe degradation).
  let user: { id: string; email?: string } | null = null
  try {
    const { data } = await supabase.auth.getUser()
    user = data.user
  } catch {
    // Network error or Supabase timeout — treat as unauthenticated.
    if (pathname.startsWith('/cms') && !isPublic) {
      const url = request.nextUrl.clone()
      url.pathname = '/cms/login'
      url.searchParams.set('next', pathname)
      return NextResponse.redirect(url)
    }
    return response
  }

  if (pathname.startsWith('/cms') && !isPublic && !user) {
    const url = request.nextUrl.clone()
    url.pathname = '/cms/login'
    url.searchParams.set('next', pathname)
    return NextResponse.redirect(url)
  }

  // Already signed in but visiting the login page → go to dashboard.
  if (pathname === '/cms/login' && user && !request.nextUrl.searchParams.has('clear')) {
    const url = request.nextUrl.clone()
    url.pathname = '/cms/dashboard'
    url.search = ''
    return NextResponse.redirect(url)
  }

  return response
}

export const config = {
  // Run on CMS routes only; skip static assets and the public menu.
  matcher: ['/cms/:path*'],
}
