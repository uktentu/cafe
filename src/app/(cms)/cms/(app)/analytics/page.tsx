import { AnalyticsDashboard } from '@/components/cms/Analytics'
import { getConfig } from '@/lib/config'
import { redirect } from 'next/navigation'

export const dynamic = process.env.STATIC_EXPORT === '1' ? 'force-static' : 'force-dynamic'

export default function AnalyticsPage() {
  if (!getConfig().features.analytics) redirect('/cms/upgrade?feature=Analytics')

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-neutral-900">Analytics</h1>
        <p className="mt-1 text-sm text-neutral-500">Page views, item views, and WhatsApp taps from the last 7 days.</p>
      </div>
      <AnalyticsDashboard />
    </div>
  )
}

export const runtime = "edge";
