import { ReportsManager } from '@/components/cms/ReportsManager'
import { UpgradePrompt } from '@/components/cms/UpgradePrompt'
import { getConfig } from '@/lib/config'

export const metadata = { title: 'Reports | MenuOS' }

export default function ReportsPage() {
  const { features } = getConfig()
  return (
    <div className="mx-auto max-w-5xl">
      {features.reports ? (
        <ReportsManager />
      ) : (
        <div className="space-y-6 p-4">
          <div>
            <h1 className="text-2xl font-bold text-neutral-900 dark:text-neutral-100">Reports &amp; Day Close</h1>
            <p className="mt-1 text-sm text-neutral-500 dark:text-neutral-400">Daily takings, item sales, and end-of-day cash close.</p>
          </div>
          <UpgradePrompt feature="Reports & Day Close" description="Z-reports and day close are part of the POS add-on." />
        </div>
      )}
    </div>
  )
}

export const runtime = "edge";
