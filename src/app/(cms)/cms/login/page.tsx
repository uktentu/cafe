'use client'

import { Suspense, useState, useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { supabaseConfigured } from '@/lib/env'

function LoginForm() {
  const router = useRouter()
  const search = useSearchParams()
  const next = search.get('next') || '/cms/dashboard'

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (search.has('clear')) {
      const supabase = createClient()
      supabase.auth.signOut().then(() => {
        router.replace('/cms/login')
        router.refresh()
      })
    }
  }, [search, router])

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    if (!supabaseConfigured()) {
      setError('Supabase is not configured yet. Add credentials to .env.local.')
      return
    }
    setLoading(true)
    const supabase = createClient()
    const { error } = await supabase.auth.signInWithPassword({ email, password })
    if (error) {
      setError(error.message)
      setLoading(false)
      return
    }
    router.replace(next)
    router.refresh()
  }

  return (
    <main className="flex min-h-[100svh]">
      {/* ── Left branding panel (hidden on mobile) ── */}
      <div className="hidden md:flex md:w-[52%] flex-col justify-between bg-neutral-950 p-12 relative overflow-hidden">
        {/* Decorative gradient orb */}
        <div className="absolute -top-32 -left-32 w-96 h-96 rounded-full bg-amber-500/10 blur-3xl pointer-events-none" />
        <div className="absolute -bottom-32 -right-32 w-96 h-96 rounded-full bg-amber-500/5 blur-3xl pointer-events-none" />

        {/* Logo */}
        <div className="relative z-10">
          <div className="flex items-center gap-2.5">
            <div className="h-8 w-8 rounded-lg bg-amber-500 flex items-center justify-center">
              <svg viewBox="0 0 24 24" fill="none" className="h-4.5 w-4.5 text-white" stroke="currentColor" strokeWidth={2.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6.75h16.5M3.75 12h16.5M12 17.25h8.25" />
              </svg>
            </div>
            <span className="text-lg font-semibold text-white tracking-tight">MenuOS</span>
          </div>
        </div>

        {/* Main copy */}
        <div className="relative z-10 space-y-6">
          <div className="space-y-3">
            <h1 className="text-4xl font-bold text-white leading-tight">
              Your menu,<br />
              always up to date.
            </h1>
            <p className="text-base text-neutral-400 leading-relaxed max-w-sm">
              Update prices, mark items sold out, and publish changes live — all from one place. Your customers scan a QR code and see the latest version instantly.
            </p>
          </div>

          {/* Feature list */}
          <ul className="space-y-3">
            {[
              'Live menu updates in seconds',
              'QR codes for every table',
              'Analytics & WhatsApp ordering',
            ].map((f) => (
              <li key={f} className="flex items-center gap-3 text-sm text-neutral-300">
                <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-amber-500/15">
                  <svg viewBox="0 0 12 12" className="h-3 w-3 text-amber-400" fill="none" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M2 6l3 3 5-5" />
                  </svg>
                </span>
                {f}
              </li>
            ))}
          </ul>
        </div>

        {/* Footer */}
        <p className="relative z-10 text-xs text-neutral-600">
          © {new Date().getFullYear()} MenuOS · Built for Indian restaurants
        </p>
      </div>

      {/* ── Right form panel ── */}
      <div className="flex flex-1 flex-col items-center justify-center bg-white dark:bg-neutral-900 px-6 py-12">
        {/* Mobile logo */}
        <div className="mb-8 flex items-center gap-2 md:hidden">
          <div className="h-8 w-8 rounded-lg bg-amber-500 flex items-center justify-center">
            <svg viewBox="0 0 24 24" fill="none" className="h-4.5 w-4.5 text-white" stroke="currentColor" strokeWidth={2.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6.75h16.5M3.75 12h16.5M12 17.25h8.25" />
            </svg>
          </div>
          <span className="text-lg font-semibold text-neutral-900 dark:text-white tracking-tight">MenuOS</span>
        </div>

        <div className="w-full max-w-sm">
          <div className="mb-8">
            <h2 className="text-2xl font-bold text-neutral-900 dark:text-white">Sign in</h2>
            <p className="mt-1.5 text-sm text-neutral-500 dark:text-neutral-400">
              Enter your credentials to manage your menu.
            </p>
          </div>

          <form onSubmit={onSubmit} className="space-y-5">
            <label className="block">
              <span className="mb-1.5 block text-sm font-medium text-neutral-700 dark:text-neutral-300">
                Email address
              </span>
              <input
                type="email"
                required
                autoComplete="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="owner@yourplace.com"
                className="h-11 w-full rounded-xl border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-800 px-3.5 text-sm text-neutral-900 dark:text-white placeholder:text-neutral-400 outline-none transition focus:border-amber-500 focus:ring-3 focus:ring-amber-500/15"
              />
            </label>

            <label className="block">
              <span className="mb-1.5 block text-sm font-medium text-neutral-700 dark:text-neutral-300">
                Password
              </span>
              <input
                type="password"
                required
                autoComplete="current-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="h-11 w-full rounded-xl border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-800 px-3.5 text-sm text-neutral-900 dark:text-white placeholder:text-neutral-400 outline-none transition focus:border-amber-500 focus:ring-3 focus:ring-amber-500/15"
              />
            </label>

            {error && (
              <div role="alert" className="flex items-start gap-2.5 rounded-xl bg-red-50 dark:bg-red-500/10 border border-red-100 dark:border-red-500/20 px-4 py-3">
                <svg viewBox="0 0 16 16" className="mt-0.5 h-4 w-4 shrink-0 text-red-500" fill="currentColor">
                  <path fillRule="evenodd" d="M8 1.5a6.5 6.5 0 100 13 6.5 6.5 0 000-13zM0 8a8 8 0 1116 0A8 8 0 010 8zm7.25-3.25a.75.75 0 011.5 0v3.5a.75.75 0 01-1.5 0v-3.5zm.75 6a.75.75 0 100-1.5.75.75 0 000 1.5z" />
                </svg>
                <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="mt-1 h-11 w-full rounded-xl bg-amber-500 text-sm font-semibold text-white shadow-sm transition hover:bg-amber-400 active:scale-[0.99] disabled:opacity-60 disabled:cursor-not-allowed"
            >
              {loading ? (
                <span className="flex items-center justify-center gap-2">
                  <svg className="h-4 w-4 animate-spin" viewBox="0 0 24 24" fill="none">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z" />
                  </svg>
                  Signing in…
                </span>
              ) : 'Sign in'}
            </button>
          </form>

          <p className="mt-6 text-center text-xs text-neutral-400">
            Trouble signing in? Contact your MenuOS developer.
          </p>
        </div>
      </div>
    </main>
  )
}

export default function LoginPage() {
  return (
    <Suspense fallback={null}>
      <LoginForm />
    </Suspense>
  )
}

export const runtime = 'edge'
