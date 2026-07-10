'use client'

import { useEffect, useRef, useState } from 'react'
import { useQuery, useQueryClient, useMutation } from '@tanstack/react-query'
import { Plus, Minus, Send, Receipt as ReceiptIcon, ShoppingBag, Search, X } from 'lucide-react'
import { useCms } from './Providers'
import { Button } from '@/components/ui/Button'
import { useCmsStore } from '@/stores/cms'
import { qk, fetchCategories, fetchItems } from '@/lib/cms-queries'
import {
  posQk, fetchTables, fetchActiveOrders, fetchOrderItems, addOrderItemsAsStaff, updateOrderItemStatus,
} from '@/lib/pos-queries'
import { createClient } from '@/lib/supabase/client'
import { PosBillingPanel } from './PosBillingPanel'
import { cn } from '@/lib/utils'
import type { Order, RestaurantTable, TableStatus } from '@/types/database'

const STATUS_DOT: Record<TableStatus, string> = {
  available: 'bg-emerald-500',
  occupied: 'bg-amber-500',
  needs_cleaning: 'bg-red-500',
  reserved: 'bg-blue-500',
}

type Context = { type: 'table'; tableId: string } | { type: 'counter' }

export function PosOrderScreen() {
  const { business } = useCms()
  const bid = business.id
  const qc = useQueryClient()
  const pushToast = useCmsStore((s) => s.pushToast)

  const tablesQ = useQuery({ queryKey: posQk.tables(bid), queryFn: () => fetchTables(bid) })
  // 60s is a safety net only — Realtime below invalidates instantly on any change.
  const ordersQ = useQuery({ queryKey: posQk.orders(bid), queryFn: () => fetchActiveOrders(bid), refetchInterval: 60000 })
  const categoriesQ = useQuery({ queryKey: qk.categories(bid), queryFn: () => fetchCategories(bid) })
  const itemsQ = useQuery({ queryKey: qk.items(bid), queryFn: () => fetchItems(bid) })

  const supabase = useRef(createClient()).current
  useEffect(() => {
    const channel = supabase
      .channel(`pos-${bid}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'orders', filter: `business_id=eq.${bid}` }, () => {
        qc.invalidateQueries({ queryKey: posQk.orders(bid) })
        qc.invalidateQueries({ queryKey: posQk.tables(bid) })
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'order_items', filter: `business_id=eq.${bid}` }, () => {
        qc.invalidateQueries({ queryKey: posQk.orders(bid) })
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'tables', filter: `business_id=eq.${bid}` }, () => {
        qc.invalidateQueries({ queryKey: posQk.tables(bid) })
      })
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [supabase, bid, qc])

  const [ctx, setCtx] = useState<Context | null>(null)
  const [cart, setCart] = useState<Record<string, number>>({})
  const [billingOrder, setBillingOrder] = useState<Order | null>(null)
  const [activeCategoryId, setActiveCategoryId] = useState<string | null>(null)
  // Counter/takeaway has no natural session key like a table does — each "send
  // to kitchen" creates a brand-new order (see add_order_items(): find-or-create
  // only applies when table_id is set). Track the specific order just created
  // so the UI shows *that* transaction, not an arbitrary pick from every
  // concurrently-open counter order.
  const [counterOrderId, setCounterOrderId] = useState<string | null>(null)
  const [query, setQuery] = useState('')

  const orders = ordersQ.data ?? []
  const dineInOrders = orders.filter((o) => o.table_id)
  const counterOrders = orders.filter((o) => !o.table_id)

  let currentOrder: Order | undefined
  if (ctx?.type === 'table') currentOrder = dineInOrders.find((o) => o.table_id === ctx.tableId)
  else if (ctx?.type === 'counter') currentOrder = orders.find((o) => o.id === counterOrderId)

  const orderItemsQ = useQuery({
    queryKey: currentOrder ? posQk.orderItems(currentOrder.id) : ['pos-order-items', 'none'],
    queryFn: () => fetchOrderItems(currentOrder!.id),
    enabled: !!currentOrder,
  })

  const sendMut = useMutation({
    mutationFn: () =>
      addOrderItemsAsStaff({
        business_id: bid,
        table_id: ctx?.type === 'table' ? ctx.tableId : null,
        order_type: ctx?.type === 'table' ? 'dine_in' : 'counter',
        items: Object.entries(cart).map(([item_id, qty]) => ({ item_id, qty })),
      }),
    onSuccess: (order) => {
      qc.invalidateQueries({ queryKey: posQk.orders(bid) })
      qc.invalidateQueries({ queryKey: posQk.orderItems(order.id) })
      qc.invalidateQueries({ queryKey: posQk.tables(bid) })
      if (ctx?.type === 'counter') setCounterOrderId(order.id)
      pushToast('Sent to kitchen')
      setCart({})
    },
    onError: (err: unknown) => pushToast((err as Error).message, 'error'),
  })

  // Customer asked the waiter to remove an item — cancel the line. The DB
  // trigger (migration 011) recomputes the order totals; the KOT board drops
  // the line automatically since it only shows placed/preparing/ready.
  const cancelLineMut = useMutation({
    mutationFn: (orderItemId: string) => updateOrderItemStatus(orderItemId, 'cancelled'),
    onSuccess: () => {
      if (currentOrder) qc.invalidateQueries({ queryKey: posQk.orderItems(currentOrder.id) })
      qc.invalidateQueries({ queryKey: posQk.orders(bid) })
      pushToast('Item removed from order')
    },
    onError: (err: unknown) => pushToast((err as Error).message, 'error'),
  })

  const cartCount = Object.values(cart).reduce((a, b) => a + b, 0)

  function addToCart(itemId: string) {
    setCart((c) => ({ ...c, [itemId]: (c[itemId] ?? 0) + 1 }))
  }
  function removeFromCart(itemId: string) {
    setCart((c) => {
      const next = { ...c }
      if (!next[itemId]) return next
      next[itemId] -= 1
      if (next[itemId] <= 0) delete next[itemId]
      return next
    })
  }

  const categories = categoriesQ.data ?? []
  const items = (itemsQ.data ?? []).filter((i) => i.is_available)
  const q = query.trim().toLowerCase()
  const visibleItems = items.filter(
    (i) => (q ? i.name.toLowerCase().includes(q) : !activeCategoryId || i.category_id === activeCategoryId)
  )
  const cartSubtotal = Object.entries(cart).reduce((sum, [id, qty]) => {
    const item = items.find((i) => i.id === id)
    return sum + (item ? item.price * qty : 0)
  }, 0)

  return (
    <div className="grid gap-4 lg:grid-cols-[280px_1fr]">
      {/* Table / context picker */}
      <div className="space-y-4">
        <div>
          <h2 className="mb-2 text-sm font-semibold uppercase tracking-wide text-neutral-400">Tables</h2>
          <div className="grid grid-cols-2 gap-2">
            {(tablesQ.data ?? []).map((table: RestaurantTable) => {
              const order = dineInOrders.find((o) => o.table_id === table.id)
              const selected = ctx?.type === 'table' && ctx.tableId === table.id
              return (
                <button
                  key={table.id}
                  onClick={() => { setCtx({ type: 'table', tableId: table.id }); setCart({}) }}
                  className={cn(
                    'rounded-lg border p-3 text-left transition',
                    selected ? 'border-amber-500 bg-amber-500/10' : 'border-neutral-200 bg-white hover:border-neutral-300 dark:border-neutral-800 dark:bg-neutral-900/50 dark:hover:border-neutral-700'
                  )}
                >
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-neutral-900 dark:text-white">{table.label}</span>
                    <span className={cn('h-2 w-2 rounded-full', STATUS_DOT[table.status])} />
                  </div>
                  {order && (
                    <p className="mt-1 text-xs text-neutral-400">
                      {order.status} &middot; ₹{order.total_amount.toFixed(0)}
                    </p>
                  )}
                </button>
              )
            })}
          </div>
        </div>

        <div>
          <h2 className="mb-2 text-sm font-semibold uppercase tracking-wide text-neutral-400">Counter</h2>
          <button
            onClick={() => { setCtx({ type: 'counter' }); setCart({}); setCounterOrderId(null) }}
            className={cn(
              'flex w-full items-center gap-2 rounded-lg border p-3 text-left transition',
              ctx?.type === 'counter' && !counterOrderId ? 'border-amber-500 bg-amber-500/10' : 'border-neutral-200 bg-white hover:border-neutral-300 dark:border-neutral-800 dark:bg-neutral-900/50 dark:hover:border-neutral-700'
            )}
          >
            <ShoppingBag className="h-4 w-4 text-neutral-400" />
            <span className="text-sm font-medium text-neutral-900 dark:text-white">New Takeaway / Counter</span>
          </button>

          {counterOrders.length > 0 && (
            <div className="mt-2 space-y-1.5">
              <p className="text-[10px] font-semibold uppercase tracking-wider text-neutral-500">Open counter orders</p>
              {counterOrders.map((o) => {
                const selected = ctx?.type === 'counter' && counterOrderId === o.id
                return (
                  <button
                    key={o.id}
                    onClick={() => { setCtx({ type: 'counter' }); setCounterOrderId(o.id); setCart({}) }}
                    className={cn(
                      'flex w-full items-center justify-between rounded-lg border px-3 py-2 text-left transition',
                      selected ? 'border-amber-500 bg-amber-500/10' : 'border-neutral-200 bg-white hover:border-neutral-300 dark:border-neutral-800 dark:bg-neutral-900/50 dark:hover:border-neutral-700'
                    )}
                  >
                    <span className="text-xs text-neutral-500 dark:text-neutral-300">#{o.id.slice(0, 6)} &middot; {o.status}</span>
                    <span className="text-xs font-medium text-neutral-900 dark:text-white">₹{o.total_amount.toFixed(0)}</span>
                  </button>
                )
              })}
            </div>
          )}
        </div>
      </div>

      {/* Order builder */}
      <div className="space-y-4">
        {!ctx ? (
          <div className="rounded-xl border border-dashed border-neutral-300 p-12 text-center text-sm text-neutral-500 dark:border-neutral-800">
            Select a table or start a counter order.
          </div>
        ) : (
          <>
            {currentOrder && (orderItemsQ.data?.length ?? 0) > 0 && (
              <div className="rounded-xl border border-neutral-200 bg-white p-4 dark:border-neutral-800 dark:bg-neutral-900/50">
                <div className="flex items-center justify-between">
                  <h3 className="font-medium text-neutral-900 dark:text-white">Current order</h3>
                  <Button size="sm" variant="secondary" onClick={() => setBillingOrder(currentOrder)}>
                    <ReceiptIcon className="h-4 w-4" /> Bill (₹{currentOrder.total_amount.toFixed(0)})
                  </Button>
                </div>
                <ul className="mt-3 space-y-1.5 text-sm">
                  {orderItemsQ.data?.map((oi) => (
                    <li key={oi.id} className={cn('flex items-center justify-between gap-2', oi.status === 'cancelled' ? 'text-neutral-400 line-through dark:text-neutral-600' : 'text-neutral-700 dark:text-neutral-300')}>
                      <span className="min-w-0 truncate">{oi.qty}&times; {oi.item_name_snapshot}</span>
                      <span className="flex shrink-0 items-center gap-2">
                        <span className="text-xs uppercase text-neutral-500">{oi.status}</span>
                        {oi.status !== 'cancelled' && oi.status !== 'served' && (
                          <button
                            onClick={() => {
                              if (confirm(`Remove ${oi.item_name_snapshot} from this order?`)) cancelLineMut.mutate(oi.id)
                            }}
                            disabled={cancelLineMut.isPending}
                            title="Remove item"
                            className="rounded p-0.5 text-red-400 hover:bg-red-500/10 hover:text-red-300"
                          >
                            <X className="h-3.5 w-3.5" />
                          </button>
                        )}
                      </span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            <div className="relative">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-neutral-400 dark:text-neutral-500" />
              <input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search items…"
                className="w-full rounded-lg border border-neutral-200 bg-white py-2.5 pl-9 pr-3 text-sm text-neutral-900 placeholder:text-neutral-400 focus:border-amber-500 focus:outline-none dark:border-neutral-800 dark:bg-neutral-900/50 dark:text-white dark:placeholder:text-neutral-500"
              />
            </div>

            <div className="flex gap-2 overflow-x-auto pb-1">
              <button
                onClick={() => setActiveCategoryId(null)}
                className={cn('shrink-0 rounded-full px-3 py-1.5 text-xs font-medium', !activeCategoryId ? 'bg-amber-500 text-white' : 'bg-neutral-100 text-neutral-600 dark:bg-neutral-800 dark:text-neutral-300')}
              >
                All
              </button>
              {categories.map((c) => (
                <button
                  key={c.id}
                  onClick={() => setActiveCategoryId(c.id)}
                  className={cn('shrink-0 rounded-full px-3 py-1.5 text-xs font-medium', activeCategoryId === c.id ? 'bg-amber-500 text-white' : 'bg-neutral-100 text-neutral-600 dark:bg-neutral-800 dark:text-neutral-300')}
                >
                  {c.name}
                </button>
              ))}
            </div>

            <div className="grid gap-2 sm:grid-cols-2">
              {visibleItems.map((item) => (
                <div key={item.id} className="flex items-center justify-between rounded-lg border border-neutral-200 bg-white p-3 dark:border-neutral-800 dark:bg-neutral-900/50">
                  <div className="min-w-0 pr-2">
                    <p className="truncate text-sm font-medium text-neutral-900 dark:text-white">{item.name}</p>
                    <p className="text-xs text-neutral-500 dark:text-neutral-400">₹{item.price.toFixed(0)}</p>
                  </div>
                  <div className="flex shrink-0 items-center gap-2">
                    {cart[item.id] > 0 && (
                      <>
                        <button onClick={() => removeFromCart(item.id)} className="rounded-md bg-neutral-100 p-1.5 text-neutral-700 hover:bg-neutral-200 dark:bg-neutral-800 dark:text-white dark:hover:bg-neutral-700">
                          <Minus className="h-3.5 w-3.5" />
                        </button>
                        <span className="w-4 text-center text-sm text-neutral-900 dark:text-white">{cart[item.id]}</span>
                      </>
                    )}
                    <button onClick={() => addToCart(item.id)} className="rounded-md bg-amber-500 p-1.5 text-white hover:bg-amber-600">
                      <Plus className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </div>
              ))}
            </div>

            {cartCount > 0 && (
              <div className="sticky bottom-4 flex justify-end">
                <Button onClick={() => sendMut.mutate()} disabled={sendMut.isPending}>
                  <Send className="h-4 w-4" /> Send {cartCount} item{cartCount > 1 ? 's' : ''} &middot; ₹{cartSubtotal.toFixed(0)}
                </Button>
              </div>
            )}
          </>
        )}
      </div>

      {billingOrder && (
        <PosBillingPanel
          order={billingOrder}
          tableLabel={billingOrder.table_id ? (tablesQ.data ?? []).find((t) => t.id === billingOrder.table_id)?.label ?? null : null}
          onClose={() => setBillingOrder(null)}
          onSettled={() => {
            setBillingOrder(null)
            setCtx(null)
            setCounterOrderId(null)
            qc.invalidateQueries({ queryKey: posQk.orders(bid) })
            qc.invalidateQueries({ queryKey: posQk.tables(bid) })
          }}
        />
      )}
    </div>
  )
}
