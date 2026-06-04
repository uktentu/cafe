'use client'

import { memo, useCallback, useMemo, useState } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useAutoAnimate } from '@formkit/auto-animate/react'
import { Plus, Search, Pencil } from 'lucide-react'
import { useCms } from './Providers'
import { getCategoryIcon } from '@/components/menu/categoryIcon'
import { Toggle } from '@/components/ui/Toggle'
import { useCmsStore } from '@/stores/cms'
import { getConfig } from '@/lib/config'
import {
  qk, fetchItems, fetchCategories, toggleAvailability,
} from '@/lib/cms-queries'
import { cdnUrl, itemImageKey, type Item } from '@/types/database'
import { formatPrice } from '@/lib/utils'

interface ItemRowProps {
  item: Item
  catName: string | undefined
  catIcon: string | null | undefined
  onToggle: (id: string, value: boolean) => void
}

const ItemRow = memo(function ItemRow({ item, catName, catIcon, onToggle }: ItemRowProps) {
  const Icon = getCategoryIcon(catIcon)
  const thumb = cdnUrl(itemImageKey(item))
  return (
    <div className="flex items-center gap-3 rounded-xl bg-white p-3 ring-1 ring-black/5">
      <div className="relative h-12 w-12 shrink-0 overflow-hidden rounded-lg bg-neutral-100">
        {item.image_mode !== 'none' && thumb ? (
          <Image src={thumb} alt="" fill sizes="48px" className="object-cover" />
        ) : (
          <span className="flex h-full w-full items-center justify-center text-neutral-400">
            <Icon className="h-5 w-5" />
          </span>
        )}
      </div>
      <div className="min-w-0 flex-1">
        <p className="truncate font-medium text-neutral-900">{item.name}</p>
        <p className="text-xs text-neutral-500">
          {catName ?? 'Uncategorised'} · {formatPrice(item.price)}
        </p>
      </div>
      <div className="flex items-center gap-3">
        <div className="flex flex-col items-center">
          <Toggle
            checked={item.is_available}
            onChange={(v) => onToggle(item.id, v)}
            label={`${item.name} available`}
            size="sm"
          />
          <span className="mt-0.5 text-[10px] text-neutral-400">
            {item.is_available ? 'Available' : 'Sold out'}
          </span>
        </div>
        <Link
          href={`/cms/items/${item.id}`}
          className="flex h-9 w-9 items-center justify-center rounded-lg text-neutral-500 hover:bg-neutral-100"
          aria-label={`Edit ${item.name}`}
        >
          <Pencil className="h-4 w-4" />
        </Link>
      </div>
    </div>
  )
})

export function ItemsList() {
  const { business } = useCms()
  const bid = business.id
  const qc = useQueryClient()
  const pushToast = useCmsStore((s) => s.pushToast)
  const { limits } = getConfig()
  const [search, setSearch] = useState('')
  const [listRef] = useAutoAnimate<HTMLDivElement>()

  const itemsQ = useQuery({ queryKey: qk.items(bid), queryFn: () => fetchItems(bid) })
  const catsQ = useQuery({ queryKey: qk.categories(bid), queryFn: () => fetchCategories(bid) })

  const catById = useMemo(() => {
    const map = new Map<string, { name: string; icon: string | null }>()
    catsQ.data?.forEach((c) => map.set(c.id, { name: c.name, icon: c.icon }))
    return map
  }, [catsQ.data])

  const toggle = useMutation({
    mutationFn: ({ id, value }: { id: string; value: boolean }) => toggleAvailability(id, value),
    onMutate: async ({ id, value }) => {
      await qc.cancelQueries({ queryKey: qk.items(bid) })
      const prev = qc.getQueryData<Item[]>(qk.items(bid))
      qc.setQueryData<Item[]>(qk.items(bid), (old) =>
        old?.map((it) => (it.id === id ? { ...it, is_available: value } : it)),
      )
      return { prev }
    },
    onError: (_e, _v, ctx) => {
      if (ctx?.prev) qc.setQueryData(qk.items(bid), ctx.prev)
      pushToast('Could not update — try again', 'error')
    },
    onSettled: () => qc.invalidateQueries({ queryKey: qk.items(bid) }),
  })

  // Stable callback — won't invalidate ItemRow memo on parent re-renders.
  // toggle.mutate is referentially stable across renders (TanStack Query).
  const mutate = toggle.mutate
  const handleToggle = useCallback(
    (id: string, value: boolean) => mutate({ id, value }),
    [mutate],
  )

  const items = itemsQ.data ?? []
  const filtered = items.filter((it) => it.name.toLowerCase().includes(search.toLowerCase().trim()))
  const atLimit = items.length >= limits.items

  return (
    <div className="space-y-5">
      <header className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold text-neutral-900">Items</h1>
          <p className="mt-1 text-sm text-neutral-500">
            {items.length}
            {limits.items < 9999 ? ` / ${limits.items}` : ''} items
          </p>
        </div>
        <Link
          href="/cms/items/new"
          aria-disabled={atLimit}
          className={`inline-flex h-[42px] items-center gap-2 rounded-lg px-4 text-sm font-medium text-white ${atLimit ? 'pointer-events-none bg-neutral-300' : 'bg-amber-500'}`}
          title={atLimit ? 'Item limit reached — upgrade to add more' : undefined}
        >
          <Plus className="h-4 w-4" /> Add item
        </Link>
      </header>

      <div className="relative">
        <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-neutral-400" />
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search items…"
          className="h-[42px] w-full rounded-lg border border-neutral-300 bg-white pl-9 pr-3 text-[16px] outline-none focus:border-amber-500 focus:ring-[3px] focus:ring-amber-500/20"
        />
      </div>

      {itemsQ.isLoading ? (
        <div className="space-y-2">
          {[0, 1, 2].map((i) => <div key={i} className="h-[72px] animate-pulse rounded-xl bg-neutral-200" />)}
        </div>
      ) : itemsQ.isError ? (
        <p className="rounded-xl bg-red-50 p-4 text-sm text-red-600">Failed to load items.</p>
      ) : filtered.length === 0 ? (
        <div className="rounded-2xl bg-white p-10 text-center ring-1 ring-black/5">
          <p className="text-sm text-neutral-500">
            {items.length === 0 ? 'No items yet. Add your first menu item.' : 'No items match your search.'}
          </p>
        </div>
      ) : (
        <div ref={listRef} className="space-y-2">
          {filtered.map((it) => {
            const cat = it.category_id ? catById.get(it.category_id) : null
            return (
              <ItemRow
                key={it.id}
                item={it}
                catName={cat?.name}
                catIcon={cat?.icon}
                onToggle={handleToggle}
              />
            )
          })}
        </div>
      )}
    </div>
  )
}
