import { ToolsManager } from '@/components/cms/ToolsManager'

export const metadata = {
  title: 'Tools & Reports | MenuOS',
}

export default function ToolsPage() {
  return (
    <div className="mx-auto max-w-4xl">
      <ToolsManager />
    </div>
  )
}
