import { BannersManager } from '@/components/cms/BannersManager'
import { UpgradePrompt } from '@/components/cms/UpgradePrompt'
import { getConfig } from '@/lib/config'

export const dynamic = process.env.STATIC_EXPORT === '1' ? 'force-static' : 'force-dynamic'

export default function BannersPage() {
  const { features } = getConfig()

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-neutral-900 dark:text-neutral-100">Banners</h1>
        <p className="mt-1 text-sm text-neutral-500 dark:text-neutral-400">Promotional banners displayed on your public menu. Toggle to show/hide.</p>
      </div>
      {features.banners ? (
        <BannersManager />
      ) : (
        <UpgradePrompt
          feature="Banners"
          description="Promotional banners are available on the Advanced plan. Showcase offers and announcements at the top of your menu."
        />
      )}
    </div>
  )
}

export const runtime = "edge";
