import { ItemForm } from '@/components/cms/ItemForm'

export const dynamic = 'force-dynamic'

export default function EditItemPage({ params }: { params: { id: string } }) {
  return <ItemForm itemId={params.id} />
}
