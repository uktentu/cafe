import { SalesManager } from '@/components/cms/SalesManager'
import { UpgradePrompt } from '@/components/cms/UpgradePrompt'
import { getConfig } from '@/lib/config'

export const metadata = {
  title: 'Sales | MenuOS',
}

export default function SalesPage() {
  const { features } = getConfig()

  return (
    <div className="mx-auto max-w-5xl">
      {features.billing ? (
        <SalesManager />
      ) : (
        <div className="space-y-6 p-4">
          <div>
            <h1 className="text-2xl font-bold text-neutral-900 dark:text-neutral-100">Sales</h1>
            <p className="mt-1 text-sm text-neutral-500 dark:text-neutral-400">Daily takings, settled bills, and payment breakdowns.</p>
          </div>
          <UpgradePrompt
            feature="Sales Tracking"
            description="Sales & billing history is part of the POS add-on. Enable it to track daily takings, taxes, and reprint any bill."
          />
        </div>
      )}
    </div>
  )
}

export const runtime = "edge";
