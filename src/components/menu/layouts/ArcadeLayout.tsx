'use client'

// ArcadeLayout — Board Game / Gaming Cafe (ULTRA GAMIFIED)
// Full retro-arcade experience: XP system, INSERT COIN header, combo counter,
// neon glow effects, scanlines, pixel HUD, animated badges, glitch effects.

import Image from 'next/image'
import { useState, useEffect, useRef } from 'react'
import { m, AnimatePresence, useReducedMotion } from 'framer-motion'
import { cdnUrl, itemImageKey } from '@/types/database'
import { useMenuStore } from '@/stores/menu'
import { useTabCategorySync } from '@/components/menu/useCategorySync'
import { track } from '@/lib/firebase'
import { VegMark, ItemBadge } from '@/components/menu/badges'
import { formatPrice } from '@/lib/utils'
import { getCategoryIcon } from '@/components/menu/categoryIcon'
import { tiltReveal, staggerContainer } from '@/components/menu/scrollVariants'
import type { LayoutProps } from './MercadoLayout'

const ACCENT_COLORS = ['var(--brand)', 'var(--brand2)', 'var(--brand3)']
const CAT_EMOJIS = ['🎮', '🃏', '🎲', '🕹️', '♟️', '🎯', '🎳', '🎪']
const XP_PER_VIEW = 50
const COMBO_LABELS = ['NICE', 'GREAT', 'AWESOME', 'INSANE', 'GOD TIER']

// Animated XP floating text
function XpFloat({ x, y, xp, color }: { x: number; y: number; xp: number; color: string }) {
  return (
    <m.div
      className="pointer-events-none fixed z-[200] text-sm font-black"
      style={{ left: x, top: y, color, fontFamily: 'var(--font-display)', textShadow: `0 0 8px ${color}` }}
      initial={{ y: 0, opacity: 1, scale: 1 }}
      animate={{ y: -60, opacity: 0, scale: 1.3 }}
      transition={{ duration: 0.9, ease: 'easeOut' }}
    >
      +{xp} XP
    </m.div>
  )
}

// Neon glitch text effect
function GlitchText({ text, color }: { text: string; color: string }) {
  const reduced = useReducedMotion()
  return (
    <m.span
      style={{ color, fontFamily: 'var(--font-display)', position: 'relative', display: 'inline-block' }}
      animate={reduced ? {} : {
        x: [0, -1, 1, -1, 0, 0],
        opacity: [1, 0.9, 1, 0.95, 1, 1],
        filter: ['none', `drop-shadow(-2px 0 ${color})`, 'none', `drop-shadow(2px 0 ${color})`, 'none', 'none'],
      }}
      transition={{ duration: 0.25, repeat: Infinity, repeatDelay: 4, ease: 'linear' }}
    >
      {text}
    </m.span>
  )
}

// Pixel-style XP bar
function XpBar({ xp, level }: { xp: number; level: number }) {
  const xpInLevel = xp % 1000
  const pct = (xpInLevel / 1000) * 100
  return (
    <div className="flex items-center gap-2 shrink-0">
      <span className="text-[10px] font-black tracking-widest" style={{ color: 'var(--brand3)', fontFamily: 'var(--font-body)' }}>
        LV{level}
      </span>
      <div className="h-2 w-16 overflow-hidden rounded-none" style={{ background: 'var(--sf2)', border: '1px solid var(--bdr)' }}>
        <m.div
          className="h-full"
          style={{ background: `linear-gradient(90deg, var(--brand3), var(--brand2))` }}
          animate={{ width: `${pct}%` }}
          transition={{ type: 'spring', stiffness: 120, damping: 20 }}
        />
      </div>
      <span className="text-[9px] tabular-nums" style={{ color: 'var(--txt3)', fontFamily: 'var(--font-body)' }}>
        {xp}XP
      </span>
    </div>
  )
}

// Floating particles on click
function ClickParticle({ x, y }: { x: number; y: number }) {
  const particles = Array.from({ length: 8 }, (_, i) => ({
    angle: (360 / 8) * i,
    color: ['var(--brand)', 'var(--brand2)', 'var(--brand3)', '#22C55E'][i % 4],
  }))
  return (
    <>
      {particles.map((p, i) => {
        const rad = (p.angle * Math.PI) / 180
        const dx = Math.cos(rad) * 40
        const dy = Math.sin(rad) * 40
        return (
          <m.div
            key={i}
            className="pointer-events-none fixed z-[201] h-2 w-2 rounded-full"
            style={{ left: x, top: y, background: p.color }}
            initial={{ x: 0, y: 0, opacity: 1, scale: 1 }}
            animate={{ x: dx, y: dy, opacity: 0, scale: 0 }}
            transition={{ duration: 0.5, ease: 'easeOut' }}
          />
        )
      })}
    </>
  )
}

export function ArcadeLayout({ categories, items, businessId: _businessId }: LayoutProps) {
  const openItem = useMenuStore((s) => s.openItem)
  const requestJump = useMenuStore((s) => s.requestJump)
  const { activeId } = useTabCategorySync(categories)
  const activeIdx = categories.findIndex((c) => c.id === activeId)
  const Icon = getCategoryIcon(categories.find((c) => c.id === activeId)?.icon)
  const catItems = items.filter((i) => i.category_id === activeId)

  // Gamification state
  const [xp, setXp] = useState(0)
  const [combo, setCombo] = useState(0)
  const [xpFloats, setXpFloats] = useState<{ id: number; x: number; y: number; xp: number; color: string }[]>([])
  const [particles, setParticles] = useState<{ id: number; x: number; y: number }[]>([])
  const [comboLabel, setComboLabel] = useState('')
  const comboTimer = useRef<ReturnType<typeof setTimeout> | null>(null)
  const nextId = useRef(0)

  const level = Math.floor(xp / 1000) + 1

  function earnXp(baseXp: number, clientX: number, clientY: number, color: string) {
    const comboMultiplier = combo + 1
    const earned = baseXp * comboMultiplier
    setXp((v) => v + earned)
    setCombo((c) => c + 1)
    if (comboMultiplier > 1) setComboLabel(COMBO_LABELS[Math.min(comboMultiplier - 2, COMBO_LABELS.length - 1)])
    else setComboLabel('')

    const id = nextId.current++
    setXpFloats((f) => [...f, { id, x: clientX - 20, y: clientY - 20, xp: earned, color }])
    setParticles((p) => [...p, { id, x: clientX, y: clientY }])
    setTimeout(() => setXpFloats((f) => f.filter((x) => x.id !== id)), 1000)
    setTimeout(() => setParticles((p) => p.filter((x) => x.id !== id)), 600)

    if (comboTimer.current) clearTimeout(comboTimer.current)
    comboTimer.current = setTimeout(() => { setCombo(0); setComboLabel('') }, 2500)
  }

  useEffect(() => () => { if (comboTimer.current) clearTimeout(comboTimer.current) }, [])

  const accentColor = ACCENT_COLORS[activeIdx % ACCENT_COLORS.length]

  return (
    <div style={{ background: 'var(--bg)', color: 'var(--txt)', position: 'relative' }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Press+Start+2P&display=swap');
        .arcade-font { font-family: 'Press Start 2P', monospace !important; text-transform: uppercase; }
        @keyframes flicker { 0% { background: #fff; } 50% { background: #000; } 100% { background: transparent; } }
        @keyframes coin-blink { 0%,49%{opacity:1} 50%,100%{opacity:0} }
        .insert-coin-blink { animation: coin-blink 1s step-end infinite; }
        @keyframes combo-shrink { from{width:100%} to{width:0%} }
      `}</style>
      {/* Scanlines — tighter 1px/3px ratio for authentic CRT */}
      <div className="pointer-events-none absolute inset-0 z-[100] opacity-[0.18]" style={{ background: 'repeating-linear-gradient(0deg, transparent, transparent 3px, rgba(0,0,0,0.35) 3px, rgba(0,0,0,0.35) 4px)' }} />
      {/* Screen flicker */}
      <div className="pointer-events-none absolute inset-0 z-[99] opacity-[0.02]" style={{ animation: 'flicker 0.15s infinite' }} />

      {/* XP floats + particles — lowered z-index so modal stays above */}
      {xpFloats.map((f) => <XpFloat key={f.id} x={f.x} y={f.y} xp={f.xp} color={f.color} />)}
      {particles.map((p) => <ClickParticle key={p.id} x={p.x} y={p.y} />)}

      {/* Parallax Stars Background */}
      <div className="pointer-events-none fixed inset-0 z-0">
        <m.div
          className="absolute inset-0"
          style={{
            backgroundImage: 'radial-gradient(2px 2px at 20px 30px, #ffffff, rgba(0,0,0,0)), radial-gradient(2px 2px at 40px 70px, #ffffff, rgba(0,0,0,0)), radial-gradient(2px 2px at 50px 160px, #ffffff, rgba(0,0,0,0)), radial-gradient(2px 2px at 90px 40px, #ffffff, rgba(0,0,0,0)), radial-gradient(2px 2px at 130px 80px, #ffffff, rgba(0,0,0,0)), radial-gradient(2px 2px at 160px 120px, #ffffff, rgba(0,0,0,0))',
            backgroundRepeat: 'repeat',
            backgroundSize: '200px 200px',
            opacity: 0.15
          }}
          animate={{ y: [0, -200] }}
          transition={{ ease: 'linear', duration: 15, repeat: Infinity }}
        />
        <m.div
          className="absolute inset-0"
          style={{
            backgroundImage: 'radial-gradient(3px 3px at 50px 50px, #ffffff, rgba(0,0,0,0)), radial-gradient(3px 3px at 150px 150px, #ffffff, rgba(0,0,0,0)), radial-gradient(3px 3px at 250px 250px, #ffffff, rgba(0,0,0,0))',
            backgroundRepeat: 'repeat',
            backgroundSize: '300px 300px',
            opacity: 0.25
          }}
          animate={{ y: [0, -300] }}
          transition={{ ease: 'linear', duration: 10, repeat: Infinity }}
        />
      </div>

      <div
        className="overflow-hidden py-2 shadow-[0_0_15px_var(--brand)] relative z-10"
        style={{ background: 'var(--brand)', borderBottom: '2px solid var(--brand2)' }}
      >
        <div className="ticker flex gap-8 whitespace-nowrap text-[10px] arcade-font tracking-[0.3em]" style={{ color: 'var(--bg)' }}>
          {Array.from({ length: 12 }, (_, i) => (
            <span key={i}><span className="insert-coin-blink">▶ INSERT COIN</span> &nbsp;&nbsp; 👾 GAME MENU &nbsp;&nbsp; ⭐ SELECT ITEM &nbsp;&nbsp;</span>
          ))}
        </div>
      </div>

      {/* XP status bar */}
      <div
        className="flex items-center justify-between px-4 py-2"
        style={{
          background: 'var(--sf1)',
          borderBottom: '1px solid var(--bdr)',
          backgroundImage: 'repeating-linear-gradient(0deg, transparent, transparent 3px, rgba(255,255,255,0.015) 3px, rgba(255,255,255,0.015) 4px)',
        }}
      >
        <XpBar xp={xp} level={level} />
        {comboLabel && (
          <div className="flex flex-col items-end gap-0.5">
            <m.span
              key={comboLabel + combo}
              className="text-xs font-black uppercase tracking-widest"
              style={{ color: 'var(--brand2)', fontFamily: 'var(--font-display)', textShadow: '0 0 10px var(--brand2)' }}
              initial={{ scale: 2, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ type: 'spring', stiffness: 500, damping: 20 }}
            >
              {combo}x COMBO — {comboLabel}!
            </m.span>
            {/* Combo countdown bar — shrinks over 2.5s */}
            <div className="h-[2px] w-24 overflow-hidden" style={{ background: 'var(--bdr)' }}>
              <div
                key={combo}
                className="h-full"
                style={{
                  background: 'var(--brand2)',
                  animation: 'combo-shrink 2.5s linear forwards',
                }}
              />
            </div>
          </div>
        )}
        {!comboLabel && <span className="text-[10px]" style={{ color: 'var(--txt3)' }}>TAP ITEMS TO EARN XP</span>}
      </div>

      {/* HUD tab bar — sticky with scanlines + LEVEL badge */}
      <div
        className="sticky top-0 z-[45] flex items-center gap-2 overflow-x-auto px-3 py-2.5 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
        style={{
          background: 'var(--glass)',
          backdropFilter: 'blur(14px)',
          borderBottom: '1px solid var(--bdr)',
          backgroundImage: 'repeating-linear-gradient(0deg, transparent, transparent 3px, rgba(255,255,255,0.018) 3px, rgba(255,255,255,0.018) 4px)',
        }}
      >
        <div className="flex flex-1 gap-2 overflow-x-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          {categories.map((cat, i) => {
            const isActive = cat.id === activeId
            const cc = ACCENT_COLORS[i % ACCENT_COLORS.length]
            const emoji = CAT_EMOJIS[i % CAT_EMOJIS.length]
            return (
              <m.button id={`nav-btn-${cat.id}`}
                key={cat.id}
                onClick={() => requestJump(cat.id)}
                whileTap={{ scale: 0.9 }}
                animate={isActive ? { scale: [1, 1.08, 1] } : { scale: 1 }}
                transition={{ type: 'spring', stiffness: 500, damping: 18 }}
                className="shrink-0 rounded-none px-3.5 py-2 text-xs font-black uppercase tracking-wide transition-all"
                style={{
                  background: isActive ? cc : 'transparent',
                  color: isActive ? 'var(--bg)' : 'var(--txt2)',
                  border: `1.5px solid ${isActive ? cc : 'var(--bdr)'}`,
                  boxShadow: isActive ? `0 0 18px ${cc}, inset 0 0 8px rgba(255,255,255,0.1)` : 'none',
                  fontFamily: 'var(--font-body)',
                  clipPath: isActive ? 'polygon(6px 0%, 100% 0%, calc(100% - 6px) 100%, 0% 100%)' : 'none',
                }}
              >
                <span className="mr-1">{emoji}</span>{cat.name}
              </m.button>
            )
          })}
        </div>
        {/* Stage counter */}
        <div
          className="shrink-0 rounded-none px-2.5 py-1.5 text-[10px] font-black uppercase tracking-widest"
          style={{
            border: '1.5px solid var(--brand)',
            color: 'var(--brand)',
            fontFamily: 'var(--font-body)',
            whiteSpace: 'nowrap',
            textShadow: '0 0 6px var(--brand)',
            boxShadow: '0 0 8px var(--brand), inset 0 0 4px rgba(139,92,246,0.2)',
          }}
        >
          STAGE {String(activeIdx + 1).padStart(2, '0')}/{String(categories.length).padStart(2, '0')}
        </div>
      </div>

      {/* Spring-bounce content */}
      <AnimatePresence mode="wait">
        <m.div
          key={activeId}
          initial={{ x: 60, scale: 0.96, opacity: 0 }}
          animate={{ x: 0, scale: 1, opacity: 1 }}
          exit={{ x: -40, scale: 0.97, opacity: 0 }}
          transition={{ type: 'spring', stiffness: 380, damping: 26 }}
          className="px-3 pb-6 pt-4"
        >
          {/* Category title */}
          <div className="mb-4 flex items-center gap-3">
            <div className="h-px flex-1" style={{ background: accentColor, opacity: 0.4 }} />
            <m.h2
              key={activeId}
              className="text-xs arcade-font tracking-[0.2em]"
              style={{
                color: accentColor,
                textShadow: `0 0 12px ${accentColor}`,
                lineHeight: 1.5,
              }}
              initial={{ opacity: 0, y: -8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
            >
              <GlitchText text={categories.find((c) => c.id === activeId)?.name ?? ''} color={accentColor} />
            </m.h2>
            <div className="h-px flex-1" style={{ background: accentColor, opacity: 0.4 }} />
            <span className="text-[10px] font-bold" style={{ color: 'var(--txt3)' }}>{catItems.length} ITEMS</span>
          </div>

          {/* Cards — 1 col on small mobile, 2 col on wider */}
          <m.div 
            className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3 lg:gap-4 relative z-10"
            variants={staggerContainer}
            initial="hidden"
            animate="show"
          >
            {catItems.map((item, idx) => {
              const imgUrl = cdnUrl(itemImageKey(item))
              const cardAccent = ACCENT_COLORS[(activeIdx + idx) % ACCENT_COLORS.length]
              const isBestseller = item.badge === 'bestseller' || item.is_featured
              return (
                <m.button
                  key={item.id}
                  custom={idx}
                  variants={tiltReveal}
                  initial="hidden"
                  whileInView="show"
                  viewport={{ once: true, margin: '-20px' }}
                  whileTap={{ scale: 0.96 }}
                  onClick={(e) => {
                    openItem(item)
                    track('item_view', { business_id: item.business_id, item_id: item.id })
                    if (item.is_available) earnXp(XP_PER_VIEW, e.clientX, e.clientY, cardAccent)
                  }}
                  className={`flex overflow-hidden text-left relative ${imgUrl ? 'flex-col' : 'col-span-full flex-col gap-4 p-5'}`}
                  style={{
                    background: 'var(--sf1)',
                    border: imgUrl ? `1.5px solid var(--bdr)` : `2px dashed ${cardAccent}`,
                    borderTop: `3px solid ${cardAccent}`,
                    opacity: item.is_available ? 1 : 0.5,
                    borderRadius: 0,
                    clipPath: 'polygon(0 0, calc(100% - 10px) 0, 100% 10px, 100% 100%, 10px 100%, 0 calc(100% - 10px))',
                    transition: 'box-shadow 0.15s',
                  }}
                  onMouseEnter={(e) => {
                    (e.currentTarget as HTMLButtonElement).style.boxShadow = `0 0 20px ${cardAccent}55, 0 0 40px ${cardAccent}22`
                  }}
                  onMouseLeave={(e) => {
                    (e.currentTarget as HTMLButtonElement).style.boxShadow = 'none'
                  }}
                >
                  {/* Bestseller achievement badge */}
                  {isBestseller && (
                    <m.div
                      className="absolute right-2 top-2 z-10 flex items-center gap-1 px-1.5 py-0.5 text-[9px] font-black uppercase tracking-widest"
                      style={{
                        background: 'var(--brand3)',
                        color: 'var(--bg)',
                        fontFamily: 'var(--font-body)',
                        boxShadow: '0 0 10px var(--brand3)',
                      }}
                      animate={{ opacity: [1, 0.6, 1], boxShadow: ['0 0 10px var(--brand3)', '0 0 20px var(--brand3)', '0 0 10px var(--brand3)'] }}
                      transition={{ duration: 1.5, repeat: Infinity, ease: 'easeInOut' }}
                    >
                      ⭐ TOP
                    </m.div>
                  )}

                  {imgUrl ? (
                    <>
                      {/* Image */}
                      <div className="relative overflow-hidden" style={{ aspectRatio: '16/9', background: 'var(--sf2)' }}>
                        <Image src={imgUrl} alt={item.name} fill className="object-cover transition-transform duration-300 hover:scale-105" sizes="(max-width:640px) 95vw, (max-width:768px) 50vw, 33vw" />
                        {/* Scanlines overlay on image */}
                        <div
                          className="pointer-events-none absolute inset-0"
                          style={{ backgroundImage: 'repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(0,0,0,0.08) 2px, rgba(0,0,0,0.08) 3px)' }}
                        />
                        {!item.is_available && (
                          <div className="absolute inset-0 flex items-center justify-center" style={{ background: 'rgba(180,0,0,0.8)' }}>
                            <m.span
                              className="px-2 py-1 text-xs font-black uppercase tracking-widest text-white"
                              style={{ border: '1px solid rgba(255,255,255,0.6)', fontFamily: 'var(--font-body)' }}
                              animate={{ opacity: [1, 0.5, 1] }}
                              transition={{ duration: 0.9, repeat: Infinity }}
                            >
                              GAME OVER
                            </m.span>
                          </div>
                        )}
                      </div>
                      {/* Card footer */}
                      <div className="flex flex-col gap-2 p-3 relative h-full">
                        <p className="text-[12px] arcade-font leading-snug line-clamp-2" style={{ color: 'var(--txt)', lineHeight: 1.4, marginBottom: '0.25rem' }}>
                          {item.name}
                        </p>
                        {item.description && (
                          <p className="text-[10px] arcade-font line-clamp-1" style={{ color: 'var(--txt3)', lineHeight: 1.4 }}>{item.description}</p>
                        )}
                        <div className="flex items-end justify-between gap-1.5">
                          <div className="flex flex-wrap items-center gap-1.5 pb-0.5">
                            <VegMark dietary={item.dietary} size="xs" />
                            {item.badge && <ItemBadge badge={item.badge} />}
                          </div>
                          <div className="flex flex-col items-end shrink-0 gap-0.5">
                            {item.compare_price && item.compare_price > item.price && <s className="opacity-50 font-normal text-[10px] leading-none">{formatPrice(item.compare_price)}</s>}
                            <m.span
                              className="px-2 py-1 text-[10px] arcade-font leading-none"
                              style={{
                                color: cardAccent,
                                border: `1.5px solid ${cardAccent}`,
                                borderRadius: 0,
                                textShadow: `0 0 6px ${cardAccent}`,
                                boxShadow: `0 0 6px ${cardAccent}33`,
                              }}
                            >
                              [{formatPrice(item.price)}]
                            </m.span>
                          </div>
                        </div>
                        {/* XP reward hint */}
                        {item.is_available && (
                          <p className="text-[9px] font-bold uppercase tracking-widest" style={{ color: 'var(--txt3)' }}>
                            TAP FOR +{XP_PER_VIEW} XP
                          </p>
                        )}
                      </div>
                    </>
                  ) : (
                    <>
                      <div className="absolute inset-0 pointer-events-none overflow-hidden" style={{ background: `radial-gradient(circle at top right, ${cardAccent}15 0%, transparent 80%)` }}>
                        <Icon size={120} className="absolute -right-4 -bottom-4 opacity-[0.03]" style={{ color: cardAccent, transform: 'rotate(-15deg)' }} />
                      </div>
                      
                      <div className="flex-1 min-w-0 relative z-10 w-full text-center">
                        <div className="w-full grid grid-cols-[1fr_minmax(0,1.5fr)_1fr] items-start gap-4 mb-2">
                          <div className="flex flex-wrap items-center justify-start gap-1.5 pt-1">
                            <VegMark dietary={item.dietary} size="xs" />
                            {item.badge && <ItemBadge badge={item.badge} />}
                            {!item.is_available && (
                              <span className="text-[9px] font-bold uppercase tracking-widest" style={{ color: 'var(--txt3)' }}>OUT</span>
                            )}
                          </div>
                          
                          <div className="flex flex-col items-center justify-center min-w-0">
                            <p className="text-[14px] arcade-font leading-snug w-full" style={{ color: 'var(--txt)', lineHeight: 1.4 }}>
                              {item.name}
                            </p>
                            {item.description && (
                              <p className="text-[10px] arcade-font line-clamp-2 mt-1" style={{ color: 'var(--txt3)', lineHeight: 1.4 }}>{item.description}</p>
                            )}
                          </div>

                          <div className="flex flex-col items-end justify-start shrink-0 gap-0.5">
                            {item.compare_price && item.compare_price > item.price && <s className="opacity-50 font-normal text-[10px] leading-none">{formatPrice(item.compare_price)}</s>}
                            <span className="px-2 py-1 text-[12px] arcade-font leading-none" style={{ color: cardAccent, textShadow: `0 0 6px ${cardAccent}` }}>
                              [{formatPrice(item.price)}]
                            </span>
                          </div>
                        </div>

                        <div className="mt-4 pt-3 border-t border-dashed flex flex-wrap items-center justify-between gap-1.5" style={{ borderColor: `${cardAccent}44` }}>
                          <div className="flex items-center gap-1.5">
                            {/* Empty space to balance XP on right */}
                          </div>
                          {item.is_available && (
                            <p className="text-[9px] font-bold uppercase tracking-widest" style={{ color: cardAccent }}>
                              +{XP_PER_VIEW} XP
                            </p>
                          )}
                        </div>
                      </div>
                    </>
                  )}
                </m.button>
              )
            })}
            {catItems.length === 0 && (
              <div className="col-span-2 flex flex-col items-center gap-3 py-16">
                <m.span
                  className="text-4xl"
                  animate={{ rotate: [0, 10, -10, 0] }}
                  transition={{ duration: 1, repeat: Infinity, ease: 'easeInOut' }}
                >
                  👾
                </m.span>
                <p className="text-xs font-bold uppercase tracking-widest" style={{ color: 'var(--txt3)' }}>
                  NO ITEMS LOADED
                </p>
              </div>
            )}
          </m.div>
        </m.div>
      </AnimatePresence>
    </div>
  )
}
