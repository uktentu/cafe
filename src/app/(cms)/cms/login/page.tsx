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
    <main className="flex min-h-[100svh] items-center justify-center bg-[#F7F8FA] px-4">
      <div className="w-full max-w-sm rounded-2xl bg-white p-7 shadow-sm ring-1 ring-black/5">
        <div className="mb-6">
          <h1 className="text-xl font-semibold text-[#1A1917]">MenuOS</h1>
          <p className="mt-1 text-sm text-neutral-500">Sign in to manage your menu.</p>
        </div>
        <form onSubmit={onSubmit} className="space-y-4">
          <label className="block">
            <span className="mb-1 block text-sm font-medium text-neutral-700">Email</span>
            <input
              type="email"
              required
              autoComplete="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="h-[42px] w-full rounded-lg border border-neutral-300 px-3 text-[16px] outline-none focus:ring-[3px] focus:ring-amber-500/20 focus:border-amber-500"
            />
          </label>
          <label className="block">
            <span className="mb-1 block text-sm font-medium text-neutral-700">Password</span>
            <input
              type="password"
              required
              autoComplete="current-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="h-[42px] w-full rounded-lg border border-neutral-300 px-3 text-[16px] outline-none focus:ring-[3px] focus:ring-amber-500/20 focus:border-amber-500"
            />
          </label>

          {error && (
            <p role="alert" className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600">
              {error}
            </p>
          )}

          <button
            type="submit"
            disabled={loading}
            className="h-[42px] w-full rounded-lg bg-[#F59E0B] font-medium text-white transition active:scale-[0.99] disabled:opacity-60"
          >
            {loading ? 'Signing in…' : 'Sign in'}
          </button>
        </form>
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
