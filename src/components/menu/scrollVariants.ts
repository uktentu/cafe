// Reusable Framer Motion scroll-reveal variants. Each template picks a flavour
// so the whole catalogue feels varied — diagonal (45°), rise, drift, zoom, etc.
// Use with: initial="hidden" whileInView="show" viewport={{ once:true }}

import type { Variants } from 'framer-motion'

const EASE_OUT = [0.22, 1, 0.36, 1] as const
const EASE_SPRING = [0.34, 1.3, 0.64, 1] as const

/** 45° diagonal reveal — slides up-and-in from the lower-left corner. */
export const diagonalReveal: Variants = {
  hidden: { opacity: 0, x: -28, y: 28, rotate: -1.5 },
  show: (i: number = 0) => ({
    opacity: 1, x: 0, y: 0, rotate: 0,
    transition: { duration: 0.5, delay: (i % 8) * 0.05, ease: EASE_OUT },
  }),
}

/** 45° diagonal reveal mirrored — from the lower-right. */
export const diagonalRevealR: Variants = {
  hidden: { opacity: 0, x: 28, y: 28, rotate: 1.5 },
  show: (i: number = 0) => ({
    opacity: 1, x: 0, y: 0, rotate: 0,
    transition: { duration: 0.5, delay: (i % 8) * 0.05, ease: EASE_OUT },
  }),
}

/** Soft vertical rise. */
export const rise: Variants = {
  hidden: { opacity: 0, y: 26 },
  show: (i: number = 0) => ({
    opacity: 1, y: 0,
    transition: { duration: 0.45, delay: (i % 8) * 0.05, ease: EASE_OUT },
  }),
}

/** Zoom-in pop (spring overshoot). */
export const zoomPop: Variants = {
  hidden: { opacity: 0, scale: 0.86 },
  show: (i: number = 0) => ({
    opacity: 1, scale: 1,
    transition: { duration: 0.5, delay: (i % 8) * 0.05, ease: EASE_SPRING },
  }),
}

/** Horizontal drift from the left. */
export const driftLeft: Variants = {
  hidden: { opacity: 0, x: -36 },
  show: (i: number = 0) => ({
    opacity: 1, x: 0,
    transition: { duration: 0.45, delay: (i % 8) * 0.05, ease: EASE_OUT },
  }),
}

/** Alternating-side reveal — even from left, odd from right. */
export function alternateSide(i: number): Variants {
  const fromLeft = i % 2 === 0
  return {
    hidden: { opacity: 0, x: fromLeft ? -40 : 40 },
    show: {
      opacity: 1, x: 0,
      transition: { duration: 0.45, ease: EASE_OUT },
    },
  }
}

/** Blur-in editorial reveal. */
export const blurRise: Variants = {
  hidden: { opacity: 0, y: 20, filter: 'blur(8px)' },
  show: (i: number = 0) => ({
    opacity: 1, y: 0, filter: 'blur(0px)',
    transition: { duration: 0.6, delay: (i % 8) * 0.06, ease: EASE_OUT },
  }),
}

/** Glitch cut-in (Brutalist). */
export const glitchReveal: Variants = {
  hidden: { opacity: 0, x: -10, scale: 1.05, filter: 'hue-rotate(90deg)' },
  show: (i: number = 0) => ({
    opacity: 1, x: 0, scale: 1, filter: 'hue-rotate(0deg)',
    transition: { duration: 0.15, delay: (i % 8) * 0.04, ease: 'linear' },
  }),
}

/** Pixel drop (Arcade retro). */
export const pixelDrop: Variants = {
  hidden: { opacity: 0, y: -24 },
  show: (i: number = 0) => ({
    opacity: 1, y: 0,
    transition: { duration: 0.3, delay: (i % 8) * 0.05, ease: 'steps(4, end)' },
  }),
}

/** Ember rise (Steakhouse). */
export const emberRise: Variants = {
  hidden: { opacity: 0, y: 30, textShadow: '0 -10px 20px rgba(255,100,0,0)' },
  show: (i: number = 0) => ({
    opacity: 1, y: 0, textShadow: '0 0px 0px rgba(255,100,0,0)',
    transition: { duration: 0.8, delay: (i % 8) * 0.08, ease: EASE_OUT },
  }),
}

/** Float up (Aether spa). */
export const floatUp: Variants = {
  hidden: { opacity: 0, y: 40, filter: 'blur(12px)' },
  show: (i: number = 0) => ({
    opacity: 1, y: 0, filter: 'blur(0px)',
    transition: { duration: 1.2, delay: (i % 8) * 0.1, ease: [0.16, 1, 0.3, 1] },
  }),
}

/** Wave reveal (Coastal surf). */
export const waveReveal: Variants = {
  hidden: { opacity: 0, x: -40, y: 10, rotate: -2 },
  show: (i: number = 0) => ({
    opacity: 1, x: 0, y: 0, rotate: 0,
    transition: { duration: 0.7, delay: (i % 8) * 0.08, ease: [0.22, 1, 0.36, 1] },
  }),
}

/** Staggered container for layout group orchestrations. */
export const staggerContainer: Variants = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1,
      delayChildren: 0.05,
    },
  },
}

/** 3D Tilt reveal (e.g. for Arcade cards). */
export const tiltReveal: Variants = {
  hidden: { opacity: 0, rotateX: 20, y: 40, scale: 0.95 },
  show: (i: number = 0) => ({
    opacity: 1, rotateX: 0, y: 0, scale: 1,
    transition: { duration: 0.6, delay: (i % 8) * 0.06, ease: EASE_SPRING },
  }),
}

/** Individual letter drop reveal for typography (OnyxLayout). */
export const letterDrop: Variants = {
  hidden: { opacity: 0, y: -20, rotateX: -90 },
  show: {
    opacity: 1, y: 0, rotateX: 0,
    transition: { duration: 0.5, ease: EASE_SPRING },
  },
}

/** Sweeping glass shine gradient (FrostLayout). */
export const glassShine: Variants = {
  hidden: { backgroundPosition: '200% center' },
  show: {
    backgroundPosition: '-200% center',
    transition: { duration: 1.5, repeat: Infinity, repeatType: 'loop', ease: 'linear' },
  },
}

/** Wax-stamp / rubber-stamp reveal — scales down from 2× with impact. */
export const stampReveal: Variants = {
  hidden: { opacity: 0, scale: 2, rotate: -12, filter: 'blur(8px)' },
  show: (i: number = 0) => ({
    opacity: 1, scale: 1, rotate: 0, filter: 'blur(0px)',
    transition: { type: 'spring', stiffness: 500, damping: 22, delay: (i % 6) * 0.08 },
  }),
}

/** 3-D page turn — rotateY from 90° with perspective. */
export const pageTurn: Variants = {
  hidden: { opacity: 0, rotateY: 90, transformOrigin: 'left center' },
  show: {
    opacity: 1, rotateY: 0,
    transition: { duration: 0.55, ease: [0.22, 1, 0.36, 1] },
  },
  exit: { opacity: 0, rotateY: -90, transition: { duration: 0.35, ease: [0.55, 0, 0.78, 0] } },
}

/** Ink-bleed typography reveal — blurs then sharpens in. */
export const inkBleed: Variants = {
  hidden: { opacity: 0, filter: 'blur(12px)', letterSpacing: '0.3em' },
  show: (i: number = 0) => ({
    opacity: 1, filter: 'blur(0px)', letterSpacing: '0em',
    transition: { duration: 0.7, delay: (i % 6) * 0.07, ease: [0.22, 1, 0.36, 1] },
  }),
}

/** Camera aperture — clipPath iris open. */
export const apertureOpen: Variants = {
  hidden: { clipPath: 'circle(0% at 50% 50%)', opacity: 0 },
  show: (i: number = 0) => ({
    clipPath: 'circle(150% at 50% 50%)', opacity: 1,
    transition: { duration: 0.6, delay: (i % 8) * 0.045, ease: [0.22, 1, 0.36, 1] },
  }),
}

/** Chalk reveal — clipPath left-to-right with slight noise. */
export const chalkReveal: Variants = {
  hidden: { clipPath: 'inset(0 100% 0 0)', opacity: 0 },
  show: (i: number = 0) => ({
    clipPath: 'inset(0 0% 0 0)', opacity: 1,
    transition: { duration: 0.65, delay: (i % 6) * 0.07, ease: [0.34, 1.3, 0.64, 1] },
  }),
}

/** Magnetic float — gentle levitation for ambient hover. */
export const magneticFloat: Variants = {
  hidden: { opacity: 0, y: 24, scale: 0.95 },
  show: (i: number = 0) => ({
    opacity: 1, y: 0, scale: 1,
    transition: { type: 'spring', stiffness: 260, damping: 22, delay: (i % 8) * 0.07 },
  }),
}

