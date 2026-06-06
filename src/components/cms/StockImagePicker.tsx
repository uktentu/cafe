'use client'

import { useMemo, useState } from 'react'
import Image from 'next/image'
import { useQuery } from '@tanstack/react-query'
import { Check, Search } from 'lucide-react'
import { qk, fetchStockImages } from '@/lib/cms-queries'
import { cdnUrl, type StockCategory } from '@/types/database'
import { cn } from '@/lib/utils'

const CATEGORIES: { value: StockCategory | 'all'; label: string }[] = [
  { value: 'all', label: 'All' },
  { value: 'indian', label: 'Indian' },
  { value: 'chinese', label: 'Chinese' },
  { value: 'continental', label: 'Continental' },
  { value: 'street', label: 'Street' },
  { value: 'drinks', label: 'Drinks' },
  { value: 'desserts', label: 'Desserts' },
]

export function StockImagePicker({
  selected,
  onSelect,
}: {
  selected: string | null
  onSelect: (r2_key: string) => void
}) {
  const { data, isLoading, isError } = useQuery({ queryKey: qk.stock(), queryFn: fetchStockImages })
  const [cat, setCat] = useState<StockCategory | 'all'>('all')
  const [q, setQ] = useState('')

  const images = useMemo(() => {
    const list = data ?? []
    return list.filter((img) => {
      if (cat !== 'all' && img.category !== cat) return false
      if (q.trim()) {
        const needle = q.toLowerCase()
        return img.name.toLowerCase().includes(needle) || img.tags.some((t) => t.includes(needle))
      }
      return true
    })
  }, [data, cat, q])

  return (
    <div className="space-y-3">
      <div className="relative">
        <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-neutral-400" />
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Search stock photos…"
          className="h-10 w-full rounded-lg border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-900 pl-9 pr-3 text-[16px] outline-none focus:border-amber-500 focus:ring-[3px] focus:ring-amber-500/20"
        />
      </div>

      <div className="flex gap-1.5 overflow-x-auto pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        {CATEGORIES.map((c) => (
          <button
            key={c.value}
            type="button"
            onClick={() => setCat(c.value)}
            className={cn(
              'shrink-0 rounded-full px-3 py-1 text-xs font-medium',
              cat === c.value ? 'bg-amber-500 text-white' : 'bg-neutral-100 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-400',
            )}
          >
            {c.label}
          </button>
        ))}
      </div>

      {isLoading ? (
        <div className="grid grid-cols-4 gap-2">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="aspect-square animate-pulse rounded-lg bg-neutral-200 dark:bg-neutral-800" />
          ))}
        </div>
      ) : isError ? (
        <p className="text-sm text-red-600">Failed to load stock images.</p>
      ) : images.length === 0 ? (
        <p className="py-6 text-center text-sm text-neutral-400">No stock photos found.</p>
      ) : (
        <div className="grid max-h-72 grid-cols-4 gap-2 overflow-y-auto">
          {images.map((img) => {
            const isSel = selected === img.r2_key
            return (
              <button
                key={img.id}
                type="button"
                onClick={() => onSelect(img.r2_key)}
                title={img.name}
                className={cn(
                  'relative aspect-square overflow-hidden rounded-lg ring-2',
                  isSel ? 'ring-amber-500' : 'ring-transparent',
                )}
              >
                {cdnUrl(img.r2_key) ? (
                  <Image src={cdnUrl(img.r2_key)!} alt={img.name} fill sizes="80px" className="object-cover" />
                ) : (
                  // CDN not configured yet — show name as text placeholder
                  <span className="flex h-full w-full items-center justify-center bg-neutral-100 dark:bg-neutral-800 text-[10px] text-neutral-400 dark:text-neutral-500 p-1 text-center">
                    {img.name}
                  </span>
                )}
                {isSel && (
                  <span className="absolute right-1 top-1 flex h-5 w-5 items-center justify-center rounded-full bg-amber-500 text-white">
                    <Check className="h-3 w-3" strokeWidth={3} />
                  </span>
                )}
              </button>
            )
          })}
        </div>
      )}
    </div>
  )
}
