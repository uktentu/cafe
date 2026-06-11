'use client'

import React, { lazy, Suspense } from 'react'
import type { Theme } from '@/types/database'

const ItemModal = lazy(() => import('./ItemModal').then((m) => ({ default: m.ItemModal })))

export function DeferredItemModal(props: { theme?: Theme }) {
  return (
    <Suspense fallback={null}>
      <ItemModal {...props} />
    </Suspense>
  )
}
