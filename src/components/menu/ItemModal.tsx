'use client'

import { useEffect, useState } from 'react'
import Image from 'next/image'
import { ShoppingBag, CheckCircle2 } from 'lucide-react'
import { SpringModal } from '@/components/motion/SpringModal'
import { VegMark, ItemBadge, DietaryFlags, AllergenTags } from './badges'
import { SpiceMeter } from './SpiceMeter'
import { useMenuStore } from '@/stores/menu'
import { track } from '@/lib/firebase'
import { cdnUrl, itemImageKey, type Item, type Theme, type AddOn } from '@/types/database'
import { formatPrice } from '@/lib/utils'
import { useLanguage } from './LanguageProvider'
import { m, AnimatePresence } from 'framer-motion'

interface ItemModalProps {
  theme?: Theme
}

export function ItemModal({ theme = 'mercado' }: ItemModalProps) {
  const { tUi } = useLanguage()
  const selected = useMenuStore((s) => s.selectedItem)
  const close = useMenuStore((s) => s.closeItem)
  const addToCart = useMenuStore((s) => s.addToCart)
  const setCartOpen = useMenuStore((s) => s.setCartOpen)
  const [imgError, setImgError] = useState(false)
  const [selectedAddOns, setSelectedAddOns] = useState<AddOn[]>([])
  const [note, setNote] = useState('')
  const [added, setAdded] = useState(false)

  const [cached, setCached] = useState<Item | null>(null)
  useEffect(() => {
    if (selected) {
      setCached(selected)
      setImgError(false)
      setSelectedAddOns([])
      setNote('')
      setAdded(false)
    }
  }, [selected])

  const item = selected ?? cached
  const open = Boolean(selected)
  const src = item ? cdnUrl(itemImageKey(item, true)) : null
  const hasImage = Boolean(item && item.image_mode !== 'none' && src && !imgError)
  const variant = theme === 'onyx' ? 'center' : 'sheet'

  const addOnTotal = selectedAddOns.reduce((s, a) => s + a.price, 0)
  const linePrice = item ? item.price + addOnTotal : 0

  function toggleAddOn(ao: AddOn) {
    setSelectedAddOns((prev) =>
      prev.find((a) => a.id === ao.id)
        ? prev.filter((a) => a.id !== ao.id)
        : [...prev, ao]
    )
  }

  function handleAddToCart() {
    if (!item || !item.is_available) return
    addToCart(item, selectedAddOns, note)
    track('add_to_cart', { business_id: item.business_id, item_id: item.id })
    setAdded(true)
    setTimeout(() => {
      close()
      setAdded(false)
    }, 700)
  }

  return (
    <SpringModal open={open} onClose={close} variant={variant} labelledBy="item-modal-title">
      {item && (
        <div className="px-5 pb-6 pt-2" style={{ color: 'var(--txt)' }}>
          {hasImage && (
            <div className="relative -mx-5 mb-4 aspect-[16/10] overflow-hidden" style={{ background: 'var(--sf2)' }}>
              <Image
                src={src!}
                alt={item.name}
                fill
                sizes="(min-width:768px) 480px, 100vw"
                className="object-cover"
                onError={() => setImgError(true)}
              />
            </div>
          )}

          <div className="flex items-start justify-between gap-3">
            <div className="flex items-center gap-2">
              <VegMark dietary={item.dietary} />
              <h2
                id="item-modal-title"
                style={{
                  fontFamily: 'var(--font-display)',
                  fontSize: 'clamp(1.4rem, 6vw, 2rem)',
                  lineHeight: 1.05,
                  textTransform: theme === 'mercado' ? 'uppercase' : 'none',
                }}
              >
                {item.name}
              </h2>
            </div>
            {item.badge && <ItemBadge badge={item.badge} className="mt-1 shrink-0" />}
          </div>

          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-xl font-semibold" style={{ color: 'var(--brand2, var(--brand))' }}>
              {formatPrice(linePrice)}
            </span>
            {item.compare_price != null && item.compare_price > item.price && (
              <span className="text-sm line-through" style={{ color: 'var(--txt3)' }}>
                {formatPrice(item.compare_price)}
              </span>
            )}
            {!item.is_available && (
              <span className="ml-auto rounded-full px-2 py-0.5 text-xs font-bold uppercase" style={{ background: '#C0392B', color: '#fff' }}>
                {tUi('Sold Out', 'Sold Out')}
              </span>
            )}
          </div>

          {item.description && (
            <p className="mt-3 text-sm leading-relaxed" style={{ color: 'var(--txt2)', fontFamily: 'var(--font-body)' }}>
              {item.description}
            </p>
          )}

          <div className="mt-3 space-y-2">
            <DietaryFlags item={item} />
            <AllergenTags allergens={item.allergens} />
            {(item.spice_level ?? 0) > 0 && (
              <SpiceMeter level={item.spice_level} size={16} showLabel />
            )}
          </div>

          {/* Add-ons */}
          {item.add_ons && item.add_ons.length > 0 && (
            <div className="mt-4 space-y-2">
              <p className="text-xs font-semibold uppercase tracking-wider opacity-50">Add-ons</p>
              <div className="space-y-1.5">
                {item.add_ons.map((ao) => {
                  const checked = !!selectedAddOns.find((a) => a.id === ao.id)
                  return (
                    <button
                      key={ao.id}
                      type="button"
                      onClick={() => toggleAddOn(ao)}
                      className="flex w-full items-center justify-between rounded-xl border px-3 py-2.5 text-left text-sm transition-colors"
                      style={{
                        borderColor: checked ? 'var(--brand)' : 'var(--bdr)',
                        background: checked ? 'rgba(var(--brand-rgb, 232,75,26), 0.06)' : 'var(--sf1)',
                      }}
                    >
                      <span style={{ color: 'var(--txt)' }}>{ao.name}</span>
                      <div className="flex items-center gap-2">
                        {ao.price > 0 && (
                          <span className="text-xs font-semibold" style={{ color: 'var(--brand)' }}>+{formatPrice(ao.price)}</span>
                        )}
                        <div
                          className="flex h-4 w-4 items-center justify-center rounded"
                          style={{ background: checked ? 'var(--brand)' : 'transparent', border: `1.5px solid ${checked ? 'var(--brand)' : 'var(--bdr)'}` }}
                        >
                          {checked && <svg className="h-2.5 w-2.5 text-white" viewBox="0 0 12 12" fill="none"><path d="M2 6l3 3 5-5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>}
                        </div>
                      </div>
                    </button>
                  )
                })}
              </div>
            </div>
          )}

          {/* Note */}
          {item.is_available && (
            <textarea
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="Any special requests? (optional)"
              rows={2}
              className="mt-3 w-full resize-none rounded-xl border px-3 py-2 text-xs placeholder-opacity-40 focus:outline-none"
              style={{ borderColor: 'var(--bdr)', background: 'var(--sf1)', color: 'var(--txt)', fontFamily: 'var(--font-body)' }}
            />
          )}

          {/* Add to Cart button */}
          {item.is_available ? (
            <m.button
              onClick={handleAddToCart}
              className="mt-4 flex h-12 w-full items-center justify-center gap-2 rounded-xl font-semibold text-white"
              style={{ background: added ? '#22C55E' : 'var(--brand)' }}
              whileTap={{ scale: 0.97 }}
              animate={{ background: added ? '#22C55E' : undefined }}
              transition={{ duration: 0.2 }}
            >
              <AnimatePresence mode="wait">
                {added ? (
                  <m.span key="added" className="flex items-center gap-2" initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
                    <CheckCircle2 className="h-5 w-5" />
                    Added!
                  </m.span>
                ) : (
                  <m.span key="add" className="flex items-center gap-2" initial={{ opacity: 0, y: -6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
                    <ShoppingBag className="h-5 w-5" />
                    Add to Order — {formatPrice(linePrice)}
                  </m.span>
                )}
              </AnimatePresence>
            </m.button>
          ) : null}

          {/* View cart nudge when cart has items */}
          {item.is_available && (
            <button
              onClick={() => { close(); setCartOpen(true) }}
              className="mt-2 w-full text-center text-xs py-1 opacity-50 hover:opacity-80 transition-opacity"
              style={{ fontFamily: 'var(--font-body)', color: 'var(--txt2)' }}
            >
              View cart →
            </button>
          )}
        </div>
      )}
    </SpringModal>
  )
}
