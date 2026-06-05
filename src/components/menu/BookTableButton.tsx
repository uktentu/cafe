'use client'

import { CalendarCheck } from 'lucide-react'
import { useMenuStore } from '@/stores/menu'
import { getConfig } from '@/lib/config'
import type { Theme } from '@/types/database'

export function BookTableButton({ theme }: { theme?: Theme }) {
  const { features } = getConfig()
  const setReservationModal = useMenuStore((s) => s.setReservationModal)

  if (!features.reservations) return null

  const isArcade = theme === 'arcade'
  const isOnyx = theme === 'onyx'
  const isProvenance = theme === 'provenance'
  const radiusClass = (isArcade || isOnyx || isProvenance) ? 'rounded-none' : 'rounded-full'

  return (
    <button
      onClick={() => setReservationModal(true)}
      className={`inline-flex items-center gap-2 px-5 py-2.5 text-sm font-semibold shadow-md transition-transform hover:scale-105 active:scale-95 ${radiusClass} ${isArcade ? 'arcade-font text-[10px] uppercase border-2 border-[var(--bg)]' : ''}`}
      style={{
        background: 'var(--brand)',
        color: 'var(--bg)',
        fontFamily: isArcade ? undefined : 'var(--font-body)'
      }}
    >
      <CalendarCheck className={isArcade ? "h-3 w-3" : "h-4 w-4"} />
      Book a Table
    </button>
  )
}
