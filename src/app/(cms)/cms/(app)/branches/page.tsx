import { BranchManager } from '@/components/cms/BranchManager'
import { getConfig } from '@/lib/config'
import { redirect } from 'next/navigation'

export const metadata = {
  title: 'Branches | MenuOS',
}

export default function BranchesPage() {
  if (!getConfig().features.multiBranch) redirect('/cms/upgrade?feature=Branches')

  return (
    <div className="mx-auto max-w-5xl">
      <BranchManager />
    </div>
  )
}
