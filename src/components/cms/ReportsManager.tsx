'use client'

import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { IndianRupee, ReceiptText, Percent, TrendingUp, Wallet, Printer, Lock, CheckCircle2 } from 'lucide-react'
import { useCms } from './Providers'
import { Input } from '@/components/ui/Input'
import { Button } from '@/components/ui/Button'
import { useCmsStore } from '@/stores/cms'
import { ownerQk, fetchDayReport, fetchDayClose, closeDay, type DayReport } from '@/lib/owner-queries'
import { formatPrice, cn } from '@/lib/utils'
import type { Business } from '@/types/database'

function dayRange(dateStr: string) {
  const start = new Date(dateStr + 'T00:00:00')
  const end = new Date(start.getTime() + 86_400_000)
  return { startIso: start.toISOString(), endIso: end.toISOString() }
}

async function printZReport(business: Business, dateStr: string, report: DayReport, close: { opening: number; counted: number; expected: number; variance: number } | null) {
  const { jsPDF } = await import('jspdf')
  const lh = 4.5
  const height = 90 + report.items.length * lh + Object.keys(report.byMethod).length * lh
  const doc = new jsPDF({ unit: 'mm', format: [80, Math.max(height, 130)] })
  const w = doc.internal.pageSize.getWidth()
  const right = w - 4
  let y = 8
  const center = (t: string, s: number, b = false) => { doc.setFontSize(s); doc.setFont('helvetica', b ? 'bold' : 'normal'); doc.text(t, w / 2, y, { align: 'center' }); y += s * 0.5 }
  const row = (l: string, v: string, b = false) => { doc.setFont('helvetica', b ? 'bold' : 'normal'); doc.text(l, 4, y); doc.text(v, right, y, { align: 'right' }); y += lh }
  const rule = () => { doc.setLineDashPattern([1, 1], 0); doc.line(4, y, right, y); doc.setLineDashPattern([], 0); y += 4 }

  center(business.name, 12, true)
  center('DAY CLOSE / Z-REPORT', 9, true)
  center(new Date(dateStr + 'T00:00:00').toLocaleDateString('en-IN', { dateStyle: 'full' }), 8)
  y += 1; rule()
  doc.setFontSize(8.5)
  row('Bills settled', String(report.billCount))
  row('Gross sales', report.grossSales.toFixed(2))
  if (report.discount > 0) row('Discounts', '-' + report.discount.toFixed(2))
  row('Net revenue', report.netRevenue.toFixed(2))
  row('Tax collected', report.tax.toFixed(2))
  doc.setFontSize(9.5); row('Total collected', 'Rs.' + report.collected.toFixed(2), true); doc.setFontSize(8.5)
  rule()
  doc.setFont('helvetica', 'bold'); doc.text('Payments', 4, y); y += lh; doc.setFont('helvetica', 'normal')
  Object.entries(report.byMethod).forEach(([m, amt]) => row('  ' + m.toUpperCase(), amt.toFixed(2)))
  rule()
  doc.setFont('helvetica', 'bold'); doc.text('Expenses', 4, y); y += lh; doc.setFont('helvetica', 'normal')
  row('Total expenses', report.expensesTotal.toFixed(2))
  doc.setFontSize(9.5); row('PROFIT (net - exp)', 'Rs.' + report.profit.toFixed(2), true); doc.setFontSize(8.5)
  if (close) {
    rule()
    doc.setFont('helvetica', 'bold'); doc.text('Cash drawer', 4, y); y += lh; doc.setFont('helvetica', 'normal')
    row('Opening cash', close.opening.toFixed(2))
    row('Cash sales', report.cashSales.toFixed(2))
    row('Expected', close.expected.toFixed(2))
    row('Counted', close.counted.toFixed(2))
    row('Variance', (close.variance >= 0 ? '+' : '') + close.variance.toFixed(2), true)
  }
  y += 2; center('Generated ' + new Date().toLocaleString('en-IN'), 7)
  doc.save(`${business.slug}-zreport-${dateStr}.pdf`)
}

function StatCard({ icon: Icon, label, value, color, hint }: { icon: React.ElementType; label: string; value: string; color: string; hint?: string }) {
  return (
    <div className="rounded-xl bg-white p-4 ring-1 ring-black/5 dark:bg-neutral-900 dark:ring-white/10">
      <Icon className={cn('h-4 w-4', color)} />
      <p className="mt-2 text-xl font-bold text-neutral-900 dark:text-neutral-100">{value}</p>
      <p className="text-xs text-neutral-500 dark:text-neutral-400">{label}</p>
      {hint && <p className="text-[10px] text-neutral-400">{hint}</p>}
    </div>
  )
}

export function ReportsManager() {
  const { business } = useCms()
  const bid = business.id
  const qc = useQueryClient()
  const pushToast = useCmsStore((s) => s.pushToast)

  const [date, setDate] = useState(() => new Date().toISOString().slice(0, 10))
  const { startIso, endIso } = dayRange(date)

  const reportQ = useQuery({ queryKey: ownerQk.dayReport(bid, date), queryFn: () => fetchDayReport(bid, startIso, endIso) })
  const closeQ = useQuery({ queryKey: [...ownerQk.dayCloses(bid), date], queryFn: () => fetchDayClose(bid, date) })

  const [openingCash, setOpeningCash] = useState('0')
  const [countedCash, setCountedCash] = useState('')

  const report = reportQ.data
  const existingClose = closeQ.data
  const expected = (Number(openingCash) || 0) + (report?.cashSales ?? 0)
  const variance = (Number(countedCash) || 0) - expected

  const closeMut = useMutation({
    mutationFn: () => closeDay({
      business_id: bid,
      close_date: date,
      opening_cash: Number(openingCash) || 0,
      counted_cash: Number(countedCash) || 0,
      expected_cash: expected,
      totals: report as unknown as Record<string, unknown>,
    }),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ownerQk.dayCloses(bid) }); pushToast('Day closed') },
    onError: (e: unknown) => pushToast((e as Error).message, 'error'),
  })

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-xl font-semibold">Reports &amp; Day Close</h2>
          <p className="text-sm text-neutral-400">The day&apos;s takings, item sales, and end-of-day cash close.</p>
        </div>
        <div className="flex items-center gap-2">
          <Input type="date" value={date} max={new Date().toISOString().slice(0, 10)} onChange={(e) => setDate(e.target.value)} className="w-auto" />
          {report && report.billCount > 0 && (
            <Button size="sm" variant="secondary" onClick={() => printZReport(business, date, report, existingClose ? { opening: existingClose.opening_cash, counted: existingClose.counted_cash, expected: existingClose.expected_cash, variance: existingClose.variance } : null)}>
              <Printer className="h-4 w-4" /> Z-Report
            </Button>
          )}
        </div>
      </div>

      {reportQ.isLoading ? (
        <div className="flex h-32 items-center justify-center text-sm text-neutral-500">Loading…</div>
      ) : reportQ.isError ? (
        <div className="rounded-xl border border-dashed border-red-900/50 bg-red-500/5 p-8 text-center">
          <p className="text-sm text-red-400">Couldn&apos;t load report: {(reportQ.error as Error).message}</p>
        </div>
      ) : report ? (
        <>
          <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
            <StatCard icon={IndianRupee} label="Total collected" value={formatPrice(report.collected)} color="text-emerald-500" />
            <StatCard icon={ReceiptText} label="Bills" value={String(report.billCount)} color="text-amber-500" />
            <StatCard icon={Percent} label="Tax collected" value={formatPrice(report.tax)} color="text-purple-500" hint="payable to govt" />
            <StatCard icon={TrendingUp} label="Profit" value={formatPrice(report.profit)} color={report.profit >= 0 ? 'text-emerald-500' : 'text-red-500'} hint="net revenue − expenses" />
          </div>

          <div className="grid gap-4 lg:grid-cols-2">
            <div className="rounded-xl bg-white p-4 ring-1 ring-black/5 dark:bg-neutral-900 dark:ring-white/10">
              <h3 className="mb-3 text-sm font-semibold text-neutral-800 dark:text-neutral-200">Breakdown</h3>
              <dl className="space-y-1.5 text-sm">
                <div className="flex justify-between text-neutral-600 dark:text-neutral-400"><dt>Gross sales</dt><dd>{formatPrice(report.grossSales)}</dd></div>
                {report.discount > 0 && <div className="flex justify-between text-neutral-600 dark:text-neutral-400"><dt>Discounts</dt><dd>−{formatPrice(report.discount)}</dd></div>}
                <div className="flex justify-between text-neutral-600 dark:text-neutral-400"><dt>Net revenue</dt><dd>{formatPrice(report.netRevenue)}</dd></div>
                <div className="flex justify-between text-neutral-600 dark:text-neutral-400"><dt>Tax</dt><dd>{formatPrice(report.tax)}</dd></div>
                <div className="flex justify-between text-neutral-600 dark:text-neutral-400"><dt>Expenses</dt><dd>−{formatPrice(report.expensesTotal)}</dd></div>
                <div className="flex justify-between border-t border-neutral-200 pt-1.5 font-semibold text-neutral-900 dark:border-neutral-800 dark:text-neutral-100"><dt>Profit</dt><dd>{formatPrice(report.profit)}</dd></div>
              </dl>
              <h4 className="mb-2 mt-4 text-xs font-semibold uppercase tracking-wide text-neutral-400">Payments</h4>
              <div className="space-y-2">
                {Object.keys(report.byMethod).length === 0 ? <p className="text-xs text-neutral-400">No settled bills.</p> :
                  Object.entries(report.byMethod).sort((a, b) => b[1] - a[1]).map(([m, amt]) => (
                    <div key={m} className="flex items-center gap-3">
                      <span className="w-12 text-xs font-medium uppercase text-neutral-500">{m}</span>
                      <div className="h-2 flex-1 overflow-hidden rounded-full bg-neutral-100 dark:bg-neutral-800"><div className="h-full rounded-full bg-amber-500" style={{ width: `${report.collected > 0 ? (amt / report.collected) * 100 : 0}%` }} /></div>
                      <span className="w-20 text-right text-xs text-neutral-600 dark:text-neutral-300">{formatPrice(amt)}</span>
                    </div>
                  ))}
              </div>
            </div>

            {/* Day close */}
            <div className="rounded-xl bg-white p-4 ring-1 ring-black/5 dark:bg-neutral-900 dark:ring-white/10">
              <h3 className="mb-3 flex items-center gap-2 text-sm font-semibold text-neutral-800 dark:text-neutral-200"><Wallet className="h-4 w-4" /> Cash drawer close</h3>
              {existingClose ? (
                <div className="space-y-2 text-sm">
                  <div className="flex items-center gap-2 rounded-lg bg-emerald-500/10 px-3 py-2 text-emerald-600 dark:text-emerald-400"><CheckCircle2 className="h-4 w-4" /> Day already closed</div>
                  <div className="flex justify-between text-neutral-600 dark:text-neutral-400"><span>Opening</span><span>{formatPrice(existingClose.opening_cash)}</span></div>
                  <div className="flex justify-between text-neutral-600 dark:text-neutral-400"><span>Expected</span><span>{formatPrice(existingClose.expected_cash)}</span></div>
                  <div className="flex justify-between text-neutral-600 dark:text-neutral-400"><span>Counted</span><span>{formatPrice(existingClose.counted_cash)}</span></div>
                  <div className={cn('flex justify-between font-semibold', existingClose.variance === 0 ? 'text-neutral-900 dark:text-neutral-100' : existingClose.variance > 0 ? 'text-emerald-500' : 'text-red-500')}><span>Variance</span><span>{existingClose.variance >= 0 ? '+' : ''}{formatPrice(existingClose.variance)}</span></div>
                </div>
              ) : (
                <div className="space-y-3">
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1">
                      <label className="text-xs font-medium text-neutral-400">Opening cash</label>
                      <Input type="number" min={0} step="0.01" value={openingCash} onChange={(e) => setOpeningCash(e.target.value)} />
                    </div>
                    <div className="space-y-1">
                      <label className="text-xs font-medium text-neutral-400">Counted cash</label>
                      <Input type="number" min={0} step="0.01" value={countedCash} onChange={(e) => setCountedCash(e.target.value)} placeholder="Count the drawer" />
                    </div>
                  </div>
                  <div className="space-y-1 rounded-lg bg-neutral-50 p-3 text-sm dark:bg-neutral-800/50">
                    <div className="flex justify-between text-neutral-600 dark:text-neutral-400"><span>Cash sales today</span><span>{formatPrice(report.cashSales)}</span></div>
                    <div className="flex justify-between text-neutral-600 dark:text-neutral-400"><span>Expected in drawer</span><span>{formatPrice(expected)}</span></div>
                    {countedCash !== '' && <div className={cn('flex justify-between font-semibold', variance === 0 ? 'text-neutral-900 dark:text-neutral-100' : variance > 0 ? 'text-emerald-500' : 'text-red-500')}><span>Variance</span><span>{variance >= 0 ? '+' : ''}{formatPrice(variance)}</span></div>}
                  </div>
                  <Button onClick={() => closeMut.mutate()} disabled={closeMut.isPending || countedCash === ''} className="w-full">
                    <Lock className="h-4 w-4" /> Close day {date === new Date().toISOString().slice(0, 10) ? '' : `(${date})`}
                  </Button>
                </div>
              )}
            </div>
          </div>

          {/* Item-wise sales */}
          <div className="overflow-x-auto rounded-xl bg-white ring-1 ring-black/5 dark:bg-neutral-900 dark:ring-white/10">
            <div className="border-b border-neutral-100 px-4 py-3 dark:border-neutral-800"><h3 className="text-sm font-semibold text-neutral-800 dark:text-neutral-200">Item-wise sales</h3></div>
            {report.items.length === 0 ? (
              <p className="p-6 text-center text-sm text-neutral-400">No items sold.</p>
            ) : (
              <table className="w-full text-sm">
                <thead><tr className="text-left text-xs uppercase tracking-wide text-neutral-400"><th className="px-4 py-2">Item</th><th className="px-4 py-2 text-right">Qty</th><th className="px-4 py-2 text-right">Revenue</th></tr></thead>
                <tbody>
                  {report.items.map((it) => (
                    <tr key={it.name} className="border-t border-neutral-50 dark:border-neutral-800/50">
                      <td className="px-4 py-2 text-neutral-700 dark:text-neutral-300">{it.name}</td>
                      <td className="px-4 py-2 text-right text-neutral-600 dark:text-neutral-400">{it.qty}</td>
                      <td className="px-4 py-2 text-right font-medium text-neutral-900 dark:text-neutral-100">{formatPrice(it.revenue)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </>
      ) : null}
    </div>
  )
}
