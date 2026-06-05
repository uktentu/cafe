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
  fetchTranslations, upsertTranslation, fetchMenus
} from '@/lib/cms-queries'
import { getCategoryIcon, CATEGORY_ICON_NAMES } from '@/components/menu/categoryIcon'
import type { Category, Menu } from '@/types/database'

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
  editNameTl,
  setEditNameTl,
  editMenuId,
  setEditMenuId,
  menus,
  secondaryLocale,
  saveEdit,
  setEditId,
  remove,
  isOverLimit,
}: {
  category: Category
  editingThis: boolean
  editName: string
  setEditName: (v: string) => void
  editIcon: string
  setEditIcon: (v: string) => void
  editNameTl: string
  setEditNameTl: (v: string) => void
  editMenuId: string
  setEditMenuId: (v: string) => void
  menus: Menu[]
  secondaryLocale: string | null
  saveEdit: (id: string) => void
  setEditId: (id: string | null) => void
  remove: (c: Category) => void
  isOverLimit?: boolean
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: category.id })
  const style = { transform: CSS.Transform.toString(transform), transition, zIndex: isDragging ? 10 : 1 }
  const Icon = getCategoryIcon(category.icon)

  return (
    <div ref={setNodeRef} style={style} className={`flex flex-col gap-2 rounded-xl border p-3 transition-shadow ${isDragging ? 'shadow-md border-neutral-300 bg-white' : 'border-neutral-200 bg-white hover:shadow-md'} ${isOverLimit ? 'opacity-60 grayscale bg-neutral-50' : ''}`}>
      <div className="flex items-center gap-3">
        <button {...attributes} {...listeners} className="cursor-grab text-neutral-400 hover:text-black active:cursor-grabbing">
          <GripVertical className="h-5 w-5" />
        </button>
        
        {editingThis ? (
          <div className="flex flex-1 flex-col gap-2">
            <div className="flex flex-1 items-center gap-2">
              <Select value={editIcon} onChange={(e) => setEditIcon(e.target.value)} className="w-[120px]">
                <option value="">No Icon</option>
                {CATEGORY_ICON_NAMES.map(n => <option key={n} value={n}>{n}</option>)}
              </Select>
              {menus.length > 0 && (
                <Select value={editMenuId} onChange={(e) => setEditMenuId(e.target.value)} className="w-[120px]">
                  <option value="">All Menus</option>
                  {menus.map(m => <option key={m.id} value={m.id}>{m.name}</option>)}
                </Select>
              )}
              <Input
                value={editName}
                onChange={(e) => setEditName(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && saveEdit(category.id)}
                autoFocus
              />
              <Button size="sm" onClick={() => saveEdit(category.id)}>
                <Check className="mr-1 h-4 w-4" /> Save
              </Button>
              <Button size="sm" variant="ghost" onClick={() => setEditId(null)}>
                <X className="h-4 w-4" />
              </Button>
            </div>
            {secondaryLocale && (
              <div className="flex items-center pl-[128px]">
                <Input
                  value={editNameTl}
                  onChange={(e) => setEditNameTl(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && saveEdit(category.id)}
                  placeholder={`Name (${secondaryLocale.toUpperCase()})`}
                  dir={secondaryLocale === 'ar' ? 'rtl' : 'ltr'}
                />
              </div>
            )}
          </div>
        ) : (
          <>
            {Icon && <Icon className="h-5 w-5 text-neutral-500" />}
            <span className="flex-1 font-medium text-neutral-900 flex items-center gap-2">
              {category.name}
              {menus.length > 0 && category.menu_id && (
                <span className="rounded bg-amber-100 px-1.5 py-0.5 text-[10px] uppercase text-amber-700">
                  {menus.find(m => m.id === category.menu_id)?.name ?? 'Unknown Menu'}
                </span>
              )}
              {isOverLimit && <span className="rounded bg-amber-100 px-1.5 py-0.5 text-[10px] font-bold text-amber-800">LIMIT REACHED</span>}
            </span>
            <div className="flex items-center gap-1">
              <Button size="sm" variant="ghost" onClick={() => setEditId(category.id)}>
                <Pencil className="h-4 w-4" />
              </Button>
              <Button size="sm" variant="ghost" onClick={() => remove(category)} className="text-red-500 hover:bg-red-50 hover:text-red-600">
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          </>
        )}
      </div>
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
  const [newMenuId, setNewMenuId] = useState('')
  const [adding, setAdding] = useState(false)
  const [editId, setEditId] = useState<string | null>(null)
  const [editName, setEditName] = useState('')
  const [editNameTl, setEditNameTl] = useState('')
  const [editIcon, setEditIcon] = useState('')
  const [editMenuId, setEditMenuId] = useState('')
  const [editDesc, setEditDesc] = useState('')

  const catsQ = useQuery({ queryKey: qk.categories(bid), queryFn: () => fetchCategories(bid) })
  const transQ = useQuery({ queryKey: qk.translations(bid), queryFn: () => fetchTranslations(bid) })
  const multiMenus = business.social_links?.multiple_menus_enabled === true
  const menusQ = useQuery({ queryKey: qk.menus(bid), queryFn: () => fetchMenus(bid), enabled: multiMenus })
  const menus = menusQ.data ?? []
  const translations = Array.isArray(transQ.data) ? transQ.data : []
  const secondaryLocaleSetting = translations.find((t) => t.entity_type === 'business' && t.field === '_system_secondary_locale')
  const secondaryLocale = secondaryLocaleSetting?.value || null

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
      const created = await createCategory({ business_id: bid, name: newName.trim(), icon: newIcon, sort_order: cats.length, menu_id: newMenuId || null })
      
      if (secondaryLocale) {
        try {
          const res = await fetch('/api/translate', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ text: newName.trim(), to: secondaryLocale })
          })
          const data = await res.json()
          if (data.translatedText) {
            await upsertTranslation(bid, 'category', created.id, secondaryLocale, 'name', data.translatedText)
            qc.invalidateQueries({ queryKey: qk.translations(bid) })
          }
        } catch (err) { console.error('Failed to auto-translate new category:', err) }
      }

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
    if (!editName.trim()) return
    try {
      const patch: Partial<Category> = { name: editName.trim(), icon: editIcon || null, description: editDesc.trim() || null, menu_id: editMenuId || null }
      await updateCategory(id, patch)
      if (secondaryLocale) {
        let finalNameTl = editNameTl.trim()
        
        if (!finalNameTl && editName.trim()) {
          try {
            const res = await fetch('/api/translate', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ text: editName.trim(), to: secondaryLocale })
            })
            const data = await res.json()
            if (data.translatedText) finalNameTl = data.translatedText
          } catch (err) { console.error('Failed to auto-translate category name:', err) }
        }

        await upsertTranslation(bid, 'category', id, secondaryLocale, 'name', finalNameTl)
        qc.invalidateQueries({ queryKey: qk.translations(bid) })
      }
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
        {menus.length > 0 && (
          <Select value={newMenuId} onChange={(e) => setNewMenuId(e.target.value)} className="w-36">
            <option value="">All Menus</option>
            {menus.map(m => <option key={m.id} value={m.id}>{m.name}</option>)}
          </Select>
        )}
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
              {cats.map((c, i) => (
                <SortableCategory
                  key={c.id}
                  category={c}
                  editingThis={editId === c.id}
                  editName={editName}
                  setEditName={setEditName}
                  editIcon={editIcon}
                  setEditIcon={setEditIcon}
                  editNameTl={editNameTl}
                  setEditNameTl={setEditNameTl}
                  editMenuId={editMenuId}
                  setEditMenuId={setEditMenuId}
                  menus={menus}
                  secondaryLocale={secondaryLocale}
                  saveEdit={saveEdit}
                  setEditId={(id) => {
                    setEditId(id)
                    if (id) {
                      const c = cats.find((x) => x.id === id)!
                      setEditName(c.name)
                      setEditDesc(c.description ?? '')
                      setEditMenuId(c.menu_id ?? '')
                      setEditNameTl(translations.find(t => t.entity_id === id && t.field === 'name')?.value ?? '')
                      setEditIcon(c.icon ?? '')
                    }
                  }}
                  remove={remove}
                  isOverLimit={i >= limits.categories}
                />
              ))}
            </div>
          </SortableContext>
        </DndContext>
      )}
    </div>
  )
}
