import { TablesManager } from '@/components/cms/TablesManager'
import { UpgradePrompt } from '@/components/cms/UpgradePrompt'
import { getConfig } from '@/lib/config'

export const metadata = {
  title: 'Tables | MenuOS',
}

export default function TablesPage() {
  const { features } = getConfig()

  return (
    <div className="mx-auto max-w-5xl">
      {features.tableManagement ? (
        <TablesManager />
      ) : (
        <div className="space-y-6 p-4">
          <div>
            <h1 className="text-2xl font-bold text-neutral-900 dark:text-neutral-100">Tables</h1>
            <p className="mt-1 text-sm text-neutral-500 dark:text-neutral-400">Manage your floor plan and table status.</p>
          </div>
          <UpgradePrompt
            feature="Table Management"
            description="Table & floor management is part of the POS add-on. Enable it to run live orders, kitchen tickets, and billing per table."
          />
        </div>
      )}
    </div>
  )
}

export const runtime = "edge";
