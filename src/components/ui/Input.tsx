'use client'

import { forwardRef } from 'react'
import { cn } from '@/lib/utils'

// 16px font prevents iOS Safari auto-zoom; 42px height per the UI brief.
const FIELD =
  'h-[42px] w-full rounded-lg border border-neutral-300 bg-white px-3 text-[16px] text-neutral-900 outline-none transition focus:border-amber-500 focus:ring-[3px] focus:ring-amber-500/20 disabled:bg-neutral-100'

export const Input = forwardRef<HTMLInputElement, React.InputHTMLAttributes<HTMLInputElement>>(
  function Input({ className, ...rest }, ref) {
    return <input ref={ref} className={cn(FIELD, className)} {...rest} />
  },
)

export const Textarea = forwardRef<HTMLTextAreaElement, React.TextareaHTMLAttributes<HTMLTextAreaElement>>(
  function Textarea({ className, ...rest }, ref) {
    return (
      <textarea
        ref={ref}
        className={cn(FIELD, 'min-h-[88px] resize-y py-2 leading-relaxed', className)}
        {...rest}
      />
    )
  },
)

export const Select = forwardRef<HTMLSelectElement, React.SelectHTMLAttributes<HTMLSelectElement>>(
  function Select({ className, children, ...rest }, ref) {
    return (
      <select ref={ref} className={cn(FIELD, 'appearance-none pr-8', className)} {...rest}>
        {children}
      </select>
    )
  },
)

export function Field({
  label,
  error,
  hint,
  required,
  children,
}: {
  label: string
  error?: string
  hint?: string
  required?: boolean
  children: React.ReactNode
}) {
  return (
    <label className="block">
      <span className="mb-1 flex items-center gap-1 text-sm font-medium text-neutral-700">
        {label}
        {required && <span className="text-red-500">*</span>}
      </span>
      {children}
      {hint && !error && <span className="mt-1 block text-xs text-neutral-400">{hint}</span>}
      {error && <span className="mt-1 block text-xs text-red-500">{error}</span>}
    </label>
  )
}
