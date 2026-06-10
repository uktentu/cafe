import { MenusManager } from '@/components/cms/MenusManager'
import { UpgradePrompt } from '@/components/cms/UpgradePrompt'
import { getConfig } from '@/lib/config'

export const dynamic = process.env.STATIC_EXPORT === '1' ? 'force-static' : 'force-dynamic'

export default function MenusPage() {
  const { features } = getConfig()

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-neutral-900 dark:text-neutral-100">Menus</h1>
        <p className="mt-1 text-sm text-neutral-500 dark:text-neutral-400">Create separate menus for Breakfast, Lunch, Dinner with time-based scheduling.</p>
      </div>
      {features.menus ? (
        <MenusManager />
      ) : (
        <UpgradePrompt
          feature="Multiple Menus"
          description="Scheduled menus (Breakfast, Lunch, Dinner) are available on the Advanced plan. Show the right menu at the right time."
        />
      )}
    </div>
  )
}

export const runtime = "edge";
