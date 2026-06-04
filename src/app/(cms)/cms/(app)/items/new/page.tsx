import { ItemForm } from '@/components/cms/ItemForm'

export const dynamic = process.env.STATIC_EXPORT === '1' ? 'force-static' : 'force-dynamic'

export default function NewItemPage() {
  return <ItemForm />
}
