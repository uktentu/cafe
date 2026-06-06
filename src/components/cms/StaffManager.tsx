'use client'

import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Plus, Trash2, X, Users, Mail } from 'lucide-react'
import { useCms } from './Providers'
import { useCmsStore } from '@/stores/cms'
import { qk, fetchStaff, deleteStaff, updateStaffRole } from '@/lib/cms-queries'
import type { StaffRole } from '@/types/database'
import { getConfig } from '@/lib/config'
import { Button } from '@/components/ui/Button'
import { Input, Select } from '@/components/ui/Input'

function InviteForm({
  businessId,
  onClose,
}: {
  businessId: string
  onClose: () => void
}) {
  const qc = useQueryClient()
  const pushToast = useCmsStore((s) => s.pushToast)
  const [email, setEmail] = useState('')
  const [name, setName] = useState('')
  const [role, setRole] = useState<StaffRole>('staff')
  const [loading, setLoading] = useState(false)

  async function handleInvite() {
    if (!email) return
    setLoading(true)
    try {
      const res = await fetch('/api/staff/invite', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, name, role, businessId }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Failed to invite')
      
      qc.invalidateQueries({ queryKey: qk.staff(businessId) })
      pushToast('Invite sent', 'success')
      onClose()
    } catch (e) {
      const msg = e instanceof Error ? e.message : 'Failed to invite'
      pushToast(msg, 'error')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center sm:items-center">
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />
      <div className="relative z-10 w-full max-w-md rounded-t-3xl bg-white dark:bg-neutral-900 p-6 shadow-2xl sm:rounded-2xl">
        <div className="mb-5 flex items-center justify-between">
          <h2 className="text-lg font-bold text-neutral-900 dark:text-neutral-100">Invite Staff</h2>
          <button onClick={onClose} className="rounded-lg p-1.5 text-neutral-400 hover:bg-neutral-100">
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="space-y-4">
          <div>
            <label className="block text-xs font-semibold uppercase tracking-widest text-neutral-500 dark:text-neutral-400 mb-1.5">Email *</label>
            <Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="staff@example.com" />
          </div>
          <div>
            <label className="block text-xs font-semibold uppercase tracking-widest text-neutral-500 dark:text-neutral-400 mb-1.5">Name (Optional)</label>
            <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="John Doe" />
          </div>
          <div>
            <label className="block text-xs font-semibold uppercase tracking-widest text-neutral-500 dark:text-neutral-400 mb-1.5">Role</label>
            <Select value={role} onChange={(e) => setRole(e.target.value as StaffRole)}>
              <option value="staff">Staff (Can edit menu)</option>
              <option value="manager">Manager (Can edit settings)</option>
            </Select>
          </div>
        </div>

        <Button
          onClick={handleInvite}
          loading={loading}
          disabled={!email || loading}
          className="mt-5 w-full"
        >
          <Mail className="h-4 w-4" /> Send Invite
        </Button>
      </div>
    </div>
  )
}

export function StaffManager() {
  const { business } = useCms()
  const bid = business.id
  const qc = useQueryClient()
  const pushToast = useCmsStore((s) => s.pushToast)
  const [inviting, setInviting] = useState(false)

  const { data: staffList = [], isLoading } = useQuery({
    queryKey: qk.staff(bid),
    queryFn: () => fetchStaff(bid),
  })

  const deleteMutation = useMutation({
    mutationFn: (id: string) => deleteStaff(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: qk.staff(bid) })
      pushToast('Staff removed', 'success')
    },
    onError: () => pushToast('Remove failed', 'error'),
  })

  const roleMutation = useMutation({
    mutationFn: ({ id, role }: { id: string; role: StaffRole }) => updateStaffRole(id, role),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: qk.staff(bid) })
      pushToast('Role updated', 'success')
    },
    onError: () => pushToast('Update failed', 'error'),
  })

  if (isLoading) return <div className="h-32 animate-pulse rounded-2xl bg-neutral-100" />

  const staffLimit = getConfig().limits.staff
  
  // Exclude owner from the limit count usually, but for simplicity let's say "total accounts except owner"
  const nonOwners = staffList.filter(s => s.role !== 'owner')
  const atLimit = nonOwners.length >= staffLimit

  return (
    <div className="space-y-5">
      {staffList.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-2xl border-2 border-dashed border-neutral-200 dark:border-neutral-800 py-16">
          <Users className="mb-3 h-10 w-10 text-neutral-300" />
          <p className="font-medium text-neutral-600 dark:text-neutral-400">No staff members yet</p>
          <p className="mt-1 text-sm text-neutral-400">Invite your team to help manage the menu.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {staffList.map((s) => (
            <div key={s.id} className="flex items-center gap-3 rounded-xl bg-white dark:bg-neutral-900 p-4 ring-1 ring-black/5 dark:ring-white/10">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-neutral-100">
                <span className="text-sm font-semibold text-neutral-500 dark:text-neutral-400">
                  {s.name ? s.name.charAt(0).toUpperCase() : 'U'}
                </span>
              </div>
              <div className="min-w-0 flex-1">
                <p className="font-semibold text-neutral-900 dark:text-neutral-100 truncate">
                  {s.name || 'Invited User'}
                </p>
                <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-0.5 capitalize">
                  {s.role} {s.is_active ? '' : '(Inactive)'}
                </p>
              </div>
              <div className="flex items-center gap-2">
                {s.role !== 'owner' && (
                  <Select 
                    value={s.role} 
                    onChange={(e) => roleMutation.mutate({ id: s.id, role: e.target.value as StaffRole })}
                    className="h-8 py-0 pl-2 pr-8 text-xs"
                  >
                    <option value="staff">Staff</option>
                    <option value="manager">Manager</option>
                  </Select>
                )}
                {s.role !== 'owner' && (
                  <button
                    onClick={() => { if (confirm('Remove this staff member?')) deleteMutation.mutate(s.id) }}
                    className="flex h-8 w-8 items-center justify-center rounded-lg text-red-400 hover:bg-red-50"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {staffLimit > 0 ? (
        <>
          <Button
            onClick={() => setInviting(true)}
            disabled={atLimit}
            className="w-full md:w-auto"
          >
            <Plus className="h-4 w-4" /> Invite staff
          </Button>
          {atLimit && <p className="text-xs text-amber-600">Staff limit reached for your tier ({staffLimit}). Upgrade for more.</p>}
        </>
      ) : (
        <p className="text-sm text-neutral-500 dark:text-neutral-400 p-4 bg-neutral-50 dark:bg-neutral-800/50 rounded-xl">Staff accounts are available on Advanced and Premium tiers.</p>
      )}

      {inviting && (
        <InviteForm
          businessId={bid}
          onClose={() => setInviting(false)}
        />
      )}
    </div>
  )
}
