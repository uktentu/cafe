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
          // 1. Update the request cookies
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value))
          
          // 2. Synchronize the 'Cookie' header so Server Components can read the updated cookies
          request.headers.set('cookie', request.cookies.toString())
          
          // 3. Create a new response with the mutated request headers
          response = NextResponse.next({
            request: {
              headers: request.headers,
            },
          })
          
          // 4. Set the cookies on the response so they apply to the browser
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
      const redirect = NextResponse.redirect(url)
      // Copy any cookies set by Supabase (e.g. clearing tokens) to the redirect
      response.headers.forEach((value, key) => {
        if (key.toLowerCase() === 'set-cookie') redirect.headers.append('set-cookie', value)
      })
      return redirect
    }
    return response
  }

  if (pathname.startsWith('/cms') && !isPublic && !user) {
    const url = request.nextUrl.clone()
    url.pathname = '/cms/login'
    url.searchParams.set('next', pathname)
    const redirect = NextResponse.redirect(url)
    response.headers.forEach((value, key) => {
      if (key.toLowerCase() === 'set-cookie') redirect.headers.append('set-cookie', value)
    })
    return redirect
  }

  // Already signed in but visiting the login page → go to dashboard.
  if (pathname === '/cms/login' && user && !request.nextUrl.searchParams.has('clear')) {
    const url = request.nextUrl.clone()
    url.pathname = '/cms/dashboard'
    url.search = ''
    const redirect = NextResponse.redirect(url)
    response.headers.forEach((value, key) => {
      if (key.toLowerCase() === 'set-cookie') redirect.headers.append('set-cookie', value)
    })
    return redirect
  }

  return response
}

export const config = {
  // Run on CMS routes only; skip static assets and the public menu.
  matcher: ['/cms/:path*'],
}
