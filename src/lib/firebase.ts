/* eslint-disable @typescript-eslint/no-explicit-any */

// ════════════════════════════════════════════════════════════════════
// firebase.ts — client analytics. Uses GA4 (gtag.js), which is exactly what
// Firebase Analytics wraps. We load gtag directly (keyed by the per-client
// Measurement ID) so NOTHING heavy lands in the Basic bundle (< 120KB budget).
//
// track() ALSO mirrors a subset of events into analytics_events for CMS charts
// — via navigator.sendBeacon to /api/track, so @supabase/supabase-js never
// enters the public menu bundle.
// ════════════════════════════════════════════════════════════════════
'use client'

import type { AnalyticsEventType } from '@/types/database'

declare global {
  interface Window {
    dataLayer?: unknown[]
    gtag?: (...args: unknown[]) => void
  }
}

let initialized = false
let sessionId = ''

const MIRRORED: ReadonlySet<AnalyticsEventType> = new Set<AnalyticsEventType>([
  'page_view', 'item_view', 'whatsapp_click', 'call_click',
  'maps_click', 'reservation_submit', 'category_tap',
])

function getSessionId(): string {
  if (sessionId) return sessionId
  if (typeof window === 'undefined') return ''
  const KEY = 'menuos_sid'
  let sid = sessionStorage.getItem(KEY)
  if (!sid) {
    sid = (crypto.randomUUID?.() ?? Math.random().toString(36).slice(2)) as string
    sessionStorage.setItem(KEY, sid)
  }
  sessionId = sid
  return sid
}

/** Load gtag for the client's GA4 Measurement ID. Idempotent. */
export function initAnalytics(measurementId?: string | null): void {
  if (initialized || typeof window === 'undefined') return
  const id = measurementId ?? process.env.NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID
  if (!id) return
  initialized = true

  const s = document.createElement('script')
  s.async = true
  s.src = `https://www.googletagmanager.com/gtag/js?id=${id}`
  document.head.appendChild(s)

  window.dataLayer = window.dataLayer || []
  window.gtag = function gtag() {
    // eslint-disable-next-line prefer-rest-params
    window.dataLayer!.push(arguments)
  }
  window.gtag('js', new Date())
  window.gtag('config', id, { send_page_view: false })
}

export interface TrackParams {
  business_id?: string
  item_id?: string | null
  [key: string]: unknown
}

let analyticsQueue: any[] = []

function flushAnalytics() {
  if (analyticsQueue.length === 0) return
  
  const payload = JSON.stringify(analyticsQueue)
  analyticsQueue = [] // Clear immediately

  try {
    if (navigator.sendBeacon) {
      navigator.sendBeacon('/api/track', new Blob([payload], { type: 'application/json' }))
    } else {
      void fetch('/api/track', {
        method: 'POST',
        body: payload,
        keepalive: true,
        headers: { 'content-type': 'application/json' },
      })
    }
  } catch {
    /* analytics must never break the page */
  }
}

// Setup visibility listener to flush on exit
if (typeof window !== 'undefined') {
  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'hidden') {
      flushAnalytics()
    }
  })
}

/** Fire a GA4 event and (for mirrored types) queue it for /api/track. */
export function track(eventType: AnalyticsEventType, params: TrackParams = {}): void {
  if (typeof window === 'undefined') return
  const sid = getSessionId()

  // 1. GA4
  window.gtag?.('event', eventType, { ...params, session_id: sid })

  // 2. Supabase mirror via batching
  if (params.business_id && MIRRORED.has(eventType)) {
    analyticsQueue.push({
      business_id: params.business_id,
      event_type: eventType,
      item_id: params.item_id ?? null,
      session_id: sid,
    })
  }
}
