'use client'

import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Plus, Trash2, Pencil, MapPin, Phone } from 'lucide-react'
import { useCms } from './Providers'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { useCmsStore } from '@/stores/cms'
import { qk, fetchBranches, createBranch, updateBranch, deleteBranch } from '@/lib/cms-queries'
import { getConfig } from '@/lib/config'
import type { Branch } from '@/types/database'

export function BranchManager() {
  const { business } = useCms()
  const bid = business.id
  const qc = useQueryClient()
  const pushToast = useCmsStore((s) => s.pushToast)

  const { data: branches = [], isLoading } = useQuery({
    queryKey: qk.branches(bid),
    queryFn: () => fetchBranches(bid),
  })

  const [isAdding, setIsAdding] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  
  // Form states
  const [name, setName] = useState('')
  const [address, setAddress] = useState('')
  const [phone, setPhone] = useState('')

  const resetForm = () => {
    setName('')
    setAddress('')
    setPhone('')
    setIsAdding(false)
    setEditingId(null)
  }

  const startEdit = (b: Branch) => {
    setName(b.name)
    setAddress(b.address || '')
    setPhone(b.phone || '')
    setEditingId(b.id)
    setIsAdding(false)
  }

  const createMut = useMutation({
    mutationFn: () => createBranch({ business_id: bid, name, address: address || null, phone: phone || null }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: qk.branches(bid) })
      pushToast('Branch created')
      resetForm()
    },
    onError: (err: unknown) => pushToast((err as Error).message, 'error')
  })

  const updateMut = useMutation({
    mutationFn: () => updateBranch(editingId!, { name, address: address || null, phone: phone || null }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: qk.branches(bid) })
      pushToast('Branch updated')
      resetForm()
    },
    onError: (err: unknown) => pushToast((err as Error).message, 'error')
  })

  const deleteMut = useMutation({
    mutationFn: (id: string) => deleteBranch(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: qk.branches(bid) })
      pushToast('Branch deleted')
    },
    onError: (err: unknown) => pushToast((err as Error).message, 'error')
  })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!name.trim()) return pushToast('Name is required', 'error')
    
    if (isAdding) {
      createMut.mutate()
    } else if (editingId) {
      updateMut.mutate()
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-xl font-semibold">Branches</h2>
          <p className="text-sm text-neutral-400">
            Manage multiple restaurant locations. 
            {getConfig().limits.branches < 99 && ` (${branches.length} / ${getConfig().limits.branches} used)`}
          </p>
        </div>
        {!isAdding && !editingId && (
          <Button 
            onClick={() => setIsAdding(true)} 
            className="w-full sm:w-auto"
            disabled={branches.length >= getConfig().limits.branches}
            title={branches.length >= getConfig().limits.branches ? 'Branch limit reached' : undefined}
          >
            <Plus className="mr-2 h-4 w-4" /> Add Branch
          </Button>
        )}
      </div>

      {(isAdding || editingId) && (
        <form onSubmit={handleSubmit} className="rounded-xl border border-neutral-800 bg-neutral-900/50 p-4 space-y-4">
          <h3 className="font-medium text-white">{isAdding ? 'New Branch' : 'Edit Branch'}</h3>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-1">
              <label className="text-xs font-medium text-neutral-400">Branch Name *</label>
              <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Downtown" autoFocus />
            </div>
            <div className="space-y-1">
              <label className="text-xs font-medium text-neutral-400">Phone</label>
              <Input value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="e.g. +1 234 567 8900" />
            </div>
            <div className="space-y-1 sm:col-span-2">
              <label className="text-xs font-medium text-neutral-400">Address / Maps Link</label>
              <Input value={address} onChange={(e) => setAddress(e.target.value)} placeholder="e.g. 123 Main St..." />
            </div>
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="ghost" onClick={resetForm}>Cancel</Button>
            <Button type="submit" disabled={createMut.isPending || updateMut.isPending}>
              {isAdding ? 'Create Branch' : 'Save Changes'}
            </Button>
          </div>
        </form>
      )}

      {isLoading ? (
        <div className="flex h-32 items-center justify-center text-sm text-neutral-500 dark:text-neutral-400">Loading branches...</div>
      ) : branches.length === 0 ? (
        <div className="rounded-xl border border-dashed border-neutral-800 p-8 text-center">
          <p className="text-sm text-neutral-400">No branches added yet.</p>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {branches.map(branch => (
            <div key={branch.id} className="relative group overflow-hidden rounded-xl border border-neutral-800 bg-[#161616] p-5 hover:border-neutral-700 transition-colors">
              <div className="flex items-start justify-between">
                <div>
                  <h3 className="font-semibold text-white">{branch.name}</h3>
                  <div className="mt-2 space-y-1 text-sm text-neutral-400">
                    {branch.phone && (
                      <div className="flex items-center gap-1.5">
                        <Phone className="h-3.5 w-3.5" />
                        <span>{branch.phone}</span>
                      </div>
                    )}
                    {branch.address && (
                      <div className="flex items-start gap-1.5">
                        <MapPin className="mt-0.5 h-3.5 w-3.5 shrink-0" />
                        <span className="line-clamp-2">{branch.address}</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>
              <div className="mt-4 flex items-center justify-end gap-2 border-t border-neutral-800/50 pt-3">
                <Button variant="ghost" size="sm" onClick={() => startEdit(branch)}>
                  <Pencil className="h-4 w-4" />
                </Button>
                <Button variant="ghost" size="sm" onClick={() => {
                  if (confirm('Delete this branch?')) deleteMut.mutate(branch.id)
                }} className="text-red-400 hover:text-red-300">
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
