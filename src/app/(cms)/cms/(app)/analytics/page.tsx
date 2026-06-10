import { AnalyticsDashboard } from '@/components/cms/Analytics'
import { UpgradePrompt } from '@/components/cms/UpgradePrompt'
import { getConfig } from '@/lib/config'

export const dynamic = process.env.STATIC_EXPORT === '1' ? 'force-static' : 'force-dynamic'

export default function AnalyticsPage() {
  const { features } = getConfig()

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-neutral-900 dark:text-neutral-100">Analytics</h1>
        <p className="mt-1 text-sm text-neutral-500 dark:text-neutral-400">Page views, item views, and WhatsApp taps from the last 7 days.</p>
      </div>
      {features.analytics ? (
        <AnalyticsDashboard />
      ) : (
        <UpgradePrompt
          feature="Analytics"
          description="Analytics are available on the Advanced plan. Track page views, item views, and customer engagement."
        />
      )}
    </div>
  )
}

export const runtime = "edge";
