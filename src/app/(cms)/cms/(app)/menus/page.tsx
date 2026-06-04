import { MenusManager } from '@/components/cms/MenusManager'

export const dynamic = 'force-dynamic'

export default function MenusPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-neutral-900">Menus</h1>
        <p className="mt-1 text-sm text-neutral-500">Create separate menus for Breakfast, Lunch, Dinner with time-based scheduling.</p>
      </div>
      <MenusManager />
    </div>
  )
}
