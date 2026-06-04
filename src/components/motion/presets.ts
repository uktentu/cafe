// Framer Motion variant presets (docs/04-UI-UX-BRIEF.md). Shared by every
// template so motion feels consistent. CSS-token easings live in globals.css.
import type { Variants, Transition } from 'framer-motion'

export const fadeUp: Variants = {
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: -10 },
}

export const fadeUpTransition: Transition = {
  duration: 0.42,
  ease: [0.25, 0.46, 0.45, 0.94],
}

export const stagger: Variants = {
  animate: { transition: { staggerChildren: 0.07, delayChildren: 0.08 } },
}

// Bottom-sheet modal with drag-dismiss (all templates except Onyx on tablet+).
export const sheetModal: Variants = {
  initial: { y: '100%', opacity: 0 },
  animate: { y: 0, opacity: 1 },
  exit: { y: '100%', opacity: 0 },
}

export const sheetTransition: Transition = { type: 'spring', stiffness: 400, damping: 40 }

// Center modal (Onyx template, tablet+).
export const centerModal: Variants = {
  initial: { scale: 0.93, opacity: 0 },
  animate: { scale: 1, opacity: 1 },
  exit: { scale: 0.93, opacity: 0 },
}

export const centerTransition: Transition = { type: 'spring', stiffness: 350, damping: 30 }

export const backdrop: Variants = {
  initial: { opacity: 0 },
  animate: { opacity: 1 },
  exit: { opacity: 0 },
}
