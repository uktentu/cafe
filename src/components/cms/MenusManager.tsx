'use client'

import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Plus, Pencil, Trash2, X, Check, CalendarClock, Star } from 'lucide-react'
import { useCms } from './Providers'
import { Toggle } from '@/components/ui/Toggle'
import { useCmsStore } from '@/stores/cms'
import {
  qk, fetchMenus, createMenu, updateMenu, deleteMenu,
  type MenuInput,
} from '@/lib/cms-queries'
import type { Menu as MenuRow } from '@/types/database'

function MenuForm({
  menu,
  businessId,
  onClose,
}: {
  menu: MenuRow | null
  businessId: string
  onClose: () => void
}) {
  const qc = useQueryClient()
  const pushToast = useCmsStore((s) => s.pushToast)
  const [name, setName] = useState(menu?.name ?? '')
  const [scheduleStart, setScheduleStart] = useState(menu?.schedule_start ?? '')
  const [scheduleEnd, setScheduleEnd] = useState(menu?.schedule_end ?? '')
  const [isDefault, setIsDefault] = useState(menu?.is_default ?? false)

  const save = useMutation({
    mutationFn: async () => {
      const input: MenuInput = {
        business_id: businessId,
        name: name.trim(),
        schedule_start: scheduleStart || null,
        schedule_end: scheduleEnd || null,
        is_default: isDefault,
        is_active: menu?.is_active ?? true,
      }
      if (menu) return updateMenu(menu.id, input)
      return createMenu(input)
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: qk.menus(businessId) })
      pushToast(menu ? 'Menu updated' : 'Menu created', 'success')
      onClose()
    },
    onError: () => pushToast('Save failed', 'error'),
  })

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center sm:items-center">
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />
      <div className="relative z-10 w-full max-w-md rounded-t-3xl bg-white dark:bg-neutral-900 p-6 shadow-2xl sm:rounded-2xl">
        <div className="mb-5 flex items-center justify-between">
          <h2 className="text-lg font-bold text-neutral-900 dark:text-neutral-100">{menu ? 'Edit menu' : 'New menu'}</h2>
          <button onClick={onClose} className="rounded-lg p-1.5 text-neutral-400 hover:bg-neutral-100">
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="space-y-4">
          <div>
            <label className="block text-xs font-semibold uppercase tracking-widest text-neutral-500 dark:text-neutral-400 mb-1.5">Menu name *</label>
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Breakfast, Lunch, Dinner…"
              className="w-full rounded-xl border border-neutral-200 dark:border-neutral-800 px-3.5 py-2.5 text-sm focus:border-amber-400 focus:outline-none"
            />
          </div>

          <div>
            <p className="mb-1.5 text-xs font-semibold uppercase tracking-widest text-neutral-500 dark:text-neutral-400">Schedule (optional)</p>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-[11px] text-neutral-400 mb-1">Start time</label>
                <input
                  type="time"
                  value={scheduleStart}
                  onChange={(e) => setScheduleStart(e.target.value)}
                  className="w-full rounded-xl border border-neutral-200 dark:border-neutral-800 px-3.5 py-2.5 text-sm focus:border-amber-400 focus:outline-none"
                />
              </div>
              <div>
                <label className="block text-[11px] text-neutral-400 mb-1">End time</label>
                <input
                  type="time"
                  value={scheduleEnd}
                  onChange={(e) => setScheduleEnd(e.target.value)}
                  className="w-full rounded-xl border border-neutral-200 dark:border-neutral-800 px-3.5 py-2.5 text-sm focus:border-amber-400 focus:outline-none"
                />
              </div>
            </div>
            <p className="mt-1.5 text-[11px] text-neutral-400">Leave blank to show this menu at all times.</p>
          </div>

          <label className="flex cursor-pointer items-center gap-3 rounded-xl border border-neutral-200 dark:border-neutral-800 p-3.5">
            <input
              type="checkbox"
              checked={isDefault}
              onChange={(e) => setIsDefault(e.target.checked)}
              className="h-4 w-4 rounded accent-amber-400"
            />
            <div>
              <p className="text-sm font-medium text-neutral-800 dark:text-neutral-200">Set as default menu</p>
              <p className="text-xs text-neutral-400">This menu is shown when no schedule applies.</p>
            </div>
          </label>
        </div>

        <button
          onClick={() => save.mutate()}
          disabled={save.isPending || !name.trim()}
          className="mt-5 flex w-full items-center justify-center gap-2 rounded-xl bg-amber-400 py-3 text-sm font-bold text-white hover:bg-amber-500 disabled:opacity-60 transition-colors"
        >
          <Check className="h-4 w-4" />
          {save.isPending ? 'Saving…' : 'Save menu'}
        </button>
      </div>
    </div>
  )
}

export function MenusManager() {
  const { business } = useCms()
  const bid = business.id
  const qc = useQueryClient()
  const pushToast = useCmsStore((s) => s.pushToast)
  const [editing, setEditing] = useState<MenuRow | null | 'new'>()

  const { data: menus = [], isLoading } = useQuery({
    queryKey: qk.menus(bid),
    queryFn: () => fetchMenus(bid),
  })

  const toggleMutation = useMutation({
    mutationFn: ({ id, active }: { id: string; active: boolean }) => updateMenu(id, { is_active: active }),
    onSuccess: () => qc.invalidateQueries({ queryKey: qk.menus(bid) }),
    onError: () => pushToast('Toggle failed', 'error'),
  })

  const deleteMutation = useMutation({
    mutationFn: (id: string) => deleteMenu(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: qk.menus(bid) })
      pushToast('Menu deleted', 'success')
    },
    onError: () => pushToast('Delete failed', 'error'),
  })

  if (isLoading) return <div className="h-32 animate-pulse rounded-2xl bg-neutral-100" />

  return (
    <div className="space-y-4">
      {menus.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-2xl border-2 border-dashed border-neutral-200 dark:border-neutral-800 py-16">
          <CalendarClock className="mb-3 h-10 w-10 text-neutral-300" />
          <p className="font-medium text-neutral-600 dark:text-neutral-400">No menus yet</p>
          <p className="mt-1 text-sm text-neutral-400">Create separate menus for Breakfast, Lunch, Dinner, etc.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {menus.map((menu) => (
            <div key={menu.id} className="flex items-center gap-3 rounded-xl bg-white dark:bg-neutral-900 p-4 ring-1 ring-black/5 dark:ring-white/10">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-amber-50">
                <CalendarClock className="h-5 w-5 text-amber-500" />
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <p className="font-semibold text-neutral-900 dark:text-neutral-100 truncate">{menu.name}</p>
                  {menu.is_default && (
                    <span className="flex items-center gap-1 rounded-full bg-amber-100 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-amber-600">
                      <Star className="h-3 w-3" /> Default
                    </span>
                  )}
                </div>
                <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-0.5">
                  {menu.schedule_start && menu.schedule_end
                    ? `${menu.schedule_start} – ${menu.schedule_end}`
                    : 'No schedule (always visible)'}
                </p>
              </div>
              <div className="flex items-center gap-2">
                <Toggle
                  checked={menu.is_active}
                  onChange={(v) => toggleMutation.mutate({ id: menu.id, active: v })}
                  label={`${menu.name} active`}
                  size="sm"
                />
                <button
                  onClick={() => setEditing(menu)}
                  className="flex h-8 w-8 items-center justify-center rounded-lg text-neutral-400 hover:bg-neutral-100"
                >
                  <Pencil className="h-4 w-4" />
                </button>
                <button
                  onClick={() => { if (confirm(`Delete "${menu.name}"?`)) deleteMutation.mutate(menu.id) }}
                  className="flex h-8 w-8 items-center justify-center rounded-lg text-red-400 hover:bg-red-50"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      <button
        onClick={() => setEditing('new')}
        className="flex w-full items-center justify-center gap-2 rounded-xl border-2 border-dashed border-neutral-200 dark:border-neutral-800 py-4 text-sm font-semibold text-neutral-500 dark:text-neutral-400 hover:border-amber-400 hover:text-amber-500 transition-colors"
      >
        <Plus className="h-4 w-4" /> New menu
      </button>

      {editing && (
        <MenuForm
          menu={editing === 'new' ? null : editing}
          businessId={bid}
          onClose={() => setEditing(undefined)}
        />
      )}
    </div>
  )
}
