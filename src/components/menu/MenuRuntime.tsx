'use client'

import { useEffect } from 'react'
import { LazyMotion, MotionConfig } from 'framer-motion'
import { initAnalytics, track } from '@/lib/firebase'

// Framer features load async (see components/motion/features.ts) so the heavy
// bundle never enters first-load JS — critical for the Basic < 120KB budget.
const loadFeatures = () => import('@/components/motion/features').then((m) => m.default)

interface MenuRuntimeProps {
  businessId: string
  measurementId: string | null
  children: React.ReactNode
}

/**
 * Client wrapper for the public menu: lazy-loads Framer features, honours
 * prefers-reduced-motion globally, boots GA4, and records one page_view.
 * `strict` enforces that every animated element uses `m.*` (not `motion.*`).
 */
export function MenuRuntime({ businessId, measurementId, children }: MenuRuntimeProps) {
  useEffect(() => {
    initAnalytics(measurementId)
    track('page_view', { business_id: businessId })
  }, [businessId, measurementId])

  return (
    <LazyMotion strict features={loadFeatures}>
      <MotionConfig reducedMotion="user">{children}</MotionConfig>
    </LazyMotion>
  )
}
