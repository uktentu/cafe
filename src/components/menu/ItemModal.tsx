'use client'

import { useEffect, useState } from 'react'
import Image from 'next/image'
import { MessageCircle } from 'lucide-react'
import { SpringModal } from '@/components/motion/SpringModal'
import { VegMark, ItemBadge, DietaryFlags } from './badges'
import { useMenuStore } from '@/stores/menu'
import { track } from '@/lib/firebase'
import { cdnUrl, itemImageKey, type Item, type Theme } from '@/types/database'
import { formatPrice } from '@/lib/utils'
import { useLanguage } from './LanguageProvider'

interface ItemModalProps {
  businessName: string
  whatsapp: string
  theme?: Theme
  tableLabel?: string | null
}

export function ItemModal({ businessName, whatsapp, theme = 'mercado', tableLabel }: ItemModalProps) {
  const { tUi } = useLanguage()
  const selected = useMenuStore((s) => s.selectedItem)
  const close = useMenuStore((s) => s.closeItem)
  const [imgError, setImgError] = useState(false)

  // Keep the last item mounted through the close animation so the sheet doesn't
  // empty out as it slides away. Reset image error when a new item opens.
  const [cached, setCached] = useState<Item | null>(null)
  useEffect(() => {
    if (selected) {
      setCached(selected)
      setImgError(false)
    }
  }, [selected])

  const item = selected ?? cached
  const open = Boolean(selected)
  const src = item ? cdnUrl(itemImageKey(item, true)) : null
  const hasImage = Boolean(item && item.image_mode !== 'none' && src && !imgError)
  const variant = theme === 'onyx' ? 'center' : 'sheet'

  const orderHref = item && whatsapp
    ? `https://wa.me/${whatsapp}?text=${encodeURIComponent(
        tableLabel
          ? `Hi ${businessName}, I'm at ${tableLabel} and would like to order: ${item.name} (₹${item.price})`
          : `Hi ${businessName}, I'd like to order: ${item.name} (₹${item.price})`
      )}`
    : null

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
              {formatPrice(item.price)}
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
            {item.allergens.length > 0 && (
              <p className="text-xs" style={{ color: 'var(--txt3)' }}>
                {tUi('Contains:', 'Contains:')} {item.allergens.join(', ')}
              </p>
            )}
          </div>

          {orderHref && (
            <a
              href={orderHref}
              target="_blank"
              rel="noopener noreferrer"
              onClick={() => track('whatsapp_click', { business_id: item.business_id, item_id: item.id })}
              className="mt-5 flex h-12 w-full items-center justify-center gap-2 rounded-xl font-semibold text-white"
              style={{ background: '#25D366' }}
            >
              <MessageCircle className="h-5 w-5" />
              {tUi('Order on WhatsApp', 'Order on WhatsApp')}
            </a>
          )}
        </div>
      )}
    </SpringModal>
  )
}
