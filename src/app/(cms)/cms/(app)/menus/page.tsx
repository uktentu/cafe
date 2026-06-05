import { MenusManager } from '@/components/cms/MenusManager'
import { getConfig } from '@/lib/config'
import { redirect } from 'next/navigation'

export const dynamic = process.env.STATIC_EXPORT === '1' ? 'force-static' : 'force-dynamic'

export default function MenusPage() {
  if (!getConfig().features.menus) redirect('/cms/upgrade?feature=Menus')

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

export const runtime = "edge";
