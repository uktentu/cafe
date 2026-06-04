import { SettingsForm } from '@/components/cms/SettingsForm'

export const dynamic = process.env.STATIC_EXPORT === '1' ? 'force-static' : 'force-dynamic'

export default function SettingsPage() {
  return <SettingsForm />
}
