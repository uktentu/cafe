'use client'

import { m, type HTMLMotionProps } from 'framer-motion'
import { fadeUp, fadeUpTransition, stagger } from './presets'

interface StaggerListProps extends HTMLMotionProps<'div'> {
  whenVisible?: boolean
}

/** Container that staggers its direct children in. Pair with <StaggerList.Item>. */
export function StaggerList({ children, whenVisible = true, ...rest }: StaggerListProps) {
  const trigger = whenVisible
    ? { initial: 'initial' as const, whileInView: 'animate' as const, viewport: { once: true, margin: '-8% 0px' } }
    : { initial: 'initial' as const, animate: 'animate' as const }

  return (
    <m.div variants={stagger} {...trigger} {...rest}>
      {children}
    </m.div>
  )
}

/** A single staggered child. Use inside <StaggerList>. */
export function StaggerItem({ children, ...rest }: HTMLMotionProps<'div'>) {
  return (
    <m.div variants={fadeUp} transition={fadeUpTransition} {...rest}>
      {children}
    </m.div>
  )
}
