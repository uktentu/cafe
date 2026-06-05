import { StaffManager } from '@/components/cms/StaffManager'

export const dynamic = process.env.STATIC_EXPORT === '1' ? 'force-static' : 'force-dynamic'

export default function StaffPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-neutral-900">Staff Accounts</h1>
        <p className="mt-1 text-sm text-neutral-500">Manage your team and their access to the CMS.</p>
      </div>
      <StaffManager />
    </div>
  )
}
