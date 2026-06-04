'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { useCms } from './Providers'
import { ImageUpload } from './ImageUpload'
import { Button } from '@/components/ui/Button'
import { Input, Field } from '@/components/ui/Input'
import { Toggle } from '@/components/ui/Toggle'
import { useCmsStore } from '@/stores/cms'
import { getConfig, tierRank } from '@/lib/config'
import { THEMES } from '@/lib/design-tokens'
import { updateBusiness, uploadImage } from '@/lib/cms-queries'
import { cdnUrl, type Theme, type OpeningHours } from '@/types/database'
import { cn } from '@/lib/utils'

const DAYS: { key: string; label: string }[] = [
  { key: 'mon', label: 'Mon' }, { key: 'tue', label: 'Tue' }, { key: 'wed', label: 'Wed' },
  { key: 'thu', label: 'Thu' }, { key: 'fri', label: 'Fri' }, { key: 'sat', label: 'Sat' },
  { key: 'sun', label: 'Sun' },
]

interface InfoForm {
  name: string
  tagline: string
  phone: string
  whatsapp: string
  address: string
  city: string
}

export function SettingsForm() {
  const { business } = useCms()
  const router = useRouter()
  const pushToast = useCmsStore((s) => s.pushToast)
  const { tier } = getConfig()

  const { register, handleSubmit } = useForm<InfoForm>({
    defaultValues: {
      name: business.name,
      tagline: business.tagline ?? '',
      phone: business.phone ?? '',
      whatsapp: business.whatsapp ?? '',
      address: business.address ?? '',
      city: business.city ?? '',
    },
  })

  const [hours, setHours] = useState<OpeningHours>(() => structuredClone(business.opening_hours))
  const [theme, setTheme] = useState<Theme>(business.theme)
  const [brand, setBrand] = useState(business.theme_color || '#F59E0B')
  const [logoFile, setLogoFile] = useState<File | null>(null)
  const [coverFile, setCoverFile] = useState<File | null>(null)
  const [saving, setSaving] = useState(false)

  const availableThemes = (Object.keys(THEMES) as Theme[]).filter(
    (t) => tierRank(THEMES[t].tier) <= tierRank(tier),
  )

  function setDay(key: string, patch: Partial<{ open: string; close: string; closed: boolean }>) {
    setHours((h) => ({ ...h, [key]: { ...h[key], ...patch } }))
  }

  async function onSubmit(values: InfoForm) {
    setSaving(true)
    try {
      const patch: Record<string, unknown> = {
        name: values.name,
        tagline: values.tagline || null,
        phone: values.phone || null,
        whatsapp: values.whatsapp || null,
        address: values.address || null,
        city: values.city || null,
        opening_hours: hours,
        theme,
        theme_color: brand,
      }
      if (logoFile) {
        const up = await uploadImage(logoFile, 'logo')
        patch.logo_r2_key = up.r2_key
      }
      if (coverFile) {
        const up = await uploadImage(coverFile, 'cover')
        patch.cover_r2_key = up.r2_key
      }
      await updateBusiness(business.id, patch)
      pushToast('Settings saved')
      setLogoFile(null)
      setCoverFile(null)
      router.refresh()
    } catch (e) {
      pushToast((e as Error).message || 'Save failed', 'error')
    } finally {
      setSaving(false)
    }
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      <h1 className="text-2xl font-semibold text-neutral-900">Settings</h1>

      {/* Business info */}
      <section className="space-y-4 rounded-2xl bg-white p-5 ring-1 ring-black/5">
        <h2 className="text-sm font-semibold text-neutral-700">Business info</h2>
        <Field label="Restaurant name" required><Input {...register('name', { required: true })} /></Field>
        <Field label="Tagline"><Input {...register('tagline')} placeholder="Good food, good vibes." /></Field>
        <div className="grid grid-cols-2 gap-4">
          <Field label="Phone"><Input {...register('phone')} placeholder="+91-…" /></Field>
          <Field label="WhatsApp" hint="Digits only, with country code"><Input {...register('whatsapp')} placeholder="9198…" /></Field>
        </div>
        <Field label="Address"><Input {...register('address')} /></Field>
        <Field label="City"><Input {...register('city')} /></Field>
      </section>

      {/* Branding */}
      <section className="space-y-4 rounded-2xl bg-white p-5 ring-1 ring-black/5">
        <h2 className="text-sm font-semibold text-neutral-700">Branding</h2>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <p className="mb-1 text-sm font-medium text-neutral-700">Logo</p>
            <ImageUpload file={logoFile} existingUrl={cdnUrl(business.logo_r2_key)} onChange={setLogoFile} aspect="aspect-square" />
          </div>
          <div>
            <p className="mb-1 text-sm font-medium text-neutral-700">Cover</p>
            <ImageUpload file={coverFile} existingUrl={cdnUrl(business.cover_r2_key)} onChange={setCoverFile} aspect="aspect-[4/3]" />
          </div>
        </div>
        <Field label="Brand colour">
          <div className="flex items-center gap-3">
            <input type="color" value={brand} onChange={(e) => setBrand(e.target.value)} className="h-10 w-12 cursor-pointer rounded border border-neutral-300" />
            <Input value={brand} onChange={(e) => setBrand(e.target.value)} className="w-32" />
          </div>
        </Field>
      </section>

      {/* Theme */}
      <section className="space-y-3 rounded-2xl bg-white p-5 ring-1 ring-black/5">
        <h2 className="text-sm font-semibold text-neutral-700">Template</h2>
        <div className="grid grid-cols-3 gap-3">
          {availableThemes.map((t) => {
            const meta = THEMES[t]
            const active = theme === t
            return (
              <button
                key={t}
                type="button"
                onClick={() => setTheme(t)}
                className={cn('rounded-xl border-2 p-3 text-left', active ? 'border-amber-500' : 'border-neutral-200')}
              >
                <span className="mb-2 flex gap-1">
                  <span className="h-5 w-5 rounded-full" style={{ background: meta.colors.brand }} />
                  <span className="h-5 w-5 rounded-full" style={{ background: meta.colors.bg, border: '1px solid #ddd' }} />
                </span>
                <span className="text-sm font-medium capitalize text-neutral-800">{t}</span>
              </button>
            )
          })}
        </div>
      </section>

      {/* Hours */}
      <section className="space-y-2 rounded-2xl bg-white p-5 ring-1 ring-black/5">
        <h2 className="text-sm font-semibold text-neutral-700">Opening hours</h2>
        {DAYS.map(({ key, label }) => {
          const d = hours[key] ?? { open: '09:00', close: '22:00', closed: false }
          return (
            <div key={key} className="flex items-center gap-3 py-1.5">
              <span className="w-10 text-sm text-neutral-600">{label}</span>
              <Toggle checked={!d.closed} onChange={(open) => setDay(key, { closed: !open })} size="sm" label={`${label} open`} />
              {d.closed ? (
                <span className="text-sm text-neutral-400">Closed</span>
              ) : (
                <div className="flex items-center gap-2">
                  <input type="time" value={d.open} onChange={(e) => setDay(key, { open: e.target.value })} className="h-9 rounded-lg border border-neutral-300 px-2 text-sm" />
                  <span className="text-neutral-400">–</span>
                  <input type="time" value={d.close} onChange={(e) => setDay(key, { close: e.target.value })} className="h-9 rounded-lg border border-neutral-300 px-2 text-sm" />
                </div>
              )}
            </div>
          )
        })}
      </section>

      <Button type="submit" loading={saving} className="w-full md:w-auto">Save settings</Button>
    </form>
  )
}
