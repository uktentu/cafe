import { getCmsContext } from '@/lib/cms-context'
import { createClient } from '@/lib/supabase/server'
import { getConfig } from '@/lib/config'
import { DashboardClient } from '@/components/cms/DashboardClient'

export const dynamic = process.env.STATIC_EXPORT === '1' ? 'force-static' : 'force-dynamic'

export default async function DashboardPage() {
  const ctx = await getCmsContext()
  if (ctx.state !== 'ok') return null

  const supabase = createClient()
  const id = ctx.business.id
  const [items, soldOut, categories, featured, qrCodes] = await Promise.all([
    supabase.from('items').select('id', { count: 'exact', head: true }).eq('business_id', id),
    supabase.from('items').select('id', { count: 'exact', head: true }).eq('business_id', id).eq('is_available', false),
    supabase.from('categories').select('id', { count: 'exact', head: true }).eq('business_id', id),
    supabase.from('items').select('id', { count: 'exact', head: true }).eq('business_id', id).eq('is_featured', true),
    supabase.from('qr_codes').select('id', { count: 'exact', head: true }).eq('business_id', id),
  ])

  const { features } = getConfig()

  // Command-center: today's live POS numbers. All reads degrade to 0 if the
  // POS tables aren't present yet (results carry errors, never throw), so the
  // dashboard never breaks.
  let pos: { todaySales: number; todayBills: number; occupiedTables: number; activeTickets: number } | null = null
  if (features.posEnabled) {
    const todayStart = new Date()
    todayStart.setHours(0, 0, 0, 0)
    const todayIso = todayStart.toISOString()
    const [settled, occupied, tickets] = await Promise.all([
      supabase.from('orders').select('total_amount').eq('business_id', id).eq('status', 'settled').gte('settled_at', todayIso),
      supabase.from('tables').select('id', { count: 'exact', head: true }).eq('business_id', id).eq('status', 'occupied'),
      supabase.from('order_items').select('id', { count: 'exact', head: true }).eq('business_id', id).in('status', ['placed', 'preparing', 'ready']),
    ])
    const todayOrders = (settled.data ?? []) as { total_amount: number }[]
    pos = {
      todaySales: todayOrders.reduce((s, o) => s + o.total_amount, 0),
      todayBills: todayOrders.length,
      occupiedTables: occupied.count ?? 0,
      activeTickets: tickets.count ?? 0,
    }
  }

  return (
    <DashboardClient
      stats={{
        items: items.count ?? 0,
        soldOut: soldOut.count ?? 0,
        categories: categories.count ?? 0,
        featured: featured.count ?? 0,
        qrCodes: qrCodes.count ?? 0,
      }}
      business={ctx.business}
      features={features}
      pos={pos}
    />
  )
}

export const runtime = "edge";
