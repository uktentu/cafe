'use client'

import { m, type HTMLMotionProps } from 'framer-motion'
import { fadeUp, fadeUpTransition } from './presets'

interface FadeUpProps extends HTMLMotionProps<'div'> {
  delay?: number
  /** When true, animate on scroll into view instead of on mount. */
  whenVisible?: boolean
}

/**
 * Fade + rise. On mount by default, or once on scroll-in (whenVisible).
 * Respects prefers-reduced-motion via the parent <MotionConfig reducedMotion="user">.
 */
export function FadeUp({ children, delay = 0, whenVisible = false, ...rest }: FadeUpProps) {
  const viewportProps = whenVisible
    ? { initial: 'initial' as const, whileInView: 'animate' as const, viewport: { once: true, margin: '-10% 0px' } }
    : { initial: 'initial' as const, animate: 'animate' as const }

  return (
    <m.div
      variants={fadeUp}
      transition={{ ...fadeUpTransition, delay }}
      {...viewportProps}
      {...rest}
    >
      {children}
    </m.div>
  )
}
