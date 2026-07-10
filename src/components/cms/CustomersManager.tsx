'use client'

import { useMemo, useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Users, Star, Search, Pencil, Check, MessageCircle } from 'lucide-react'
import { useCms } from './Providers'
import { Input } from '@/components/ui/Input'
import { useCmsStore } from '@/stores/cms'
import { ownerQk, fetchCustomers, updateCustomer } from '@/lib/owner-queries'
import { formatPrice, cn } from '@/lib/utils'

export function CustomersManager() {
  const { business } = useCms()
  const bid = business.id
  const qc = useQueryClient()
  const pushToast = useCmsStore((s) => s.pushToast)

  const { data: customers = [], isLoading, isError, error } = useQuery({
    queryKey: ownerQk.customers(bid),
    queryFn: () => fetchCustomers(bid),
  })

  const [query, setQuery] = useState('')
  const [editId, setEditId] = useState<string | null>(null)
  const [editName, setEditName] = useState('')

  const saveMut = useMutation({
    mutationFn: ({ id, name }: { id: string; name: string }) => updateCustomer(id, { name: name || null }),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ownerQk.customers(bid) }); pushToast('Saved'); setEditId(null) },
    onError: (e: unknown) => pushToast((e as Error).message, 'error'),
  })

  const q = query.trim().toLowerCase()
  const filtered = useMemo(
    () => customers.filter((c) => !q || (c.name ?? '').toLowerCase().includes(q) || c.phone.includes(q)),
    [customers, q]
  )

  const totalSpent = customers.reduce((s, c) => s + c.total_spent, 0)
  const totalVisits = customers.reduce((s, c) => s + c.visit_count, 0)

  const stats = [
    { label: 'Customers', value: String(customers.length), icon: Users, color: 'text-amber-500' },
    { label: 'Total visits', value: String(totalVisits), icon: Star, color: 'text-blue-500' },
    { label: 'Lifetime value', value: formatPrice(totalSpent), icon: Users, color: 'text-emerald-500' },
  ]

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-semibold">Customers</h2>
        <p className="text-sm text-neutral-400">Your customer book — built automatically from settled bills with a phone number.</p>
      </div>

      <div className="grid grid-cols-3 gap-3">
        {stats.map((s) => {
          const Icon = s.icon
          return (
            <div key={s.label} className="rounded-xl bg-white p-4 ring-1 ring-black/5 dark:bg-neutral-900 dark:ring-white/10">
              <Icon className={cn('h-4 w-4', s.color)} />
              <p className="mt-2 text-lg font-bold text-neutral-900 dark:text-neutral-100">{s.value}</p>
              <p className="text-xs text-neutral-500 dark:text-neutral-400">{s.label}</p>
            </div>
          )
        })}
      </div>

      <div className="relative">
        <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-neutral-400" />
        <Input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search name or phone…" className="pl-9" />
      </div>

      {isLoading ? (
        <div className="flex h-32 items-center justify-center text-sm text-neutral-500">Loading…</div>
      ) : isError ? (
        <div className="rounded-xl border border-dashed border-red-900/50 bg-red-500/5 p-8 text-center">
          <p className="text-sm text-red-400">Couldn&apos;t load customers: {(error as Error).message}</p>
          <p className="mt-1 text-xs text-neutral-500">Has migration 013 been applied?</p>
        </div>
      ) : filtered.length === 0 ? (
        <div className="rounded-xl border border-dashed border-neutral-300 p-8 text-center dark:border-neutral-800">
          <p className="text-sm text-neutral-400">{customers.length === 0 ? 'No customers yet. They appear here after a bill is settled with a phone number.' : 'No matches.'}</p>
        </div>
      ) : (
        <div className="overflow-x-auto rounded-xl bg-white ring-1 ring-black/5 dark:bg-neutral-900 dark:ring-white/10">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-neutral-100 text-left text-xs uppercase tracking-wide text-neutral-400 dark:border-neutral-800">
                <th className="px-4 py-3">Customer</th><th className="px-4 py-3 text-right">Visits</th><th className="px-4 py-3 text-right">Spent</th><th className="px-4 py-3 text-right">Points</th><th className="px-4 py-3">Last seen</th><th className="px-4 py-3" />
              </tr>
            </thead>
            <tbody>
              {filtered.map((c) => (
                <tr key={c.id} className="border-b border-neutral-50 last:border-0 dark:border-neutral-800/50">
                  <td className="px-4 py-2.5">
                    {editId === c.id ? (
                      <div className="flex items-center gap-1.5">
                        <Input value={editName} onChange={(e) => setEditName(e.target.value)} className="h-8 w-40" autoFocus />
                        <button onClick={() => saveMut.mutate({ id: c.id, name: editName })} className="rounded p-1.5 text-emerald-500 hover:bg-emerald-500/10"><Check className="h-4 w-4" /></button>
                      </div>
                    ) : (
                      <>
                        <p className="font-medium text-neutral-900 dark:text-neutral-100">{c.name || 'Guest'}</p>
                        <p className="text-xs text-neutral-500 dark:text-neutral-400">{c.phone}</p>
                      </>
                    )}
                  </td>
                  <td className="px-4 py-2.5 text-right text-neutral-600 dark:text-neutral-300">{c.visit_count}</td>
                  <td className="px-4 py-2.5 text-right font-medium text-neutral-900 dark:text-neutral-100">{formatPrice(c.total_spent)}</td>
                  <td className="px-4 py-2.5 text-right">
                    <span className="inline-flex items-center gap-1 text-amber-500"><Star className="h-3.5 w-3.5 fill-amber-500" />{c.loyalty_points}</span>
                  </td>
                  <td className="px-4 py-2.5 text-xs text-neutral-500 dark:text-neutral-400">{c.last_seen ? new Date(c.last_seen).toLocaleDateString('en-IN', { day: '2-digit', month: 'short' }) : '—'}</td>
                  <td className="px-4 py-2.5 text-right">
                    <div className="flex items-center justify-end gap-1">
                      <a href={`https://wa.me/${c.phone.replace(/[^0-9]/g, '')}`} target="_blank" rel="noopener noreferrer" title="WhatsApp" className="rounded p-1.5 text-emerald-500 hover:bg-emerald-500/10">
                        <MessageCircle className="h-4 w-4" />
                      </a>
                      <button onClick={() => { setEditId(c.id); setEditName(c.name ?? '') }} title="Edit name" className="rounded p-1.5 text-neutral-400 hover:bg-neutral-100 dark:hover:bg-neutral-800">
                        <Pencil className="h-4 w-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
