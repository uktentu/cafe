import { StaffManager } from '@/components/cms/StaffManager'
import { getConfig } from '@/lib/config'
import { redirect } from 'next/navigation'

export const dynamic = process.env.STATIC_EXPORT === '1' ? 'force-static' : 'force-dynamic'

export default function StaffPage() {
  if (!getConfig().features.staffAccounts) redirect('/cms/upgrade?feature=Staff')

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-neutral-900 dark:text-neutral-100">Staff Accounts</h1>
        <p className="mt-1 text-sm text-neutral-500 dark:text-neutral-400">Manage your team and their access to the CMS.</p>
      </div>
      <StaffManager />
    </div>
  )
}

export const runtime = "edge";
