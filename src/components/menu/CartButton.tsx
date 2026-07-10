'use client'

import { m, AnimatePresence } from 'framer-motion'
import { ShoppingBag, ChefHat } from 'lucide-react'
import { useMenuStore } from '@/stores/menu'

export function CartButton({ inAppOrdering }: { inAppOrdering?: boolean }) {
  const count = useMenuStore((s) => s.cartCount())
  const activeOrder = useMenuStore((s) => s.activeOrder)
  const setCartOpen = useMenuStore((s) => s.setCartOpen)

  // Hide entirely when there's nothing to show (no items, no live order).
  if (count === 0 && !activeOrder) return null

  const trackingOrder = Boolean(activeOrder)
  // POS mode uses the brand colour; the WhatsApp flow keeps its signature green.
  const bg = trackingOrder || inAppOrdering ? 'var(--brand)' : '#25D366'

  return (
    <div
      className="fixed z-[70] right-4 md:right-6 lg:right-8"
      style={{ bottom: 'calc(1rem + env(safe-area-inset-bottom))' }}
    >
      <m.button
        onClick={() => setCartOpen(true)}
        aria-label={trackingOrder ? 'Track your order' : 'View cart'}
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.9 }}
        className="relative flex h-14 w-14 items-center justify-center rounded-full text-white shadow-lg"
        style={{ background: bg }}
      >
        {!trackingOrder && <span className="wa-pulse" aria-hidden />}
        {trackingOrder
          ? <ChefHat className="relative h-6 w-6" strokeWidth={2.2} />
          : <ShoppingBag className="relative h-6 w-6" strokeWidth={2.2} />}
        <AnimatePresence>
          {!trackingOrder && count > 0 && (
            <m.span
              key={count}
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0 }}
              className="absolute -right-1 -top-1 flex h-5 w-5 items-center justify-center rounded-full text-[10px] font-bold text-white"
              style={{ background: '#E84B1A' }}
            >
              {count > 9 ? '9+' : count}
            </m.span>
          )}
        </AnimatePresence>
      </m.button>
    </div>
  )
}
