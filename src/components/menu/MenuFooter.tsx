'use client'

import { Phone, MapPin, Share2, Star, Clock } from 'lucide-react'
import type { Business, Theme } from '@/types/database'
import { track } from '@/lib/firebase'
import { getConfig } from '@/lib/config'
import { useLanguage } from './LanguageProvider'

const DAYS = [
  { key: 'mon', label: 'Monday' },
  { key: 'tue', label: 'Tuesday' },
  { key: 'wed', label: 'Wednesday' },
  { key: 'thu', label: 'Thursday' },
  { key: 'fri', label: 'Friday' },
  { key: 'sat', label: 'Saturday' },
  { key: 'sun', label: 'Sunday' }
] as const

function SocialIcon({
  href,
  label,
  icon,
  iconComponent,
  onClick,
}: {
  href: string
  label: string
  icon?: string
  iconComponent?: React.ReactNode
  onClick?: () => void
}) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      aria-label={label}
      onClick={onClick}
      className="flex items-center justify-center h-12 w-12 rounded-full transition-transform hover:scale-110 active:scale-95"
      style={{
        background: 'var(--sf1)',
        color: 'var(--txt)',
        boxShadow: '0 2px 8px rgba(0,0,0,0.05)',
        border: '1px solid var(--bdr2)'
      }}
    >
      {iconComponent}
      {icon && <span className="font-bold text-sm">{icon}</span>}
    </a>
  )
}

export function MenuFooter({ business, theme = 'mercado' }: { business: Business, theme?: Theme }) {
  const { tUi } = useLanguage()
  const { features } = getConfig()

  const { phone, whatsapp, social_links, address, city, opening_hours } = business
  const { instagram, swiggy, zomato, google_maps, google_reviews, google_maps_query } = social_links || {}

  // Helper to extract precise location from maps link if possible
  const getMapQuery = () => {
    if (google_maps_query) return google_maps_query
    if (!google_maps) return `${business.name}, ${city || ''} ${address || ''}`
    try {
      const url = new URL(google_maps)
      if (url.searchParams.has('q')) return url.searchParams.get('q')!
      
      const placeMatch = url.pathname.match(/\/place\/([^\/]+)/)
      if (placeMatch && placeMatch[1]) return decodeURIComponent(placeMatch[1].replace(/\+/g, ' '))
        
      const coordMatch = url.pathname.match(/@(-?\d+\.\d+),(-?\d+\.\d+)/)
      if (coordMatch) return `${coordMatch[1]},${coordMatch[2]}`
    } catch {}
    
    return `${business.name}, ${city || ''} ${address || ''}`
  }

  const showSocials = features.socialLinks && (instagram || swiggy || zomato || google_maps || google_reviews)
  const showContactBar = phone || whatsapp || showSocials
  const hasContactInfo = address || city || (opening_hours && Object.keys(opening_hours).length > 0)
  
  if (!showContactBar && !hasContactInfo) return null

  const isArcade = theme === 'arcade'

  return (
    <footer id="footer" className={`mt-auto px-6 pt-12 pb-28 md:pt-16 md:pb-24 text-center ${isArcade ? 'arcade-font' : ''}`} style={{ background: 'var(--bg)', borderTop: '1px solid var(--bdr)' }}>
      <div className={`max-w-md mx-auto flex flex-col items-center gap-6 ${isArcade ? 'uppercase tracking-widest' : ''}`}>
        
        {/* Contact Links */}
        {showContactBar && (
          <div className="flex flex-wrap justify-center gap-4">
            {phone && (
              <SocialIcon href={`tel:${phone}`} label="Call Us" iconComponent={<Phone className="h-5 w-5" />} onClick={() => track('call_click', { business_id: business.id })} />
            )}
            {whatsapp && (
              <SocialIcon href={`https://wa.me/${whatsapp.replace(/[^0-9]/g, '')}`} label="WhatsApp" icon="WA" onClick={() => track('whatsapp_click', { business_id: business.id })} />
            )}
            {showSocials && google_maps && (
              <SocialIcon href={google_maps} label="Google Maps" iconComponent={<MapPin className="h-5 w-5" />} onClick={() => track('maps_click', { business_id: business.id })} />
            )}
            {showSocials && google_reviews && (
              <SocialIcon href={google_reviews} label="Google Reviews" iconComponent={<Star className="h-5 w-5 text-yellow-500" />} onClick={() => track('reviews_click', { business_id: business.id })} />
            )}
            {showSocials && instagram && <SocialIcon href={instagram} label="Instagram" icon="IG" />}
            {showSocials && zomato && <SocialIcon href={zomato} label="Zomato" icon="Z" />}
            {showSocials && swiggy && <SocialIcon href={swiggy} label="Swiggy" icon="S" />}
          </div>
        )}

        {/* Shop Info (Address & Hours) */}
        <div className="flex flex-col gap-6 w-full mt-6 pt-6" style={{ borderTop: '1px solid var(--bdr2)' }}>
          {/* Address & Embedded Map */}
          {(address || city || google_maps) && (
            <div className="flex flex-col items-center w-full gap-4">
              {(address || city) && (
                <div className={`flex ${isArcade ? 'flex-col items-center gap-3 text-center' : 'items-start gap-2 text-left'}`}>
                  <MapPin className={`shrink-0 ${isArcade ? 'h-5 w-5 mb-1' : 'h-4 w-4 mt-0.5'}`} style={{ color: 'var(--txt2)' }} />
                  <p className={`leading-relaxed max-w-sm ${isArcade ? 'text-[10px] leading-loose' : 'text-sm'}`} style={{ color: 'var(--txt)' }}>
                    {address}
                    {address && city && ', '}
                    {city}
                  </p>
                </div>
              )}
              {google_maps && (
                <a 
                  href={google_maps} 
                  target="_blank" 
                  rel="noopener noreferrer" 
                  className="w-full max-w-sm rounded-xl overflow-hidden block border transition-opacity hover:opacity-90 active:opacity-75"
                  style={{ borderColor: 'var(--bdr2)' }}
                  onClick={() => track('maps_embed_click', { business_id: business.id })}
                >
                  <div className="p-2.5 text-left font-semibold text-xs border-b flex items-center justify-between" style={{ backgroundColor: 'var(--sf1)', color: 'var(--txt)', borderColor: 'var(--bdr2)' }}>
                    <span className="flex items-center gap-1.5"><MapPin className="h-3.5 w-3.5" /> {tUi('Get Directions', 'Get Directions')}</span>
                    <span className="text-[10px] uppercase tracking-wider opacity-60">{tUi('Tap Map', 'Tap Map')}</span>
                  </div>
                  <iframe 
                    src={`https://maps.google.com/maps?q=${encodeURIComponent(getMapQuery())}&t=&z=15&ie=UTF8&iwloc=&output=embed`} 
                    width="100%" 
                    height="180" 
                    style={{ border: 0, pointerEvents: 'none' }} 
                    allowFullScreen={false} 
                    loading="lazy" 
                    referrerPolicy="no-referrer-when-downgrade"
                  />
                </a>
              )}
            </div>
          )}

          {/* Opening Hours */}
          {opening_hours && Object.keys(opening_hours).length > 0 && (
            <div className="flex flex-col items-center gap-3 w-full">
              <div className="flex items-center gap-1.5" style={{ color: 'var(--txt2)' }}>
                <Clock className="h-4 w-4" />
                <h4 className={`text-sm font-semibold uppercase ${isArcade ? 'tracking-[0.3em] text-[10px]' : 'tracking-widest'}`}>{tUi('Opening Hours', 'Opening Hours')}</h4>
              </div>
              <div className="flex flex-col gap-1 w-full max-w-[260px]">
                {DAYS.map(({ key, label }) => {
                  const hours = opening_hours[key]
                  if (!hours) return null
                  return (
                    <div key={key} className={`flex justify-between items-center py-1.5 ${isArcade ? 'text-[8px] tracking-widest' : 'text-sm'} border-b last:border-0`} style={{ borderColor: 'var(--bdr2)' }}>
                      <span className="capitalize" style={{ color: 'var(--txt2)' }}>{tUi(key, isArcade ? label.slice(0,3).toUpperCase() : label.slice(0,3))}</span>
                      <span className={isArcade ? '' : 'font-medium'} style={{ color: 'var(--txt)', fontFamily: isArcade ? undefined : 'var(--font-body)' }}>
                        {hours.closed ? <span className="opacity-50 text-xs uppercase tracking-widest">{tUi('Closed', 'Closed')}</span> : `${hours.open} - ${hours.close}`}
                      </span>
                    </div>
                  )
                })}
              </div>
            </div>
          )}
        </div>

        {/* Share menu button */}
        <button
          onClick={() => {
            const url = window.location.href.split('?')[0]
            const shareData = { title: `${business.name} — Menu`, text: `Check out the menu at ${business.name}`, url }
            if (typeof navigator !== 'undefined' && navigator.share) {
              navigator.share(shareData).catch(() => {})
            } else {
              navigator.clipboard?.writeText(url).then(() => {
                // brief visual feedback handled by CSS
              })
            }
          }}
          className="flex items-center gap-2 text-xs px-4 py-2 rounded-full border transition-transform hover:scale-105 active:scale-95"
          style={{ borderColor: 'var(--bdr2)', color: 'var(--txt2)', background: 'var(--sf1)', fontFamily: 'var(--font-body)' }}
        >
          <Share2 className="h-3.5 w-3.5" />
          Share this menu
        </button>

        <p className="text-xs uppercase tracking-widest mt-2 opacity-40" style={{ color: 'var(--txt2)', fontFamily: 'var(--font-body)' }}>
          {business.name}
        </p>

      </div>
    </footer>
  )
}
