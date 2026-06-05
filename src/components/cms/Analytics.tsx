'use client'

import { useMemo } from 'react'
import { useQuery } from '@tanstack/react-query'
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts'
import { Eye, MessageCircle, ShoppingBag, TrendingUp } from 'lucide-react'
import { useCms } from './Providers'
import { qk, fetchAnalyticsSummary } from '@/lib/cms-queries'
import { AnimatedNumber } from '@/components/motion/AnimatedNumber'

interface StatCardProps {
  icon: React.ReactNode
  label: string
  value: number
  color: string
}

function StatCard({ icon, label, value, color }: StatCardProps) {
  return (
    <div className="rounded-2xl bg-white p-5 ring-1 ring-black/5">
      <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-xl" style={{ background: color + '18' }}>
        <span style={{ color }}>{icon}</span>
      </div>
      <p className="text-2xl font-bold text-neutral-900">
        <AnimatedNumber value={value} />
      </p>
      <p className="mt-1 text-sm text-neutral-500">{label}</p>
    </div>
  )
}

function EmptyState() {
  return (
    <div className="flex flex-col items-center justify-center rounded-2xl bg-white py-16 ring-1 ring-black/5">
      <TrendingUp className="mb-4 h-10 w-10 text-neutral-300" />
      <p className="font-medium text-neutral-700">No analytics yet</p>
      <p className="mt-1 text-sm text-neutral-400">Data appears once visitors start viewing your menu.</p>
    </div>
  )
}

export function AnalyticsDashboard() {
  const { business } = useCms()
  const bid = business.id

  const { data, isLoading, isError } = useQuery({
    queryKey: qk.analytics(bid),
    queryFn: () => fetchAnalyticsSummary(bid),
    staleTime: 5 * 60 * 1000,
  })

  const chartData = useMemo(
    () =>
      (data?.pageViews7d ?? []).map(({ date, count }) => ({
        label: new Date(date + 'T00:00:00').toLocaleDateString('en-IN', { weekday: 'short', day: 'numeric' }),
        views: count,
      })),
    [data],
  )

  if (isLoading) {
    return (
      <div className="space-y-4">
        <div className="grid grid-cols-2 gap-4 md:grid-cols-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-28 rounded-2xl bg-neutral-100 animate-pulse" />
          ))}
        </div>
        <div className="h-64 rounded-2xl bg-neutral-100 animate-pulse" />
      </div>
    )
  }

  if (isError || !data) {
    return (
      <div className="rounded-2xl bg-red-50 p-6 text-sm text-red-700 ring-1 ring-red-200">
        Could not load analytics. Make sure the analytics_events table exists and RLS is configured.
      </div>
    )
  }

  const hasData = data.totalPageViews + data.totalItemViews + data.totalWhatsappClicks > 0

  return (
    <div className="space-y-6">
      {/* Stat cards */}
      <div className="grid grid-cols-2 gap-4 md:grid-cols-3">
        <StatCard icon={<Eye className="h-5 w-5" />} label="Page views (7d)" value={data.totalPageViews} color="#3B82F6" />
        <StatCard icon={<ShoppingBag className="h-5 w-5" />} label="Item views (7d)" value={data.totalItemViews} color="#8B5CF6" />
        <StatCard icon={<MessageCircle className="h-5 w-5" />} label="WhatsApp taps (7d)" value={data.totalWhatsappClicks} color="#22C55E" />
      </div>

      {/* Page views chart */}
      <div className="rounded-2xl bg-white p-5 ring-1 ring-black/5">
        <p className="mb-4 text-sm font-semibold text-neutral-700">Page views — last 7 days</p>
        {!hasData ? (
          <EmptyState />
        ) : (
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={chartData} margin={{ top: 0, right: 0, left: -20, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#F0F0EE" vertical={false} />
              <XAxis dataKey="label" tick={{ fontSize: 11, fill: '#9CA3AF' }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 11, fill: '#9CA3AF' }} axisLine={false} tickLine={false} allowDecimals={false} />
              <Tooltip
                contentStyle={{ borderRadius: 8, border: 'none', boxShadow: '0 4px 20px rgba(0,0,0,0.10)', fontSize: 12 }}
                cursor={{ fill: '#F5F5F3' }}
              />
              <Bar dataKey="views" fill="#3B82F6" radius={[4, 4, 0, 0]} name="Page views" />
            </BarChart>
          </ResponsiveContainer>
        )}
      </div>

      {/* Top items */}
      {data.topItems.length > 0 && (
        <div className="rounded-2xl bg-white p-5 ring-1 ring-black/5">
          <p className="mb-4 text-sm font-semibold text-neutral-700">Most-viewed items (7d)</p>
          <div className="space-y-3">
            {data.topItems.map((item, idx) => (
              <div key={item.item_id} className="flex items-center gap-3">
                <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-violet-50 text-xs font-bold text-violet-600">
                  {idx + 1}
                </span>
                <p className="flex-1 truncate text-sm text-neutral-700 font-medium">{item.name || <span className="font-mono text-xs">{item.item_id.slice(0, 8)}…</span>}</p>
                <span className="text-sm font-semibold text-neutral-900">{item.count} views</span>
              </div>
            ))}
          </div>
        </div>
      )}

      <p className="text-center text-xs text-neutral-400">Analytics data retained for 90 days · refreshes every 5 minutes</p>
    </div>
  )
}
