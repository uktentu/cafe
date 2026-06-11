// MenuHero — each theme gets its own visual treatment. Server component.
'use client'

import Image from 'next/image'
import { useLanguage } from './LanguageProvider'
import { cdnUrl, type Business, type Theme } from '@/types/database'
import { useState, useEffect, useRef } from 'react'
import { m, AnimatePresence } from 'framer-motion'
import { isOpenNow } from '@/lib/hours'
import { ArcadeGameModal } from './ArcadeGameModal'
import { BookTableButton } from './BookTableButton'
import { Info, Clock } from 'lucide-react'

function initials(name: string): string {
  return name.split(/\s+/).slice(0, 2).map((w) => w[0]?.toUpperCase() ?? '').join('')
}

// ── Shared building blocks ─────────────────────────────────────────

// Themes that use sharp/square badge edges instead of pills
const SQUARE_BADGE_THEMES: Theme[] = ['arcade', 'onyx', 'nocturne', 'studio', 'ember']

function StatusBadge({ business, theme, align = 'center' }: { business: Business; theme?: Theme; align?: 'start' | 'center' }) {
  const status = isOpenNow(business.opening_hours)
  const justifyClass = align === 'start' ? 'justify-start' : 'justify-center'

  const isArcade = theme === 'arcade'
  const isSquare = SQUARE_BADGE_THEMES.includes(theme as Theme)
  const radiusClass = isSquare ? 'rounded-none' : 'rounded-full'
  const waitTime = business.social_links?.wait_time

  const sharedBadgeStyle: React.CSSProperties = {
    background: 'var(--glass)', backdropFilter: 'blur(8px)',
    fontFamily: isArcade ? undefined : 'var(--font-body)',
  }

  // Per-theme typography for the wait time badge
  const waitTypography: React.CSSProperties =
    isArcade
      ? { fontFamily: undefined, fontSize: '8px', letterSpacing: '0.15em', textTransform: 'uppercase' }
      : theme === 'onyx' || theme === 'nocturne'
      ? { fontFamily: 'var(--font-body)', fontSize: '10px', letterSpacing: '0.2em', textTransform: 'uppercase' }
      : theme === 'bazaar' || theme === 'ember'
      ? { fontFamily: 'var(--font-body)', fontSize: '10px', letterSpacing: '0.12em', textTransform: 'uppercase' }
      : theme === 'studio'
      ? { fontFamily: 'var(--font-display)', fontSize: '10px', letterSpacing: '-0.01em' }
      : { fontFamily: 'var(--font-body)', fontSize: '12px' }

  const infoBtn = (
    <button
      onClick={() => document.getElementById('footer')?.scrollIntoView({ behavior: 'smooth' })}
      className={`inline-flex items-center gap-1.5 px-4 py-2.5 text-sm font-semibold border border-white/10 transition-transform hover:scale-105 active:scale-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand ${radiusClass} ${isArcade ? 'arcade-font text-[10px] uppercase border-[var(--txt)]' : ''}`}
      style={{ ...sharedBadgeStyle, color: 'var(--txt)' }}
      aria-label="Shop Information"
    >
      <Info className={isArcade ? "h-3 w-3" : "h-4 w-4"} />
      Info
    </button>
  )

  return (
    <div className={`flex flex-col items-${align === 'start' ? 'start' : 'center'} gap-2 mt-1`}>
      {waitTime && (
        <div
          className={`inline-flex items-center gap-1.5 px-3 py-1.5 font-medium border ${radiusClass}`}
          style={{ borderColor: 'var(--brand)', background: 'var(--brand-dim)', color: 'var(--brand)', ...waitTypography }}
        >
          <Clock className="h-3.5 w-3.5 shrink-0" />
          ~{waitTime} wait tonight
        </div>
      )}
      <div className={`flex items-center gap-3 flex-wrap ${justifyClass}`}>
        {status.label && (
          <div
            className={`inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium border border-white/10 ${radiusClass} ${isArcade ? 'arcade-font text-[8px] uppercase border-[var(--txt2)]' : ''}`}
            style={{ ...sharedBadgeStyle, color: 'var(--txt2)' }}
          >
            <span className={isArcade ? "h-1 w-1 rounded-none" : "h-1.5 w-1.5 rounded-full"} style={{ background: status.open ? '#22C55E' : '#EF4444' }} />
            {status.label}
          </div>
        )}
        <BookTableButton theme={theme} tenantEnabled={business.social_links?.reservations_enabled === true} />
        {infoBtn}
      </div>
    </div>
  )
}

function LogoOrInitials({ business, size = 72 }: { business: Business; size?: number }) {
  const logo = cdnUrl(business.logo_r2_key)
  if (logo) {
    return (
      <Image
        src={logo}
        alt={`${business.name} logo`}
        width={size}
        height={size}
        loading="eager" fetchPriority="high"
        className="rounded-full object-cover"
        style={{ width: size, height: size, boxShadow: '0 0 0 2px var(--brand)' }}
      />
    )
  }
  return (
    <div
      className="flex items-center justify-center rounded-full font-bold"
      style={{
        width: size, height: size,
        background: 'var(--brand)', color: 'var(--bg)',
        fontSize: size * 0.3,
      }}
    >
      {initials(business.name)}
    </div>
  )
}

// ── mercado — bold dark, cover fills, name huge + uppercase ───────
function MercadoHero({ business }: { business: Business }) {
  const cover = cdnUrl(business.cover_r2_key)
  return (
    <header className="relative isolate overflow-hidden" style={{ minHeight: 'min(75vw, 380px)' }}>
      {cover ? (
        <>
          <Image src={cover} alt="" fill loading="eager" fetchPriority="high" sizes="100vw" className="object-cover" />
          <div className="absolute inset-0" style={{ background: 'linear-gradient(180deg, rgba(0,0,0,0.4) 0%, var(--bg) 100%)' }} />
        </>
      ) : (
        <div className="absolute inset-0" style={{ background: 'linear-gradient(135deg, var(--brand) 0%, var(--sf1) 100%)' }} />
      )}
      <div className="relative flex min-h-[inherit] flex-col items-center justify-end gap-3 px-5 pb-8 pt-16 text-center lg:pb-12 lg:pt-20">
        <LogoOrInitials business={business} />
        <h1
          style={{
            fontFamily: 'var(--font-display)',
            fontSize: 'clamp(2.5rem, 12vw, 6rem)',
            lineHeight: 0.9,
            color: 'var(--txt)',
            textTransform: 'uppercase',
            letterSpacing: '0.02em',
          }}
        >
          {business.name}
        </h1>
        {business.tagline && (
          <p className="text-sm" style={{ color: 'var(--txt2)', fontFamily: 'var(--font-body)' }}>
            {business.tagline}
          </p>
        )}
        <StatusBadge business={business} theme="mercado" />
      </div>
    </header>
  )
}

// ── provenance — minimal white, serif italic name ─────────────────
function ProvenanceHero({ business }: { business: Business }) {
  const cover = cdnUrl(business.cover_r2_key)
  return (
    <header className="relative" style={{ background: 'var(--bg)' }}>
      {cover && (
        <div className="relative h-[200px] w-full overflow-hidden md:h-[260px] lg:h-[320px]">
          <Image src={cover} alt="" fill loading="eager" fetchPriority="high" sizes="100vw" className="object-cover opacity-80" />
          <div className="absolute inset-0" style={{ background: 'linear-gradient(180deg, transparent 50%, var(--bg) 100%)' }} />
        </div>
      )}
      <div className="flex flex-col items-center gap-3 px-6 py-8 text-center">
        <LogoOrInitials business={business} size={60} />
        <div className="h-px w-12" style={{ background: 'var(--bdr2)' }} />
        <h1
          style={{
            fontFamily: 'var(--font-display)',
            fontSize: 'clamp(2rem, 8vw, 3.5rem)',
            color: 'var(--txt)',
            fontStyle: 'italic',
            letterSpacing: '-0.01em',
          }}
        >
          {business.name}
        </h1>
        {business.tagline && (
          <p className="max-w-sm text-sm leading-relaxed" style={{ color: 'var(--txt2)', fontFamily: 'var(--font-body)' }}>
            {business.tagline}
          </p>
        )}
        <StatusBadge business={business} theme="provenance" />
        <div className="h-px w-12" style={{ background: 'var(--bdr2)' }} />
      </div>
    </header>
  )
}

// ── terrain — warm earthy, name left-aligned, cover as side panel ─
function TerrainHero({ business }: { business: Business }) {
  const cover = cdnUrl(business.cover_r2_key)
  return (
    <header className="relative isolate overflow-hidden" style={{ background: 'var(--sf1)' }}>
      <div className="grid md:grid-cols-2">
        <div className="flex flex-col justify-end gap-4 px-6 py-10 md:px-10 md:py-14">
          <LogoOrInitials business={business} size={56} />
          <h1
            style={{
              fontFamily: 'var(--font-display)',
              fontSize: 'clamp(2.2rem, 10vw, 4rem)',
              color: 'var(--txt)',
              fontWeight: 700,
              letterSpacing: '-0.02em',
              lineHeight: 1.05,
            }}
          >
            {business.name}
          </h1>
          {business.tagline && (
            <p className="text-sm leading-relaxed" style={{ color: 'var(--txt2)', fontFamily: 'var(--font-body)' }}>
              {business.tagline}
            </p>
          )}
          <StatusBadge business={business} align="start" theme="terrain" />
        </div>
        {cover && (
          <div className="relative h-[220px] overflow-hidden md:h-auto md:min-h-[320px]">
            <Image src={cover} alt="" fill sizes="50vw" className="object-cover" loading="eager" fetchPriority="high" />
          </div>
        )}
      </div>
    </header>
  )
}

// ── bazaar — vibrant dark, pattern border, ornate ─────────────────
function BazaarHero({ business }: { business: Business }) {
  const cover = cdnUrl(business.cover_r2_key)
  return (
    <header className="relative isolate overflow-hidden" style={{ minHeight: 'min(80vw, 400px)' }}>
      {cover ? (
        <>
          <Image src={cover} alt="" fill loading="eager" fetchPriority="high" sizes="100vw" className="object-cover" />
          <div className="absolute inset-0" style={{ background: 'linear-gradient(180deg, rgba(13,8,0,0.5) 0%, rgba(13,8,0,0.1) 40%, var(--bg) 100%)' }} />
        </>
      ) : (
        <div className="absolute inset-0" style={{
          background: 'radial-gradient(ellipse 80% 60% at 50% 0%, var(--brand-dim) 0%, transparent 70%), linear-gradient(180deg, var(--sf1) 0%, var(--bg) 100%)',
        }} />
      )}
      {/* Ornate border lines */}
      <div className="absolute inset-x-4 top-4 h-px" style={{ background: 'linear-gradient(90deg, transparent, var(--brand), transparent)' }} />
      <div className="absolute inset-x-4 bottom-4 h-px" style={{ background: 'linear-gradient(90deg, transparent, var(--brand), transparent)' }} />

      <div className="relative flex min-h-[inherit] flex-col items-center justify-end gap-3 px-5 pb-10 pt-20 text-center">
        <LogoOrInitials business={business} size={80} />
        <h1
          style={{
            fontFamily: 'var(--font-display)',
            fontSize: 'clamp(3rem, 14vw, 7rem)',
            lineHeight: 0.9,
            color: 'var(--txt)',
            textTransform: 'uppercase',
            letterSpacing: '0.04em',
          }}
        >
          {business.name}
        </h1>
        {business.tagline && (
          <p className="text-sm tracking-widest uppercase" style={{ color: 'var(--brand)', fontFamily: 'var(--font-body)' }}>
            {business.tagline}
          </p>
        )}
        <StatusBadge business={business} theme="bazaar" />
      </div>
    </header>
  )
}

// ── nocturne — cinematic dark, gold accent ────────────────────────
function NocturneHero({ business }: { business: Business }) {
  const cover = cdnUrl(business.cover_r2_key)
  return (
    <header className="relative isolate overflow-hidden" style={{ minHeight: 'min(90vw, 460px)', background: 'var(--sf1)' }}>
      {cover ? (
        <>
          <Image src={cover} alt="" fill loading="eager" fetchPriority="high" sizes="100vw" className="object-cover opacity-40" />
          <div className="absolute inset-0" style={{ background: 'linear-gradient(180deg, var(--bg) 0%, transparent 30%, var(--bg) 100%)' }} />
        </>
      ) : (
        <div className="absolute inset-0" style={{
          background: 'radial-gradient(ellipse 70% 70% at 50% 50%, var(--sf2) 0%, var(--bg) 100%)',
        }} />
      )}
      <div className="relative flex min-h-[inherit] flex-col items-center justify-center gap-4 px-6 text-center">
        <div className="h-px w-8" style={{ background: 'var(--brand)' }} />
        <h1
          style={{
            fontFamily: 'var(--font-display)',
            fontSize: 'clamp(2.5rem, 10vw, 5.5rem)',
            color: 'var(--txt)',
            fontStyle: 'italic',
            letterSpacing: '0.06em',
            textTransform: 'uppercase',
          }}
        >
          {business.name}
        </h1>
        {business.tagline && (
          <p className="text-xs tracking-[0.2em] uppercase" style={{ color: 'var(--brand)', fontFamily: 'var(--font-body)' }}>
            {business.tagline}
          </p>
        )}
        <div className="flex items-center gap-3">
          <div className="h-px w-8" style={{ background: 'var(--brand)' }} />
          <StatusBadge business={business} theme="nocturne" />
          <div className="h-px w-8" style={{ background: 'var(--brand)' }} />
        </div>
      </div>
    </header>
  )
}

// ── coastal — full-bleed photo, name bottom-left ─────────────────
function CoastalHero({ business }: { business: Business }) {
  const cover = cdnUrl(business.cover_r2_key)
  return (
    <header className="relative isolate overflow-hidden" style={{ minHeight: 'min(80vw, 420px)' }}>
      {cover ? (
        <>
          <Image src={cover} alt="" fill loading="eager" fetchPriority="high" sizes="100vw" className="object-cover" />
          <div className="absolute inset-0" style={{ background: 'linear-gradient(to top right, rgba(22,32,48,0.9) 0%, rgba(22,32,48,0.3) 60%, transparent 100%)' }} />
        </>
      ) : (
        <div className="absolute inset-0" style={{
          background: 'linear-gradient(135deg, var(--brand) 0%, var(--brand3,#4A9B6F) 100%)',
          opacity: 0.9,
        }} />
      )}
      <div className="absolute bottom-0 left-0 flex flex-col gap-3 px-6 pb-8">
        <LogoOrInitials business={business} size={52} />
        <h1
          style={{
            fontFamily: 'var(--font-display)',
            fontSize: 'clamp(2.2rem, 9vw, 4.5rem)',
            lineHeight: 1,
            color: '#FFFFFF',
            fontStyle: 'italic',
            letterSpacing: '-0.01em',
          }}
        >
          {business.name}
        </h1>
        {business.tagline && (
          <p className="text-sm text-white/80" style={{ fontFamily: 'var(--font-body)' }}>
            {business.tagline}
          </p>
        )}
        <StatusBadge business={business} theme="coastal" />
      </div>
    </header>
  )
}

// ── aether — floating, airy, large negative space ─────────────────
function AetherHero({ business }: { business: Business }) {
  const cover = cdnUrl(business.cover_r2_key)
  return (
    <header className="relative overflow-hidden" style={{ background: 'var(--bg)' }}>
      {cover && (
        <div className="relative mx-auto mt-8 h-[220px] w-full max-w-lg overflow-hidden rounded-3xl md:h-[280px] lg:h-[340px] lg:max-w-2xl">
          <Image src={cover} alt="" fill loading="eager" fetchPriority="high" sizes="512px" className="object-cover" />
        </div>
      )}
      {/* Blob accent */}
      <div
        className="absolute -right-20 -top-20 h-[40vmax] w-[40vmax] rounded-full opacity-20"
        style={{ background: 'radial-gradient(circle, var(--brand) 0%, transparent 70%)' }}
      />
      <div className="relative flex flex-col items-center gap-4 px-6 py-10 text-center">
        <LogoOrInitials business={business} size={52} />
        <h1
          style={{
            fontFamily: 'var(--font-display)',
            fontSize: 'clamp(2rem, 9vw, 4rem)',
            color: 'var(--txt)',
            fontWeight: 700,
            letterSpacing: '-0.03em',
          }}
        >
          {business.name}
        </h1>
        {business.tagline && (
          <p className="max-w-xs text-sm leading-relaxed" style={{ color: 'var(--txt2)', fontFamily: 'var(--font-body)' }}>
            {business.tagline}
          </p>
        )}
        <StatusBadge business={business} align="start" theme="aether" />
      </div>
    </header>
  )
}

// ── onyx — editorial full-screen, white on black ─────────────────
function OnyxHero({ business }: { business: Business }) {
  const cover = cdnUrl(business.cover_r2_key)
  return (
    <header className="relative isolate overflow-hidden" style={{ minHeight: 'clamp(50vh, 85svh, 100svh)', background: 'var(--bg)' }}>
      {cover ? (
        <>
          <Image src={cover} alt="" fill loading="eager" fetchPriority="high" sizes="100vw" className="object-cover opacity-30" />
          <div className="absolute inset-0" style={{ background: 'var(--bg)', opacity: 0.6 }} />
        </>
      ) : (
        <div className="absolute inset-0" style={{
          background: 'radial-gradient(ellipse 60% 50% at 50% 20%, var(--sf2) 0%, var(--bg) 100%)',
        }} />
      )}
      {/* Horizontal rules */}
      <div className="absolute inset-x-8 top-8 h-px" style={{ background: 'var(--bdr2)' }} />
      <div className="absolute inset-x-8 bottom-8 h-px" style={{ background: 'var(--bdr2)' }} />

      <div className="relative flex min-h-[inherit] flex-col items-center justify-center gap-5 px-8 text-center">
        <p className="text-[10px] font-medium uppercase tracking-[0.4em]" style={{ color: 'var(--txt2)', fontFamily: 'var(--font-body)' }}>
          {business.city || 'Restaurant'}
        </p>
        <h1
          style={{
            fontFamily: 'var(--font-display)',
            fontSize: 'clamp(2.5rem, 11vw, 6rem)',
            lineHeight: 1,
            color: 'var(--txt)',
            fontStyle: 'italic',
            letterSpacing: '0.05em',
          }}
        >
          {business.name}
        </h1>
        {business.tagline && (
          <p className="text-sm tracking-widest uppercase" style={{ color: 'var(--brand2)', fontFamily: 'var(--font-body)' }}>
            {business.tagline}
          </p>
        )}
        <StatusBadge business={business} theme="onyx" />
        {/* Scroll cue */}
        <div className="absolute bottom-20 flex flex-col items-center gap-1">
          <span className="text-[10px] uppercase tracking-[0.3em]" style={{ color: 'var(--txt3)', fontFamily: 'var(--font-body)' }}>
            scroll
          </span>
          <div className="h-8 w-px" style={{ background: 'linear-gradient(to bottom, var(--txt3), transparent)' }} />
        </div>
      </div>
    </header>
  )
}

// ── studio — asymmetric grid, monospace aesthetic ─────────────────
function StudioHero({ business }: { business: Business }) {
  const cover = cdnUrl(business.cover_r2_key)
  return (
    <header className="relative" style={{ background: 'var(--bg)' }}>
      <div className="grid md:grid-cols-[1fr_1.4fr]">
        {/* Left: metadata grid */}
        <div
          className="flex flex-col justify-between border-r p-6 md:min-h-[360px] md:p-10"
          style={{ borderColor: 'var(--bdr2)' }}
        >
          <div className="flex items-center gap-3">
            <LogoOrInitials business={business} size={40} />
            <span className="text-xs font-bold uppercase tracking-widest" style={{ color: 'var(--brand2)', fontFamily: 'var(--font-display)' }}>
              ◈ Menu
            </span>
          </div>
          <div>
            <h1
              style={{
                fontFamily: 'var(--font-display)',
                fontSize: 'clamp(1.8rem, 8vw, 3rem)',
                color: 'var(--txt)',
                fontWeight: 700,
                letterSpacing: '-0.03em',
              }}
            >
              {business.name}
            </h1>
            {business.tagline && (
              <p className="mt-2 text-xs" style={{ color: 'var(--txt2)', fontFamily: 'var(--font-body)' }}>
                {business.tagline}
              </p>
            )}
          </div>
          <StatusBadge business={business} align="start" theme="studio" />
        </div>
        {/* Right: cover image or pattern */}
        <div className="relative h-[180px] md:h-auto" style={{ background: 'var(--sf1)' }}>
          {cover ? (
            <Image src={cover} alt="" fill sizes="60vw" className="object-cover" loading="eager" fetchPriority="high" />
          ) : (
            <div
              className="absolute inset-0 flex items-center justify-center overflow-hidden"
              style={{ background: 'var(--bg)' }}
            >
              <div
                className="absolute inset-0 opacity-10"
                style={{ backgroundImage: 'radial-gradient(var(--txt) 1px, transparent 1px)', backgroundSize: '16px 16px' }}
              />
              <span className="relative text-[160px] font-bold leading-none tracking-tighter opacity-5" style={{ fontFamily: 'var(--font-display)', color: 'var(--txt)' }}>
                {initials(business.name)}
              </span>
            </div>
          )}
        </div>
      </div>
    </header>
  )
}

// ── sakura — romantic, blush, floral ─────────────────────────────
function SakuraHero({ business }: { business: Business }) {
  const cover = cdnUrl(business.cover_r2_key)
  return (
    <header className="relative overflow-hidden" style={{ background: 'var(--bg)' }}>
      {cover && (
        <div className="relative h-[180px] w-full overflow-hidden">
          <Image src={cover} alt="" fill loading="eager" fetchPriority="high" sizes="100vw" className="object-cover opacity-70" />
          <div className="absolute inset-0" style={{ background: 'linear-gradient(180deg, transparent 40%, var(--bg) 100%)' }} />
        </div>
      )}
      <div className="flex flex-col items-center gap-4 px-6 py-8 text-center">
        <div className="text-2xl" aria-hidden>🌸</div>
        <LogoOrInitials business={business} size={60} />
        <h1 style={{
          fontFamily: 'var(--font-display)',
          fontSize: 'clamp(2rem, 9vw, 4rem)',
          color: 'var(--txt)',
          fontStyle: 'italic',
          letterSpacing: '-0.01em',
        }}>{business.name}</h1>
        {business.tagline && (
          <p className="text-sm leading-relaxed max-w-xs" style={{ color: 'var(--txt2)', fontFamily: 'var(--font-body)' }}>
            {business.tagline}
          </p>
        )}
        <div className="flex items-center gap-3">
          <div className="h-px w-8" style={{ background: 'var(--brand3)' }} />
          <StatusBadge business={business} theme="sakura" />
          <div className="h-px w-8" style={{ background: 'var(--brand3)' }} />
        </div>
      </div>
    </header>
  )
}

// ── frost — playful, pastel, sweet ───────────────────────────────
function FrostHero({ business }: { business: Business }) {
  return (
    <header className="relative overflow-hidden" style={{ background: 'var(--bg)' }}>
      {/* Pastel gradient blob */}
      <div className="absolute -right-12 -top-12 h-48 w-48 rounded-full opacity-30"
        style={{ background: 'radial-gradient(circle, var(--brand2) 0%, transparent 70%)' }} />
      <div className="absolute -left-8 top-16 h-32 w-32 rounded-full opacity-20"
        style={{ background: 'radial-gradient(circle, var(--brand3) 0%, transparent 70%)' }} />
      <div className="relative flex flex-col items-center gap-4 px-6 py-10 text-center">
        <LogoOrInitials business={business} size={72} />
        <h1 style={{
          fontFamily: 'var(--font-display)',
          fontSize: 'clamp(2rem, 10vw, 4.5rem)',
          color: 'var(--txt)',
          fontWeight: 700,
          letterSpacing: '-0.02em',
          lineHeight: 1,
        }}>{business.name}</h1>
        {business.tagline && (
          <p className="text-sm" style={{ color: 'var(--txt2)', fontFamily: 'var(--font-body)' }}>{business.tagline}</p>
        )}
        <StatusBadge business={business} theme="frost" />
      </div>
    </header>
  )
}

// ── ember — dramatic red, Chinese aesthetic ───────────────────────
function EmberHero({ business }: { business: Business }) {
  const cover = cdnUrl(business.cover_r2_key)
  return (
    <header className="relative isolate overflow-hidden" style={{ minHeight: 'min(80vw, 380px)', background: 'var(--sf1)' }}>
      {cover ? (
        <>
          <Image src={cover} alt="" fill loading="eager" fetchPriority="high" sizes="100vw" className="object-cover opacity-30" />
          <div className="absolute inset-0" style={{ background: 'linear-gradient(180deg, rgba(10,0,0,0.5) 0%, var(--bg) 100%)' }} />
        </>
      ) : (
        <div className="absolute inset-0" style={{
          background: 'radial-gradient(ellipse 80% 60% at 50% 30%, rgba(220,38,38,0.25) 0%, transparent 70%)',
        }} />
      )}
      {/* Gold border accents */}
      <div className="absolute inset-x-6 top-5 h-px" style={{ background: 'linear-gradient(90deg, transparent, var(--brand2), transparent)' }} />
      <div className="absolute inset-x-6 bottom-5 h-px" style={{ background: 'linear-gradient(90deg, transparent, var(--brand2), transparent)' }} />
      <div className="relative flex min-h-[inherit] flex-col items-center justify-center gap-4 px-6 text-center">
        <span className="text-3xl" aria-hidden>🏮</span>
        <h1 style={{
          fontFamily: 'var(--font-display)',
          fontSize: 'clamp(2.5rem, 11vw, 6rem)',
          color: 'var(--txt)',
          fontStyle: 'italic',
          letterSpacing: '0.02em',
          lineHeight: 1,
        }}>{business.name}</h1>
        {business.tagline && (
          <p className="text-xs tracking-[0.2em] uppercase" style={{ color: 'var(--brand2)', fontFamily: 'var(--font-body)' }}>
            {business.tagline}
          </p>
        )}
        <StatusBadge business={business} align="start" theme="ember" />
      </div>
    </header>
  )
}

// ── arcade — neon, gaming, electric ──────────────────────────────

function PixelCloud({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 12" fill="currentColor" xmlns="http://www.w3.org/2000/svg">
      <path d="M6,6 h2 v-2 h4 v-2 h4 v2 h4 v4 h2 v4 h-20 v-2 h-2 v-2 h2 v-2 z" />
    </svg>
  )
}

function PixelPlayer({ frame }: { frame: number }) {
  return (
    <svg viewBox="0 0 16 16" width="100%" height="100%" className="drop-shadow-[0_0_8px_var(--brand)]">
      {/* Head */}
      <rect x="6" y="1" width="5" height="1" fill="#0f172a" /> {/* Hair top */}
      <rect x="5" y="2" width="1" height="1" fill="#0f172a" /> {/* Hair side */}
      <rect x="6" y="2" width="5" height="1" fill="#ef4444" /> {/* Bandana */}
      <rect x="4" y="2" width="2" height="1" fill="#ef4444" /> {/* Knot */}
      <rect x="4" y="3" width="1" height="1" fill="#ef4444" /> {/* Knot tail */}
      
      <rect x="6" y="3" width="5" height="3" fill="#fcd34d" /> {/* Face */}
      <rect x="9" y="3" width="1" height="1" fill="#0f172a" /> {/* Eye */}
      <rect x="10" y="4" width="1" height="1" fill="#f59e0b" /> {/* Nose shadow */}
      
      {/* Body */}
      <rect x="6" y="6" width="5" height="3" fill="#fcd34d" /> {/* Chest */}
      <rect x="7" y="6" width="2" height="2" fill="#f59e0b" /> {/* Pecs shadow */}
      <rect x="6" y="9" width="5" height="2" fill="#1e3a8a" /> {/* Pants top */}
      <rect x="6" y="9" width="5" height="1" fill="#0f172a" /> {/* Belt */}
      <rect x="8" y="9" width="1" height="1" fill="#eab308" /> {/* Buckle */}
      
      {/* Arm & Gun */}
      <rect x="7" y="6" width="4" height="2" fill="#fcd34d" />
      <rect x="11" y="5" width="1" height="3" fill="#4b5563" /> {/* Gun stock */}
      <rect x="12" y="6" width="4" height="1" fill="#6b7280" /> {/* Gun barrel top */}
      <rect x="12" y="7" width="3" height="1" fill="#4b5563" /> {/* Gun barrel bottom */}
      <rect x="12" y="8" width="1" height="1" fill="#1f2937" /> {/* Trigger guard */}
      <rect x="16" y="6" width="1" height="1" fill="#ef4444" /> {/* Gun tip */}

      {/* Legs animated */}
      {frame === 0 ? (
        <>
          <rect x="6" y="11" width="2" height="4" fill="#1e3a8a" />
          <rect x="5" y="14" width="3" height="1" fill="#7f1d1d" />
          <rect x="9" y="10" width="2" height="3" fill="#1e40af" />
          <rect x="9" y="13" width="3" height="1" fill="#7f1d1d" />
        </>
      ) : (
        <>
          <rect x="5" y="11" width="2" height="3" fill="#1e3a8a" />
          <rect x="4" y="13" width="2" height="1" fill="#7f1d1d" />
          <rect x="8" y="11" width="2" height="4" fill="#1e40af" />
          <rect x="8" y="14" width="3" height="1" fill="#7f1d1d" />
        </>
      )}
    </svg>
  )
}

function ArcadeScene() {
  const [frame, setFrame] = useState(0)
  const [shots, setShots] = useState<number[]>([])

  useEffect(() => {
    const timer = setInterval(() => setFrame(f => (f === 0 ? 1 : 0)), 150)
    return () => clearInterval(timer)
  }, [])

  useEffect(() => {
    const timer = setInterval(() => {
      if (Math.random() > 0.4) {
        const id = Date.now()
        setShots(s => [...s, id])
        setTimeout(() => setShots(s => s.filter(x => x !== id)), 600)
      }
    }, 400)
    return () => clearInterval(timer)
  }, [])

  return (
    <div className="relative w-full max-w-2xl mx-auto overflow-hidden rounded pt-1 mt-4 h-24" style={{ background: 'var(--bg)', border: '2px solid var(--brand)', boxShadow: 'inset 0 0 10px rgba(139,92,246,0.2)' }}>
      {/* Sky/backdrop */}
      <div className="absolute inset-0 bg-gradient-to-b from-[#1e1b4b] to-transparent opacity-50 pointer-events-none" />

      <p className="absolute inset-x-0 top-2 text-[10px] uppercase tracking-[0.4em] text-center z-10" style={{ color: 'var(--brand)', opacity: 0.6, fontFamily: 'var(--font-body)', textShadow: '0 0 8px var(--brand)' }}>▶ HOLD TO PLAY ◀</p>
      
      {/* Floating clouds */}
      <m.div className="absolute top-2 left-0 text-white/30" animate={{ x: [700, -100] }} transition={{ duration: 18, repeat: Infinity, ease: 'linear' }}>
        <PixelCloud className="h-5 w-10" />
      </m.div>
      <m.div className="absolute top-8 left-0 text-white/10" animate={{ x: [750, -100] }} transition={{ duration: 24, repeat: Infinity, ease: 'linear', delay: 4 }}>
        <PixelCloud className="h-4 w-8" />
      </m.div>
      <m.div className="absolute top-5 left-0 text-white/20" animate={{ x: [700, -100] }} transition={{ duration: 14, repeat: Infinity, ease: 'linear', delay: 8 }}>
        <PixelCloud className="h-3 w-6" />
      </m.div>

      {/* Grass ground */}
      <div className="absolute bottom-0 inset-x-0 h-3 border-t border-green-900/50" style={{ background: 'repeating-linear-gradient(90deg, #15803d 0px, #15803d 4px, #166534 4px, #166534 8px)' }} />

      {/* Player and bullets moving together across the screen */}
      <m.div
        className="absolute bottom-3 h-10 w-10"
        animate={{ x: ['-50px', '800px'] }}
        transition={{ duration: 8, repeat: Infinity, ease: 'linear' }}
      >
        <PixelPlayer frame={frame} />
        <AnimatePresence>
          {shots.map(id => (
            <m.div
              key={id}
              className="absolute top-2 left-8 h-1.5 w-3 bg-yellow-400"
              style={{ boxShadow: '0 0 8px yellow, 0 0 2px white' }}
              initial={{ x: 0, opacity: 1 }}
              animate={{ x: 300, opacity: 0 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.4, ease: 'linear' }}
            />
          ))}
        </AnimatePresence>
      </m.div>
    </div>
  )
}
function ArcadeHero({ business }: { business: Business }) {
  const cover = cdnUrl(business.cover_r2_key)
  const [isGameOpen, setIsGameOpen] = useState(false)
  const [isPressing, setIsPressing] = useState(false)
  const pressTimer = useRef<NodeJS.Timeout | null>(null)

  const startPress = () => {
    setIsPressing(true)
    pressTimer.current = setTimeout(() => {
      setIsGameOpen(true)
      setIsPressing(false)
    }, 800) // 800ms hold to play
  }

  const cancelPress = () => {
    setIsPressing(false)
    if (pressTimer.current) clearTimeout(pressTimer.current)
  }
  
  return (
    <header className="relative isolate overflow-hidden" style={{ background: 'var(--bg)' }}>
      {cover && (
        <div className="relative h-[160px] overflow-hidden md:h-[220px] lg:h-[280px]">
          <Image src={cover} alt="" fill loading="eager" fetchPriority="high" sizes="100vw" className="object-cover opacity-20" />
        </div>
      )}
      {/* CRT scanlines */}
      <div className="pointer-events-none absolute inset-0"
        style={{ backgroundImage: 'repeating-linear-gradient(0deg, transparent, transparent 3px, rgba(139,92,246,0.06) 3px, rgba(139,92,246,0.06) 4px)' }}
      />
      {/* Corner brackets */}
      {[
        { cls: 'absolute left-3 top-3 h-5 w-5 border-l-2 border-t-2' },
        { cls: 'absolute right-3 top-3 h-5 w-5 border-r-2 border-t-2' },
        { cls: 'absolute bottom-3 left-3 h-5 w-5 border-b-2 border-l-2' },
        { cls: 'absolute bottom-3 right-3 h-5 w-5 border-b-2 border-r-2' },
      ].map((b, i) => (
        <div key={i} className={b.cls} style={{ borderColor: 'var(--brand)', opacity: 0.5 }} />
      ))}
      <div className="relative flex flex-col items-center gap-4 px-6 py-8 text-center">
        <div className="relative">
          <LogoOrInitials business={business} size={64} />
          <div className="absolute inset-0 rounded-full" style={{ boxShadow: '0 0 20px var(--brand)', animation: 'ember-glow 2s ease-in-out infinite' }} />
        </div>
        <h1 style={{
          fontFamily: 'var(--font-display)',
          fontSize: 'clamp(2rem, 10vw, 4.5rem)',
          fontWeight: 700,
          color: 'var(--txt)',
          letterSpacing: '-0.01em',
          lineHeight: 1,
          textShadow: '0 0 20px rgba(139,92,246,0.6), 0 0 40px rgba(139,92,246,0.3)',
        }}>{business.name}</h1>
        {business.tagline && (
          <p className="text-xs uppercase tracking-[0.3em]" style={{ color: 'var(--brand)', fontFamily: 'var(--font-body)', textShadow: '0 0 8px var(--brand)' }}>{business.tagline}</p>
        )}
        <StatusBadge business={business} theme="arcade" />
        
        {/* Clickable Arcade Scene to launch game */}
        {!isGameOpen && (
          <m.div 
            layoutId="arcade-game-container"
            onPointerDown={startPress}
            onPointerUp={cancelPress}
            onPointerLeave={cancelPress}
            onKeyDown={(e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault()
                setIsGameOpen(true)
              }
            }}
            className="relative w-full cursor-pointer transition-transform hover:scale-[1.02] active:scale-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--bg)]"
            role="button"
            tabIndex={0}
            aria-label="Hold to Play Arcade Game or press Enter"
            style={{ borderRadius: '1rem', overflow: 'hidden' }}
          >
            <ArcadeScene />
            {/* Hold progress effect */}
            {isPressing && (
              <m.div 
                className="absolute inset-y-0 left-0 bg-white/20 z-20 pointer-events-none mix-blend-overlay"
                initial={{ width: '0%' }}
                animate={{ width: '100%' }}
                transition={{ duration: 0.8, ease: 'linear' }}
              />
            )}
          </m.div>
        )}
      </div>

      {isGameOpen && <ArcadeGameModal onClose={() => setIsGameOpen(false)} />}
    </header>
  )
}

// ── Router ────────────────────────────────────────────────────────
const HERO_MAP: Record<Theme, React.ComponentType<{ business: Business }>> = {
  mercado: MercadoHero,
  provenance: ProvenanceHero,
  terrain: TerrainHero,
  bazaar: BazaarHero,
  nocturne: NocturneHero,
  coastal: CoastalHero,
  aether: AetherHero,
  onyx: OnyxHero,
  studio: StudioHero,
  sakura: SakuraHero,
  frost: FrostHero,
  ember: EmberHero,
  arcade: ArcadeHero,
}

export function MenuHero({ business, theme }: { business: Business; theme: Theme }) {
  const { t } = useLanguage()
  const Hero = HERO_MAP[theme] ?? HERO_MAP.mercado
  
  const translatedBusiness = {
    ...business,
    name: t('business', business.id, 'name', business.name),
    tagline: business.tagline ? t('business', business.id, 'tagline', business.tagline) : business.tagline,
  }

  return <Hero business={translatedBusiness} />
}
