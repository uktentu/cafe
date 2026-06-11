'use client'

import { useState } from 'react'
import { CalendarCheck, Loader2 } from 'lucide-react'
import { SpringModal } from '@/components/motion/SpringModal'
import { useMenuStore } from '@/stores/menu'
import type { Theme } from '@/types/database'

import { Turnstile } from '@marsidev/react-turnstile'

interface ReservationModalProps {
  businessId: string
  businessName: string
  branchId?: string
  theme?: Theme
}

export function ReservationModal({ businessId, businessName, branchId, theme = 'mercado' }: ReservationModalProps) {
  const open = useMenuStore((s) => s.reservationModalOpen)
  const close = () => useMenuStore.setState({ reservationModalOpen: false })
  
  const [saving, setSaving] = useState(false)
  const [success, setSuccess] = useState(false)
  const [error, setError] = useState<string | null>(null)
  
  const siteKey = process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY
  const [turnstileToken, setTurnstileToken] = useState<string | null>(siteKey ? null : 'dummy_token')

  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    party_size: '2',
    date: new Date().toISOString().split('T')[0],
    time: '19:00',
    notes: ''
  })

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    setFormData(prev => ({ ...prev, [e.target.name]: e.target.value }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!turnstileToken) {
      setError('Please complete the CAPTCHA')
      return
    }

    setError(null)
    setSaving(true)

    try {
      const res = await fetch('/api/reservations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          business_id: businessId,
          branch_id: branchId,
          turnstileToken,
          ...formData
        })
      })

      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Failed to submit reservation')
      
      setSuccess(true)
    } catch (err: unknown) {
      setError((err as Error).message)
    } finally {
      setSaving(false)
    }
  }

  const variant = theme === 'onyx' ? 'center' : 'sheet'

  return (
    <SpringModal open={open} onClose={close} variant={variant} labelledBy="reservation-modal-title">
      <div className="px-5 pb-6 pt-4" style={{ color: 'var(--txt)' }}>
        <div className="flex items-center gap-3 mb-6 border-b pb-4" style={{ borderColor: 'var(--bdr)' }}>
          <div className="flex h-10 w-10 items-center justify-center rounded-full" style={{ background: 'var(--brand)', color: 'var(--bg)' }}>
            <CalendarCheck className="h-5 w-5" />
          </div>
          <div>
            <h2 id="reservation-modal-title" className="text-xl font-bold font-display uppercase tracking-wider" style={{ fontFamily: 'var(--font-display)', color: 'var(--txt)' }}>
              Book a Table
            </h2>
            <p className="text-sm opacity-80 mt-0.5" style={{ color: 'var(--txt2)' }}>at {businessName}</p>
          </div>
        </div>

        {success ? (
          <div className="py-8 text-center space-y-4">
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-emerald-500/20 text-emerald-500">
              <CalendarCheck className="h-8 w-8" />
            </div>
            <h3 className="text-xl font-bold">Request Sent!</h3>
            <p className="text-sm opacity-80 px-4" style={{ color: 'var(--txt2)' }}>
              We&apos;ve received your reservation request for {formData.party_size} people on {formData.date} at {formData.time}. We&apos;ll confirm with you shortly.
            </p>
            <button 
              onClick={close}
              className="mt-6 w-full py-3.5 rounded-xl font-bold transition-transform active:scale-[0.98]"
              style={{ background: 'var(--brand)', color: 'var(--bg)' }}
            >
              Close
            </button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1">
                <label className="text-xs font-semibold uppercase tracking-wider" style={{ color: 'var(--txt3)' }}>Date</label>
                <input 
                  type="date" 
                  name="date"
                  required
                  min={new Date().toISOString().split('T')[0]}
                  value={formData.date}
                  onChange={handleChange}
                  className="w-full rounded-xl border px-3 py-2.5 text-sm outline-none transition-colors"
                  style={{ background: 'var(--bg)', borderColor: 'var(--bdr)', color: 'var(--txt)' }}
                />
              </div>
              <div className="space-y-1">
                <label className="text-xs font-semibold uppercase tracking-wider" style={{ color: 'var(--txt3)' }}>Time</label>
                <input 
                  type="time" 
                  name="time"
                  required
                  value={formData.time}
                  onChange={handleChange}
                  className="w-full rounded-xl border px-3 py-2.5 text-sm outline-none transition-colors"
                  style={{ background: 'var(--bg)', borderColor: 'var(--bdr)', color: 'var(--txt)' }}
                />
              </div>
            </div>

            <div className="space-y-1">
              <label className="text-xs font-semibold uppercase tracking-wider" style={{ color: 'var(--txt3)' }}>Party Size</label>
              <select 
                name="party_size"
                required
                value={formData.party_size}
                onChange={handleChange}
                className="w-full rounded-xl border px-3 py-2.5 text-sm outline-none transition-colors"
                style={{ background: 'var(--bg)', borderColor: 'var(--bdr)', color: 'var(--txt)' }}
              >
                {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map(num => (
                  <option key={num} value={num}>{num} {num === 1 ? 'person' : 'people'}</option>
                ))}
              </select>
            </div>

            <div className="space-y-1 pt-2">
              <label className="text-xs font-semibold uppercase tracking-wider" style={{ color: 'var(--txt3)' }}>Your Name</label>
              <input 
                type="text" 
                name="name"
                required
                value={formData.name}
                onChange={handleChange}
                placeholder="John Doe"
                className="w-full rounded-xl border px-3 py-2.5 text-sm outline-none transition-colors"
                style={{ background: 'var(--bg)', borderColor: 'var(--bdr)', color: 'var(--txt)' }}
              />
            </div>

            <div className="space-y-1">
              <label className="text-xs font-semibold uppercase tracking-wider" style={{ color: 'var(--txt3)' }}>Email Address (Optional)</label>
              <input 
                type="email" 
                name="email"
                value={formData.email}
                onChange={handleChange}
                placeholder="john@example.com"
                className="w-full rounded-xl border px-3 py-2.5 text-sm outline-none transition-colors"
                style={{ background: 'var(--bg)', borderColor: 'var(--bdr)', color: 'var(--txt)' }}
              />
            </div>

            <div className="space-y-1">
              <label className="text-xs font-semibold uppercase tracking-wider" style={{ color: 'var(--txt3)' }}>Phone Number</label>
              <input 
                type="tel" 
                name="phone"
                required
                value={formData.phone}
                onChange={handleChange}
                placeholder="+1 234 567 890"
                className="w-full rounded-xl border px-3 py-2.5 text-sm outline-none transition-colors"
                style={{ background: 'var(--bg)', borderColor: 'var(--bdr)', color: 'var(--txt)' }}
              />
            </div>

            <div className="space-y-1">
              <label className="text-xs font-semibold uppercase tracking-wider" style={{ color: 'var(--txt3)' }}>Special Requests (Optional)</label>
              <textarea 
                name="notes"
                rows={2}
                value={formData.notes}
                onChange={handleChange}
                placeholder="Window seat, allergies, etc."
                className="w-full rounded-xl border px-3 py-2.5 text-sm outline-none transition-colors resize-none"
                style={{ background: 'var(--bg)', borderColor: 'var(--bdr)', color: 'var(--txt)' }}
              />
            </div>

            {siteKey && (
              <div className="flex justify-center pt-2">
                <Turnstile 
                  siteKey={siteKey}
                  onSuccess={(token) => setTurnstileToken(token)}
                  onError={() => setError('CAPTCHA failed to load')}
                  options={{ theme: 'auto' }}
                />
              </div>
            )}

            {error && (
              <p className="text-sm text-red-500 font-medium py-1">{error}</p>
            )}

            <button 
              type="submit"
              disabled={saving || !turnstileToken}
              className="mt-6 flex w-full items-center justify-center gap-2 py-3.5 rounded-xl font-bold transition-transform active:scale-[0.98] disabled:opacity-70 disabled:active:scale-100"
              style={{ background: 'var(--brand)', color: 'var(--bg)' }}
            >
              {saving && <Loader2 className="h-4 w-4 animate-spin" />}
              {saving ? 'Requesting...' : 'Request Booking'}
            </button>
          </form>
        )}
      </div>
    </SpringModal>
  )
}
