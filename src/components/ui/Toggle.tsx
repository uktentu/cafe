'use client'

import { useState, useEffect } from 'react'
import { cn } from '@/lib/utils'

interface ToggleProps {
  checked: boolean
  onChange: (next: boolean) => void
  disabled?: boolean
  label?: string
  size?: 'sm' | 'md'
}

/** Accessible switch with a spring-y thumb (CSS). Large tap target on mobile. */
export function Toggle({ checked, onChange, disabled, label, size = 'md' }: ToggleProps) {
  const [optimistic, setOptimistic] = useState(checked)

  // Sync with prop when it changes
  useEffect(() => {
    setOptimistic(checked)
  }, [checked])

  const handleClick = () => {
    if (disabled) return
    const next = !optimistic
    setOptimistic(next) // Optimistic visual update instantly!
    onChange(next)
  }

  const dims = size === 'sm' ? { w: 36, h: 20, t: 14 } : { w: 44, h: 24, t: 18 }
  return (
    <button
      type="button"
      role="switch"
      aria-checked={optimistic}
      aria-label={label}
      disabled={disabled}
      onClick={handleClick}
      className={cn(
        'relative inline-flex shrink-0 items-center rounded-full transition-colors duration-150 disabled:opacity-50',
        optimistic ? 'bg-green-500' : 'bg-neutral-300 dark:bg-neutral-600',
      )}
      style={{ width: dims.w, height: dims.h }}
    >
      <span
        className="absolute rounded-full bg-white shadow transition-transform duration-150"
        style={{
          width: dims.t,
          height: dims.t,
          left: 3,
          transform: optimistic ? `translateX(${dims.w - dims.t - 6}px)` : 'translateX(0)',
          transitionTimingFunction: 'cubic-bezier(0.34, 1.56, 0.64, 1)',
        }}
      />
    </button>
  )
}
