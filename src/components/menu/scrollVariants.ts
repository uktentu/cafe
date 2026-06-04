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
