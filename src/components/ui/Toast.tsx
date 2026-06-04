'use client'

import { AnimatePresence, m } from 'framer-motion'
import { Check, X, Info } from 'lucide-react'
import { useCmsStore } from '@/stores/cms'

const ICON = { success: Check, error: X, info: Info } as const
const BG = { success: '#22C55E', error: '#EF4444', info: '#3B82F6' } as const

/** Toast viewport — bottom-center on mobile. Reads the Zustand toast queue. */
export function ToastViewport() {
  const toasts = useCmsStore((s) => s.toasts)
  const dismiss = useCmsStore((s) => s.dismissToast)

  return (
    <div className="pointer-events-none fixed inset-x-0 bottom-4 z-[90] flex flex-col items-center gap-2 px-4">
      <AnimatePresence>
        {toasts.map((t) => {
          const Icon = ICON[t.variant]
          return (
            <m.div
              key={t.id}
              layout
              initial={{ opacity: 0, y: 20, scale: 0.96 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 10, scale: 0.96 }}
              transition={{ type: 'spring', stiffness: 400, damping: 32 }}
              onClick={() => dismiss(t.id)}
              className="pointer-events-auto flex max-w-sm items-center gap-2 rounded-xl bg-neutral-900 px-4 py-3 text-sm text-white shadow-lg"
            >
              <span className="flex h-5 w-5 items-center justify-center rounded-full" style={{ background: BG[t.variant] }}>
                <Icon className="h-3 w-3" strokeWidth={3} />
              </span>
              {t.message}
            </m.div>
          )
        })}
      </AnimatePresence>
    </div>
  )
}
