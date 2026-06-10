import { BranchManager } from '@/components/cms/BranchManager'
import { UpgradePrompt } from '@/components/cms/UpgradePrompt'
import { getConfig } from '@/lib/config'

export const metadata = {
  title: 'Branches | MenuOS',
}

export default function BranchesPage() {
  const { features } = getConfig()

  return (
    <div className="mx-auto max-w-5xl">
      {features.multiBranch ? (
        <BranchManager />
      ) : (
        <div className="space-y-6 p-4">
          <div>
            <h1 className="text-2xl font-bold text-neutral-900 dark:text-neutral-100">Branches</h1>
            <p className="mt-1 text-sm text-neutral-500 dark:text-neutral-400">Manage multiple locations with separate menus and QR codes.</p>
          </div>
          <UpgradePrompt
            feature="Multi-Branch"
            description="Multiple branch support is available on the Premium plan. Run up to 3 locations from a single dashboard with location-specific QR codes."
          />
        </div>
      )}
    </div>
  )
}

export const runtime = "edge";
