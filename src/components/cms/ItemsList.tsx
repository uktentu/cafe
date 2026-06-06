'use client'

import { memo, useCallback, useMemo, useState } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { AnimatePresence, m } from 'framer-motion'
import { Plus, Search, Pencil, GripVertical } from 'lucide-react'
import { useCms } from './Providers'
import { getCategoryIcon } from '@/components/menu/categoryIcon'
import { Toggle } from '@/components/ui/Toggle'
import { useCmsStore } from '@/stores/cms'
import { getConfig } from '@/lib/config'
import {
  qk, fetchItems, fetchCategories, toggleAvailability, reorderItems,
} from '@/lib/cms-queries'
import { cdnUrl, itemImageKey, type Item } from '@/types/database'
import { formatPrice } from '@/lib/utils'

import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from '@dnd-kit/core'
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
  useSortable,
} from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'

interface ItemRowProps {
  item: Item
  catName: string | undefined
  catIcon: string | null | undefined
  onToggle: (id: string, value: boolean) => void
  isSearchActive: boolean
  isOverLimit?: boolean
}

const SortableItemRow = memo(function SortableItemRow({ item, catName, catIcon, onToggle, isSearchActive, isOverLimit }: ItemRowProps) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: item.id })
  const style = { transform: CSS.Transform.toString(transform), transition, zIndex: isDragging ? 10 : 1 }
  const Icon = getCategoryIcon(catIcon)
  const thumb = cdnUrl(itemImageKey(item))
  
  return (
    <div ref={setNodeRef} style={style} className={`flex items-center gap-3 rounded-xl p-3 ring-1 ${isDragging ? 'shadow-lg ring-black/10 dark:ring-white/20 bg-white dark:bg-neutral-900' : 'ring-black/5 dark:ring-white/10 bg-white dark:bg-neutral-900'} ${isOverLimit ? 'opacity-60 grayscale bg-neutral-50 dark:bg-neutral-800/50' : ''}`}>
      {!isSearchActive && (
        <button {...attributes} {...listeners} className="flex h-8 w-8 cursor-grab items-center justify-center text-neutral-400 hover:text-neutral-600 dark:text-neutral-400 active:cursor-grabbing" aria-label="Drag handle">
          <GripVertical className="h-4 w-4" />
        </button>
      )}
      <div className="relative h-12 w-12 shrink-0 overflow-hidden rounded-lg bg-neutral-100 dark:bg-neutral-800">
        {item.image_mode !== 'none' && thumb ? (
          <Image src={thumb} alt="" fill sizes="48px" className="object-cover" />
        ) : (
          <span className="flex h-full w-full items-center justify-center text-neutral-400 dark:text-neutral-500">
            <Icon className="h-5 w-5" />
          </span>
        )}
      </div>
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          <p className="truncate font-medium text-neutral-900 dark:text-neutral-100">{item.name}</p>
          {isOverLimit && <span className="rounded bg-amber-100 px-1.5 py-0.5 text-[10px] font-bold text-amber-800">LIMIT REACHED</span>}
        </div>
        <p className="text-xs text-neutral-500 dark:text-neutral-400">
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
            disabled={isOverLimit}
          />
          <span className="mt-0.5 text-[10px] text-neutral-400">
            {item.is_available ? 'Available' : 'Sold out'}
          </span>
        </div>
        <Link
          href={`/cms/items/${item.id}`}
          className="flex h-9 w-9 items-center justify-center rounded-lg text-neutral-500 dark:text-neutral-400 hover:bg-neutral-100"
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
  const activeBranchId = useCmsStore((s) => s.activeBranchId)
  const { limits } = getConfig()
  const [search, setSearch] = useState('')
  const [catFilter, setCatFilter] = useState('all')

  const itemsQ = useQuery({ queryKey: qk.items(bid, activeBranchId), queryFn: () => fetchItems(bid, activeBranchId) })
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
  const mutate = toggle.mutate
  const handleToggle = useCallback(
    (id: string, value: boolean) => mutate({ id, value }),
    [mutate],
  )

  const items = itemsQ.data ?? []
  const filtered = items.filter((it) => {
    const matchesSearch = it.name.toLowerCase().includes(search.toLowerCase().trim())
    const matchesCat = catFilter === 'all' 
      ? true 
      : catFilter === 'none' 
        ? !it.category_id 
        : it.category_id === catFilter
    return matchesSearch && matchesCat
  })
  const atLimit = items.length >= limits.items
  const isSearchActive = search.trim().length > 0

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  )

  async function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event
    if (!over || active.id === over.id || isSearchActive) return

    const oldIndex = items.findIndex((i) => i.id === active.id)
    const newIndex = items.findIndex((i) => i.id === over.id)
    
    const reordered = arrayMove(items, oldIndex, newIndex)
    const payload = reordered.map((i, idx) => ({ id: i.id, sort_order: idx }))
    qc.setQueryData<Item[]>(qk.items(bid), reordered.map((item, idx) => ({ ...item, sort_order: idx })))
    
    try {
      await reorderItems(payload)
    } catch {
      await qc.invalidateQueries({ queryKey: qk.items(bid) })
      pushToast('Reorder failed', 'error')
    }
  }

  return (
    <div className="space-y-5">
      <header className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold text-neutral-900 dark:text-neutral-100">Items</h1>
          <p className="mt-1 text-sm text-neutral-500 dark:text-neutral-400">
            {items.length}
            {limits.items < 9999 ? ` / ${limits.items}` : ''} items
          </p>
        </div>
        <Link
          href="/cms/items/new"
          aria-disabled={atLimit}
          className={`inline-flex h-[42px] items-center gap-2 rounded-lg px-4 text-sm font-medium text-white ${atLimit ? 'pointer-events-none bg-neutral-300 dark:bg-neutral-700 dark:text-neutral-500' : 'bg-amber-500'}`}
          title={atLimit ? 'Item limit reached — upgrade to add more' : undefined}
        >
          <Plus className="h-4 w-4" /> Add item
        </Link>
      </header>

      <div className="flex flex-col sm:flex-row gap-3 relative">
        <div className="relative flex-1">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-neutral-400" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search items…"
            className="h-[42px] w-full rounded-lg border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-900 pl-9 pr-3 text-[16px] outline-none focus:border-amber-500 focus:ring-[3px] focus:ring-amber-500/20"
          />
        </div>
        <select
          value={catFilter}
          onChange={(e) => setCatFilter(e.target.value)}
          className="h-[42px] w-full sm:w-auto min-w-[160px] rounded-lg border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-900 px-3 text-sm outline-none focus:border-amber-500 focus:ring-[3px] focus:ring-amber-500/20"
        >
          <option value="all">All Categories</option>
          {Array.from(catById.entries()).map(([id, cat]) => (
            <option key={id} value={id}>{cat.name}</option>
          ))}
          <option value="none">Uncategorised</option>
        </select>
      </div>

      {itemsQ.isLoading ? (
        <div className="space-y-2">
          {[0, 1, 2].map((i) => <div key={i} className="h-[72px] animate-pulse rounded-xl bg-neutral-200 dark:bg-neutral-800" />)}
        </div>
      ) : itemsQ.isError ? (
        <p className="rounded-xl bg-red-50 dark:bg-red-950/50 p-4 text-sm text-red-600 dark:text-red-400">Failed to load items.</p>
      ) : filtered.length === 0 ? (
        <div className="rounded-2xl bg-white dark:bg-neutral-900 p-10 text-center ring-1 ring-black/5 dark:ring-white/10">
          <p className="text-sm text-neutral-500 dark:text-neutral-400">
            {items.length === 0 ? 'No items yet. Add your first menu item.' : 'No items match your filters.'}
          </p>
        </div>
      ) : (
        <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
          <SortableContext items={filtered.map(it => it.id)} strategy={verticalListSortingStrategy}>
            <div className="space-y-2">
              <AnimatePresence initial={false}>
                {filtered.map((it) => {
                  const cat = it.category_id ? catById.get(it.category_id) : null
                  const originalIndex = items.findIndex(i => i.id === it.id)
                  const isOverLimit = originalIndex >= limits.items
                  return (
                    <m.div
                      key={it.id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, scale: 0.95 }}
                      transition={{ duration: 0.2 }}
                      className="block"
                    >
                      <SortableItemRow
                        item={it}
                        catName={cat?.name}
                        catIcon={cat?.icon}
                        onToggle={handleToggle}
                        isSearchActive={isSearchActive}
                        isOverLimit={isOverLimit}
                      />
                    </m.div>
                  )
                })}
              </AnimatePresence>
            </div>
          </SortableContext>
        </DndContext>
      )}
    </div>
  )
}
