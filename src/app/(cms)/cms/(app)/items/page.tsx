import { ItemsList } from '@/components/cms/ItemsList'

export const dynamic = process.env.STATIC_EXPORT === '1' ? 'force-static' : 'force-dynamic'

export default function ItemsPage() {
  return <ItemsList />
}

export const runtime = "edge";
