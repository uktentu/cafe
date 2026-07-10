'use client'

import { useEffect, useMemo, useRef, useState } from 'react'
import { useQuery, useQueryClient, useMutation } from '@tanstack/react-query'
import { DndContext, PointerSensor, useSensor, useSensors, useDraggable, useDroppable, pointerWithin, type DragEndEvent } from '@dnd-kit/core'
import { Plus, X, Clock, Ban, Receipt as ReceiptIcon, CheckCircle2, ShoppingBag, Trash2 } from 'lucide-react'
import { useCms } from './Providers'
import { Button } from '@/components/ui/Button'
import { Input, Select } from '@/components/ui/Input'
import { useCmsStore } from '@/stores/cms'
import { createClient } from '@/lib/supabase/client'
import { posQk, fetchBoardOrders, fetchTables, updateOrderStatus, createExternalOrder, type BoardOrder } from '@/lib/pos-queries'
import { PosBillingPanel } from './PosBillingPanel'
import { CHANNEL_META } from '@/lib/channels'
import { formatPrice, cn } from '@/lib/utils'
import type { OrderStatus, OrderChannel, RestaurantTable } from '@/types/database'

// Kanban columns and the status each represents. Dropping a card sets that status.
const COLUMNS: { key: OrderStatus; label: string; match: OrderStatus[] }[] = [
  { key: 'placed', label: 'New', match: ['placed', 'confirmed'] },
  { key: 'preparing', label: 'Preparing', match: ['preparing'] },
  { key: 'ready', label: 'Ready', match: ['ready'] },
  { key: 'served', label: 'Served', match: ['served'] },
]
const OVERDUE_MIN = 20

function elapsed(iso?: string) { return iso ? Math.max(0, Math.floor((Date.now() - new Date(iso).getTime()) / 60000)) : 0 }

function ChannelBadge({ channel }: { channel: OrderChannel }) {
  const m = CHANNEL_META[channel]
  return <span className="rounded px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wide text-white" style={{ background: m.color }}>{m.short}</span>
}

function orderTitle(o: BoardOrder, tables: RestaurantTable[]) {
  if (o.channel && o.channel !== 'direct') return o.external_ref ? `#${o.external_ref}` : (o.customer_name || CHANNEL_META[o.channel].label)
  if (o.table_id) return tables.find((t) => t.id === o.table_id)?.label ?? 'Table'
  return o.customer_name || (o.order_type === 'takeaway' ? 'Takeaway' : 'Counter')
}

function Card({ order, tables, onBill, onComplete, onCancel }: {
  order: BoardOrder; tables: RestaurantTable[]
  onBill: (o: BoardOrder) => void; onComplete: (o: BoardOrder) => void; onCancel: (o: BoardOrder) => void
}) {
  const { attributes, listeners, setNodeRef, isDragging } = useDraggable({ id: order.id })
  const channel = order.channel ?? 'direct'
  const mins = elapsed(order.created_at)
  const overdue = mins >= OVERDUE_MIN
  const stop = (e: React.PointerEvent) => e.stopPropagation()

  return (
    <div
      ref={setNodeRef}
      {...listeners}
      {...attributes}
      className={cn('cursor-grab rounded-lg border bg-white p-3 shadow-sm active:cursor-grabbing dark:bg-neutral-900', isDragging && 'opacity-40')}
      style={{ borderColor: '#00000012', borderLeftWidth: 4, borderLeftColor: overdue ? '#EF4444' : CHANNEL_META[channel].color }}
    >
      <div className="mb-1.5 flex items-center justify-between gap-2">
        <div className="flex items-center gap-1.5 min-w-0">
          <ChannelBadge channel={channel} />
          <span className="truncate text-sm font-semibold text-neutral-900 dark:text-neutral-100">{orderTitle(order, tables)}</span>
        </div>
        <span className={cn('flex shrink-0 items-center gap-1 text-[11px]', overdue ? 'font-semibold text-red-500' : 'text-neutral-400')}>
          <Clock className="h-3 w-3" />{mins}m
        </span>
      </div>
      <div className="flex items-center justify-between text-xs text-neutral-500 dark:text-neutral-400">
        <span>{order.item_count} item{order.item_count === 1 ? '' : 's'}</span>
        <span className="font-medium text-neutral-700 dark:text-neutral-300">{formatPrice(order.total_amount)}</span>
      </div>
      <div className="mt-2 flex items-center gap-1 border-t border-neutral-100 pt-2 dark:border-neutral-800" onPointerDown={stop}>
        {channel === 'direct' ? (
          <button onClick={() => onBill(order)} className="flex flex-1 items-center justify-center gap-1 rounded-md bg-amber-500/10 py-1.5 text-xs font-medium text-amber-600 hover:bg-amber-500/20 dark:text-amber-400">
            <ReceiptIcon className="h-3.5 w-3.5" /> Bill
          </button>
        ) : (
          <button onClick={() => onComplete(order)} className="flex flex-1 items-center justify-center gap-1 rounded-md bg-emerald-500/10 py-1.5 text-xs font-medium text-emerald-600 hover:bg-emerald-500/20 dark:text-emerald-400">
            <CheckCircle2 className="h-3.5 w-3.5" /> Complete
          </button>
        )}
        <button onClick={() => onCancel(order)} title="Cancel order" className="rounded-md p-1.5 text-red-400 hover:bg-red-500/10">
          <Ban className="h-3.5 w-3.5" />
        </button>
      </div>
    </div>
  )
}

function Column({ col, orders, tables, onBill, onComplete, onCancel }: {
  col: typeof COLUMNS[number]; orders: BoardOrder[]; tables: RestaurantTable[]
  onBill: (o: BoardOrder) => void; onComplete: (o: BoardOrder) => void; onCancel: (o: BoardOrder) => void
}) {
  const { setNodeRef, isOver } = useDroppable({ id: col.key })
  const value = orders.reduce((s, o) => s + o.total_amount, 0)
  return (
    <div ref={setNodeRef} className={cn('flex min-h-[60vh] w-72 shrink-0 flex-col rounded-xl bg-neutral-100/70 p-2 dark:bg-neutral-900/50', isOver && 'ring-2 ring-amber-500')}>
      <div className="flex items-center justify-between px-2 py-1.5">
        <div className="flex items-center gap-2">
          <span className="text-sm font-semibold text-neutral-800 dark:text-neutral-200">{col.label}</span>
          <span className="rounded-full bg-neutral-200 px-1.5 text-xs font-medium text-neutral-600 dark:bg-neutral-800 dark:text-neutral-300">{orders.length}</span>
        </div>
        <span className="text-xs text-neutral-400">{formatPrice(value)}</span>
      </div>
      <div className="flex-1 space-y-2 overflow-y-auto p-1">
        {orders.length === 0 ? (
          <div className="flex h-24 items-center justify-center rounded-lg border border-dashed border-neutral-300 text-xs text-neutral-400 dark:border-neutral-800">Drop here</div>
        ) : orders.map((o) => <Card key={o.id} order={o} tables={tables} onBill={onBill} onComplete={onComplete} onCancel={onCancel} />)}
      </div>
    </div>
  )
}

type NewLine = { name: string; price: string; qty: string }

function AddAggregatorModal({ businessId, onClose, onCreated }: { businessId: string; onClose: () => void; onCreated: () => void }) {
  const pushToast = useCmsStore((s) => s.pushToast)
  const [channel, setChannel] = useState<Exclude<OrderChannel, 'direct'>>('swiggy')
  const [ref, setRef] = useState('')
  const [customer, setCustomer] = useState('')
  const [lines, setLines] = useState<NewLine[]>([{ name: '', price: '', qty: '1' }])
  const [saving, setSaving] = useState(false)

  const setLine = (i: number, patch: Partial<NewLine>) => setLines((ls) => ls.map((l, idx) => (idx === i ? { ...l, ...patch } : l)))
  const addLine = () => setLines((ls) => [...ls, { name: '', price: '', qty: '1' }])
  const removeLine = (i: number) => setLines((ls) => ls.filter((_, idx) => idx !== i))
  const total = lines.reduce((s, l) => s + (Number(l.price) || 0) * (Number(l.qty) || 0), 0)

  async function submit() {
    const items = lines.filter((l) => l.name.trim() && Number(l.price) >= 0 && Number(l.qty) > 0).map((l) => ({ name: l.name.trim(), price: Number(l.price), qty: Number(l.qty) }))
    if (items.length === 0) { pushToast('Add at least one item', 'error'); return }
    setSaving(true)
    try {
      await createExternalOrder({ business_id: businessId, channel, external_ref: ref.trim() || null, customer_name: customer.trim() || null, items })
      pushToast('Order added to board')
      onCreated()
    } catch (e) {
      pushToast((e as Error).message, 'error'); setSaving(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center sm:items-center">
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />
      <div className="relative z-10 max-h-[90svh] w-full max-w-md overflow-y-auto rounded-t-3xl bg-white p-6 shadow-2xl dark:bg-neutral-900 sm:rounded-2xl">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-lg font-bold text-neutral-900 dark:text-neutral-100">Add aggregator order</h2>
          <button onClick={onClose} className="rounded-lg p-1.5 text-neutral-400 hover:bg-neutral-100"><X className="h-5 w-5" /></button>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1">
            <label className="text-xs font-medium text-neutral-400">Platform</label>
            <Select value={channel} onChange={(e) => setChannel(e.target.value as Exclude<OrderChannel, 'direct'>)}>
              <option value="swiggy">Swiggy</option>
              <option value="zomato">Zomato</option>
              <option value="phone">Phone</option>
            </Select>
          </div>
          <div className="space-y-1">
            <label className="text-xs font-medium text-neutral-400">Order # (ref)</label>
            <Input value={ref} onChange={(e) => setRef(e.target.value)} placeholder="e.g. SW-12345" />
          </div>
          <div className="space-y-1 col-span-2">
            <label className="text-xs font-medium text-neutral-400">Customer (optional)</label>
            <Input value={customer} onChange={(e) => setCustomer(e.target.value)} placeholder="Name" />
          </div>
        </div>

        <div className="mt-4 space-y-2">
          <label className="text-xs font-medium text-neutral-400">Items</label>
          {lines.map((l, i) => (
            <div key={i} className="flex items-center gap-2">
              <Input value={l.name} onChange={(e) => setLine(i, { name: e.target.value })} placeholder="Item name" className="flex-1" />
              <Input type="number" min={0} value={l.price} onChange={(e) => setLine(i, { price: e.target.value })} placeholder="₹" className="w-20" />
              <Input type="number" min={1} value={l.qty} onChange={(e) => setLine(i, { qty: e.target.value })} className="w-14" />
              {lines.length > 1 && <button onClick={() => removeLine(i)} className="rounded p-1.5 text-red-400 hover:bg-red-500/10"><Trash2 className="h-4 w-4" /></button>}
            </div>
          ))}
          <button onClick={addLine} className="flex items-center gap-1 text-xs font-medium text-amber-600 dark:text-amber-400"><Plus className="h-3.5 w-3.5" /> Add item</button>
        </div>

        <div className="mt-4 flex items-center justify-between border-t border-neutral-200 pt-3 text-sm font-semibold dark:border-neutral-800">
          <span>Total</span><span>{formatPrice(total)}</span>
        </div>
        <button onClick={submit} disabled={saving} className="mt-4 w-full rounded-xl bg-amber-500 py-3 text-sm font-bold text-white hover:bg-amber-600 disabled:opacity-60">
          {saving ? 'Adding…' : 'Add to board'}
        </button>
      </div>
    </div>
  )
}

export function OrdersBoard() {
  const { business } = useCms()
  const bid = business.id
  const qc = useQueryClient()
  const pushToast = useCmsStore((s) => s.pushToast)
  const supabase = useRef(createClient()).current

  // 60s is a safety net only — Realtime below invalidates instantly on any change.
  const ordersQ = useQuery({ queryKey: posQk.board(bid), queryFn: () => fetchBoardOrders(bid), refetchInterval: 60000 })
  const tablesQ = useQuery({ queryKey: posQk.tables(bid), queryFn: () => fetchTables(bid) })

  const [filter, setFilter] = useState<OrderChannel | 'all'>('all')
  const [adding, setAdding] = useState(false)
  const [billing, setBilling] = useState<BoardOrder | null>(null)

  useEffect(() => {
    const ch = supabase
      .channel(`board-${bid}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'orders', filter: `business_id=eq.${bid}` }, () => qc.invalidateQueries({ queryKey: posQk.board(bid) }))
      .on('postgres_changes', { event: '*', schema: 'public', table: 'order_items', filter: `business_id=eq.${bid}` }, () => qc.invalidateQueries({ queryKey: posQk.board(bid) }))
      .subscribe()
    return () => { supabase.removeChannel(ch) }
  }, [supabase, bid, qc])

  const invalidate = () => qc.invalidateQueries({ queryKey: posQk.board(bid) })

  const moveMut = useMutation({
    mutationFn: ({ id, status }: { id: string; status: OrderStatus }) => updateOrderStatus(id, status),
    onSuccess: invalidate,
    onError: (e: unknown) => pushToast((e as Error).message, 'error'),
  })
  const completeMut = useMutation({
    mutationFn: (id: string) => updateOrderStatus(id, 'settled'),
    onSuccess: () => { invalidate(); pushToast('Order completed') },
    onError: (e: unknown) => pushToast((e as Error).message, 'error'),
  })
  const cancelMut = useMutation({
    mutationFn: (id: string) => updateOrderStatus(id, 'cancelled'),
    onSuccess: () => { invalidate(); pushToast('Order cancelled') },
    onError: (e: unknown) => pushToast((e as Error).message, 'error'),
  })

  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 8 } }))

  const orders = useMemo(() => {
    const all = ordersQ.data ?? []
    return filter === 'all' ? all : all.filter((o) => (o.channel ?? 'direct') === filter)
  }, [ordersQ.data, filter])

  const tables = tablesQ.data ?? []

  function handleDragEnd(e: DragEndEvent) {
    const overId = e.over?.id as OrderStatus | undefined
    const orderId = e.active.id as string
    if (!overId) return
    const order = orders.find((o) => o.id === orderId)
    if (!order || order.status === overId) return
    moveMut.mutate({ id: orderId, status: overId })
  }

  const channelChips: (OrderChannel | 'all')[] = ['all', 'direct', 'swiggy', 'zomato', 'phone']

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-xl font-semibold">Orders Board</h2>
          <p className="text-sm text-neutral-400">Every channel — dine-in, takeaway, Swiggy &amp; Zomato — in one live board. Drag to advance.</p>
        </div>
        <Button size="sm" onClick={() => setAdding(true)}><Plus className="h-4 w-4" /> Add aggregator order</Button>
      </div>

      <div className="flex flex-wrap gap-2">
        {channelChips.map((c) => (
          <button key={c} onClick={() => setFilter(c)} className={cn('flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-medium transition', filter === c ? 'bg-neutral-900 text-white dark:bg-white dark:text-neutral-900' : 'bg-neutral-100 text-neutral-600 dark:bg-neutral-800 dark:text-neutral-300')}>
            {c !== 'all' && <span className="h-2 w-2 rounded-full" style={{ background: CHANNEL_META[c].color }} />}
            {c === 'all' ? 'All' : CHANNEL_META[c].label}
          </button>
        ))}
      </div>

      {ordersQ.isError ? (
        <div className="rounded-xl border border-dashed border-red-900/50 bg-red-500/5 p-8 text-center">
          <p className="text-sm text-red-400">Couldn&apos;t load orders: {(ordersQ.error as Error).message}</p>
          <p className="mt-1 text-xs text-neutral-500">Has migration 014 been applied?</p>
        </div>
      ) : (
        <DndContext sensors={sensors} collisionDetection={pointerWithin} onDragEnd={handleDragEnd}>
          <div className="flex gap-3 overflow-x-auto pb-2">
            {COLUMNS.map((col) => (
              <Column
                key={col.key}
                col={col}
                orders={orders.filter((o) => col.match.includes(o.status))}
                tables={tables}
                onBill={setBilling}
                onComplete={(o) => completeMut.mutate(o.id)}
                onCancel={(o) => { if (confirm('Cancel this order?')) cancelMut.mutate(o.id) }}
              />
            ))}
          </div>
        </DndContext>
      )}

      {orders.length === 0 && !ordersQ.isError && !ordersQ.isLoading && (
        <div className="flex items-center justify-center gap-2 rounded-xl border border-dashed border-neutral-300 py-10 text-sm text-neutral-400 dark:border-neutral-800">
          <ShoppingBag className="h-4 w-4" /> No live orders. New orders appear here automatically.
        </div>
      )}

      {adding && <AddAggregatorModal businessId={bid} onClose={() => setAdding(false)} onCreated={() => { setAdding(false); invalidate() }} />}
      {billing && (
        <PosBillingPanel
          order={billing}
          tableLabel={billing.table_id ? tables.find((t) => t.id === billing.table_id)?.label ?? null : null}
          onClose={() => setBilling(null)}
          onSettled={() => { setBilling(null); invalidate() }}
        />
      )}
    </div>
  )
}
