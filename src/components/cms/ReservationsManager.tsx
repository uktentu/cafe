'use client'

import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Check, X, Clock, Trash2, Phone, Mail, FileText, Loader2 } from 'lucide-react'
import { useCms } from './Providers'
import { Button } from '@/components/ui/Button'
import { useCmsStore } from '@/stores/cms'
import { qk, fetchReservations, updateReservation, deleteReservation } from '@/lib/cms-queries'
import type { Reservation } from '@/types/database'
import { cn } from '@/lib/utils'

export function ReservationsManager() {
  const { business } = useCms()
  const bid = business.id
  const qc = useQueryClient()
  const pushToast = useCmsStore((s) => s.pushToast)
  const activeBranchId = useCmsStore((s) => s.activeBranchId)

  const { data: reservations = [], isLoading } = useQuery({
    queryKey: qk.reservations(bid, activeBranchId),
    queryFn: () => fetchReservations(bid, activeBranchId),
  })

  const [updatingId, setUpdatingId] = useState<string | null>(null)

  const updateMut = useMutation({
    mutationFn: async ({ id, status }: { id: string, status: Reservation['status'] }) => {
      setUpdatingId(id)
      await updateReservation(id, { status })
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: qk.reservations(bid, activeBranchId) })
      pushToast('Status updated', 'success')
      setUpdatingId(null)
    },
    onError: (err: unknown) => {
      pushToast((err as Error).message, 'error')
      setUpdatingId(null)
    }
  })

  const deleteMut = useMutation({
    mutationFn: (id: string) => deleteReservation(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: qk.reservations(bid, activeBranchId) })
      pushToast('Reservation deleted')
    },
    onError: (err: unknown) => pushToast((err as Error).message, 'error')
  })

  if (isLoading) return <div className="flex h-32 items-center justify-center text-sm text-neutral-500 dark:text-neutral-400">Loading reservations...</div>

  if (reservations.length === 0) {
    return (
      <div className="rounded-xl border border-dashed border-neutral-800 p-12 text-center">
        <Clock className="mx-auto h-8 w-8 text-neutral-600 dark:text-neutral-400 mb-3" />
        <p className="text-sm text-neutral-400 font-medium">No reservations yet.</p>
        <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-1">When customers book a table, they will appear here.</p>
      </div>
    )
  }

  const statusColors = {
    pending: 'bg-amber-500/10 text-amber-500 border-amber-500/20',
    confirmed: 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20',
    cancelled: 'bg-red-500/10 text-red-500 border-red-500/20',
  }

  return (
    <div className="space-y-6">
      <header>
        <h2 className="text-xl font-semibold">Reservations</h2>
        <p className="text-sm text-neutral-400 mt-1">Manage incoming table bookings.</p>
      </header>

      <div className="space-y-3">
        {reservations.map(res => (
          <div key={res.id} className="relative overflow-hidden rounded-xl border border-neutral-800 bg-[#161616] p-5 hover:border-neutral-700 transition-colors">
            <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
              <div className="space-y-3">
                <div className="flex items-center gap-3">
                  <h3 className="font-semibold text-white text-lg">{res.name}</h3>
                  <span className={cn("px-2 py-0.5 rounded-full text-xs font-medium border", statusColors[res.status])}>
                    {res.status.charAt(0).toUpperCase() + res.status.slice(1)}
                  </span>
                  <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-neutral-800 text-neutral-300">
                    {res.party_size} {res.party_size === 1 ? 'person' : 'people'}
                  </span>
                </div>
                
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-2 text-sm text-neutral-400">
                  <div className="flex items-center gap-1.5 text-neutral-300 font-medium">
                    <Clock className="h-4 w-4 text-neutral-500 dark:text-neutral-400" />
                    {res.date} at {res.time}
                  </div>
                  <div className="flex items-center gap-1.5">
                    <Phone className="h-4 w-4 text-neutral-500 dark:text-neutral-400" />
                    {res.phone}
                  </div>
                  {res.email && (
                    <div className="flex items-center gap-1.5">
                      <Mail className="h-4 w-4 text-neutral-500 dark:text-neutral-400" />
                      {res.email}
                    </div>
                  )}
                  {res.notes && (
                    <div className="flex items-start gap-1.5 sm:col-span-2 mt-1">
                      <FileText className="h-4 w-4 text-neutral-500 dark:text-neutral-400 mt-0.5" />
                      <span className="italic">&quot;{res.notes}&quot;</span>
                    </div>
                  )}
                </div>
              </div>

              <div className="flex items-center gap-2 border-t border-neutral-800/50 pt-3 sm:border-0 sm:pt-0 shrink-0">
                {res.status === 'pending' && (
                  <>
                    <Button 
                      size="sm" 
                      variant="secondary"
                      className="bg-emerald-500/10 text-emerald-500 hover:bg-emerald-500/20"
                      disabled={updatingId === res.id}
                      onClick={() => updateMut.mutate({ id: res.id, status: 'confirmed' })}
                    >
                      {updatingId === res.id ? <Loader2 className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4" />}
                      <span className="ml-1.5">Confirm</span>
                    </Button>
                    <Button 
                      size="sm" 
                      variant="secondary"
                      className="bg-red-500/10 text-red-500 hover:bg-red-500/20"
                      disabled={updatingId === res.id}
                      onClick={() => updateMut.mutate({ id: res.id, status: 'cancelled' })}
                    >
                      <X className="h-4 w-4" />
                      <span className="ml-1.5">Decline</span>
                    </Button>
                  </>
                )}
                {res.status !== 'pending' && (
                  <Button 
                    size="sm" 
                    variant="ghost" 
                    className="text-red-400 hover:text-red-300"
                    onClick={() => {
                      if (confirm('Delete this reservation?')) deleteMut.mutate(res.id)
                    }}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
