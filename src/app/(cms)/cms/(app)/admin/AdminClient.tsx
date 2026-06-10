'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { Building2, Users, TrendingUp, CheckCircle, Plus, RefreshCw, Copy, Check } from 'lucide-react'
import type { Business, Tier } from '@/types/database'

type BizRow = Pick<Business, 'id' | 'slug' | 'name' | 'tier' | 'is_active' | 'city' | 'phone' | 'created_at'>

interface Stats {
  total: number
  active: number
  tierCounts: Record<string, number>
  monthlyRevenue: number
}

function StatCard({ icon: Icon, label, value, sub }: { icon: React.ElementType; label: string; value: string; sub?: string }) {
  return (
    <div className="rounded-xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 p-5">
      <div className="flex items-center gap-3">
        <div className="rounded-lg bg-amber-500/10 p-2">
          <Icon className="h-5 w-5 text-amber-500" />
        </div>
        <div>
          <p className="text-xs text-neutral-500 uppercase tracking-wide">{label}</p>
          <p className="text-2xl font-bold text-neutral-900 dark:text-white">{value}</p>
          {sub && <p className="text-xs text-neutral-400">{sub}</p>}
        </div>
      </div>
    </div>
  )
}

function AddBusinessModal({ onClose, onSuccess }: { onClose: () => void; onSuccess: (envVars: string) => void }) {
  const [form, setForm] = useState({ name: '', slug: '', city: '', phone: '', email: '', tier: 'basic' as Tier })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  async function submit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError('')
    try {
      const res = await fetch('/api/admin/add-business', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Failed')
      onSuccess(data.envVars)
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Unknown error')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
      <div className="w-full max-w-md rounded-2xl bg-white dark:bg-neutral-900 p-6 shadow-2xl">
        <h2 className="mb-4 text-lg font-bold text-neutral-900 dark:text-white">Add New Business</h2>
        <form onSubmit={submit} className="space-y-3">
          {[
            { key: 'name', label: 'Business Name', placeholder: 'Taj Cafe' },
            { key: 'slug', label: 'Slug (URL-safe)', placeholder: 'taj-cafe' },
            { key: 'city', label: 'City', placeholder: 'Mumbai' },
            { key: 'phone', label: 'Phone', placeholder: '+919876543210' },
            { key: 'email', label: 'Owner Email', placeholder: 'owner@tajcafe.com' },
          ].map(({ key, label, placeholder }) => (
            <div key={key}>
              <label className="mb-1 block text-xs font-medium text-neutral-600 dark:text-neutral-400">{label}</label>
              <input
                type={key === 'email' ? 'email' : 'text'}
                placeholder={placeholder}
                value={(form as Record<string, string>)[key]}
                onChange={(e) => setForm(f => ({ ...f, [key]: e.target.value }))}
                required
                className="w-full rounded-lg border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-800 px-3 py-2 text-sm text-neutral-900 dark:text-white focus:border-amber-500 focus:outline-none"
              />
            </div>
          ))}
          <div>
            <label className="mb-1 block text-xs font-medium text-neutral-600 dark:text-neutral-400">Tier</label>
            <select
              value={form.tier}
              onChange={(e) => setForm(f => ({ ...f, tier: e.target.value as Tier }))}
              className="w-full rounded-lg border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-800 px-3 py-2 text-sm text-neutral-900 dark:text-white focus:border-amber-500 focus:outline-none"
            >
              <option value="basic">Basic — ₹999/mo</option>
              <option value="advanced">Advanced — ₹1,999/mo</option>
              <option value="premium">Premium — ₹3,499/mo</option>
            </select>
          </div>
          {error && <p className="text-xs text-red-500">{error}</p>}
          <div className="flex gap-3 pt-2">
            <button type="button" onClick={onClose} className="flex-1 rounded-lg border border-neutral-200 dark:border-neutral-700 py-2 text-sm text-neutral-600 dark:text-neutral-400 hover:bg-neutral-50 dark:hover:bg-neutral-800">
              Cancel
            </button>
            <button type="submit" disabled={loading} className="flex-1 rounded-lg bg-amber-500 py-2 text-sm font-semibold text-white hover:bg-amber-600 disabled:opacity-50">
              {loading ? 'Creating…' : 'Create Business'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

function EnvVarsModal({ envVars, onClose }: { envVars: string; onClose: () => void }) {
  const [copied, setCopied] = useState(false)

  function copy() {
    navigator.clipboard.writeText(envVars)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
      <div className="w-full max-w-lg rounded-2xl bg-white dark:bg-neutral-900 p-6 shadow-2xl">
        <h2 className="mb-2 text-lg font-bold text-neutral-900 dark:text-white">Business Created!</h2>
        <p className="mb-4 text-sm text-neutral-500">Copy these env vars into Cloudflare Pages → Settings → Environment variables for the new client deployment.</p>
        <pre className="mb-4 overflow-x-auto rounded-lg bg-neutral-950 p-4 text-xs text-green-400 max-h-64 overflow-y-auto">{envVars}</pre>
        <div className="flex gap-3">
          <button onClick={copy} className="flex flex-1 items-center justify-center gap-2 rounded-lg bg-neutral-800 py-2 text-sm text-white hover:bg-neutral-700">
            {copied ? <Check className="h-4 w-4 text-green-400" /> : <Copy className="h-4 w-4" />}
            {copied ? 'Copied!' : 'Copy to clipboard'}
          </button>
          <button onClick={onClose} className="flex-1 rounded-lg bg-amber-500 py-2 text-sm font-semibold text-white hover:bg-amber-600">
            Done
          </button>
        </div>
      </div>
    </div>
  )
}

export function AdminClient({ businesses: initial, stats }: { businesses: BizRow[]; stats: Stats }) {
  const router = useRouter()
  const [businesses, setBusinesses] = useState(initial)
  const [showAdd, setShowAdd] = useState(false)
  const [envVars, setEnvVars] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()

  async function setTier(bizId: string, newTier: Tier) {
    setBusinesses(prev => prev.map(b => b.id === bizId ? { ...b, tier: newTier } : b))
    await fetch('/api/admin/set-tier', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ businessId: bizId, tier: newTier }),
    })
    startTransition(() => router.refresh())
  }

  async function toggleActive(bizId: string, current: boolean) {
    setBusinesses(prev => prev.map(b => b.id === bizId ? { ...b, is_active: !current } : b))
    await fetch('/api/admin/set-active', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ businessId: bizId, isActive: !current }),
    })
    startTransition(() => router.refresh())
  }

  const tierBadge = (t: Tier) => ({
    basic: 'bg-blue-100 dark:bg-blue-500/15 text-blue-700 dark:text-blue-400',
    advanced: 'bg-amber-100 dark:bg-amber-500/15 text-amber-700 dark:text-amber-400',
    premium: 'bg-purple-100 dark:bg-purple-500/15 text-purple-700 dark:text-purple-400',
  }[t])

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-2xl font-bold text-neutral-900 dark:text-white">Admin Panel</h1>
          <p className="text-sm text-neutral-500 dark:text-neutral-400">Developer-only — manage all businesses</p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={() => startTransition(() => router.refresh())}
            disabled={isPending}
            className="flex items-center gap-2 rounded-lg border border-neutral-200 dark:border-neutral-700 px-3 py-2 text-sm text-neutral-600 dark:text-neutral-400 hover:bg-neutral-50 dark:hover:bg-neutral-800"
          >
            <RefreshCw className={`h-4 w-4 ${isPending ? 'animate-spin' : ''}`} />
            Refresh
          </button>
          <button
            onClick={() => setShowAdd(true)}
            className="flex items-center gap-2 rounded-lg bg-amber-500 px-4 py-2 text-sm font-semibold text-white hover:bg-amber-600"
          >
            <Plus className="h-4 w-4" />
            Add Business
          </button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard icon={Building2} label="Total Businesses" value={String(stats.total)} />
        <StatCard icon={CheckCircle} label="Active" value={String(stats.active)} sub={`${stats.total - stats.active} inactive`} />
        <StatCard
          icon={Users}
          label="Tier Breakdown"
          value={`${stats.tierCounts['basic'] || 0}B / ${stats.tierCounts['advanced'] || 0}A / ${stats.tierCounts['premium'] || 0}P`}
          sub="Basic / Advanced / Premium"
        />
        <StatCard
          icon={TrendingUp}
          label="Est. MRR"
          value={`₹${stats.monthlyRevenue.toLocaleString('en-IN')}`}
          sub="if all active"
        />
      </div>

      {/* Businesses table */}
      <div className="rounded-xl border border-neutral-200 dark:border-neutral-800 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-neutral-50 dark:bg-neutral-800/50 border-b border-neutral-200 dark:border-neutral-800">
              <tr>
                <th className="px-4 py-3 text-left font-medium text-neutral-600 dark:text-neutral-400">Business</th>
                <th className="px-4 py-3 text-left font-medium text-neutral-600 dark:text-neutral-400">Slug</th>
                <th className="px-4 py-3 text-left font-medium text-neutral-600 dark:text-neutral-400">Tier</th>
                <th className="px-4 py-3 text-left font-medium text-neutral-600 dark:text-neutral-400">Status</th>
                <th className="px-4 py-3 text-left font-medium text-neutral-600 dark:text-neutral-400">City</th>
                <th className="px-4 py-3 text-left font-medium text-neutral-600 dark:text-neutral-400">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-100 dark:divide-neutral-800 bg-white dark:bg-neutral-900">
              {businesses.map((biz) => (
                <tr key={biz.id} className="hover:bg-neutral-50 dark:hover:bg-neutral-800/30">
                  <td className="px-4 py-3">
                    <p className="font-medium text-neutral-900 dark:text-white">{biz.name}</p>
                    {biz.phone && <p className="text-xs text-neutral-400">{biz.phone}</p>}
                  </td>
                  <td className="px-4 py-3 font-mono text-xs text-neutral-500">{biz.slug}</td>
                  <td className="px-4 py-3">
                    <select
                      value={biz.tier}
                      onChange={(e) => setTier(biz.id, e.target.value as Tier)}
                      className={`rounded-full px-2.5 py-1 text-xs font-semibold border-0 cursor-pointer ${tierBadge(biz.tier)}`}
                    >
                      <option value="basic">Basic</option>
                      <option value="advanced">Advanced</option>
                      <option value="premium">Premium</option>
                    </select>
                  </td>
                  <td className="px-4 py-3">
                    <button
                      onClick={() => toggleActive(biz.id, biz.is_active)}
                      className={`rounded-full px-2.5 py-1 text-xs font-semibold ${
                        biz.is_active
                          ? 'bg-green-100 dark:bg-green-500/15 text-green-700 dark:text-green-400'
                          : 'bg-red-100 dark:bg-red-500/15 text-red-700 dark:text-red-400'
                      }`}
                    >
                      {biz.is_active ? 'Active' : 'Inactive'}
                    </button>
                  </td>
                  <td className="px-4 py-3 text-neutral-500 dark:text-neutral-400">{biz.city || '—'}</td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <a
                        href={`https://${biz.slug}.menuos.in`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-xs text-amber-500 hover:underline"
                      >
                        View menu →
                      </a>
                    </div>
                  </td>
                </tr>
              ))}
              {businesses.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-4 py-8 text-center text-neutral-400">No businesses yet.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {showAdd && (
        <AddBusinessModal
          onClose={() => setShowAdd(false)}
          onSuccess={(vars) => { setShowAdd(false); setEnvVars(vars) }}
        />
      )}
      {envVars && (
        <EnvVarsModal envVars={envVars} onClose={() => { setEnvVars(null); startTransition(() => router.refresh()) }} />
      )}
    </div>
  )
}
