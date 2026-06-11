'use client'

import React, { lazy, Suspense } from 'react'
import type { Theme } from '@/types/database'

const ReservationModal = lazy(() => import('./ReservationModal').then((m) => ({ default: m.ReservationModal })))

export function DeferredReservationModal(props: { businessId: string, businessName: string, branchId?: string, theme?: Theme }) {
  return (
    <Suspense fallback={null}>
      <ReservationModal {...props} />
    </Suspense>
  )
}
