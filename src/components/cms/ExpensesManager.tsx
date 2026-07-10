'use client'

import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Plus, Trash2, Receipt } from 'lucide-react'
import { useCms } from './Providers'
import { Button } from '@/components/ui/Button'
import { Input, Select } from '@/components/ui/Input'
import { useCmsStore } from '@/stores/cms'
import { ownerQk, fetchExpenses, createExpense, deleteExpense } from '@/lib/owner-queries'
import { formatPrice, cn } from '@/lib/utils'
import type { ExpenseCategory } from '@/types/database'

type Range = 'today' | '7d' | 'month'
function rangeStart(range: Range): string {
  const now = new Date()
  const d = new Date(now.getFullYear(), now.getMonth(), now.getDate())
  if (range === '7d') d.setDate(d.getDate() - 6)
  if (range === 'month') return new Date(now.getFullYear(), now.getMonth(), 1).toISOString().slice(0, 10)
  return d.toISOString().slice(0, 10)
}
const RANGE_LABEL: Record<Range, string> = { today: 'Today', '7d': 'Last 7 days', month: 'This month' }

const CATEGORIES: { value: ExpenseCategory; label: string }[] = [
  { value: 'supplies', label: 'Supplies / Ingredients' },
  { value: 'salaries', label: 'Salaries / Wages' },
  { value: 'rent', label: 'Rent' },
  { value: 'utilities', label: 'Utilities' },
  { value: 'maintenance', label: 'Maintenance' },
  { value: 'misc', label: 'Miscellaneous' },
]
const CAT_LABEL = Object.fromEntries(CATEGORIES.map((c) => [c.value, c.label])) as Record<ExpenseCategory, string>

export function ExpensesManager() {
  const { business, role } = useCms()
  const bid = business.id
  const qc = useQueryClient()
  const pushToast = useCmsStore((s) => s.pushToast)
  const canDelete = role === 'owner' || role === 'admin'

  const [range, setRange] = useState<Range>('month')
  const fromIso = rangeStart(range)

  const { data: expenses = [], isLoading, isError, error } = useQuery({
    queryKey: ownerQk.expenses(bid, fromIso),
    queryFn: () => fetchExpenses(bid, fromIso),
  })

  const [adding, setAdding] = useState(false)
  const [category, setCategory] = useState<ExpenseCategory>('supplies')
  const [vendor, setVendor] = useState('')
  const [amount, setAmount] = useState('')
  const [spentOn, setSpentOn] = useState(() => new Date().toISOString().slice(0, 10))
  const [note, setNote] = useState('')

  const reset = () => { setVendor(''); setAmount(''); setNote(''); setCategory('supplies'); setSpentOn(new Date().toISOString().slice(0, 10)); setAdding(false) }

  const createMut = useMutation({
    mutationFn: () => createExpense({ business_id: bid, category, vendor: vendor || null, amount: Number(amount) || 0, note: note || null, spent_on: spentOn }),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['owner-expenses', bid] }); pushToast('Expense added'); reset() },
    onError: (e: unknown) => pushToast((e as Error).message, 'error'),
  })

  const deleteMut = useMutation({
    mutationFn: (id: string) => deleteExpense(id),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['owner-expenses', bid] }); pushToast('Expense removed') },
    onError: (e: unknown) => pushToast((e as Error).message, 'error'),
  })

  const total = expenses.reduce((s, e) => s + e.amount, 0)

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-xl font-semibold">Expenses</h2>
          <p className="text-sm text-neutral-400">Track money out for a real profit picture.</p>
        </div>
        <div className="flex items-center gap-2">
          {(Object.keys(RANGE_LABEL) as Range[]).map((r) => (
            <button key={r} onClick={() => setRange(r)} className={cn('rounded-full px-3 py-1.5 text-xs font-medium transition', range === r ? 'bg-amber-500 text-white' : 'bg-neutral-100 text-neutral-600 dark:bg-neutral-800 dark:text-neutral-300')}>
              {RANGE_LABEL[r]}
            </button>
          ))}
          {!adding && <Button size="sm" onClick={() => setAdding(true)}><Plus className="h-4 w-4" /> Add</Button>}
        </div>
      </div>

      <div className="rounded-xl bg-white p-4 ring-1 ring-black/5 dark:bg-neutral-900 dark:ring-white/10">
        <Receipt className="h-4 w-4 text-red-500" />
        <p className="mt-2 text-2xl font-bold text-neutral-900 dark:text-neutral-100">{formatPrice(total)}</p>
        <p className="text-xs text-neutral-500 dark:text-neutral-400">{RANGE_LABEL[range]} · {expenses.length} entr{expenses.length === 1 ? 'y' : 'ies'}</p>
      </div>

      {adding && (
        <form onSubmit={(e) => { e.preventDefault(); if (!amount || Number(amount) <= 0) return pushToast('Enter an amount', 'error'); createMut.mutate() }} className="rounded-xl border border-neutral-200 bg-neutral-50 p-4 space-y-4 dark:border-neutral-800 dark:bg-neutral-900/50">
          <h3 className="font-medium text-neutral-900 dark:text-white">New expense</h3>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-1">
              <label className="text-xs font-medium text-neutral-400">Category</label>
              <Select value={category} onChange={(e) => setCategory(e.target.value as ExpenseCategory)}>
                {CATEGORIES.map((c) => <option key={c.value} value={c.value}>{c.label}</option>)}
              </Select>
            </div>
            <div className="space-y-1">
              <label className="text-xs font-medium text-neutral-400">Amount *</label>
              <Input type="number" min={0} step="0.01" value={amount} onChange={(e) => setAmount(e.target.value)} placeholder="0.00" autoFocus />
            </div>
            <div className="space-y-1">
              <label className="text-xs font-medium text-neutral-400">Vendor / Paid to</label>
              <Input value={vendor} onChange={(e) => setVendor(e.target.value)} placeholder="e.g. Metro Cash & Carry" />
            </div>
            <div className="space-y-1">
              <label className="text-xs font-medium text-neutral-400">Date</label>
              <Input type="date" value={spentOn} onChange={(e) => setSpentOn(e.target.value)} />
            </div>
            <div className="space-y-1 sm:col-span-2">
              <label className="text-xs font-medium text-neutral-400">Note</label>
              <Input value={note} onChange={(e) => setNote(e.target.value)} placeholder="Optional" />
            </div>
          </div>
          <div className="flex justify-end gap-2">
            <Button type="button" variant="ghost" onClick={reset}>Cancel</Button>
            <Button type="submit" disabled={createMut.isPending}>Add expense</Button>
          </div>
        </form>
      )}

      {isLoading ? (
        <div className="flex h-32 items-center justify-center text-sm text-neutral-500">Loading…</div>
      ) : isError ? (
        <div className="rounded-xl border border-dashed border-red-900/50 bg-red-500/5 p-8 text-center">
          <p className="text-sm text-red-400">Couldn&apos;t load expenses: {(error as Error).message}</p>
          <p className="mt-1 text-xs text-neutral-500">Has migration 013 been applied?</p>
        </div>
      ) : expenses.length === 0 ? (
        <div className="rounded-xl border border-dashed border-neutral-300 p-8 text-center dark:border-neutral-800">
          <p className="text-sm text-neutral-400">No expenses in this period.</p>
        </div>
      ) : (
        <div className="overflow-x-auto rounded-xl bg-white ring-1 ring-black/5 dark:bg-neutral-900 dark:ring-white/10">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-neutral-100 text-left text-xs uppercase tracking-wide text-neutral-400 dark:border-neutral-800">
                <th className="px-4 py-3">Date</th><th className="px-4 py-3">Category</th><th className="px-4 py-3">Vendor</th><th className="px-4 py-3 text-right">Amount</th><th className="px-4 py-3" />
              </tr>
            </thead>
            <tbody>
              {expenses.map((e) => (
                <tr key={e.id} className="border-b border-neutral-50 last:border-0 dark:border-neutral-800/50">
                  <td className="px-4 py-2.5 text-neutral-500 dark:text-neutral-400">{new Date(e.spent_on).toLocaleDateString('en-IN', { day: '2-digit', month: 'short' })}</td>
                  <td className="px-4 py-2.5 text-neutral-700 dark:text-neutral-300">{CAT_LABEL[e.category] ?? e.category}{e.note ? <span className="block text-xs text-neutral-400">{e.note}</span> : null}</td>
                  <td className="px-4 py-2.5 text-neutral-600 dark:text-neutral-300">{e.vendor ?? '—'}</td>
                  <td className="px-4 py-2.5 text-right font-medium text-neutral-900 dark:text-neutral-100">{formatPrice(e.amount)}</td>
                  <td className="px-4 py-2.5 text-right">
                    {canDelete && (
                      <button onClick={() => { if (confirm('Delete this expense?')) deleteMut.mutate(e.id) }} className="rounded p-1.5 text-red-400 hover:bg-red-500/10">
                        <Trash2 className="h-4 w-4" />
                      </button>
                    )}
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
