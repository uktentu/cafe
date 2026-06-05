'use client'

import dynamic from 'next/dynamic'
import type { Theme } from '@/types/database'

const ReservationModal = dynamic(() => import('./ReservationModal').then((m) => m.ReservationModal), { ssr: false })

export function DeferredReservationModal(props: { businessId: string; businessName: string; branchId?: string; theme?: Theme }) {
  return <ReservationModal {...props} />
}
