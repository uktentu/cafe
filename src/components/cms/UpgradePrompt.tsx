import Link from 'next/link'
import { Lock } from 'lucide-react'

export function UpgradePrompt({ feature, description }: { feature: string; description: string }) {
  return (
    <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-amber-200 dark:border-amber-500/20 bg-amber-50/50 dark:bg-amber-500/5 p-6 text-center">
      <div className="mb-3 rounded-full bg-amber-100 dark:bg-amber-500/10 p-3">
        <Lock className="h-6 w-6 text-amber-600 dark:text-amber-500" />
      </div>
      <h3 className="mb-2 font-medium text-neutral-900 dark:text-neutral-100">{feature} is locked</h3>
      <p className="mb-4 max-w-sm text-sm text-neutral-500 dark:text-neutral-400">{description}</p>
      <Link
        href={`/cms/upgrade?feature=${encodeURIComponent(feature)}`}
        className="rounded-lg bg-amber-500 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-amber-600 active:bg-amber-700"
      >
        View Upgrade Options
      </Link>
    </div>
  )
}
