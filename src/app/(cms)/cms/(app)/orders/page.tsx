import { OrdersBoard } from '@/components/cms/OrdersBoard'
import { UpgradePrompt } from '@/components/cms/UpgradePrompt'
import { getConfig } from '@/lib/config'

export const metadata = { title: 'Orders Board | MenuOS' }

export default function OrdersPage() {
  const { features } = getConfig()
  return (
    <div className="mx-auto max-w-7xl">
      {features.aggregator ? (
        <OrdersBoard />
      ) : (
        <div className="space-y-6 p-4">
          <div>
            <h1 className="text-2xl font-bold text-neutral-900 dark:text-neutral-100">Orders Board</h1>
            <p className="mt-1 text-sm text-neutral-500 dark:text-neutral-400">Every channel — dine-in, Swiggy, Zomato — in one live board.</p>
          </div>
          <UpgradePrompt feature="Orders Board" description="The unified Swiggy/Zomato orders board is part of the POS add-on." />
        </div>
      )}
    </div>
  )
}

export const runtime = "edge";
