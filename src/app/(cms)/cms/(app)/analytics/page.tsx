import { AnalyticsDashboard } from '@/components/cms/Analytics'

export const dynamic = 'force-dynamic'

export default function AnalyticsPage() {
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
