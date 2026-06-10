import { StaffManager } from '@/components/cms/StaffManager'
import { UpgradePrompt } from '@/components/cms/UpgradePrompt'
import { getConfig } from '@/lib/config'

export const dynamic = process.env.STATIC_EXPORT === '1' ? 'force-static' : 'force-dynamic'

export default function StaffPage() {
  const { features } = getConfig()

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-neutral-900 dark:text-neutral-100">Staff Accounts</h1>
        <p className="mt-1 text-sm text-neutral-500 dark:text-neutral-400">Manage your team and their access to the CMS.</p>
      </div>
      {features.staffAccounts ? (
        <StaffManager />
      ) : (
        <UpgradePrompt
          feature="Staff Accounts"
          description="Team accounts are available on the Advanced plan. Let staff update availability and manage orders without sharing your owner login."
        />
      )}
    </div>
  )
}

export const runtime = "edge";
