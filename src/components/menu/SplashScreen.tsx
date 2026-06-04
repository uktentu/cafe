'use client'

import { useEffect, useState } from 'react'
import { AnimatePresence, m } from 'framer-motion'
import type { Theme } from '@/types/database'

interface SplashScreenProps {
  name: string
  splashMs: number
  theme: Theme
}

// ── Shared: perfect center wrapper ────────────────────────────────────────
function SplashWrap({
  bg,
  children,
  exit: exitProp = { opacity: 0 },
  exitDuration = 0.4,
}: {
  bg: string
  children: React.ReactNode
  exit?: Record<string, unknown>
  exitDuration?: number
}) {
  return (
    <m.div
      key="splash"
      aria-hidden
      className="fixed inset-0 z-[100] flex items-center justify-center overflow-hidden"
      style={{ background: bg }}
      exit={exitProp as never}
      transition={{ duration: exitDuration, ease: 'easeInOut' }}
    >
      {children}
    </m.div>
  )
}

// ── 1. MERCADO — Red shockwave burst ──────────────────────────────────────
function MercadoSplash({ name }: { name: string }) {
  return (
    <SplashWrap bg="#0E0B09">
      {/* Shockwave rings */}
      {[1, 1.4, 1.8].map((scale, i) => (
        <m.div key={i} className="absolute rounded-full border-2"
          style={{ width: '60vmin', height: '60vmin', borderColor: '#E5292A' }}
          initial={{ scale: 0, opacity: 0.8 }}
          animate={{ scale: scale * 3, opacity: 0 }}
          transition={{ duration: 1.1, delay: i * 0.15, ease: 'easeOut' }}
        />
      ))}
      {/* Solid fill */}
      <m.div className="absolute rounded-full"
        style={{ background: '#E5292A', width: '200vmax', height: '200vmax' }}
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
      />
      {/* Punch-out center */}
      <m.div className="absolute rounded-full"
        style={{ background: '#0E0B09', width: '200vmax', height: '200vmax' }}
        initial={{ scale: 0 }}
        animate={{ scale: 0.82 }}
        transition={{ duration: 0.5, delay: 0.4, ease: [0.22, 1, 0.36, 1] }}
      />
      <m.div className="relative z-10 flex flex-col items-center gap-1 px-6 text-center"
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.45, duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
      >
        <span style={{
          fontFamily: 'var(--font-display)',
          fontSize: 'clamp(3.5rem, 15vw, 8rem)',
          lineHeight: 0.9,
          color: '#F7EFE7',
          textTransform: 'uppercase',
          letterSpacing: '0.02em',
        }}>{name}</span>
        <m.span
          className="block h-0.5 w-16"
          style={{ background: '#E5292A' }}
          initial={{ scaleX: 0 }}
          animate={{ scaleX: 1 }}
          transition={{ delay: 0.7, duration: 0.4 }}
        />
      </m.div>
    </SplashWrap>
  )
}

// ── 2. PROVENANCE — Botanical bloom ───────────────────────────────────────
function ProvenanceSplash({ name }: { name: string }) {
  return (
    <SplashWrap bg="#FAFAF7" exitDuration={0.7}>
      {/* Expanding circle */}
      <m.div className="absolute rounded-full"
        style={{ background: '#1A2E22', width: '200vmax', height: '200vmax', opacity: 0.04 }}
        initial={{ scale: 0 }} animate={{ scale: 1 }}
        transition={{ duration: 1.2, ease: [0.22, 1, 0.36, 1] }}
      />
      <div className="relative flex flex-col items-center gap-4 px-8 text-center">
        {/* Top rule */}
        <m.div className="h-px" style={{ background: '#8A6840', width: 48 }}
          initial={{ scaleX: 0 }} animate={{ scaleX: 1 }}
          transition={{ duration: 0.8, ease: 'easeInOut' }}
        />
        {/* Name */}
        <m.span
          style={{
            fontFamily: 'var(--font-display)',
            fontSize: 'clamp(2rem, 9vw, 4.5rem)',
            color: '#0D1A12',
            fontStyle: 'italic',
            letterSpacing: '-0.01em',
            lineHeight: 1.1,
          }}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.25, duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
        >{name}</m.span>
        {/* Tagline */}
        <m.span className="text-xs uppercase tracking-[0.25em]"
          style={{ color: '#8A6840', fontFamily: 'var(--font-body)' }}
          initial={{ opacity: 0 }} animate={{ opacity: 1 }}
          transition={{ delay: 0.65, duration: 0.5 }}
        >Est. Bengaluru</m.span>
        {/* Bottom rule */}
        <m.div className="h-px" style={{ background: '#8A6840', width: 48 }}
          initial={{ scaleX: 0 }} animate={{ scaleX: 1 }}
          transition={{ duration: 0.8, delay: 0.2, ease: 'easeInOut' }}
        />
      </div>
    </SplashWrap>
  )
}

// ── 3. TERRAIN — ERASER SWEEP ─────────────────────────────────────────────
// A white "eraser" bar sweeps L→R, leaving the menu revealed beneath.
function TerrainSplash({ name }: { name: string }) {
  return (
    <SplashWrap bg="#F2EDE6" exit={{ opacity: 0 }} exitDuration={0.3}>
      {/* Chalk-board fill panel */}
      <m.div className="absolute inset-0"
        style={{ background: '#2C2218', transformOrigin: 'left' }}
        initial={{ scaleX: 1 }}
        animate={{ scaleX: 0 }}
        transition={{ duration: 0.9, delay: 0.9, ease: [0.65, 0, 0.35, 1] }}
      />
      {/* Eraser bar — moves right as the panel retracts */}
      <m.div
        className="absolute left-0 top-0 h-full"
        style={{
          width: 18,
          background: 'linear-gradient(90deg, #EAE3D9 0%, #F2EDE6 40%, #EAE3D9 100%)',
          boxShadow: '4px 0 20px rgba(44,34,24,0.35)',
          zIndex: 10,
        }}
        initial={{ x: 0 }}
        animate={{ x: '100vw' }}
        transition={{ duration: 0.9, delay: 0.9, ease: [0.65, 0, 0.35, 1] }}
      />
      {/* Name on dark chalkboard */}
      <m.div className="relative z-20 flex flex-col items-center gap-3 px-8 text-center"
        initial={{ opacity: 0 }} animate={{ opacity: 1 }}
        transition={{ delay: 0.1, duration: 0.5 }}
      >
        <span style={{
          fontFamily: 'var(--font-display)',
          fontSize: 'clamp(2.5rem, 11vw, 6rem)',
          color: '#F2EDE6',
          fontWeight: 700,
          letterSpacing: '-0.02em',
          lineHeight: 1,
        }}>{name}</span>
        <m.span className="h-px" style={{ background: '#B85C2A', width: 40 }}
          initial={{ scaleX: 0 }} animate={{ scaleX: 1 }}
          transition={{ delay: 0.4, duration: 0.5 }}
        />
      </m.div>
    </SplashWrap>
  )
}

// ── 4. BAZAAR — Kaleidoscope burst ────────────────────────────────────────
function BazaarSplash({ name }: { name: string }) {
  const colors = ['#F5A623', '#E84A2F', '#2A9D8F', '#F5A623']
  return (
    <SplashWrap bg="#0D0800" exitDuration={0.3}>
      {/* Rotating colour segments */}
      {colors.map((color, i) => (
        <m.div key={i} className="absolute inset-0 origin-center"
          style={{ background: `conic-gradient(from ${i * 90}deg, ${color}20 0deg, transparent 90deg)` }}
          animate={{ rotate: 360 }}
          transition={{ duration: 8, repeat: Infinity, ease: 'linear' }}
        />
      ))}
      {/* Radial burst rings */}
      {[0.5, 1, 1.5].map((delay, i) => (
        <m.div key={i} className="absolute rounded-full border"
          style={{ width: `${40 + i * 25}vmin`, height: `${40 + i * 25}vmin`, borderColor: '#F5A623', opacity: 0.3 }}
          animate={{ scale: [1, 1.08, 1], opacity: [0.3, 0.6, 0.3] }}
          transition={{ duration: 2, delay, repeat: Infinity, ease: 'easeInOut' }}
        />
      ))}
      {/* Name */}
      <m.div className="relative z-10 flex flex-col items-center gap-2 px-6 text-center"
        initial={{ opacity: 0, scale: 0.7 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ delay: 0.2, duration: 0.6, ease: [0.34, 1.56, 0.64, 1] }}
      >
        <span style={{
          fontFamily: 'var(--font-display)',
          fontSize: 'clamp(3.5rem, 15vw, 9rem)',
          color: '#FFF5E8',
          textTransform: 'uppercase',
          letterSpacing: '0.04em',
          lineHeight: 0.9,
        }}>{name}</span>
        <m.div className="flex gap-1"
          initial={{ opacity: 0 }} animate={{ opacity: 1 }}
          transition={{ delay: 0.6 }}
        >
          {['★', '◆', '★'].map((s, i) => (
            <span key={i} style={{ color: '#F5A623', fontSize: 12 }}>{s}</span>
          ))}
        </m.div>
      </m.div>
    </SplashWrap>
  )
}

// ── 5. NOCTURNE — Curtain drop ────────────────────────────────────────────
function NocturneSplash({ name }: { name: string }) {
  return (
    <SplashWrap bg="#080A0C" exitDuration={0.5}>
      {/* Top curtain panel */}
      <m.div className="absolute inset-x-0 top-0 z-20"
        style={{ background: '#10131A', height: '50%', transformOrigin: 'top' }}
        animate={{ scaleY: [1, 1, 0] }}
        transition={{ duration: 0.7, delay: 0.8, ease: [0.65, 0, 0.35, 1], times: [0, 0.5, 1] }}
      />
      {/* Bottom curtain panel */}
      <m.div className="absolute inset-x-0 bottom-0 z-20"
        style={{ background: '#10131A', height: '50%', transformOrigin: 'bottom' }}
        animate={{ scaleY: [1, 1, 0] }}
        transition={{ duration: 0.7, delay: 0.8, ease: [0.65, 0, 0.35, 1], times: [0, 0.5, 1] }}
      />
      {/* Gold horizontal rule top/bottom */}
      <m.div className="absolute inset-x-12 top-8 h-px z-30"
        style={{ background: 'linear-gradient(90deg, transparent, #C9A84C, transparent)' }}
        initial={{ scaleX: 0 }} animate={{ scaleX: 1 }}
        transition={{ duration: 0.8, ease: 'easeInOut' }}
      />
      <m.div className="absolute inset-x-12 bottom-8 h-px z-30"
        style={{ background: 'linear-gradient(90deg, transparent, #C9A84C, transparent)' }}
        initial={{ scaleX: 0 }} animate={{ scaleX: 1 }}
        transition={{ duration: 0.8, delay: 0.1, ease: 'easeInOut' }}
      />
      {/* Name */}
      <m.div className="relative z-10 flex flex-col items-center gap-3 px-8 text-center"
        initial={{ opacity: 0 }} animate={{ opacity: 1 }}
        transition={{ delay: 0.15, duration: 0.6 }}
      >
        <span className="block text-xs uppercase tracking-[0.35em]"
          style={{ color: '#C9A84C', fontFamily: 'var(--font-body)' }}>Welcome to</span>
        <span style={{
          fontFamily: 'var(--font-display)',
          fontSize: 'clamp(2.2rem, 10vw, 6rem)',
          color: '#EDE8DA',
          fontStyle: 'italic',
          letterSpacing: '0.06em',
          textTransform: 'uppercase',
          lineHeight: 1,
        }}>{name}</span>
      </m.div>
    </SplashWrap>
  )
}

// ── 6. COASTAL — Ocean wave wipe ─────────────────────────────────────────
function CoastalSplash({ name }: { name: string }) {
  return (
    <SplashWrap bg="#F5F8F5" exitDuration={0.4}>
      {/* Ocean wave */}
      <m.div className="absolute inset-y-0"
        style={{
          width: '120%',
          left: '-10%',
          background: 'linear-gradient(135deg, #1B5E8A 0%, #4A9B6F 100%)',
          borderRadius: '0 60% 60% 0',
        }}
        initial={{ x: '-110%' }}
        animate={{ x: '110%' }}
        transition={{ duration: 0.9, ease: [0.65, 0, 0.35, 1] }}
      />
      {/* Name slides in from right after wave */}
      <m.div className="relative z-10 flex flex-col items-center gap-3 px-8 text-center"
        initial={{ opacity: 0, x: 40 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ delay: 0.55, duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
      >
        <span style={{
          fontFamily: 'var(--font-display)',
          fontSize: 'clamp(2.2rem, 10vw, 5rem)',
          color: '#162030',
          fontStyle: 'italic',
          letterSpacing: '-0.02em',
          lineHeight: 1,
        }}>{name}</span>
        {/* Wave underline */}
        <svg width="80" height="12" viewBox="0 0 80 12" fill="none" aria-hidden>
          <path d="M0 6 Q10 0 20 6 Q30 12 40 6 Q50 0 60 6 Q70 12 80 6" stroke="#1B5E8A" strokeWidth="2" fill="none" />
        </svg>
      </m.div>
    </SplashWrap>
  )
}

// ── 7. AETHER — Morphing blobs ────────────────────────────────────────────
function AetherSplash({ name }: { name: string }) {
  return (
    <SplashWrap bg="#F8F7F3" exitDuration={0.8}>
      {/* Morphing blobs */}
      {[
        { x: '20%', y: '25%', color: '#C4A86A', size: '50vmin', delay: 0 },
        { x: '75%', y: '65%', color: '#7C5C3A', size: '40vmin', delay: 0.15 },
        { x: '50%', y: '15%', color: '#1A1208', size: '25vmin', delay: 0.1 },
      ].map((b, i) => (
        <m.div key={i}
          className="absolute rounded-full"
          style={{
            left: b.x, top: b.y,
            width: b.size, height: b.size,
            background: b.color, opacity: 0.1,
            transform: 'translate(-50%,-50%)',
            filter: 'blur(30px)',
          }}
          initial={{ scale: 0, opacity: 0 }}
          animate={{ scale: [0, 1.2, 1], opacity: 0.1 }}
          transition={{ delay: b.delay, duration: 1.2, ease: [0.22, 1, 0.36, 1] }}
        />
      ))}
      <m.div className="relative z-10 flex flex-col items-center gap-4 px-8 text-center"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4, duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
      >
        <span style={{
          fontFamily: 'var(--font-display)',
          fontSize: 'clamp(2.2rem, 10vw, 5rem)',
          color: '#1A1208',
          fontWeight: 700,
          letterSpacing: '-0.03em',
          lineHeight: 1,
        }}>{name}</span>
        <m.div className="flex items-center gap-2"
          initial={{ opacity: 0 }} animate={{ opacity: 1 }}
          transition={{ delay: 0.75 }}
        >
          <span className="h-px w-8" style={{ background: '#C4A86A', display: 'block' }} />
          <span className="text-xs uppercase tracking-widest" style={{ color: '#8A7E6E', fontFamily: 'var(--font-body)' }}>
            A Fine Experience
          </span>
          <span className="h-px w-8" style={{ background: '#C4A86A', display: 'block' }} />
        </m.div>
      </m.div>
    </SplashWrap>
  )
}

// ── 8. ONYX — Per-letter cascade + horizontal rule reveal ────────────────
function OnyxSplash({ name }: { name: string }) {
  const letters = name.split('')
  return (
    <SplashWrap bg="#060606" exitDuration={0.5}>
      {/* Thin horizontal rules */}
      {['20%', '80%'].map((top, i) => (
        <m.div key={i} className="absolute inset-x-0"
          style={{ top, height: 1, background: 'rgba(250,250,245,0.12)' }}
          initial={{ scaleX: 0 }} animate={{ scaleX: 1 }}
          transition={{ duration: 0.8, delay: i * 0.1, ease: 'easeInOut' }}
        />
      ))}
      {/* Letter cascade from top */}
      <div className="relative z-10 flex flex-col items-center gap-5 px-6 text-center">
        <div className="overflow-hidden flex flex-wrap justify-center">
          {letters.map((ch, i) => (
            <m.span key={i}
              style={{
                fontFamily: 'var(--font-display)',
                fontSize: 'clamp(2.5rem, 11vw, 7rem)',
                color: '#FAFAF5',
                fontStyle: 'italic',
                letterSpacing: '0.04em',
                display: 'inline-block',
                whiteSpace: 'pre',
                lineHeight: 1,
              }}
              initial={{ y: '120%', opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.1 + i * 0.04, duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
            >{ch}</m.span>
          ))}
        </div>
        <m.div className="flex items-center gap-3"
          initial={{ opacity: 0 }} animate={{ opacity: 1 }}
          transition={{ delay: 0.4 + letters.length * 0.04 }}
        >
          <span className="h-px w-10" style={{ background: '#C9A35A', display: 'block' }} />
          <span style={{ color: '#C9A35A', fontSize: 10, letterSpacing: '0.3em', fontFamily: 'var(--font-body)', textTransform: 'uppercase' }}>
            Fine Dining
          </span>
          <span className="h-px w-10" style={{ background: '#C9A35A', display: 'block' }} />
        </m.div>
      </div>
    </SplashWrap>
  )
}

// ── 9. STUDIO — Typewriter → erase → reveal ───────────────────────────────
function StudioSplash({ name }: { name: string }) {
  return (
    <SplashWrap bg="#F0EEE8" exitDuration={0.3}>
      {/* Corner brackets — positioned absolutely with explicit border sides */}
      {([
        { style: { top: 16, left: 16,   borderTop: '2px solid #0A0A0A', borderLeft: '2px solid #0A0A0A' } },
        { style: { top: 16, right: 16,  borderTop: '2px solid #0A0A0A', borderRight: '2px solid #0A0A0A' } },
        { style: { bottom: 16, left: 16,  borderBottom: '2px solid #0A0A0A', borderLeft: '2px solid #0A0A0A' } },
        { style: { bottom: 16, right: 16, borderBottom: '2px solid #0A0A0A', borderRight: '2px solid #0A0A0A' } },
      ] as const).map((c, i) => (
        <m.div key={i}
          className="absolute h-8 w-8"
          style={c.style}
          initial={{ opacity: 0, scale: 0.5 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: i * 0.07, duration: 0.3, ease: [0.34, 1.56, 0.64, 1] }}
        />
      ))}
      <div className="relative z-10 flex flex-col items-center gap-3 px-6 text-center">
        <m.span className="text-[11px] font-bold uppercase tracking-[0.3em]"
          style={{ color: '#FF4500', fontFamily: 'var(--font-display)' }}
          initial={{ opacity: 0 }} animate={{ opacity: 1 }}
          transition={{ delay: 0.35 }}
        >◈ Now Open</m.span>
        <m.span
          style={{
            fontFamily: 'var(--font-display)',
            fontSize: 'clamp(2rem, 9vw, 5rem)',
            color: '#0A0A0A',
            fontWeight: 700,
            letterSpacing: '-0.02em',
            lineHeight: 1,
          }}
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5, duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
        >{name}</m.span>
        <m.div className="h-px" style={{ background: '#FF4500', width: 40 }}
          initial={{ scaleX: 0 }} animate={{ scaleX: 1 }}
          transition={{ delay: 0.75, duration: 0.4 }}
        />
      </div>
    </SplashWrap>
  )
}

// ── 10. SAKURA — Full-screen petal bloom ─────────────────────────────────
// Renders only client-side (SplashScreen `show` starts false), so window is safe.
function SakuraSplash({ name }: { name: string }) {
  // Viewport-relative geometry — fills ~84% of the shorter screen dimension.
  const vmin = Math.min(window.innerWidth, window.innerHeight)
  const R_OUTER = Math.round(vmin * 0.42)
  const R_INNER = Math.round(vmin * 0.285)
  const PW     = Math.round(vmin * 0.065)
  const PH     = R_OUTER - R_INNER
  const N      = 12

  const AMBIENT = [
    { x: '8%',  delay: 0.2, dur: 3.2, rot: -25 },
    { x: '22%', delay: 0.9, dur: 2.8, rot: 15  },
    { x: '55%', delay: 0.1, dur: 3.5, rot: -10 },
    { x: '72%', delay: 1.1, dur: 2.6, rot: 30  },
    { x: '88%', delay: 0.5, dur: 3.0, rot: -20 },
    { x: '38%', delay: 1.6, dur: 2.9, rot: 5   },
  ]

  return (
    <SplashWrap bg="#FFF0F3" exitDuration={0.6}>
      {/* Soft radial glow */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{ background: 'radial-gradient(ellipse 70% 60% at 50% 50%, rgba(160,36,62,0.06) 0%, transparent 70%)' }}
      />

      {/* Floating background petals */}
      {AMBIENT.map((p, i) => (
        <m.div
          key={i}
          style={{
            position: 'absolute',
            left: p.x,
            top: '-8%',
            width: Math.round(vmin * 0.04),
            height: Math.round(vmin * 0.065),
            background: `hsl(${338 + i * 4}, ${65 + (i % 3) * 5}%, ${72 + (i % 4) * 3}%)`,
            borderRadius: '50% 50% 35% 35%',
            opacity: 0.55,

          }}
          initial={{ rotate: p.rot }}
          animate={{ y: '115vh', rotate: p.rot + 360, opacity: [0.55, 0.7, 0.3, 0] }}
          transition={{ delay: p.delay, duration: p.dur, ease: 'linear', repeat: Infinity, repeatDelay: 0.8 }}
        />
      ))}

      {/* Centred flower */}
      <div className="absolute" style={{ left: '50%', top: '50%' }}>
        {/* Petals — pivot at wrapper centre (0,0) */}
        {Array.from({ length: N }, (_, i) => (
          <m.div
            key={i}
            style={{
              position: 'absolute',
              width: PW,
              height: PH,
              left: -(PW / 2),
              top: -R_OUTER,
              background: `hsl(${334 + i * 4},${68 + (i % 3) * 7}%,${66 + (i % 4) * 5}%)`,
              borderRadius: '50% 50% 32% 32%',
              transformOrigin: `${PW / 2}px ${R_OUTER}px`,
            }}
            initial={{ rotate: (360 / N) * i, scale: 0, opacity: 0 }}
            animate={{ rotate: (360 / N) * i, scale: 1, opacity: 0.88 }}
            transition={{ delay: i * 0.045, duration: 0.6, ease: [0.34, 1.56, 0.64, 1] }}
          />
        ))}

        {/* Inner disc */}
        <m.div
          style={{
            position: 'absolute',
            width: R_INNER * 2 - 8,
            height: R_INNER * 2 - 8,
            left: -(R_INNER - 4),
            top: -(R_INNER - 4),
            borderRadius: '50%',
            background: '#FFF8FA',
            boxShadow: '0 0 0 3px rgba(160,36,62,0.15)',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            textAlign: 'center',
            padding: Math.round(vmin * 0.04),
            overflow: 'hidden',
          }}
          initial={{ scale: 0, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ delay: 0.32, duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
        >
          <m.span
            style={{
              fontFamily: 'var(--font-display)',
              fontSize: Math.max(14, Math.round(R_INNER * 0.28)),
              color: '#A0243E',
              fontStyle: 'italic',
              letterSpacing: '-0.01em',
              lineHeight: 1.2,
              display: 'block',
              maxWidth: (R_INNER * 2 - Math.round(vmin * 0.1)) + 'px',
              wordBreak: 'break-word',
            }}
            initial={{ opacity: 0, scale: 0.85 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.55, duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
          >
            {name}
          </m.span>
          <m.span
            style={{
              color: '#C4728A',
              fontSize: Math.max(9, Math.round(vmin * 0.028)),
              marginTop: Math.round(vmin * 0.012),
              letterSpacing: '0.18em',
              fontFamily: 'var(--font-body)',
            }}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.74 }}
          >
            ✦ café ✦
          </m.span>
        </m.div>
      </div>
    </SplashWrap>
  )
}

// ── 11. FROST — Ice crystal ───────────────────────────────────────────────
function FrostSplash({ name }: { name: string }) {
  return (
    <SplashWrap bg="#F0F9FF" exitDuration={0.4}>
      {/* Sparkle dots */}
      {[
        { x: '15%', y: '20%' }, { x: '80%', y: '15%' },
        { x: '10%', y: '75%' }, { x: '85%', y: '70%' },
        { x: '50%', y: '10%' }, { x: '50%', y: '88%' },
      ].map((pos, i) => (
        <m.div key={i} className="absolute"
          style={{
            left: pos.x, top: pos.y,
            width: 8, height: 8,
            background: '#7DD3FC',
            borderRadius: '50%',
            transform: 'translate(-50%,-50%)',
          }}
          animate={{ scale: [0, 1.5, 0.8, 1.2, 1], opacity: [0, 1, 0.6, 1, 0.8] }}
          transition={{ delay: i * 0.1, duration: 0.8, ease: 'easeOut' }}
        />
      ))}
      <m.div className="relative z-10 flex flex-col items-center gap-3 px-8 text-center"
        initial={{ opacity: 0, scale: 0.85 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ delay: 0.3, duration: 0.6, ease: [0.34, 1.56, 0.64, 1] }}
      >
        <span style={{
          fontFamily: 'var(--font-display)',
          fontSize: 'clamp(2.2rem, 10vw, 5.5rem)',
          color: '#0C4A6E',
          fontWeight: 700,
          letterSpacing: '-0.02em',
          lineHeight: 1,
        }}>{name}</span>
        <span className="text-sm" style={{ color: '#38BDF8', fontFamily: 'var(--font-body)' }}>
          ❄ Sweet Treats Await ❄
        </span>
      </m.div>
    </SplashWrap>
  )
}

// ── 12. EMBER — Lantern glow ──────────────────────────────────────────────
function EmberSplash({ name }: { name: string }) {
  return (
    <SplashWrap bg="#0A0000" exitDuration={0.4}>
      {/* Glow */}
      <m.div className="absolute rounded-full"
        style={{ background: 'radial-gradient(circle, rgba(220,38,38,0.35) 0%, transparent 70%)', width: '80vmin', height: '80vmin' }}
        animate={{ scale: [0.8, 1.1, 0.9, 1], opacity: [0.5, 1, 0.7, 1] }}
        transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
      />
      <m.div className="relative z-10 flex flex-col items-center gap-3 px-6 text-center"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2, duration: 0.7 }}
      >
        <m.div className="mb-1 text-3xl" initial={{ rotate: -10 }} animate={{ rotate: [0, 5, -5, 0] }}
          transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
        >🏮</m.div>
        <span style={{
          fontFamily: 'var(--font-display)',
          fontSize: 'clamp(2.5rem, 12vw, 6.5rem)',
          color: '#FEF2F2',
          fontStyle: 'italic',
          letterSpacing: '0.02em',
          lineHeight: 0.95,
        }}>{name}</span>
        <m.div className="flex gap-1" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.6 }}>
          {['龙', '食', '府'].map((ch, i) => (
            <span key={i} style={{ color: '#DC2626', fontSize: 16, fontFamily: 'serif' }}>{ch}</span>
          ))}
        </m.div>
      </m.div>
    </SplashWrap>
  )
}

// ── 13. ARCADE — Full game boot screen ──────────────────────────────────────
function ArcadeSplash({ name }: { name: string }) {
  const colors = ['#F59E0B', '#EC4899', '#8B5CF6', '#10B981', '#3B82F6']
  const scanlines = [10, 25, 40, 55, 70, 85]

  return (
    <SplashWrap bg="#0F0A1E" exitDuration={0.3}>
      {/* Scanline grid */}
      {scanlines.map((pct) => (
        <div key={pct} className="absolute inset-x-0" style={{ top: `${pct}%`, height: 1, background: 'rgba(139,92,246,0.12)' }} />
      ))}
      {[15, 35, 55, 75, 90].map((pct) => (
        <div key={pct} className="absolute inset-y-0" style={{ left: `${pct}%`, width: 1, background: 'rgba(139,92,246,0.12)' }} />
      ))}

      {/* Corner brackets */}
      {[
        { style: { top: 20, left: 20,   borderTop: '2px solid #8B5CF6', borderLeft: '2px solid #8B5CF6' } },
        { style: { top: 20, right: 20,  borderTop: '2px solid #8B5CF6', borderRight: '2px solid #8B5CF6' } },
        { style: { bottom: 20, left: 20,  borderBottom: '2px solid #8B5CF6', borderLeft: '2px solid #8B5CF6' } },
        { style: { bottom: 20, right: 20, borderBottom: '2px solid #8B5CF6', borderRight: '2px solid #8B5CF6' } },
      ].map((c, i) => (
        <m.div key={i} className="absolute h-10 w-10" style={c.style as React.CSSProperties}
          initial={{ opacity: 0, scale: 0.4 }} animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: i * 0.05, type: 'spring', stiffness: 400, damping: 24 }}
        />
      ))}

      {/* Bouncing coins */}
      {colors.map((color, i) => (
        <m.div key={i} className="absolute rounded-full"
          style={{ background: color, width: 10, height: 10, top: '20%', left: `${10 + i * 18}%`, boxShadow: `0 0 8px ${color}` }}
          animate={{ y: [0, -24, 0], opacity: [0.9, 1, 0.9] }}
          transition={{ duration: 0.5, delay: i * 0.08, repeat: Infinity, ease: 'easeInOut' }}
        />
      ))}

      {/* INSERT COIN strip */}
      <m.div className="absolute inset-x-0 top-[30%] flex justify-center"
        initial={{ opacity: 0 }} animate={{ opacity: [0, 1, 0.6, 1] }}
        transition={{ delay: 0.1, duration: 0.4, repeat: Infinity, repeatDelay: 1.4 }}
      >
        <span className="text-[11px] font-black uppercase tracking-[0.35em]"
          style={{ color: '#EC4899', fontFamily: 'var(--font-body)', textShadow: '0 0 8px #EC4899' }}>
          ▶ INSERT COIN ◀
        </span>
      </m.div>

      {/* Main name + neon gradient */}
      <m.div className="relative z-10 flex flex-col items-center gap-2 px-6 text-center"
        initial={{ opacity: 0, scale: 0.5, rotate: -5 }}
        animate={{ opacity: 1, scale: 1, rotate: 0 }}
        transition={{ delay: 0.15, duration: 0.7, ease: [0.34, 1.56, 0.64, 1] }}
      >
        <span style={{
          fontFamily: 'var(--font-display)',
          fontSize: 'clamp(2.5rem, 12vw, 6rem)',
          fontWeight: 900,
          lineHeight: 1,
          background: 'linear-gradient(135deg, #F59E0B, #EC4899, #8B5CF6)',
          WebkitBackgroundClip: 'text',
          WebkitTextFillColor: 'transparent',
          backgroundClip: 'text',
          letterSpacing: '-0.01em',
          filter: 'drop-shadow(0 0 12px rgba(139,92,246,0.5))',
        }}>{name}</span>

        <m.div className="flex items-center gap-3"
          initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.55 }}
        >
          <div className="h-px w-8" style={{ background: 'rgba(139,92,246,0.5)' }} />
          <span className="text-xs uppercase tracking-[0.25em]"
            style={{ color: '#8B5CF6', fontFamily: 'var(--font-body)', textShadow: '0 0 6px #8B5CF6' }}>
            ▶ Game On!
          </span>
          <div className="h-px w-8" style={{ background: 'rgba(139,92,246,0.5)' }} />
        </m.div>
      </m.div>

      {/* Tap to start prompt */}
      <m.div className="absolute bottom-8 left-0 right-0 flex justify-center"
        animate={{ opacity: [0, 1, 0] }} transition={{ duration: 1.2, repeat: Infinity, ease: 'easeInOut' }}
      >
        <span className="text-[10px] font-black uppercase tracking-[0.3em]"
          style={{ color: '#F59E0B', fontFamily: 'var(--font-body)' }}>
          ● ● ● LOADING ● ● ●
        </span>
      </m.div>
    </SplashWrap>
  )
}

// ── Router ────────────────────────────────────────────────────────────────

type AnyTheme = Theme | 'sakura' | 'frost' | 'ember' | 'arcade'

const SPLASH_MAP: Record<AnyTheme, React.ComponentType<{ name: string }>> = {
  mercado:    MercadoSplash,
  provenance: ProvenanceSplash,
  terrain:    TerrainSplash,
  bazaar:     BazaarSplash,
  nocturne:   NocturneSplash,
  coastal:    CoastalSplash,
  aether:     AetherSplash,
  onyx:       OnyxSplash,
  studio:     StudioSplash,
  sakura:     SakuraSplash,
  frost:      FrostSplash,
  ember:      EmberSplash,
  arcade:     ArcadeSplash,
}

export function SplashScreen({ name, splashMs, theme }: SplashScreenProps) {
  // null  = not yet determined (shows opaque backdrop to prevent menu flash)
  // true  = show the full animated splash
  // false = hide (splash done or already shown this session)
  const [show, setShow] = useState<boolean | null>(null)

  useEffect(() => {
    // Skip splash if user prefers reduced motion
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      setShow(false)
      return
    }
    // Show splash every page load
    setShow(true)
    const t = setTimeout(() => setShow(false), splashMs)
    return () => clearTimeout(t)
  }, [splashMs])

  const Splash = SPLASH_MAP[theme as AnyTheme] ?? SPLASH_MAP.mercado

  // While show===null (before useEffect runs), render an opaque backdrop so
  // the menu content is never visible before the splash appears.
  if (show === null) {
    return (
      <div
        className="fixed inset-0 z-[100]"
        style={{ background: 'var(--bg, #0E0B09)' }}
        aria-hidden
      />
    )
  }

  return (
    <AnimatePresence>
      {show && <Splash name={name} />}
    </AnimatePresence>
  )
}
