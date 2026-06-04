'use client'

import { createContext, useContext, useState } from 'react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { LazyMotion } from 'framer-motion'
import type { Business, StaffRole } from '@/types/database'

const loadFeatures = () => import('@/components/motion/features').then((m) => m.default)

interface CmsContextValue {
  business: Business
  role: StaffRole
}
const CmsContext = createContext<CmsContextValue | null>(null)

/** Current business + role for CMS client components. */
export function useCms(): CmsContextValue {
  const ctx = useContext(CmsContext)
  if (!ctx) throw new Error('useCms must be used within <CmsProviders>')
  return ctx
}

export function CmsProviders({
  business,
  role,
  children,
}: {
  business: Business
  role: StaffRole
  children: React.ReactNode
}) {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: { staleTime: 30_000, refetchOnWindowFocus: false, retry: 1 },
        },
      }),
  )

  return (
    <QueryClientProvider client={queryClient}>
      <LazyMotion strict features={loadFeatures}>
        <CmsContext.Provider value={{ business, role }}>{children}</CmsContext.Provider>
      </LazyMotion>
    </QueryClientProvider>
  )
}
