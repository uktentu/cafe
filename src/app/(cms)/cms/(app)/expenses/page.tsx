import { ExpensesManager } from '@/components/cms/ExpensesManager'
import { UpgradePrompt } from '@/components/cms/UpgradePrompt'
import { getConfig } from '@/lib/config'

export const metadata = { title: 'Expenses | MenuOS' }

export default function ExpensesPage() {
  const { features } = getConfig()
  return (
    <div className="mx-auto max-w-5xl">
      {features.expenses ? (
        <ExpensesManager />
      ) : (
        <div className="space-y-6 p-4">
          <div>
            <h1 className="text-2xl font-bold text-neutral-900 dark:text-neutral-100">Expenses</h1>
            <p className="mt-1 text-sm text-neutral-500 dark:text-neutral-400">Track money out and see your real profit.</p>
          </div>
          <UpgradePrompt feature="Expenses & Profit" description="Expense tracking and P&L is part of the POS add-on." />
        </div>
      )}
    </div>
  )
}

export const runtime = "edge";
