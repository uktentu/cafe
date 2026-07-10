import { PosOrderScreen } from '@/components/cms/PosOrderScreen'
import { UpgradePrompt } from '@/components/cms/UpgradePrompt'
import { getConfig } from '@/lib/config'

export const metadata = {
  title: 'Orders & Billing | MenuOS',
}

export default function PosPage() {
  const { features } = getConfig()

  return (
    <div className="mx-auto max-w-6xl">
      {features.staffOrderTaking ? (
        <PosOrderScreen />
      ) : (
        <div className="space-y-6 p-4">
          <div>
            <h1 className="text-2xl font-bold text-neutral-900 dark:text-neutral-100">Orders & Billing</h1>
            <p className="mt-1 text-sm text-neutral-500 dark:text-neutral-400">Take orders, send tickets to the kitchen, and settle bills.</p>
          </div>
          <UpgradePrompt
            feature="Orders & Billing"
            description="Waiter order-taking and billing is part of the POS add-on. Enable it to run your floor from a tablet."
          />
        </div>
      )}
    </div>
  )
}

export const runtime = "edge";
