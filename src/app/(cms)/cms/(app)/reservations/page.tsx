import { ReservationsManager } from '@/components/cms/ReservationsManager'
import { getConfig } from '@/lib/config'
import { redirect } from 'next/navigation'

export const metadata = {
  title: 'Reservations | MenuOS',
}

export default function ReservationsPage() {
  if (!getConfig().features.reservations) redirect('/cms/upgrade?feature=Reservations')

  return (
    <div className="mx-auto max-w-5xl">
      <ReservationsManager />
    </div>
  )
}
