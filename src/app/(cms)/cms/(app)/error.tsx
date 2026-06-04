'use client'

import { useEffect } from 'react'

export default function CmsError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    console.error('[CMS error]', error)
  }, [error])

  return (
    <main className="flex min-h-[100svh] items-center justify-center bg-[#F7F8FA] px-4">
      <div className="w-full max-w-md rounded-2xl bg-white p-7 text-center shadow-sm ring-1 ring-black/5">
        <h1 className="text-lg font-semibold text-[#1A1917]">Something went wrong</h1>
        <p className="mt-2 text-sm leading-relaxed text-neutral-500">
          {error.message || 'An unexpected error occurred. Please try again.'}
        </p>
        <button
          onClick={reset}
          className="mt-5 inline-flex h-[42px] items-center justify-center rounded-lg bg-amber-500 px-5 text-sm font-medium text-white"
        >
          Try again
        </button>
      </div>
    </main>
  )
}
