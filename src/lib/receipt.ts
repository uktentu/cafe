// Shared bill math + 80mm PDF receipt generation, used by the POS billing
// panel (settle/proforma) and the Sales screen (reprint). Client-side only —
// jspdf is dynamically imported so it never lands in the base bundle.
'use client'

import type { Business, Order, OrderItem } from '@/types/database'

export type BillKind = 'combined' | 'food' | 'bar'

export interface BillTotals {
  foodItems: OrderItem[]
  barItems: OrderItem[]
  hasBoth: boolean
  foodSub: number
  barSub: number
  subtotal: number
  discount: number
  foodTax: number
  barTax: number
  taxAmount: number
  total: number
  foodTaxPercent: number
  barTaxPercent: number
}

export function computeBill(
  items: OrderItem[],
  opts: { foodTaxPercent: number; barTaxPercent: number; discount: number }
): BillTotals {
  // Round each tax component to 2 decimals, exactly matching settle_order()'s
  // round(...) in Postgres, so the printed/displayed total equals the bill the
  // DB actually stores (no stray paisa discrepancy).
  const round2 = (n: number) => Math.round(n * 100) / 100
  const active = items.filter((i) => i.status !== 'cancelled')
  const foodItems = active.filter((i) => !i.is_bar)
  const barItems = active.filter((i) => i.is_bar)
  const foodSub = round2(foodItems.reduce((sum, i) => sum + i.line_total, 0))
  const barSub = round2(barItems.reduce((sum, i) => sum + i.line_total, 0))
  const foodTax = round2(foodSub * (opts.foodTaxPercent / 100))
  const barTax = round2(barSub * (opts.barTaxPercent / 100))
  const subtotal = foodSub + barSub
  return {
    foodItems,
    barItems,
    hasBoth: foodItems.length > 0 && barItems.length > 0,
    foodSub,
    barSub,
    subtotal,
    discount: opts.discount,
    foodTax,
    barTax,
    taxAmount: foodTax + barTax,
    total: subtotal - opts.discount + foodTax + barTax,
    foodTaxPercent: opts.foodTaxPercent,
    barTaxPercent: opts.barTaxPercent,
  }
}

export async function generateBillPdf(params: {
  business: Business
  totals: BillTotals
  kind: BillKind
  billNo?: number | null
  /** 'Table 5', 'Takeaway', 'Counter' … */
  contextLabel: string
  customerName?: string | null
  discountReason?: string | null
  paidBy?: string | null
  /** Bill date — settled_at for reprints, now for fresh bills. */
  date?: Date
  order?: Pick<Order, 'order_type'> | null
}): Promise<void> {
  const { business, totals, kind, billNo, contextLabel, customerName, discountReason, paidBy, date } = params
  const { jsPDF } = await import('jspdf')

  const billItems = kind === 'food' ? totals.foodItems : kind === 'bar' ? totals.barItems : [...totals.foodItems, ...totals.barItems]
  const billNoLabel = billNo != null ? `${billNo}${kind === 'bar' && totals.hasBoth ? '-B' : ''}` : 'PROFORMA'

  const lineHeight = 4.5
  const height = 62 + billItems.length * lineHeight + 42
  const doc = new jsPDF({ unit: 'mm', format: [80, Math.max(height, 110)] })
  const pageW = doc.internal.pageSize.getWidth()
  const right = pageW - 4
  let y = 8

  const center = (text: string, size: number, bold = false) => {
    doc.setFontSize(size)
    doc.setFont('helvetica', bold ? 'bold' : 'normal')
    doc.text(text, pageW / 2, y, { align: 'center' })
    y += size * 0.5
  }
  const row = (left: string, value: string, bold = false) => {
    doc.setFont('helvetica', bold ? 'bold' : 'normal')
    doc.text(left, 4, y)
    doc.text(value, right, y, { align: 'right' })
    y += lineHeight
  }
  const divider = () => {
    doc.setLineDashPattern([1, 1], 0)
    doc.line(4, y, right, y)
    doc.setLineDashPattern([], 0)
    y += 4
  }

  // ── Header: everything a real restaurant bill carries ──
  center(business.name, 13, true)
  if (business.address) center(`${business.address}${business.city ? ', ' + business.city : ''}`, 8)
  else if (business.city) center(business.city, 8)
  if (business.phone) center(`Ph: ${business.phone}`, 8)
  if (business.gstin) center(`GSTIN: ${business.gstin}`, 8)
  if (business.fssai_license) center(`FSSAI: ${business.fssai_license}`, 8)
  y += 1
  divider()

  doc.setFontSize(8.5)
  doc.setFont('helvetica', 'normal')
  const kindLabel = kind === 'bar' ? 'BAR BILL' : kind === 'food' && totals.hasBoth ? 'FOOD BILL' : 'TAX INVOICE'
  doc.text(`Bill No: ${billNoLabel}`, 4, y)
  doc.text(kindLabel, right, y, { align: 'right' })
  y += lineHeight
  doc.text(`Date: ${(date ?? new Date()).toLocaleString('en-IN', { dateStyle: 'short', timeStyle: 'short' })}`, 4, y)
  doc.text(contextLabel, right, y, { align: 'right' })
  y += lineHeight
  if (customerName) {
    doc.text(`Customer: ${customerName}`, 4, y)
    y += lineHeight
  }
  divider()

  // ── Items: Item / Qty / Rate / Amount ──
  doc.setFont('helvetica', 'bold')
  doc.text('Item', 4, y)
  doc.text('Qty', 46, y, { align: 'right' })
  doc.text('Rate', 60, y, { align: 'right' })
  doc.text('Amt', right, y, { align: 'right' })
  y += lineHeight
  doc.setFont('helvetica', 'normal')
  billItems.forEach((i) => {
    doc.text(i.item_name_snapshot.slice(0, 22), 4, y)
    doc.text(String(i.qty), 46, y, { align: 'right' })
    doc.text(i.unit_price_snapshot.toFixed(2), 60, y, { align: 'right' })
    doc.text(i.line_total.toFixed(2), right, y, { align: 'right' })
    y += lineHeight
  })
  divider()

  // ── Totals — CGST/SGST split for food (Indian standard), VAT for bar ──
  doc.setFontSize(8.5)
  if (kind === 'combined' || kind === 'food') {
    row('Subtotal', (kind === 'combined' ? totals.subtotal : totals.foodSub).toFixed(2))
    if (kind === 'combined' && totals.barSub > 0) {
      row('  Food', totals.foodSub.toFixed(2))
      row('  Bar', totals.barSub.toFixed(2))
    }
    if (totals.discount > 0) row(`Discount${discountReason ? ` (${discountReason.slice(0, 14)})` : ''}`, `-${totals.discount.toFixed(2)}`)
    if (totals.foodSub > 0) {
      row(`CGST @ ${(totals.foodTaxPercent / 2).toFixed(2)}%`, (totals.foodTax / 2).toFixed(2))
      row(`SGST @ ${(totals.foodTaxPercent / 2).toFixed(2)}%`, (totals.foodTax / 2).toFixed(2))
    }
    if (kind === 'combined' && totals.barSub > 0) row(`VAT @ ${totals.barTaxPercent.toFixed(2)}% (bar)`, totals.barTax.toFixed(2))
    divider()
    const t = kind === 'combined' ? totals.total : totals.foodSub - totals.discount + totals.foodTax
    doc.setFontSize(10)
    row('TOTAL', `Rs.${t.toFixed(2)}`, true)
  } else {
    row('Subtotal', totals.barSub.toFixed(2))
    row(`VAT @ ${totals.barTaxPercent.toFixed(2)}%`, totals.barTax.toFixed(2))
    divider()
    doc.setFontSize(10)
    row('TOTAL', `Rs.${(totals.barSub + totals.barTax).toFixed(2)}`, true)
  }

  if (paidBy) {
    doc.setFontSize(8)
    doc.setFont('helvetica', 'normal')
    row('Paid by', paidBy.toUpperCase())
  }

  y += 2
  center(business.receipt_footer || 'Thank you! Visit again.', 8)

  doc.save(`${business.slug}-bill-${billNoLabel}${kind !== 'combined' ? '-' + kind : ''}.pdf`)
}
