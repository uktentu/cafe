import { redirect } from 'next/navigation'
import { getCmsContext } from '@/lib/cms-context'
import { createAdminClient } from '@/lib/supabase/server'
import { AdminClient } from './AdminClient'
import type { Business } from '@/types/database'

export const dynamic = 'force-dynamic'

export default async function AdminPage() {
  const ctx = await getCmsContext()
  if (ctx.state !== 'ok' || !ctx.isAdmin) redirect('/cms/dashboard')

  const supabase = createAdminClient()
  const { data: businesses } = await supabase
    .from('businesses')
    .select('id, slug, name, tier, is_active, city, phone, created_at')
    .order('created_at', { ascending: false })

  const list = (businesses ?? []) as Pick<Business, 'id' | 'slug' | 'name' | 'tier' | 'is_active' | 'city' | 'phone' | 'created_at'>[]

  const tierCounts = list.reduce(
    (acc, b) => { acc[b.tier] = (acc[b.tier] || 0) + 1; return acc },
    {} as Record<string, number>
  )

  const monthlyRevenue =
    (tierCounts['basic'] || 0) * 999 +
    (tierCounts['advanced'] || 0) * 1999 +
    (tierCounts['premium'] || 0) * 3499

  return (
    <AdminClient
      businesses={list}
      stats={{
        total: list.length,
        active: list.filter(b => b.is_active).length,
        tierCounts,
        monthlyRevenue,
      }}
    />
  )
}
