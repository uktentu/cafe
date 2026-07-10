'use client'

import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Plus, Trash2, Pencil, Users as UsersIcon } from 'lucide-react'
import { useCms } from './Providers'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { useCmsStore } from '@/stores/cms'
import { posQk, fetchTables, createTable, updateTable, deleteTable } from '@/lib/pos-queries'
import { getConfig } from '@/lib/config'
import { cn } from '@/lib/utils'
import type { RestaurantTable, TableStatus } from '@/types/database'

const STATUS_LABEL: Record<TableStatus, string> = {
  available: 'Available',
  occupied: 'Occupied',
  needs_cleaning: 'Needs Cleaning',
  reserved: 'Reserved',
}

const STATUS_DOT: Record<TableStatus, string> = {
  available: 'bg-emerald-500',
  occupied: 'bg-amber-500',
  needs_cleaning: 'bg-red-500',
  reserved: 'bg-blue-500',
}

function slugifyCode(label: string): string {
  return label.trim().toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '').slice(0, 20)
}

export function TablesManager() {
  const { business } = useCms()
  const bid = business.id
  const qc = useQueryClient()
  const pushToast = useCmsStore((s) => s.pushToast)
  const { limits } = getConfig()

  const { data: tables = [], isLoading, isError, error } = useQuery({
    queryKey: posQk.tables(bid),
    queryFn: () => fetchTables(bid),
  })

  const [isAdding, setIsAdding] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)

  const [label, setLabel] = useState('')
  const [code, setCode] = useState('')
  const [capacity, setCapacity] = useState('4')
  const [zone, setZone] = useState('')

  const resetForm = () => {
    setLabel('')
    setCode('')
    setCapacity('4')
    setZone('')
    setIsAdding(false)
    setEditingId(null)
  }

  const startEdit = (t: RestaurantTable) => {
    setLabel(t.label)
    setCode(t.code)
    setCapacity(String(t.capacity))
    setZone(t.zone || '')
    setEditingId(t.id)
    setIsAdding(false)
  }

  const createMut = useMutation({
    mutationFn: () =>
      createTable({ business_id: bid, label, code: code || slugifyCode(label), capacity: Number(capacity) || 4, zone: zone || null }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: posQk.tables(bid) })
      pushToast('Table created')
      resetForm()
    },
    onError: (err: unknown) => pushToast((err as Error).message, 'error'),
  })

  const updateMut = useMutation({
    mutationFn: () => updateTable(editingId!, { label, code, capacity: Number(capacity) || 4, zone: zone || null }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: posQk.tables(bid) })
      pushToast('Table updated')
      resetForm()
    },
    onError: (err: unknown) => pushToast((err as Error).message, 'error'),
  })

  const deleteMut = useMutation({
    mutationFn: (id: string) => deleteTable(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: posQk.tables(bid) })
      pushToast('Table deleted')
    },
    onError: (err: unknown) => pushToast((err as Error).message, 'error'),
  })

  const statusMut = useMutation({
    mutationFn: ({ id, status }: { id: string; status: TableStatus }) => updateTable(id, { status }),
    onSuccess: () => qc.invalidateQueries({ queryKey: posQk.tables(bid) }),
    onError: (err: unknown) => pushToast((err as Error).message, 'error'),
  })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!label.trim()) return pushToast('Table name is required', 'error')

    if (isAdding) {
      createMut.mutate()
    } else if (editingId) {
      updateMut.mutate()
    }
  }

  const atLimit = tables.length >= limits.maxTables

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-xl font-semibold">Tables</h2>
          <p className="text-sm text-neutral-400">
            Manage your floor plan. ({tables.length} / {limits.maxTables} used)
          </p>
        </div>
        {!isAdding && !editingId && (
          <Button
            onClick={() => setIsAdding(true)}
            className="w-full sm:w-auto"
            disabled={atLimit}
            title={atLimit ? 'Table limit reached' : undefined}
          >
            <Plus className="mr-2 h-4 w-4" /> Add Table
          </Button>
        )}
      </div>

      {(isAdding || editingId) && (
        <form onSubmit={handleSubmit} className="rounded-xl border border-neutral-200 bg-neutral-50 p-4 space-y-4 dark:border-neutral-800 dark:bg-neutral-900/50">
          <h3 className="font-medium text-neutral-900 dark:text-white">{isAdding ? 'New Table' : 'Edit Table'}</h3>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-1">
              <label className="text-xs font-medium text-neutral-400">Label *</label>
              <Input
                value={label}
                onChange={(e) => {
                  setLabel(e.target.value)
                  if (isAdding) setCode(slugifyCode(e.target.value))
                }}
                placeholder="e.g. Table 5"
                autoFocus
              />
            </div>
            <div className="space-y-1">
              <label className="text-xs font-medium text-neutral-400">QR Code (short code) *</label>
              <Input value={code} onChange={(e) => setCode(slugifyCode(e.target.value))} placeholder="e.g. t5" />
            </div>
            <div className="space-y-1">
              <label className="text-xs font-medium text-neutral-400">Capacity</label>
              <Input type="number" min={1} value={capacity} onChange={(e) => setCapacity(e.target.value)} />
            </div>
            <div className="space-y-1">
              <label className="text-xs font-medium text-neutral-400">Zone</label>
              <Input value={zone} onChange={(e) => setZone(e.target.value)} placeholder="e.g. Indoor, Patio" />
            </div>
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="ghost" onClick={resetForm}>Cancel</Button>
            <Button type="submit" disabled={createMut.isPending || updateMut.isPending}>
              {isAdding ? 'Create Table' : 'Save Changes'}
            </Button>
          </div>
        </form>
      )}

      {isLoading ? (
        <div className="flex h-32 items-center justify-center text-sm text-neutral-500 dark:text-neutral-400">Loading tables...</div>
      ) : isError ? (
        <div className="rounded-xl border border-dashed border-red-900/50 bg-red-500/5 p-8 text-center">
          <p className="text-sm text-red-400">Couldn&apos;t load tables: {(error as Error).message}</p>
          <p className="mt-1 text-xs text-neutral-500">Have migrations 008 and 009 been applied to this Supabase project?</p>
        </div>
      ) : tables.length === 0 ? (
        <div className="rounded-xl border border-dashed border-neutral-300 p-8 text-center dark:border-neutral-800">
          <p className="text-sm text-neutral-500 dark:text-neutral-400">No tables added yet.</p>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {tables.map((table) => (
            <div key={table.id} className="relative group overflow-hidden rounded-xl border border-neutral-200 bg-white p-5 transition-colors hover:border-neutral-300 dark:border-neutral-800 dark:bg-[#161616] dark:hover:border-neutral-700">
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0">
                  <h3 className="font-semibold text-neutral-900 dark:text-white">{table.label}</h3>
                  <div className="mt-1 flex items-center gap-3 text-sm text-neutral-500 dark:text-neutral-400">
                    <span className="flex items-center gap-1">
                      <UsersIcon className="h-3.5 w-3.5" /> {table.capacity}
                    </span>
                    {table.zone && <span className="truncate">{table.zone}</span>}
                  </div>
                </div>
                <span className={cn('h-2.5 w-2.5 shrink-0 rounded-full mt-1', STATUS_DOT[table.status])} title={STATUS_LABEL[table.status]} />
              </div>

              <select
                value={table.status}
                onChange={(e) => statusMut.mutate({ id: table.id, status: e.target.value as TableStatus })}
                className="mt-3 w-full rounded-md border border-neutral-300 bg-white px-2 py-1.5 text-xs text-neutral-900 focus:border-amber-500 focus:outline-none dark:border-neutral-700 dark:bg-neutral-900 dark:text-white"
              >
                {(Object.keys(STATUS_LABEL) as TableStatus[]).map((s) => (
                  <option key={s} value={s}>{STATUS_LABEL[s]}</option>
                ))}
              </select>

              <div className="mt-4 flex items-center justify-end gap-2 border-t border-neutral-100 pt-3 dark:border-neutral-800/50">
                <Button variant="ghost" size="sm" onClick={() => startEdit(table)}>
                  <Pencil className="h-4 w-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    if (confirm('Delete this table?')) deleteMut.mutate(table.id)
                  }}
                  className="text-red-400 hover:text-red-300"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
