'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { useCms } from './Providers'
import { useQuery } from '@tanstack/react-query'
import { ImageUpload } from './ImageUpload'
import { Button } from '@/components/ui/Button'
import { Input, Field } from '@/components/ui/Input'
import { Toggle } from '@/components/ui/Toggle'
import { useCmsStore } from '@/stores/cms'
import { getConfig, tierRank } from '@/lib/config'
import { THEMES } from '@/lib/design-tokens'
import { UpgradePrompt } from './UpgradePrompt'
import { updateBusiness, uploadImage, fetchSecondaryLocale, setSecondaryLocale } from '@/lib/cms-queries'
import { cdnUrl, type Theme, type OpeningHours, SUPPORTED_LOCALES } from '@/types/database'
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
  seo_title: string
  seo_description: string
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
      seo_title: business.seo_title ?? '',
      seo_description: business.seo_description ?? '',
    },
  })

  const [hours, setHours] = useState<OpeningHours>(() => structuredClone(business.opening_hours))
  const [theme, setTheme] = useState<Theme>(business.theme)
  const [brand, setBrand] = useState(business.theme_color || '#F59E0B')
  const [multipleMenus, setMultipleMenus] = useState(business.social_links?.multiple_menus_enabled ?? false)
  const [reservationsEnabled, setReservationsEnabled] = useState(business.social_links?.reservations_enabled ?? false)
  const [multipleBranchesEnabled, setMultipleBranchesEnabled] = useState(business.social_links?.multiple_branches_enabled ?? false)
  const [waitTime, setWaitTime] = useState(business.social_links?.wait_time ?? '')
  const [about, setAbout] = useState(business.social_links?.about ?? '')
  const [instagram, setInstagram] = useState(business.social_links?.instagram ?? '')
  const [swiggy, setSwiggy] = useState(business.social_links?.swiggy ?? '')
  const [zomato, setZomato] = useState(business.social_links?.zomato ?? '')
  const [googleMaps, setGoogleMaps] = useState(business.social_links?.google_maps ?? '')
  const [logoFile, setLogoFile] = useState<File | null>(null)
  const [coverFile, setCoverFile] = useState<File | null>(null)
  const [seoOgFile, setSeoOgFile] = useState<File | null>(null)
  const [saving, setSaving] = useState(false)

  const { data: initialSecondaryLocale } = useQuery({
    queryKey: ['secondaryLocale', business.id],
    queryFn: () => fetchSecondaryLocale(business.id),
  })

  // We keep it in local state. Initialize from data when it arrives.
  const [secondaryLocale, setSecondaryLocaleState] = useState<string>('')
  
  // Set it once it's loaded
  useEffect(() => {
    if (initialSecondaryLocale !== undefined && initialSecondaryLocale !== null) {
      setSecondaryLocaleState(initialSecondaryLocale)
    }
  }, [initialSecondaryLocale])

  const isAdvancedOrPremium = tierRank(tier) >= tierRank('advanced')
  const isPremium = tier === 'premium'

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
        social_links: {
          ...business.social_links,
          instagram: instagram.trim() || null,
          swiggy: swiggy.trim() || null,
          zomato: zomato.trim() || null,
          google_maps: googleMaps.trim() || null,
          multiple_menus_enabled: multipleMenus,
          reservations_enabled: reservationsEnabled,
          multiple_branches_enabled: multipleBranchesEnabled,
          wait_time: waitTime.trim() || null,
          about: about.trim() || null,
        },
        seo_title: values.seo_title || null,
        seo_description: values.seo_description || null,
      }
      if (logoFile) {
        const up = await uploadImage(logoFile, 'logo')
        patch.logo_r2_key = up.r2_key
      }
      if (coverFile) {
        const up = await uploadImage(coverFile, 'cover')
        patch.cover_r2_key = up.r2_key
      }
      if (seoOgFile) {
        const up = await uploadImage(seoOgFile, 'seo_og')
        patch.seo_og_r2_key = up.r2_key
      }
      await updateBusiness(business.id, patch)
      await setSecondaryLocale(business.id, secondaryLocale)
      pushToast('Settings saved')
      setLogoFile(null)
      setCoverFile(null)
      setSeoOgFile(null)
      router.refresh()
    } catch (e) {
      pushToast((e as Error).message || 'Save failed', 'error')
    } finally {
      setSaving(false)
    }
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      <h1 className="text-2xl font-semibold text-neutral-900 dark:text-neutral-100">Settings</h1>

      {/* Business info */}
      <section className="space-y-4 rounded-2xl bg-white dark:bg-neutral-900 p-5 ring-1 ring-black/5 dark:ring-white/10">
        <h2 className="text-sm font-semibold text-neutral-700 dark:text-neutral-300">Business info</h2>
        <Field label="Restaurant name" required><Input {...register('name', { required: true })} /></Field>
        <Field label="Tagline"><Input {...register('tagline')} placeholder="Good food, good vibes." /></Field>
        <Field label="Our Story" hint="A short paragraph shown on your menu. Leave blank to hide.">
          <textarea
            value={about}
            onChange={(e) => setAbout(e.target.value)}
            rows={4}
            maxLength={600}
            placeholder="Tell guests what makes your place special — your history, your signature dishes, your vibe."
            className="w-full rounded-lg border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-950 px-3 py-2 text-sm text-neutral-900 dark:text-neutral-100 focus:border-amber-500 focus:outline-none focus:ring-1 focus:ring-amber-500"
          />
        </Field>
        <div className="grid grid-cols-2 gap-4">
          <Field label="Phone"><Input {...register('phone')} placeholder="+91-…" /></Field>
          <Field label="WhatsApp" hint="Digits only, with country code"><Input {...register('whatsapp')} placeholder="9198…" /></Field>
        </div>
        <Field label="Tonight's wait time" hint="Shown on your menu hero to manage expectations. Leave blank to hide.">
          <div className="flex gap-2 items-center">
            <Input
              placeholder="e.g. 20 min"
              value={waitTime}
              onChange={(e) => setWaitTime(e.target.value)}
              className="max-w-[180px]"
            />
            {waitTime && (
              <button type="button" onClick={() => setWaitTime('')} className="text-xs text-neutral-400 hover:text-red-500">
                Clear
              </button>
            )}
          </div>
        </Field>
        <div className="grid grid-cols-2 gap-4">
          <Field label="Address"><Input {...register('address')} /></Field>
          <Field label="City"><Input {...register('city')} /></Field>
        </div>
        <Field label="Secondary Language" hint="Optional secondary language for the menu. Note: Primary is always English.">
          {getConfig().features.bilingual ? (
            <select
              value={secondaryLocale}
              onChange={(e) => setSecondaryLocaleState(e.target.value)}
              className="w-full rounded border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-900 text-neutral-900 dark:text-neutral-100 p-2 text-sm focus:border-amber-500 focus:outline-none focus:ring-[3px] focus:ring-amber-500/20"
            >
              <option value="">None (English Only)</option>
              {SUPPORTED_LOCALES.map((loc) => (
                <option key={loc.code} value={loc.code}>{loc.name}</option>
              ))}
            </select>
          ) : (
            <div className="mt-2">
              <UpgradePrompt feature="Bilingual Menu" description="Enable a secondary language option for international tourists and guests." />
            </div>
          )}
        </Field>
      </section>

      {/* Social Links */}
      <section className="space-y-4 rounded-2xl bg-white dark:bg-neutral-900 p-5 ring-1 ring-black/5 dark:ring-white/10">
        <div>
          <h2 className="text-sm font-semibold text-neutral-700 dark:text-neutral-300">Social &amp; ordering links</h2>
          <p className="mt-0.5 text-xs text-neutral-500 dark:text-neutral-400">Links shown as icons on your menu footer. Leave blank to hide.</p>
        </div>
        <Field label="Instagram" hint="Full URL — e.g. https://instagram.com/yourplace">
          <Input value={instagram} onChange={(e) => setInstagram(e.target.value)} placeholder="https://instagram.com/…" type="url" />
        </Field>
        <Field label="Google Maps" hint="Your Google Maps listing URL">
          <Input value={googleMaps} onChange={(e) => setGoogleMaps(e.target.value)} placeholder="https://maps.google.com/…" type="url" />
        </Field>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Field label="Swiggy" hint="Your restaurant's Swiggy ordering page">
            <Input value={swiggy} onChange={(e) => setSwiggy(e.target.value)} placeholder="https://swiggy.com/…" type="url" />
          </Field>
          <Field label="Zomato" hint="Your restaurant's Zomato ordering page">
            <Input value={zomato} onChange={(e) => setZomato(e.target.value)} placeholder="https://zomato.com/…" type="url" />
          </Field>
        </div>
      </section>

      {/* Branding */}
      <section className="space-y-4 rounded-2xl bg-white dark:bg-neutral-900 p-5 ring-1 ring-black/5 dark:ring-white/10">
        <h2 className="text-sm font-semibold text-neutral-700 dark:text-neutral-300">Branding</h2>
        <div className="flex flex-col gap-6 sm:flex-row sm:items-start">
          <div className="w-40 shrink-0">
            <p className="mb-1 text-sm font-medium text-neutral-700 dark:text-neutral-300">Logo</p>
            <ImageUpload file={logoFile} existingUrl={cdnUrl(business.logo_r2_key)} onChange={setLogoFile} aspect="aspect-square" />
          </div>
          <div className="flex-1">
            <p className="mb-1 text-sm font-medium text-neutral-700 dark:text-neutral-300">Cover Image</p>
            <ImageUpload file={coverFile} existingUrl={cdnUrl(business.cover_r2_key)} onChange={setCoverFile} aspect="aspect-video" />
          </div>
        </div>
        <Field label="Brand colour">
          <div className="flex items-center gap-3">
            <input type="color" value={brand} onChange={(e) => setBrand(e.target.value)} className="h-10 w-12 cursor-pointer rounded border border-neutral-300 dark:border-neutral-700 bg-transparent" />
            <Input value={brand} onChange={(e) => setBrand(e.target.value)} className="w-32" />
          </div>
        </Field>
      </section>

      {/* Theme */}
      <section className="space-y-3 rounded-2xl bg-white dark:bg-neutral-900 p-5 ring-1 ring-black/5 dark:ring-white/10">
        <h2 className="text-sm font-semibold text-neutral-700 dark:text-neutral-300">Template</h2>
        <div className="grid grid-cols-3 gap-3">
          {availableThemes.map((t) => {
            const meta = THEMES[t]
            const active = theme === t
            return (
              <button
                key={t}
                type="button"
                onClick={() => setTheme(t)}
                className={cn('rounded-xl border-2 p-3 text-left', active ? 'border-amber-500' : 'border-neutral-200 dark:border-neutral-800')}
              >
                <span className="mb-2 flex gap-1">
                  <span className="h-5 w-5 rounded-full" style={{ background: meta.colors.brand }} />
                  <span className="h-5 w-5 rounded-full" style={{ background: meta.colors.bg, border: '1px solid #ddd' }} />
                </span>
                <span className="text-sm font-medium capitalize text-neutral-800 dark:text-neutral-200">{t}</span>
              </button>
            )
          })}
        </div>
      </section>

      {/* Hours */}
      <section className="space-y-2 rounded-2xl bg-white dark:bg-neutral-900 p-5 ring-1 ring-black/5 dark:ring-white/10">
        <h2 className="text-sm font-semibold text-neutral-700 dark:text-neutral-300">Opening hours</h2>
        {DAYS.map(({ key, label }) => {
          const d = hours[key] ?? { open: '09:00', close: '22:00', closed: false }
          return (
            <div key={key} className="flex items-center gap-3 py-1.5">
              <span className="w-10 text-sm text-neutral-600 dark:text-neutral-400">{label}</span>
              <Toggle checked={!d.closed} onChange={(open) => setDay(key, { closed: !open })} size="sm" label={`${label} open`} />
              {d.closed ? (
                <span className="text-sm text-neutral-400">Closed</span>
              ) : (
                <div className="flex items-center gap-2">
                  <input type="time" value={d.open} onChange={(e) => setDay(key, { open: e.target.value })} className="h-9 rounded-lg border border-neutral-300 dark:border-neutral-700 bg-transparent dark:bg-neutral-800 text-neutral-900 dark:text-neutral-100 px-2 text-sm" />
                  <span className="text-neutral-400">–</span>
                  <input type="time" value={d.close} onChange={(e) => setDay(key, { close: e.target.value })} className="h-9 rounded-lg border border-neutral-300 dark:border-neutral-700 bg-transparent dark:bg-neutral-800 text-neutral-900 dark:text-neutral-100 px-2 text-sm" />
                </div>
              )}
            </div>
          )
        })}
      </section>

      {/* Advanced Features */}
      <section className="space-y-4 rounded-2xl bg-white dark:bg-neutral-900 p-5 ring-1 ring-black/5 dark:ring-white/10">
        <h2 className="text-sm font-semibold text-neutral-700 dark:text-neutral-300">Advanced Features</h2>
        
        {/* Multiple Menus (Advanced or Premium) */}
        {isAdvancedOrPremium ? (
          <div className="flex items-center justify-between gap-4">
            <div>
              <p className="font-medium text-neutral-800 dark:text-neutral-200 text-sm">Multiple Menus</p>
              <p className="text-xs text-neutral-500 dark:text-neutral-400">Enable creating separate menus for Breakfast, Lunch, and Dinner with custom schedules.</p>
            </div>
            <Toggle checked={multipleMenus} onChange={setMultipleMenus} size="md" label="Multiple menus" />
          </div>
        ) : (
          <UpgradePrompt feature="Multiple Menus" description="Create separate menus for Breakfast, Lunch, and Dinner with custom automated schedules." />
        )}

        <div className="my-4 border-t border-black/5 dark:border-white/10" />

        {/* Reservations (Premium only) */}
        {isPremium ? (
          <div className="flex items-center justify-between gap-4">
            <div>
              <p className="font-medium text-neutral-800 dark:text-neutral-200 text-sm">Table Reservations</p>
              <p className="text-xs text-neutral-500 dark:text-neutral-400">Allow customers to book a table directly from your menu.</p>
            </div>
            <Toggle checked={reservationsEnabled} onChange={setReservationsEnabled} size="md" label="Table reservations" />
          </div>
        ) : (
          <UpgradePrompt feature="Table Reservations" description="Allow customers to request table bookings straight from your digital menu." />
        )}

        <div className="my-4 border-t border-black/5 dark:border-white/10" />

        {/* Multiple Branches (Premium only) */}
        {isPremium ? (
          <div className="flex items-center justify-between gap-4">
            <div>
              <p className="font-medium text-neutral-800 dark:text-neutral-200 text-sm">Multiple Branches</p>
              <p className="text-xs text-neutral-500 dark:text-neutral-400">Manage multiple outlet locations and branch-specific item availability.</p>
            </div>
            <Toggle checked={multipleBranchesEnabled} onChange={setMultipleBranchesEnabled} size="md" label="Multiple branches" />
          </div>
        ) : (
          <UpgradePrompt feature="Multiple Branches" description="Expand your menu to support multiple outlets and branch-specific stock." />
        )}
      </section>

      {/* SEO settings */}
      <section className="space-y-4 rounded-2xl bg-white dark:bg-neutral-900 p-5 ring-1 ring-black/5 dark:ring-white/10">
        <h2 className="text-sm font-semibold text-neutral-700 dark:text-neutral-300">SEO Settings</h2>
        {isPremium ? (
          <>
            <Field label="SEO Title"><Input {...register('seo_title')} placeholder={`e.g. ${business.name} | Best Cafe in Town`} /></Field>
            <Field label="SEO Description"><Input {...register('seo_description')} placeholder="e.g. Come visit our beautiful cafe..." /></Field>
            <div className="w-full sm:w-96">
              <p className="mb-1 text-sm font-medium text-neutral-700 dark:text-neutral-300">SEO Image (OG Image)</p>
              <p className="mb-3 text-xs text-neutral-500 dark:text-neutral-400">Appears when the link is shared on iMessage, WhatsApp, Twitter, etc.</p>
              <ImageUpload file={seoOgFile} existingUrl={cdnUrl(business.seo_og_r2_key)} onChange={setSeoOgFile} aspect="aspect-[1.91/1]" />
            </div>
          </>
        ) : (
          <UpgradePrompt feature="SEO Customization" description="Take full control of how your menu appears on Google and when shared on social media." />
        )}
      </section>

      <Button type="submit" loading={saving} className="w-full md:w-auto">Save settings</Button>
    </form>
  )
}
