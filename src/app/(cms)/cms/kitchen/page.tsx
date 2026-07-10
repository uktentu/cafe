import { getCmsContext } from '@/lib/cms-context'
import { KitchenDisplay } from '@/components/cms/KitchenDisplay'

export const metadata = {
  title: 'Kitchen | MenuOS',
}

export default async function KitchenPage() {
  const ctx = await getCmsContext()
  if (ctx.state !== 'ok') return null // layout already renders the notice

  return <KitchenDisplay businessId={ctx.business.id} />
}

export const runtime = "edge";
