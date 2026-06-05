import { ItemForm } from '@/components/cms/ItemForm'

export const dynamic = process.env.STATIC_EXPORT === '1' ? 'force-static' : 'force-dynamic'

// In static export, generate a placeholder page. The CMS layout shows "login
// required" regardless, so the actual ID doesn't matter.
export function generateStaticParams() {
  return [{ id: 'demo' }]
}

export default function EditItemPage({ params }: { params: { id: string } }) {
  return <ItemForm itemId={params.id} />
}

export const runtime = "edge";
