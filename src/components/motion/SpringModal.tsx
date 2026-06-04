'use client'

import { useEffect } from 'react'
import { AnimatePresence, m, type PanInfo } from 'framer-motion'
import {
  sheetModal, sheetTransition, centerModal, centerTransition, backdrop,
} from './presets'

interface SpringModalProps {
  open: boolean
  onClose: () => void
  children: React.ReactNode
  /** 'sheet' = bottom drag-dismiss (default), 'center' = scaled center modal. */
  variant?: 'sheet' | 'center'
  labelledBy?: string
}

/**
 * Accessible modal. Bottom-sheet with drag-to-dismiss on mobile, or a centered
 * spring modal (Onyx, tablet+). Locks body scroll and closes on Escape.
 */
export function SpringModal({ open, onClose, children, variant = 'sheet', labelledBy }: SpringModalProps) {
  useEffect(() => {
    if (!open) return
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose()
    document.addEventListener('keydown', onKey)
    const prev = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      document.removeEventListener('keydown', onKey)
      document.body.style.overflow = prev
    }
  }, [open, onClose])

  const handleDragEnd = (_e: unknown, info: PanInfo) => {
    if (info.offset.y > 120 || info.velocity.y > 600) onClose()
  }

  const isSheet = variant === 'sheet'

  return (
    <AnimatePresence>
      {open && (
        <m.div
          className="fixed inset-0 z-[80] flex"
          style={{ alignItems: isSheet ? 'flex-end' : 'center', justifyContent: 'center' }}
          variants={backdrop}
          initial="initial"
          animate="animate"
          exit="exit"
        >
          <button
            aria-label="Close"
            onClick={onClose}
            className="absolute inset-0 cursor-default"
            style={{ background: 'rgba(0,0,0,0.55)', backdropFilter: 'blur(2px)' }}
          />
          <m.div
            role="dialog"
            aria-modal="true"
            aria-labelledby={labelledBy}
            className="relative w-full"
            style={{
              maxWidth: isSheet ? 540 : 480,
              background: 'var(--sf3, #2E2820)',
              borderTopLeftRadius: 20,
              borderTopRightRadius: 20,
              borderBottomLeftRadius: isSheet ? 0 : 20,
              borderBottomRightRadius: isSheet ? 0 : 20,
              paddingBottom: 'env(safe-area-inset-bottom)',
              maxHeight: '88vh',
              overflowY: 'auto',
              touchAction: 'pan-y',
            }}
            variants={isSheet ? sheetModal : centerModal}
            transition={isSheet ? sheetTransition : centerTransition}
            drag={isSheet ? 'y' : false}
            dragConstraints={{ top: 0, bottom: 0 }}
            dragElastic={{ top: 0, bottom: 0.5 }}
            onDragEnd={isSheet ? handleDragEnd : undefined}
          >
            {isSheet && (
              <div className="flex justify-center pt-3 pb-1">
                <span
                  aria-hidden
                  style={{ width: 40, height: 4, borderRadius: 999, background: 'var(--bdr2, rgba(255,255,255,0.2))' }}
                />
              </div>
            )}
            {children}
          </m.div>
        </m.div>
      )}
    </AnimatePresence>
  )
}
