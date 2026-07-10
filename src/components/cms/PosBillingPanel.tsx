'use client'

import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { X, Check, Printer, Ban } from 'lucide-react'
import { useCms } from './Providers'
import { Input } from '@/components/ui/Input'
import { useCmsStore } from '@/stores/cms'
import { posQk, fetchOrderItems, settleOrder, updateOrderStatus } from '@/lib/pos-queries'
import { computeBill, generateBillPdf, type BillKind } from '@/lib/receipt'
import { track } from '@/lib/firebase'
import type { Order, PaymentMethod } from '@/types/database'

const PAYMENT_METHODS: PaymentMethod[] = ['cash', 'card', 'upi', 'other']

export function PosBillingPanel({
  order,
  tableLabel,
  onClose,
  onSettled,
}: {
  order: Order
  tableLabel?: string | null
  onClose: () => void
  onSettled: () => void
}) {
  const { business, role } = useCms()
  const qc = useQueryClient()
  const pushToast = useCmsStore((s) => s.pushToast)
  const canDiscount = role === 'owner' || role === 'admin'

  const itemsQ = useQuery({ queryKey: posQk.orderItems(order.id), queryFn: () => fetchOrderItems(order.id) })

  const [discountAmount, setDiscountAmount] = useState('0')
  const [discountReason, setDiscountReason] = useState('')
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('cash')
  // Set once the settle succeeds — flips the panel into the printed-bill
  // confirmation view carrying the DB-assigned bill number.
  const [settledOrder, setSettledOrder] = useState<Order | null>(null)

  const discount = canDiscount ? Number(discountAmount) || 0 : 0
  const totals = computeBill(itemsQ.data ?? [], {
    foodTaxPercent: business.tax_percent ?? 5,
    barTaxPercent: business.bar_tax_percent ?? 18,
    discount,
  })
  const { foodItems, barItems, hasBoth, foodSub, barSub, subtotal, foodTax, barTax, total } = totals
  const activeCount = foodItems.length + barItems.length

  const contextLabel = tableLabel ?? (order.order_type === 'dine_in' ? 'Dine-in' : order.order_type === 'takeaway' ? 'Takeaway' : 'Counter')

  const settleMut = useMutation({
    mutationFn: () =>
      settleOrder(order.id, {
        payment_method: paymentMethod,
        discount_amount: discount,
        discount_reason: discount > 0 ? discountReason || null : null,
        food_tax_percent: totals.foodTaxPercent,
        bar_tax_percent: totals.barTaxPercent,
      }),
    onSuccess: (settled) => {
      pushToast(settled.bill_no ? `Bill #${settled.bill_no} settled` : 'Bill settled')
      track('order_settled', { business_id: business.id })
      setSettledOrder(settled)
    },
    onError: (err: unknown) => pushToast((err as Error).message, 'error'),
  })

  const cancelMut = useMutation({
    mutationFn: () => updateOrderStatus(order.id, 'cancelled'),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: posQk.orders(business.id) })
      pushToast('Order cancelled')
      onSettled()
    },
    onError: (err: unknown) => pushToast((err as Error).message, 'error'),
  })

  function print(kind: BillKind) {
    void generateBillPdf({
      business,
      totals,
      kind,
      billNo: settledOrder?.bill_no ?? null,
      contextLabel,
      customerName: order.customer_name,
      discountReason: discount > 0 ? discountReason : null,
      paidBy: settledOrder ? settledOrder.payment_method ?? paymentMethod : null,
    })
  }

  // ── Post-settle confirmation: bill number + print, then Done ──
  if (settledOrder) {
    return (
      <div className="fixed inset-0 z-50 flex items-end justify-center sm:items-center">
        <div className="absolute inset-0 bg-black/40" />
        <div className="relative z-10 w-full max-w-md rounded-t-3xl bg-white dark:bg-neutral-900 p-6 shadow-2xl sm:rounded-2xl text-center">
          <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-emerald-500/15">
            <Check className="h-6 w-6 text-emerald-500" />
          </div>
          <h2 className="text-lg font-bold text-neutral-900 dark:text-neutral-100">
            {settledOrder.bill_no != null ? `Bill #${settledOrder.bill_no}` : 'Bill'} settled
          </h2>
          <p className="mt-1 text-sm text-neutral-500 dark:text-neutral-400">
            ₹{settledOrder.total_amount.toFixed(2)} &middot; {(settledOrder.payment_method ?? paymentMethod).toUpperCase()}
          </p>

          <div className="mt-5 flex flex-col gap-2">
            {hasBoth ? (
              <>
                <button onClick={() => print('food')} className="flex items-center justify-center gap-2 rounded-xl bg-neutral-100 py-3 text-sm font-medium text-neutral-700 hover:bg-neutral-200 dark:bg-neutral-800 dark:text-neutral-200 dark:hover:bg-neutral-700">
                  <Printer className="h-4 w-4" /> Print Food Bill
                </button>
                <button onClick={() => print('bar')} className="flex items-center justify-center gap-2 rounded-xl bg-neutral-100 py-3 text-sm font-medium text-neutral-700 hover:bg-neutral-200 dark:bg-neutral-800 dark:text-neutral-200 dark:hover:bg-neutral-700">
                  <Printer className="h-4 w-4" /> Print Bar Bill
                </button>
              </>
            ) : (
              <button onClick={() => print(barItems.length > 0 ? 'bar' : 'combined')} className="flex items-center justify-center gap-2 rounded-xl bg-neutral-100 py-3 text-sm font-medium text-neutral-700 hover:bg-neutral-200 dark:bg-neutral-800 dark:text-neutral-200 dark:hover:bg-neutral-700">
                <Printer className="h-4 w-4" /> Print Bill
              </button>
            )}
            <button onClick={onSettled} className="rounded-xl bg-amber-500 py-3 text-sm font-bold text-white hover:bg-amber-600 transition-colors">
              Done
            </button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center sm:items-center">
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />
      <div className="relative z-10 w-full max-w-md rounded-t-3xl bg-white dark:bg-neutral-900 p-6 shadow-2xl sm:rounded-2xl">
        <div className="mb-4 flex items-center justify-between">
          <div>
            <h2 className="text-lg font-bold text-neutral-900 dark:text-neutral-100">Settle Bill</h2>
            <p className="text-xs text-neutral-500 dark:text-neutral-400">
              {contextLabel}
              {order.customer_name ? ` · ${order.customer_name}` : ''}
            </p>
          </div>
          <button onClick={onClose} className="rounded-lg p-1.5 text-neutral-400 hover:bg-neutral-100">
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="max-h-44 space-y-2 overflow-y-auto border-b border-neutral-200 pb-3 text-sm dark:border-neutral-800">
          {foodItems.length > 0 && (
            <ul className="space-y-1">
              {hasBoth && <li className="text-[10px] font-semibold uppercase tracking-wider text-neutral-400">Food</li>}
              {foodItems.map((i) => (
                <li key={i.id} className="flex justify-between text-neutral-700 dark:text-neutral-300">
                  <span>{i.qty}&times; {i.item_name_snapshot}</span>
                  <span>₹{i.line_total.toFixed(2)}</span>
                </li>
              ))}
            </ul>
          )}
          {barItems.length > 0 && (
            <ul className="space-y-1">
              {hasBoth && <li className="text-[10px] font-semibold uppercase tracking-wider text-neutral-400">Bar</li>}
              {barItems.map((i) => (
                <li key={i.id} className="flex justify-between text-neutral-700 dark:text-neutral-300">
                  <span>{i.qty}&times; {i.item_name_snapshot}</span>
                  <span>₹{i.line_total.toFixed(2)}</span>
                </li>
              ))}
            </ul>
          )}
        </div>

        <div className="mt-3 space-y-1.5 text-sm">
          <div className="flex justify-between text-neutral-600 dark:text-neutral-400">
            <span>Subtotal</span><span>₹{subtotal.toFixed(2)}</span>
          </div>

          {canDiscount && (
            <div className="flex items-center gap-2 py-1">
              <span className="shrink-0 text-neutral-600 dark:text-neutral-400">Discount</span>
              <Input
                type="number"
                min={0}
                value={discountAmount}
                onChange={(e) => setDiscountAmount(e.target.value)}
                className="h-8 w-24 text-right"
              />
              {Number(discountAmount) > 0 && (
                <Input
                  value={discountReason}
                  onChange={(e) => setDiscountReason(e.target.value)}
                  placeholder="Reason"
                  className="h-8 flex-1"
                />
              )}
            </div>
          )}

          {foodSub > 0 && (
            <>
              <div className="flex justify-between text-neutral-600 dark:text-neutral-400">
                <span>CGST ({(totals.foodTaxPercent / 2).toFixed(2)}%)</span><span>₹{(foodTax / 2).toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-neutral-600 dark:text-neutral-400">
                <span>SGST ({(totals.foodTaxPercent / 2).toFixed(2)}%)</span><span>₹{(foodTax / 2).toFixed(2)}</span>
              </div>
            </>
          )}
          {barSub > 0 && (
            <div className="flex justify-between text-neutral-600 dark:text-neutral-400">
              <span>VAT on bar ({totals.barTaxPercent}%)</span><span>₹{barTax.toFixed(2)}</span>
            </div>
          )}
          <div className="flex justify-between border-t border-neutral-200 pt-1.5 font-semibold text-neutral-900 dark:border-neutral-800 dark:text-neutral-100">
            <span>Total</span><span>₹{total.toFixed(2)}</span>
          </div>
        </div>

        <div className="mt-4">
          <label className="mb-1.5 block text-xs font-semibold uppercase tracking-widest text-neutral-500 dark:text-neutral-400">Payment method</label>
          <div className="grid grid-cols-4 gap-2">
            {PAYMENT_METHODS.map((m) => (
              <button
                key={m}
                onClick={() => setPaymentMethod(m)}
                className={`rounded-lg py-2 text-xs font-medium capitalize transition ${paymentMethod === m ? 'bg-amber-500 text-white' : 'bg-neutral-100 text-neutral-600 dark:bg-neutral-800 dark:text-neutral-300'}`}
              >
                {m}
              </button>
            ))}
          </div>
        </div>

        <div className="mt-5 flex gap-2">
          <button
            onClick={() => {
              if (confirm('Cancel this entire order? The table will be freed.')) cancelMut.mutate()
            }}
            disabled={cancelMut.isPending}
            title="Cancel order"
            className="flex items-center justify-center gap-2 rounded-xl bg-red-500/10 px-4 py-3 text-sm font-medium text-red-500 hover:bg-red-500/20 disabled:opacity-60"
          >
            <Ban className="h-4 w-4" />
          </button>
          <button
            onClick={() => print('combined')}
            disabled={activeCount === 0}
            title="Print proforma (before settling)"
            className="flex items-center justify-center gap-2 rounded-xl bg-neutral-100 px-4 py-3 text-sm font-medium text-neutral-700 hover:bg-neutral-200 disabled:opacity-60 dark:bg-neutral-800 dark:text-neutral-200 dark:hover:bg-neutral-700"
          >
            <Printer className="h-4 w-4" />
          </button>
          <button
            onClick={() => settleMut.mutate()}
            disabled={settleMut.isPending || activeCount === 0}
            className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-amber-500 py-3 text-sm font-bold text-white hover:bg-amber-600 disabled:opacity-60 transition-colors"
          >
            <Check className="h-4 w-4" />
            {settleMut.isPending ? 'Settling…' : `Settle ₹${total.toFixed(2)}`}
          </button>
        </div>
      </div>
    </div>
  )
}
