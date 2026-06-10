import { ReservationsManager } from '@/components/cms/ReservationsManager'
import { UpgradePrompt } from '@/components/cms/UpgradePrompt'
import { getConfig } from '@/lib/config'

export const metadata = {
  title: 'Reservations | MenuOS',
}

export default function ReservationsPage() {
  const { features } = getConfig()

  return (
    <div className="mx-auto max-w-5xl">
      {features.reservations ? (
        <ReservationsManager />
      ) : (
        <div className="space-y-6">
          <div>
            <h1 className="text-2xl font-bold text-neutral-900 dark:text-neutral-100">Reservations</h1>
            <p className="mt-1 text-sm text-neutral-500 dark:text-neutral-400">Let guests book a table directly from your menu.</p>
          </div>
          <UpgradePrompt
            feature="Reservations"
            description="Table reservations are available on the Premium plan. Accept bookings directly from your QR menu — no third-party app required."
          />
        </div>
      )}
    </div>
  )
}

export const runtime = "edge";
