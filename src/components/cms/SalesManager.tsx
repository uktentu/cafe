'use client'

import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { IndianRupee, ReceiptText, Percent, TrendingUp, Printer } from 'lucide-react'
import { useCms } from './Providers'
import { useCmsStore } from '@/stores/cms'
import { posQk, fetchSettledOrders, fetchOrderItems, fetchTables } from '@/lib/pos-queries'
import { computeBill, generateBillPdf } from '@/lib/receipt'
import { cn, formatPrice } from '@/lib/utils'
import type { Order } from '@/types/database'

type Range = 'today' | '7d' | 'month'

function rangeStart(range: Range): Date {
  const now = new Date()
  if (range === 'today') return new Date(now.getFullYear(), now.getMonth(), now.getDate())
  if (range === '7d') {
    const d = new Date(now.getFullYear(), now.getMonth(), now.getDate())
    d.setDate(d.getDate() - 6)
    return d
  }
  return new Date(now.getFullYear(), now.getMonth(), 1)
}

const RANGE_LABEL: Record<Range, string> = { today: 'Today', '7d': 'Last 7 days', month: 'This month' }

export function SalesManager() {
  const { business } = useCms()
  const bid = business.id
  const pushToast = useCmsStore((s) => s.pushToast)

  const [range, setRange] = useState<Range>('today')
  const fromIso = rangeStart(range).toISOString()

  const salesQ = useQuery({ queryKey: posQk.sales(bid, fromIso), queryFn: () => fetchSettledOrders(bid, fromIso) })
  const tablesQ = useQuery({ queryKey: posQk.tables(bid), queryFn: () => fetchTables(bid) })

  const bills = salesQ.data ?? []
  const gross = bills.reduce((s, o) => s + o.total_amount, 0)
  const tax = bills.reduce((s, o) => s + o.tax_amount, 0)
  const discounts = bills.reduce((s, o) => s + o.discount_amount, 0)
  const avg = bills.length > 0 ? gross / bills.length : 0

  const byMethod = bills.reduce<Record<string, number>>((acc, o) => {
    const m = o.payment_method ?? 'other'
    acc[m] = (acc[m] ?? 0) + o.total_amount
    return acc
  }, {})

  const tableLabel = (o: Order) => {
    if (!o.table_id) return o.order_type === 'takeaway' ? 'Takeaway' : 'Counter'
    return (tablesQ.data ?? []).find((t) => t.id === o.table_id)?.label ?? 'Table'
  }

  async function reprint(o: Order) {
    try {
      const items = await fetchOrderItems(o.id)
      // Reconstruct from the settled order's own stored values — rates from
      // its tax snapshot, discount as billed — so a reprint matches the
      // original bill even if Settings have changed since.
      const snap = o.tax_rate_snapshot as { food_percent?: number; bar_percent?: number } | null
      const totals = computeBill(items, {
        foodTaxPercent: snap?.food_percent ?? business.tax_percent ?? 5,
        barTaxPercent: snap?.bar_percent ?? business.bar_tax_percent ?? 18,
        discount: o.discount_amount,
      })
      await generateBillPdf({
        business,
        totals,
        kind: 'combined',
        billNo: o.bill_no ?? null,
        contextLabel: tableLabel(o),
        customerName: o.customer_name,
        discountReason: o.discount_reason,
        paidBy: o.payment_method,
        date: o.settled_at ? new Date(o.settled_at) : undefined,
      })
    } catch (err) {
      pushToast((err as Error).message, 'error')
    }
  }

  const stats = [
    { label: 'Gross sales', value: formatPrice(gross), icon: IndianRupee, color: 'text-emerald-500' },
    { label: 'Bills settled', value: String(bills.length), icon: ReceiptText, color: 'text-amber-500' },
    { label: 'Avg bill', value: formatPrice(avg), icon: TrendingUp, color: 'text-blue-500' },
    { label: 'Tax collected', value: formatPrice(tax), icon: Percent, color: 'text-purple-500' },
  ]

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-xl font-semibold">Sales</h2>
          <p className="text-sm text-neutral-400">Settled bills &amp; daily takings.</p>
        </div>
        <div className="flex gap-2">
          {(Object.keys(RANGE_LABEL) as Range[]).map((r) => (
            <button
              key={r}
              onClick={() => setRange(r)}
              className={cn(
                'rounded-full px-3 py-1.5 text-xs font-medium transition',
                range === r ? 'bg-amber-500 text-white' : 'bg-neutral-100 text-neutral-600 dark:bg-neutral-800 dark:text-neutral-300'
              )}
            >
              {RANGE_LABEL[r]}
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        {stats.map((s) => {
          const Icon = s.icon
          return (
            <div key={s.label} className="rounded-xl bg-white p-4 ring-1 ring-black/5 dark:bg-neutral-900 dark:ring-white/10">
              <Icon className={cn('h-4 w-4', s.color)} />
              <p className="mt-2 text-xl font-bold text-neutral-900 dark:text-neutral-100">{s.value}</p>
              <p className="text-xs text-neutral-500 dark:text-neutral-400">{s.label}</p>
            </div>
          )
        })}
      </div>

      {Object.keys(byMethod).length > 0 && (
        <div className="rounded-xl bg-white p-4 ring-1 ring-black/5 dark:bg-neutral-900 dark:ring-white/10">
          <h3 className="mb-3 text-sm font-semibold text-neutral-800 dark:text-neutral-200">Payment methods</h3>
          <div className="space-y-2">
            {Object.entries(byMethod).sort((a, b) => b[1] - a[1]).map(([method, amount]) => (
              <div key={method} className="flex items-center gap-3">
                <span className="w-12 text-xs font-medium uppercase text-neutral-500">{method}</span>
                <div className="h-2 flex-1 overflow-hidden rounded-full bg-neutral-100 dark:bg-neutral-800">
                  <div className="h-full rounded-full bg-amber-500" style={{ width: `${gross > 0 ? (amount / gross) * 100 : 0}%` }} />
                </div>
                <span className="w-20 text-right text-xs text-neutral-600 dark:text-neutral-300">{formatPrice(amount)}</span>
              </div>
            ))}
          </div>
          {discounts > 0 && (
            <p className="mt-3 text-xs text-neutral-400">Discounts given: {formatPrice(discounts)}</p>
          )}
        </div>
      )}

      {salesQ.isLoading ? (
        <div className="flex h-32 items-center justify-center text-sm text-neutral-500">Loading bills…</div>
      ) : salesQ.isError ? (
        <div className="rounded-xl border border-dashed border-red-900/50 bg-red-500/5 p-8 text-center">
          <p className="text-sm text-red-400">Couldn&apos;t load sales: {(salesQ.error as Error).message}</p>
        </div>
      ) : bills.length === 0 ? (
        <div className="rounded-xl border border-dashed border-neutral-300 p-8 text-center dark:border-neutral-800">
          <p className="text-sm text-neutral-400">No settled bills in this period.</p>
        </div>
      ) : (
        <div className="overflow-x-auto rounded-xl bg-white ring-1 ring-black/5 dark:bg-neutral-900 dark:ring-white/10">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-neutral-100 text-left text-xs uppercase tracking-wide text-neutral-400 dark:border-neutral-800">
                <th className="px-4 py-3">Bill</th>
                <th className="px-4 py-3">Time</th>
                <th className="px-4 py-3">Where</th>
                <th className="px-4 py-3 text-right">Total</th>
                <th className="px-4 py-3">Paid</th>
                <th className="px-4 py-3" />
              </tr>
            </thead>
            <tbody>
              {bills.map((o) => (
                <tr key={o.id} className="border-b border-neutral-50 last:border-0 dark:border-neutral-800/50">
                  <td className="px-4 py-2.5 font-medium text-neutral-900 dark:text-neutral-100">
                    {o.bill_no != null ? `#${o.bill_no}` : `#${o.id.slice(0, 6)}`}
                  </td>
                  <td className="px-4 py-2.5 text-neutral-500 dark:text-neutral-400">
                    {o.settled_at ? new Date(o.settled_at).toLocaleString('en-IN', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' }) : '—'}
                  </td>
                  <td className="px-4 py-2.5 text-neutral-600 dark:text-neutral-300">{tableLabel(o)}</td>
                  <td className="px-4 py-2.5 text-right font-medium text-neutral-900 dark:text-neutral-100">{formatPrice(o.total_amount)}</td>
                  <td className="px-4 py-2.5 text-xs uppercase text-neutral-500">{o.payment_method ?? '—'}</td>
                  <td className="px-4 py-2.5 text-right">
                    <button onClick={() => reprint(o)} title="Reprint bill" className="rounded p-1.5 text-neutral-400 hover:bg-neutral-100 hover:text-neutral-600 dark:hover:bg-neutral-800">
                      <Printer className="h-4 w-4" />
                    </button>
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
