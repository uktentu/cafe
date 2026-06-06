'use client'

import React from 'react'
import type { Banner, Theme } from '@/types/database'
import Image from 'next/image'
import { cdnUrl } from '@/types/database'

export function BannerStrip({ banners, theme = 'mercado' }: { banners: Banner[], theme?: Theme }) {
  if (!banners || banners.length === 0) return null

  // Just picking the first active banner for simplicity in this implementation,
  // or mapping through them in a scrollable strip.
  const isArcade = theme === 'arcade'
  const isOnyx = theme === 'onyx'
  const isSakura = theme === 'sakura'
  const isProvenance = theme === 'provenance'

  const radiusClass = (isArcade || isOnyx || isProvenance) ? 'rounded-none' : isSakura ? 'rounded-[32px]' : 'rounded-2xl'

  return (
    <div className={`w-full overflow-x-auto hide-scrollbar snap-x snap-mandatory flex gap-4 px-4 py-4 pt-6 ${banners.length === 1 ? 'md:justify-center' : ''}`}>
      {banners.map((b) => {
        const imgUrl = cdnUrl(b.image_r2_key)
        return (
          <div 
            key={b.id} 
            className={`flex-shrink-0 w-full ${banners.length === 1 ? 'md:max-w-4xl' : 'md:w-[80%] max-w-3xl'} snap-center overflow-hidden shadow-sm relative group ${radiusClass}`}
            style={{ 
              aspectRatio: '21/9', 
              background: 'var(--surface)',
              border: '1px solid var(--bdr)'
            }}
          >
            {imgUrl ? (
              <>
                <Image src={imgUrl} alt="" fill className="object-cover blur-md opacity-30" sizes="(max-width: 768px) 100vw, 80vw" />
                <Image 
                  src={imgUrl} 
                  alt={b.title || ''} 
                  fill 
                  className="object-contain"
                  sizes="(max-width: 768px) 100vw, 80vw"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/10 to-transparent p-4 md:p-6 flex flex-col justify-end">
                  <h3 
                    className={`text-white font-bold text-lg md:text-2xl ${isArcade ? 'arcade-font text-xs md:text-sm' : ''}`}
                    style={{ fontFamily: isArcade ? undefined : 'var(--font-display)', letterSpacing: isArcade ? undefined : '0.02em', textShadow: '0 2px 4px rgba(0,0,0,0.8)' }}
                  >
                    {b.title}
                  </h3>
                  {b.subtitle && (
                    <p className={`text-white/90 mt-1 text-sm md:text-base ${isArcade ? 'arcade-font text-[8px] md:text-[10px]' : ''}`} style={{ textShadow: '0 1px 3px rgba(0,0,0,0.8)' }}>
                      {b.subtitle}
                    </p>
                  )}
                  {b.cta_url && (
                    <a 
                      href={b.cta_url} 
                      target="_blank" 
                      rel="noreferrer"
                      className={`mt-2 w-max text-white/90 hover:text-white transition-colors ${
                        isArcade 
                          ? 'arcade-font text-[8px] uppercase px-3 py-1.5 border-2 border-white/50 hover:border-white bg-black/50 mt-4'
                          : 'text-sm font-medium underline decoration-white/50 hover:decoration-white'
                      }`}
                      style={{ fontFamily: isArcade ? undefined : 'var(--font-body)' }}
                    >
                      {b.cta_text || 'Learn more'}
                    </a>
                  )}
                </div>
              </>
            ) : (
              <div className="relative z-10 w-full h-full flex flex-col items-center justify-center p-6 text-center">
                <h3 
                  className={`font-bold text-xl md:text-3xl ${isArcade ? 'arcade-font text-sm md:text-base' : ''}`}
                  style={{ color: 'var(--txt)', fontFamily: isArcade ? undefined : 'var(--font-display)', letterSpacing: isArcade ? undefined : '0.02em' }}
                >
                  {b.title}
                </h3>
                {b.subtitle && (
                  <p className={`mt-2 text-base md:text-lg ${isArcade ? 'arcade-font text-[10px] md:text-xs' : ''}`} style={{ color: 'var(--txt2)', fontFamily: isArcade ? undefined : 'var(--font-body)' }}>
                    {b.subtitle}
                  </p>
                )}
                {b.cta_url && (
                  <a 
                    href={b.cta_url} 
                    target="_blank" 
                    rel="noreferrer"
                    className={`mt-4 w-max transition-colors ${
                      isArcade 
                        ? 'arcade-font text-[10px] uppercase px-4 py-2 border-2 border-[var(--txt)] hover:bg-[var(--txt)] hover:text-[var(--bg)] mt-6'
                        : 'text-sm font-medium px-5 py-2.5 rounded-full shadow-md'
                    }`}
                    style={{ 
                      color: isArcade ? undefined : 'var(--bg)', 
                      background: isArcade ? undefined : 'var(--txt)',
                      fontFamily: isArcade ? undefined : 'var(--font-body)' 
                    }}
                  >
                    {b.cta_text || 'Learn more'}
                  </a>
                )}
              </div>
            )}
          </div>
        )
      })}
    </div>
  )
}
