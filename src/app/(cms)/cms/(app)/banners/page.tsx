import { BannersManager } from '@/components/cms/BannersManager'

export const dynamic = process.env.STATIC_EXPORT === '1' ? 'force-static' : 'force-dynamic'

export default function BannersPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-neutral-900">Banners</h1>
        <p className="mt-1 text-sm text-neutral-500">Promotional banners displayed on your public menu. Toggle to show/hide.</p>
      </div>
      <BannersManager />
    </div>
  )
}
