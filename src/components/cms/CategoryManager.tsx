'use client'

import { useState } from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { Plus, Trash2, Check, X, Pencil, GripVertical } from 'lucide-react'
import { useCms } from './Providers'
import { Button } from '@/components/ui/Button'
import { Input, Select } from '@/components/ui/Input'
import { useCmsStore } from '@/stores/cms'
import { getConfig } from '@/lib/config'
import {
  qk, fetchCategories, createCategory, updateCategory, deleteCategory, reorderCategories,
} from '@/lib/cms-queries'
import { getCategoryIcon, CATEGORY_ICON_NAMES } from '@/components/menu/categoryIcon'
import type { Category } from '@/types/database'

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

function SortableCategory({
  category,
  editingThis,
  editName,
  setEditName,
  editIcon,
  setEditIcon,
  saveEdit,
  setEditId,
  remove,
}: {
  category: Category
  editingThis: boolean
  editName: string
  setEditName: (v: string) => void
  editIcon: string
  setEditIcon: (v: string) => void
  saveEdit: (id: string) => void
  setEditId: (id: string | null) => void
  remove: (c: Category) => void
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: category.id })
  const style = { transform: CSS.Transform.toString(transform), transition, zIndex: isDragging ? 10 : 1 }
  const Icon = getCategoryIcon(category.icon)

  return (
    <div ref={setNodeRef} style={style} className={`flex items-center gap-3 rounded-xl bg-white p-3 ring-1 ring-black/5 ${isDragging ? 'shadow-lg ring-black/10' : ''}`}>
      <button {...attributes} {...listeners} className="flex h-8 w-8 cursor-grab items-center justify-center text-neutral-400 hover:text-neutral-600 active:cursor-grabbing" aria-label="Drag handle">
        <GripVertical className="h-4 w-4" />
      </button>
      <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-neutral-100 text-neutral-500">
        <Icon className="h-4 w-4" />
      </span>
      {editingThis ? (
        <div className="flex flex-1 flex-wrap items-center gap-2">
          <Input value={editName} onChange={(e) => setEditName(e.target.value)} className="h-9 min-w-[120px] flex-1" />
          <Select value={editIcon} onChange={(e) => setEditIcon(e.target.value)} className="h-9 w-32">
            {CATEGORY_ICON_NAMES.map((n) => <option key={n} value={n}>{n}</option>)}
          </Select>
          <button onClick={() => saveEdit(category.id)} className="text-green-600" aria-label="Save"><Check className="h-5 w-5" /></button>
          <button onClick={() => setEditId(null)} className="text-neutral-400" aria-label="Cancel"><X className="h-5 w-5" /></button>
        </div>
      ) : (
        <>
          <span className="flex-1 font-medium text-neutral-900">{category.name}</span>
          <div className="flex items-center gap-1 text-neutral-400">
            <button onClick={() => { setEditId(category.id); setEditName(category.name); setEditIcon(category.icon ?? CATEGORY_ICON_NAMES[0]) }} className="p-1 hover:text-neutral-700" aria-label="Edit"><Pencil className="h-4 w-4" /></button>
            <button onClick={() => remove(category)} className="p-1 hover:text-red-500" aria-label="Delete"><Trash2 className="h-4 w-4" /></button>
          </div>
        </>
      )}
    </div>
  )
}

export function CategoryManager() {
  const { business } = useCms()
  const bid = business.id
  const qc = useQueryClient()
  const pushToast = useCmsStore((s) => s.pushToast)
  const { limits } = getConfig()

  const [newName, setNewName] = useState('')
  const [newIcon, setNewIcon] = useState(CATEGORY_ICON_NAMES[0])
  const [adding, setAdding] = useState(false)
  const [editId, setEditId] = useState<string | null>(null)
  const [editName, setEditName] = useState('')
  const [editIcon, setEditIcon] = useState('')

  const catsQ = useQuery({ queryKey: qk.categories(bid), queryFn: () => fetchCategories(bid) })
  const cats = catsQ.data ?? []
  const atLimit = cats.length >= limits.categories
  const invalidate = () => qc.invalidateQueries({ queryKey: qk.categories(bid) })

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  )

  async function add() {
    if (!newName.trim()) return
    setAdding(true)
    try {
      await createCategory({ business_id: bid, name: newName.trim(), icon: newIcon, sort_order: cats.length })
      setNewName('')
      await invalidate()
      pushToast('Category added')
    } catch (e) {
      pushToast((e as Error).message || 'Failed', 'error')
    } finally {
      setAdding(false)
    }
  }

  async function saveEdit(id: string) {
    try {
      await updateCategory(id, { name: editName.trim(), icon: editIcon })
      setEditId(null)
      await invalidate()
      pushToast('Category updated')
    } catch (e) {
      pushToast((e as Error).message || 'Failed', 'error')
    }
  }

  async function remove(c: Category) {
    if (!confirm(`Delete “${c.name}”? Items in it become uncategorised.`)) return
    try {
      await deleteCategory(c.id)
      await invalidate()
      pushToast('Category deleted')
    } catch (e) {
      pushToast((e as Error).message || 'Failed', 'error')
    }
  }

  async function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event
    if (!over || active.id === over.id) return

    const oldIndex = cats.findIndex((c) => c.id === active.id)
    const newIndex = cats.findIndex((c) => c.id === over.id)
    
    const reordered = arrayMove(cats, oldIndex, newIndex)
    const payload = reordered.map((c, i) => ({ id: c.id, sort_order: i }))
    qc.setQueryData<Category[]>(qk.categories(bid), reordered.map((c, i) => ({ ...c, sort_order: i })))
    
    try {
      await reorderCategories(payload)
    } catch {
      await invalidate()
      pushToast('Reorder failed', 'error')
    }
  }

  return (
    <div className="space-y-5">
      <header>
        <h1 className="text-2xl font-semibold text-neutral-900">Categories</h1>
        <p className="mt-1 text-sm text-neutral-500">
          {cats.length}{limits.categories < 99 ? ` / ${limits.categories}` : ''} categories
        </p>
      </header>

      {/* Add */}
      <div className="flex flex-wrap items-end gap-2 rounded-2xl bg-white p-4 ring-1 ring-black/5">
        <div className="min-w-[140px] flex-1">
          <Input value={newName} onChange={(e) => setNewName(e.target.value)} placeholder="New category name" />
        </div>
        <Select value={newIcon} onChange={(e) => setNewIcon(e.target.value)} className="w-36">
          {CATEGORY_ICON_NAMES.map((n) => <option key={n} value={n}>{n}</option>)}
        </Select>
        <Button onClick={add} loading={adding} disabled={atLimit || !newName.trim()}>
          <Plus className="h-4 w-4" /> Add
        </Button>
      </div>
      {atLimit && <p className="text-xs text-amber-600">Category limit reached — upgrade to add more.</p>}

      {/* List */}
      {catsQ.isLoading ? (
        <div className="h-40 animate-pulse rounded-2xl bg-neutral-200" />
      ) : cats.length === 0 ? (
        <div className="rounded-2xl bg-white p-10 text-center text-sm text-neutral-500 ring-1 ring-black/5">
          No categories yet.
        </div>
      ) : (
        <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
          <SortableContext items={cats.map(c => c.id)} strategy={verticalListSortingStrategy}>
            <div className="space-y-2">
              {cats.map((c) => (
                <SortableCategory
                  key={c.id}
                  category={c}
                  editingThis={editId === c.id}
                  editName={editName}
                  setEditName={setEditName}
                  editIcon={editIcon}
                  setEditIcon={setEditIcon}
                  saveEdit={saveEdit}
                  setEditId={setEditId}
                  remove={remove}
                />
              ))}
            </div>
          </SortableContext>
        </DndContext>
      )}
    </div>
  )
}
