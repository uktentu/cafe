'use client'

import Link from 'next/link'
import { Plus, UtensilsCrossed, FolderTree, PackageX } from 'lucide-react'
import { AnimatedNumber } from '@/components/motion/AnimatedNumber'

interface Stats {
  items: number
  soldOut: number
  categories: number
}

export function StatCards({ stats }: { stats: Stats }) {
  const cards = [
    { label: 'Menu items', value: stats.items, icon: UtensilsCrossed, color: '#F59E0B' },
    { label: 'Sold out', value: stats.soldOut, icon: PackageX, color: '#EF4444' },
    { label: 'Categories', value: stats.categories, icon: FolderTree, color: '#22C55E' },
  ]
  return (
    <div className="grid grid-cols-3 gap-3 md:gap-4">
      {cards.map((c) => {
        const Icon = c.icon
        return (
          <div key={c.label} className="rounded-2xl bg-white p-4 ring-1 ring-black/5 md:p-5">
            <Icon className="h-5 w-5" style={{ color: c.color }} />
            <div className="mt-3 text-2xl font-semibold text-neutral-900 md:text-3xl">
              <AnimatedNumber value={c.value} />
            </div>
            <div className="text-xs text-neutral-500 md:text-sm">{c.label}</div>
          </div>
        )
      })}
    </div>
  )
}

export function QuickActions() {
  return (
    <div className="flex flex-wrap gap-3">
      <Link
        href="/cms/items/new"
        className="inline-flex h-[42px] items-center gap-2 rounded-lg bg-amber-500 px-4 text-sm font-medium text-white"
      >
        <Plus className="h-4 w-4" /> Add item
      </Link>
      <Link
        href="/cms/items"
        className="inline-flex h-[42px] items-center gap-2 rounded-lg bg-white px-4 text-sm font-medium text-neutral-800 ring-1 ring-neutral-300"
      >
        <UtensilsCrossed className="h-4 w-4" /> Manage menu
      </Link>
    </div>
  )
}
