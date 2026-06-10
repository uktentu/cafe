'use client'

import { m, AnimatePresence } from 'framer-motion'
import { ShoppingBag } from 'lucide-react'
import { useMenuStore } from '@/stores/menu'

export function CartButton() {
  const count = useMenuStore((s) => s.cartCount())
  const setCartOpen = useMenuStore((s) => s.setCartOpen)

  return (
    <div
      className="fixed z-[70] right-4 md:right-6 lg:right-8"
      style={{ bottom: 'calc(1rem + env(safe-area-inset-bottom))' }}
    >
      <m.button
        onClick={() => setCartOpen(true)}
        aria-label="View cart"
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.9 }}
        className="relative flex h-14 w-14 items-center justify-center rounded-full text-white shadow-lg"
        style={{ background: '#25D366' }}
      >
        <span className="wa-pulse" aria-hidden />
        <ShoppingBag className="relative h-6 w-6" strokeWidth={2.2} />
        <AnimatePresence>
          {count > 0 && (
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
