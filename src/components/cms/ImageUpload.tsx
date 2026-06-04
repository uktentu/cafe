'use client'

import { useEffect, useRef, useState } from 'react'
import { UploadCloud, X } from 'lucide-react'
import { cn } from '@/lib/utils'

interface ImageUploadProps {
  /** Currently chosen File (overrides existing preview). */
  file: File | null
  /** URL of the already-saved image (shown when no new file chosen). */
  existingUrl?: string | null
  onChange: (file: File | null) => void
  aspect?: string // tailwind aspect class, e.g. 'aspect-[4/3]'
}

const MAX_MB = 10

export function ImageUpload({ file, existingUrl, onChange, aspect = 'aspect-[4/3]' }: ImageUploadProps) {
  const inputRef = useRef<HTMLInputElement>(null)
  const [error, setError] = useState<string | null>(null)
  const [preview, setPreview] = useState<string | null>(null)

  useEffect(() => {
    if (!file) {
      setPreview(null)
      return
    }
    const url = URL.createObjectURL(file)
    setPreview(url)
    return () => URL.revokeObjectURL(url)
  }, [file])

  function pick(f: File | undefined | null) {
    setError(null)
    if (!f) return
    if (!f.type.startsWith('image/')) {
      setError('Please choose an image file.')
      return
    }
    if (f.size > MAX_MB * 1024 * 1024) {
      setError(`Image must be under ${MAX_MB}MB.`)
      return
    }
    onChange(f)
  }

  const shown = preview ?? existingUrl ?? null

  return (
    <div className="space-y-2">
      <div
        onClick={() => inputRef.current?.click()}
        onDragOver={(e) => e.preventDefault()}
        onDrop={(e) => {
          e.preventDefault()
          pick(e.dataTransfer.files?.[0])
        }}
        className={cn(
          'relative flex cursor-pointer items-center justify-center overflow-hidden rounded-xl border-2 border-dashed border-neutral-300 bg-neutral-50',
          aspect,
        )}
      >
        {shown ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={shown} alt="Preview" className="h-full w-full object-cover" />
        ) : (
          <div className="flex flex-col items-center gap-1 text-neutral-400">
            <UploadCloud className="h-7 w-7" />
            <span className="text-xs">Tap to upload or drag a photo</span>
          </div>
        )}
        {shown && (
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation()
              onChange(null)
            }}
            className="absolute right-2 top-2 flex h-7 w-7 items-center justify-center rounded-full bg-black/60 text-white"
            aria-label="Remove image"
          >
            <X className="h-4 w-4" />
          </button>
        )}
      </div>
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={(e) => pick(e.target.files?.[0])}
      />
      {error && <p className="text-xs text-red-500">{error}</p>}
    </div>
  )
}
