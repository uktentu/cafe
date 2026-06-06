// CMS dashboard — overview stats + quick actions. Counts fetched server-side
// (head queries, cheap); the (app) layout guarantees an authed staff member.
import { getCmsContext } from '@/lib/cms-context'
import { createClient } from '@/lib/supabase/server'
import { StatCards, QuickActions } from '@/components/cms/StatCards'

export const dynamic = process.env.STATIC_EXPORT === '1' ? 'force-static' : 'force-dynamic'

export default async function DashboardPage() {
  const ctx = await getCmsContext()
  if (ctx.state !== 'ok') return null // layout already rendered the notice

  const supabase = createClient()
  const businessId = ctx.business.id
  const [items, soldOut, categories] = await Promise.all([
    supabase.from('items').select('id', { count: 'exact', head: true }).eq('business_id', businessId),
    supabase.from('items').select('id', { count: 'exact', head: true }).eq('business_id', businessId).eq('is_available', false),
    supabase.from('categories').select('id', { count: 'exact', head: true }).eq('business_id', businessId),
  ])

  const stats = {
    items: items.count ?? 0,
    soldOut: soldOut.count ?? 0,
    categories: categories.count ?? 0,
  }

  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-2xl font-semibold text-neutral-900 dark:text-neutral-100">Dashboard</h1>
        <p className="mt-1 text-sm text-neutral-500 dark:text-neutral-400">Welcome back to {ctx.business.name}.</p>
      </header>
      <StatCards stats={stats} />
      <QuickActions />
    </div>
  )
}

export const runtime = "edge";
