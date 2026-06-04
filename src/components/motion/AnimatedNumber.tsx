'use client'

import { useEffect, useRef } from 'react'
import { animate, useInView } from 'framer-motion'

interface AnimatedNumberProps {
  value: number
  duration?: number
  /** Decimal places to render. */
  decimals?: number
  prefix?: string
  suffix?: string
  className?: string
}

/** Count-up number (CMS dashboard stats). Animates once when scrolled into view. */
export function AnimatedNumber({
  value, duration = 1, decimals = 0, prefix = '', suffix = '', className,
}: AnimatedNumberProps) {
  const ref = useRef<HTMLSpanElement>(null)
  const inView = useInView(ref, { once: true })

  useEffect(() => {
    if (!inView) return
    const node = ref.current
    if (!node) return
    const controls = animate(0, value, {
      duration,
      ease: [0.25, 0.46, 0.45, 0.94],
      onUpdate(latest) {
        node.textContent = `${prefix}${latest.toFixed(decimals)}${suffix}`
      },
    })
    return () => controls.stop()
  }, [inView, value, duration, decimals, prefix, suffix])

  return (
    <span ref={ref} className={className}>
      {`${prefix}${(0).toFixed(decimals)}${suffix}`}
    </span>
  )
}
