import { createAdminClient } from '@/lib/supabase/server'
import { getConfig } from '@/lib/config'
import { LoyaltyCard } from './LoyaltyCard'

export const revalidate = 3600

export default async function LoyaltyPage() {
  const { slug } = getConfig()
  const db = createAdminClient()
  const { data: business } = await db
    .from('businesses')
    .select('id, name, slug, whatsapp, social_links, theme, theme_color')
    .eq('slug', slug)
    .maybeSingle()

  if (!business) return null

  const stampsNeeded = 10
  const reward = 'a free item of your choice'

  return (
    <LoyaltyCard
      businessId={business.id}
      businessName={business.name}
      whatsapp={business.whatsapp ?? ''}
      themeColor={business.theme_color ?? '#E84B1A'}
      stampsNeeded={stampsNeeded}
      reward={reward}
    />
  )
}


export const runtime = "edge";