import { CustomersManager } from '@/components/cms/CustomersManager'
import { UpgradePrompt } from '@/components/cms/UpgradePrompt'
import { getConfig } from '@/lib/config'

export const metadata = { title: 'Customers | MenuOS' }

export default function CustomersPage() {
  const { features } = getConfig()
  return (
    <div className="mx-auto max-w-5xl">
      {features.crm ? (
        <CustomersManager />
      ) : (
        <div className="space-y-6 p-4">
          <div>
            <h1 className="text-2xl font-bold text-neutral-900 dark:text-neutral-100">Customers</h1>
            <p className="mt-1 text-sm text-neutral-500 dark:text-neutral-400">Your customer book and loyalty program.</p>
          </div>
          <UpgradePrompt feature="Customer CRM" description="The customer book & loyalty program is part of the POS add-on." />
        </div>
      )}
    </div>
  )
}

export const runtime = "edge";
