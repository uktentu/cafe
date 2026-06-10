'use client'

import { useState } from 'react'
import { m, AnimatePresence } from 'framer-motion'
import { X, Minus, Plus, ShoppingBag, Star } from 'lucide-react'
import { useMenuStore } from '@/stores/menu'
import { formatPrice } from '@/lib/utils'
import { track } from '@/lib/firebase'

interface CartDrawerProps {
  whatsapp: string
  businessName: string
  businessId: string
  googleMapsUrl?: string | null
  tableLabel?: string | null
}

export function CartDrawer({ whatsapp, businessName, businessId, googleMapsUrl, tableLabel }: CartDrawerProps) {
  const { cart, cartOpen, setCartOpen, updateQty, clearCart, cartTotal, cartCount } = useMenuStore()
  const [showReview, setShowReview] = useState(false)

  const total = cartTotal()
  const count = cartCount()

  function buildWhatsAppMessage() {
    const header = tableLabel
      ? `Hi ${businessName}, I'm at ${tableLabel} and would like to order:`
      : `Hi ${businessName}, I'd like to place an order:`

    const lines = cart.map((c) => {
      const addOnText = c.selectedAddOns.length > 0
        ? ` + ${c.selectedAddOns.map((a) => `${a.name} (+₹${a.price})`).join(', ')}`
        : ''
      const noteText = c.note ? ` [${c.note}]` : ''
      const lineTotal = (c.item.price + c.selectedAddOns.reduce((s, a) => s + a.price, 0)) * c.qty
      return `• ${c.item.name}${addOnText}${noteText} x${c.qty} — ₹${lineTotal}`
    })

    return `${header}\n\n${lines.join('\n')}\n\nTotal: ₹${total}`
  }

  function handleOrder() {
    if (!whatsapp || cart.length === 0) return
    const msg = buildWhatsAppMessage()
    const href = `https://wa.me/${whatsapp}?text=${encodeURIComponent(msg)}`
    window.open(href, '_blank', 'noopener,noreferrer')
    track('cart_order', { business_id: businessId, item_count: count, total })
    clearCart()
    setCartOpen(false)
    if (googleMapsUrl) {
      setTimeout(() => setShowReview(true), 600)
    }
  }

  return (
    <>
      {/* Cart Drawer */}
      <AnimatePresence>
        {cartOpen && (
          <>
            <m.div
              className="fixed inset-0 z-[80] bg-black/50"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setCartOpen(false)}
            />
            <m.div
              className="fixed bottom-0 left-0 right-0 z-[90] max-h-[85svh] rounded-t-3xl flex flex-col"
              style={{ background: 'var(--bg)', color: 'var(--txt)' }}
              initial={{ y: '100%' }}
              animate={{ y: 0 }}
              exit={{ y: '100%' }}
              transition={{ type: 'spring', stiffness: 380, damping: 38 }}
            >
              {/* Handle + header */}
              <div className="flex items-center justify-between px-5 pt-4 pb-3" style={{ borderBottom: '1px solid var(--bdr)' }}>
                <div className="mx-auto mb-2 absolute top-2 left-1/2 -translate-x-1/2 h-1 w-10 rounded-full opacity-30" style={{ background: 'var(--txt)' }} />
                <div className="flex items-center gap-2 mt-1">
                  <ShoppingBag className="h-5 w-5" style={{ color: 'var(--brand)' }} />
                  <h2 className="text-base font-bold" style={{ fontFamily: 'var(--font-display)' }}>
                    Your Order
                  </h2>
                  {count > 0 && (
                    <span className="rounded-full px-2 py-0.5 text-xs font-bold text-white" style={{ background: 'var(--brand)' }}>
                      {count}
                    </span>
                  )}
                </div>
                <button onClick={() => setCartOpen(false)} className="rounded-full p-1.5 hover:bg-black/5">
                  <X className="h-4 w-4" />
                </button>
              </div>

              {/* Items */}
              <div className="flex-1 overflow-y-auto px-5 py-3 space-y-3">
                {cart.length === 0 ? (
                  <div className="py-12 text-center">
                    <ShoppingBag className="mx-auto h-10 w-10 mb-3 opacity-20" />
                    <p className="text-sm opacity-50">Your cart is empty</p>
                    <p className="text-xs opacity-35 mt-1">Tap + on any item to add it</p>
                  </div>
                ) : (
                  cart.map((c) => {
                    const addOnTotal = c.selectedAddOns.reduce((s, a) => s + a.price, 0)
                    const lineTotal = (c.item.price + addOnTotal) * c.qty
                    return (
                      <div key={c.item.id} className="flex items-start gap-3 py-2" style={{ borderBottom: '1px solid var(--bdr2)' }}>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium truncate" style={{ fontFamily: 'var(--font-body)' }}>{c.item.name}</p>
                          {c.selectedAddOns.length > 0 && (
                            <p className="text-xs opacity-50 mt-0.5">
                              + {c.selectedAddOns.map(a => a.name).join(', ')}
                            </p>
                          )}
                          {c.note && <p className="text-xs italic opacity-40 mt-0.5">{c.note}</p>}
                          <p className="text-sm font-semibold mt-1" style={{ color: 'var(--brand)' }}>
                            {formatPrice(lineTotal)}
                          </p>
                        </div>
                        <div className="flex items-center gap-2 shrink-0">
                          <button
                            onClick={() => updateQty(c.item.id, c.qty - 1)}
                            className="flex h-7 w-7 items-center justify-center rounded-full border transition-colors hover:bg-black/5"
                            style={{ borderColor: 'var(--bdr)' }}
                          >
                            <Minus className="h-3 w-3" />
                          </button>
                          <span className="w-5 text-center text-sm font-bold">{c.qty}</span>
                          <button
                            onClick={() => updateQty(c.item.id, c.qty + 1)}
                            className="flex h-7 w-7 items-center justify-center rounded-full border transition-colors hover:bg-black/5"
                            style={{ background: 'var(--brand)', border: 'none', color: '#fff' }}
                          >
                            <Plus className="h-3 w-3" />
                          </button>
                        </div>
                      </div>
                    )
                  })
                )}
              </div>

              {/* Footer */}
              {cart.length > 0 && (
                <div className="px-5 pb-safe-bottom py-4 space-y-3" style={{ borderTop: '1px solid var(--bdr)', paddingBottom: 'calc(1rem + env(safe-area-inset-bottom))' }}>
                  <div className="flex items-center justify-between text-sm">
                    <span className="opacity-60">Total ({count} item{count !== 1 ? 's' : ''})</span>
                    <span className="text-lg font-bold" style={{ fontFamily: 'var(--font-display)', color: 'var(--brand)' }}>
                      {formatPrice(total)}
                    </span>
                  </div>
                  {whatsapp && (
                    <button
                      onClick={handleOrder}
                      className="flex w-full items-center justify-center gap-2 rounded-2xl py-3.5 text-sm font-bold text-white transition-transform active:scale-95"
                      style={{ background: '#25D366', fontFamily: 'var(--font-body)' }}
                    >
                      <svg className="h-5 w-5" viewBox="0 0 24 24" fill="currentColor">
                        <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
                      </svg>
                      Order on WhatsApp
                    </button>
                  )}
                </div>
              )}
            </m.div>
          </>
        )}
      </AnimatePresence>

      {/* Google Reviews prompt — shows after ordering */}
      <AnimatePresence>
        {showReview && googleMapsUrl && (
          <m.div
            className="fixed inset-x-4 bottom-24 z-[100] rounded-2xl p-4 shadow-2xl"
            style={{ background: 'var(--sf1)', color: 'var(--txt)', border: '1px solid var(--bdr)' }}
            initial={{ opacity: 0, y: 40, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.95 }}
          >
            <button
              onClick={() => setShowReview(false)}
              className="absolute right-3 top-3 rounded-full p-1 opacity-40 hover:opacity-70"
            >
              <X className="h-3.5 w-3.5" />
            </button>
            <div className="flex items-start gap-3 pr-4">
              <div className="flex shrink-0 items-center justify-center rounded-full bg-yellow-400/20 p-2">
                <Star className="h-5 w-5 fill-yellow-400 text-yellow-400" />
              </div>
              <div>
                <p className="text-sm font-semibold">Enjoyed your visit?</p>
                <p className="mt-0.5 text-xs opacity-60">Help others find {businessName} — leave a quick Google review!</p>
                <a
                  href={googleMapsUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={() => setShowReview(false)}
                  className="mt-2.5 inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-semibold text-white"
                  style={{ background: '#4285F4' }}
                >
                  <Star className="h-3 w-3 fill-white" />
                  Leave a review
                </a>
              </div>
            </div>
          </m.div>
        )}
      </AnimatePresence>
    </>
  )
}
