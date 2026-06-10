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
    />
  )
}

export const runtime = "edge";
