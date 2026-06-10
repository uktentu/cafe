'use client'

import dynamic from 'next/dynamic'
import type { Theme } from '@/types/database'

// The detail modal (and its SpringModal/drag features) is only needed after a
// tap — defer it out of the menu's first-load JS (Basic < 120KB budget).
const ItemModal = dynamic(() => import('./ItemModal').then((m) => m.ItemModal), { ssr: false })

export function DeferredItemModal(props: { businessName: string; whatsapp: string; theme?: Theme; tableLabel?: string | null }) {
  return <ItemModal {...props} />
}
