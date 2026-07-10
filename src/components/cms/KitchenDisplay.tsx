'use client'

import { useEffect, useMemo, useRef } from 'react'
import { useQuery, useQueryClient, useMutation } from '@tanstack/react-query'
import { Clock, ChefHat, CheckCircle2 } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { posQk, fetchKotItems, updateOrderItemStatus, type KotTicketItem } from '@/lib/pos-queries'
import { CHANNEL_COLOR } from '@/lib/channels'
import type { OrderItemStatus } from '@/types/database'

const NEXT_STATUS: Record<OrderItemStatus, OrderItemStatus | null> = {
  placed: 'preparing',
  preparing: 'ready',
  ready: 'served',
  served: null,
  cancelled: null,
}

const STATUS_LABEL: Record<OrderItemStatus, string> = {
  placed: 'New',
  preparing: 'Preparing',
  ready: 'Ready',
  served: 'Served',
  cancelled: 'Cancelled',
}

const STATUS_COLOR: Record<OrderItemStatus, string> = {
  placed: 'border-red-500 bg-red-500/10',
  preparing: 'border-amber-500 bg-amber-500/10',
  ready: 'border-emerald-500 bg-emerald-500/10',
  served: 'border-neutral-700 bg-neutral-800/30',
  cancelled: 'border-neutral-800 bg-neutral-900',
}

function elapsedMinutes(createdAt?: string): number {
  if (!createdAt) return 0
  return Math.max(0, Math.floor((Date.now() - new Date(createdAt).getTime()) / 60000))
}

export function KitchenDisplay({ businessId }: { businessId: string }) {
  const supabase = useRef(createClient()).current
  const qc = useQueryClient()

  const { data: items = [] } = useQuery({
    queryKey: posQk.kot(businessId),
    queryFn: () => fetchKotItems(businessId),
    refetchInterval: 15000,
  })

  useEffect(() => {
    const channel = supabase
      .channel(`kot-${businessId}`)
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'order_items', filter: `business_id=eq.${businessId}` },
        () => qc.invalidateQueries({ queryKey: posQk.kot(businessId) })
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'orders', filter: `business_id=eq.${businessId}` },
        () => qc.invalidateQueries({ queryKey: posQk.kot(businessId) })
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [supabase, businessId, qc])

  const advanceMut = useMutation({
    mutationFn: ({ id, status }: { id: string; status: OrderItemStatus }) => updateOrderItemStatus(id, status),
    onSuccess: () => qc.invalidateQueries({ queryKey: posQk.kot(businessId) }),
  })

  const tickets = useMemo(() => {
    const byOrder = new Map<string, KotTicketItem[]>()
    for (const item of items) {
      const list = byOrder.get(item.order_id) ?? []
      list.push(item)
      byOrder.set(item.order_id, list)
    }
    return Array.from(byOrder.entries()).map(([orderId, orderItems]) => {
      const first = orderItems[0]
      const channel = first?.channel ?? 'direct'
      // Aggregator tickets are labelled by platform + external ref so the
      // kitchen knows it's a Swiggy/Zomato order to hand to a rider.
      const label = channel !== 'direct'
        ? `${channel === 'swiggy' ? 'Swiggy' : channel === 'zomato' ? 'Zomato' : 'Phone'}${first?.external_ref ? ' #' + first.external_ref : ''}`
        : first?.table_label ?? (first?.order_type === 'takeaway' ? 'Takeaway' : first?.order_type === 'delivery' ? 'Delivery' : 'Counter')
      return {
        orderId,
        label,
        channel,
        items: orderItems,
        oldest: orderItems.reduce((min, i) => (i.created_at && i.created_at < min ? i.created_at : min), first?.created_at ?? ''),
      }
    })
  }, [items])

  return (
    <div className="min-h-[100svh] bg-[#0A0A0A] p-4 text-white">
      <div className="mb-4 flex items-center justify-between">
        <h1 className="flex items-center gap-2 text-xl font-bold">
          <ChefHat className="h-6 w-6" /> Kitchen
        </h1>
        <span className="text-sm text-neutral-500">{tickets.length} active ticket{tickets.length === 1 ? '' : 's'}</span>
      </div>

      {tickets.length === 0 ? (
        <div className="flex h-[60vh] items-center justify-center text-neutral-600">No active orders.</div>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {tickets.map((ticket) => (
            <div key={ticket.orderId} className="rounded-xl border border-neutral-800 bg-neutral-900 p-4" style={ticket.channel !== 'direct' ? { borderLeftWidth: 4, borderLeftColor: CHANNEL_COLOR[ticket.channel] } : undefined}>
              <div className="mb-3 flex items-center justify-between">
                <h2 className="text-lg font-semibold" style={ticket.channel !== 'direct' ? { color: CHANNEL_COLOR[ticket.channel] } : undefined}>{ticket.label}</h2>
                <span className="flex items-center gap-1 text-xs text-neutral-500">
                  <Clock className="h-3.5 w-3.5" /> {elapsedMinutes(ticket.oldest)}m
                </span>
              </div>
              <ul className="space-y-2">
                {ticket.items.map((item) => {
                  const next = NEXT_STATUS[item.status]
                  return (
                    <li key={item.id} className={`rounded-lg border p-2.5 ${STATUS_COLOR[item.status]}`}>
                      <div className="flex items-center justify-between gap-2">
                        <div className="min-w-0">
                          <p className="truncate text-sm font-medium">{item.qty}&times; {item.item_name_snapshot}</p>
                          {item.note && <p className="truncate text-xs text-neutral-400">{item.note}</p>}
                        </div>
                        <span className="shrink-0 text-[10px] font-semibold uppercase tracking-wide text-neutral-400">
                          {STATUS_LABEL[item.status]}
                        </span>
                      </div>
                      {next && (
                        <button
                          onClick={() => advanceMut.mutate({ id: item.id, status: next })}
                          disabled={advanceMut.isPending}
                          className="mt-2 flex w-full items-center justify-center gap-1.5 rounded-md bg-white/10 py-1.5 text-xs font-medium hover:bg-white/20"
                        >
                          <CheckCircle2 className="h-3.5 w-3.5" /> Mark {STATUS_LABEL[next]}
                        </button>
                      )}
                    </li>
                  )
                })}
              </ul>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
