'use client'

import { m } from 'framer-motion'
import { MessageCircle } from 'lucide-react'
import { track } from '@/lib/firebase'

interface WhatsAppCTAProps {
  whatsapp: string
  businessId: string
  businessName: string
}

/**
 * Fixed WhatsApp button with a permanent CSS pulse ring (.wa-pulse in
 * globals.css). Always visible, respects the safe-area inset on notched phones.
 */
export function WhatsAppCTA({ whatsapp, businessId, businessName }: WhatsAppCTAProps) {
  if (!whatsapp) return null
  const text = encodeURIComponent(`Hi ${businessName}, I'm viewing your menu.`)
  const href = `https://wa.me/${whatsapp}?text=${text}`

  return (
    <div
      className="fixed z-[70] right-4 md:right-6 lg:right-8"
      style={{
        bottom: 'calc(1rem + env(safe-area-inset-bottom))',
      }}
    >
      <m.a
        href={href}
        target="_blank"
        rel="noopener noreferrer"
        aria-label={`Order from ${businessName} on WhatsApp`}
        onClick={() => track('whatsapp_click', { business_id: businessId })}
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.9 }}
        className="relative flex h-14 w-14 items-center justify-center rounded-full text-white shadow-lg"
        style={{ background: '#25D366' }}
      >
        <span className="wa-pulse" aria-hidden />
        <MessageCircle className="relative h-7 w-7" strokeWidth={2.2} />
      </m.a>
    </div>
  )
}
