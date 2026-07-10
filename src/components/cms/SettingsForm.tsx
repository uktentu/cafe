'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { useCms } from './Providers'
import { useQuery } from '@tanstack/react-query'
import { ImageUpload } from './ImageUpload'
import { Button } from '@/components/ui/Button'
import { Input, Field, Textarea, Select } from '@/components/ui/Input'
import { Toggle } from '@/components/ui/Toggle'
import { useCmsStore } from '@/stores/cms'
import { getConfig, tierRank } from '@/lib/config'
import { THEMES } from '@/lib/design-tokens'
import { UpgradePrompt } from './UpgradePrompt'
import { updateBusiness, uploadImage, fetchSecondaryLocale, setSecondaryLocale } from '@/lib/cms-queries'
import { cdnUrl, type Theme, type OpeningHours, SUPPORTED_LOCALES } from '@/types/database'
import { cn } from '@/lib/utils'
import {
  Store, Share2, Palette, Layers, Clock, Zap, Globe,
  MapPin, Check, Star, Loader2
} from 'lucide-react'

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

function SectionCard({
  icon: Icon,
  title,
  description,
  children,
}: {
  icon: React.ElementType
  title: string
  description?: string
  children: React.ReactNode
}) {
  return (
    <section className="overflow-hidden rounded-2xl bg-white dark:bg-neutral-900 ring-1 ring-black/5 dark:ring-white/10">
      <div className="flex items-center gap-3 border-b border-black/5 dark:border-white/[0.08] px-5 py-4">
        <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-neutral-100 dark:bg-neutral-800 text-neutral-500 dark:text-neutral-400">
          <Icon className="h-4 w-4" />
        </span>
        <div>
          <h2 className="text-sm font-semibold text-neutral-800 dark:text-neutral-200">{title}</h2>
          {description && (
            <p className="mt-0.5 text-xs text-neutral-500 dark:text-neutral-400">{description}</p>
          )}
        </div>
      </div>
      <div className="space-y-4 p-5">{children}</div>
    </section>
  )
}

function Divider() {
  return <div className="border-t border-black/5 dark:border-white/[0.06]" />
}

function FeatureRow({
  title,
  description,
  checked,
  onChange,
}: {
  title: string
  description: string
  checked: boolean
  onChange: (v: boolean) => void
}) {
  return (
    <div className="flex items-start justify-between gap-4">
      <div className="min-w-0">
        <p className="text-sm font-medium text-neutral-800 dark:text-neutral-200">{title}</p>
        <p className="mt-0.5 text-xs text-neutral-500 dark:text-neutral-400 leading-relaxed">{description}</p>
      </div>
      <Toggle checked={checked} onChange={onChange} size="md" label={title} />
    </div>
  )
}

export function SettingsForm() {
  const { business } = useCms()
  const router = useRouter()
  const pushToast = useCmsStore((s) => s.pushToast)
  const { tier, features } = getConfig()

  const extractQueryFromMapsUrl = (expandedUrl: string): string | null => {
    try {
      const u = new URL(expandedUrl)
      if (u.searchParams.has('q')) return u.searchParams.get('q')
      // @lat,lng,zoom pattern (place pins and search results)
      const coordMatch = expandedUrl.match(/@(-?\d+\.\d+),(-?\d+\.\d+)/)
      if (coordMatch) return `${coordMatch[1]},${coordMatch[2]}`
      // /place/Name or /search/Name in pathname
      const pathMatch = expandedUrl.match(/\/(?:place|search)\/([^/@]+)/)
      if (pathMatch?.[1]) return decodeURIComponent(pathMatch[1].replace(/\+/g, ' '))
    } catch {}
    return null
  }

  const handleMapsBlur = async () => {
    if (!googleMaps || !googleMaps.includes('goo.gl')) return
    if (googleMapsQuery) return // already has an override

    setResolvingMap(true)
    try {
      const res = await fetch('/api/admin/resolve-url', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: googleMaps })
      })
      if (res.ok) {
        const data = await res.json()
        if (data.expandedUrl) {
          const q = extractQueryFromMapsUrl(data.expandedUrl)
          if (q) setGoogleMapsQuery(q)
        }
      }
    } catch (err) {
      console.error('Failed to unfurl maps link', err)
    }
    setResolvingMap(false)
  }

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

  // Feature toggles
  const [multipleMenus, setMultipleMenus] = useState(business.social_links?.multiple_menus_enabled ?? false)
  const [reservationsEnabled, setReservationsEnabled] = useState(business.social_links?.reservations_enabled ?? false)
  const [multipleBranchesEnabled, setMultipleBranchesEnabled] = useState(business.social_links?.multiple_branches_enabled ?? false)
  const [waitTime, setWaitTime] = useState(business.social_links?.wait_time ?? '')
  const [about, setAbout] = useState(business.social_links?.about ?? '')

  // Social links
  const [instagram, setInstagram] = useState(business.social_links?.instagram ?? '')
  const [swiggy, setSwiggy] = useState(business.social_links?.swiggy ?? '')
  const [zomato, setZomato] = useState(business.social_links?.zomato ?? '')
  const [googleMaps, setGoogleMaps] = useState(business.social_links?.google_maps ?? '')
  const [googleMapsQuery, setGoogleMapsQuery] = useState(business.social_links?.google_maps_query ?? '')
  const [resolvingMap, setResolvingMap] = useState(false)
  const [googleReviews, setGoogleReviews] = useState(business.social_links?.google_reviews ?? '')

  // Auto-resolve on mount: if a goo.gl shortlink is already saved but no embed query was extracted yet
  useEffect(() => {
    const savedMaps = business.social_links?.google_maps ?? ''
    const savedQuery = business.social_links?.google_maps_query ?? ''
    if (!savedMaps.includes('goo.gl') || savedQuery) return
    setResolvingMap(true)
    fetch('/api/admin/resolve-url', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ url: savedMaps }),
    })
      .then(r => (r.ok ? r.json() : null))
      .then(data => {
        if (!data?.expandedUrl) return
        const q = extractQueryFromMapsUrl(data.expandedUrl)
        if (q) setGoogleMapsQuery(q)
      })
      .catch(() => {})
      .finally(() => setResolvingMap(false))
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const [taxPercent, setTaxPercent] = useState(String(business.tax_percent ?? 5))
  const [barTaxPercent, setBarTaxPercent] = useState(String(business.bar_tax_percent ?? 18))
  const [gstin, setGstin] = useState(business.gstin ?? '')
  const [fssaiLicense, setFssaiLicense] = useState(business.fssai_license ?? '')
  const [receiptFooter, setReceiptFooter] = useState(business.receipt_footer ?? '')
  const [logoFile, setLogoFile] = useState<File | null>(null)
  const [coverFile, setCoverFile] = useState<File | null>(null)
  const [seoOgFile, setSeoOgFile] = useState<File | null>(null)
  const [saving, setSaving] = useState(false)

  const { data: initialSecondaryLocale } = useQuery({
    queryKey: ['secondaryLocale', business.id],
    queryFn: () => fetchSecondaryLocale(business.id),
  })
  const [secondaryLocale, setSecondaryLocaleState] = useState<string>('')
  useEffect(() => {
    if (initialSecondaryLocale != null) setSecondaryLocaleState(initialSecondaryLocale)
  }, [initialSecondaryLocale])

  const isAdvancedOrPremium = tierRank(tier) >= tierRank('advanced')
  const isPremium = tier === 'premium'

  const availableThemes = (Object.keys(THEMES) as Theme[]).filter(
    (t) => tierRank(THEMES[t].tier) <= tierRank(tier),
  )
  const lockedThemes = (Object.keys(THEMES) as Theme[]).filter(
    (t) => tierRank(THEMES[t].tier) > tierRank(tier),
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
          google_maps_query: googleMapsQuery.trim() || null,
          google_reviews: googleReviews.trim() || null,
          multiple_menus_enabled: multipleMenus,
          reservations_enabled: reservationsEnabled,
          multiple_branches_enabled: multipleBranchesEnabled,
          wait_time: waitTime.trim() || null,
          about: about.trim() || null,
        },
        seo_title: values.seo_title || null,
        seo_description: values.seo_description || null,
      }
      if (features.posEnabled) {
        const parsedTax = Number(taxPercent)
        patch.tax_percent = Number.isFinite(parsedTax) ? parsedTax : 5
        const parsedBarTax = Number(barTaxPercent)
        patch.bar_tax_percent = Number.isFinite(parsedBarTax) ? parsedBarTax : 18
        patch.gstin = gstin.trim() || null
        patch.fssai_license = fssaiLicense.trim() || null
        patch.receipt_footer = receiptFooter.trim() || null
      }
      if (logoFile) { const up = await uploadImage(logoFile, 'logo'); patch.logo_r2_key = up.r2_key }
      if (coverFile) { const up = await uploadImage(coverFile, 'cover'); patch.cover_r2_key = up.r2_key }
      if (seoOgFile) { const up = await uploadImage(seoOgFile, 'seo_og'); patch.seo_og_r2_key = up.r2_key }
      await updateBusiness(business.id, patch)
      await setSecondaryLocale(business.id, secondaryLocale)
      pushToast('Settings saved')
      setLogoFile(null); setCoverFile(null); setSeoOgFile(null)
      router.refresh()
    } catch (e) {
      pushToast((e as Error).message || 'Save failed', 'error')
    } finally {
      setSaving(false)
    }
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)}>
      {/* ── Page header ── */}
      <div className="sticky top-[49px] md:top-0 z-20 -mx-4 md:-mx-8 mb-6 flex items-center justify-between bg-neutral-50/95 dark:bg-neutral-950/95 backdrop-blur-sm px-4 md:px-8 py-4 border-b border-black/5 dark:border-white/[0.06]">
        <div>
          <h1 className="text-xl font-semibold text-neutral-900 dark:text-neutral-100">Settings</h1>
          <p className="mt-0.5 text-xs text-neutral-500 dark:text-neutral-400">Restaurant profile, branding, and features</p>
        </div>
        <Button type="submit" loading={saving} size="sm">Save changes</Button>
      </div>

      <div className="space-y-5">
        {/* ── Restaurant ── */}
        <SectionCard icon={Store} title="Restaurant" description="Basic info shown on your public menu">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <Field label="Restaurant name" required>
              <Input {...register('name', { required: true })} />
            </Field>
            <Field label="Tagline">
              <Input {...register('tagline')} placeholder="Good food, good vibes." />
            </Field>
          </div>

          <Field label="Our Story" hint="Short paragraph shown on your menu. Leave blank to hide.">
            <Textarea
              value={about}
              onChange={(e) => setAbout(e.target.value)}
              rows={3}
              maxLength={600}
              placeholder="Tell guests what makes your place special — your history, signature dishes, vibe."
            />
          </Field>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <Field label="Phone number">
              <Input {...register('phone')} placeholder="+91 98765 43210" type="tel" />
            </Field>
            <Field label="WhatsApp" hint="Digits only, with country code">
              <Input {...register('whatsapp')} placeholder="919876543210" />
            </Field>
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <Field label="Address">
              <Input {...register('address')} placeholder="12, MG Road" />
            </Field>
            <Field label="City">
              <Input {...register('city')} placeholder="Bengaluru" />
            </Field>
          </div>

          <Divider />

          <Field label="Tonight's wait time" hint="Shown on the menu hero to manage expectations. Leave blank to hide.">
            <div className="flex items-center gap-2">
              <Input
                placeholder="e.g. 20 min"
                value={waitTime}
                onChange={(e) => setWaitTime(e.target.value)}
                className="max-w-[180px]"
              />
              {waitTime && (
                <button type="button" onClick={() => setWaitTime('')} className="text-xs text-neutral-400 hover:text-red-500 transition-colors">
                  Clear
                </button>
              )}
            </div>
          </Field>

          <Divider />

          <Field label="Secondary language" hint="Optional secondary language for the menu. English is always primary.">
            {getConfig().features.bilingual ? (
              <Select
                value={secondaryLocale}
                onChange={(e) => setSecondaryLocaleState(e.target.value)}
              >
                <option value="">None (English only)</option>
                {SUPPORTED_LOCALES.map((loc) => (
                  <option key={loc.code} value={loc.code}>{loc.name}</option>
                ))}
              </Select>
            ) : (
              <div className="mt-2">
                <UpgradePrompt feature="Bilingual Menu" description="Enable a secondary language for international tourists and guests." />
              </div>
            )}
          </Field>
        </SectionCard>

        {/* ── Social & Ordering links ── */}
        <SectionCard icon={Share2} title="Social &amp; ordering links" description="Icons shown in your menu footer. Leave blank to hide.">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <Field label="Instagram">
              <div className="relative">
                <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-[11px] font-bold text-pink-500">IG</span>
                <Input
                  value={instagram}
                  onChange={(e) => setInstagram(e.target.value)}
                  placeholder="https://instagram.com/yourplace"
                  type="url"
                  className="pl-9"
                />
              </div>
            </Field>
            <Field label="Google Maps Link">
              <div className="relative">
                <MapPin className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-red-400" />
                <Input
                  value={googleMaps}
                  onChange={(e) => setGoogleMaps(e.target.value)}
                  onBlur={handleMapsBlur}
                  placeholder="https://maps.google.com/… or https://maps.app.goo.gl/…"
                  type="url"
                  className="pl-9 pr-8"
                />
                {resolvingMap && <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 animate-spin text-white/50" />}
              </div>
            </Field>
            <Field label="Map Embed Override (Optional)">
              <div className="relative">
                <MapPin className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 opacity-50" />
                <Input
                  value={googleMapsQuery}
                  onChange={(e) => setGoogleMapsQuery(e.target.value)}
                  placeholder='<iframe src="https://www.google.com/maps/embed...'
                  type="text"
                  className="pl-9"
                />
              </div>
              <p className="mt-2 text-xs opacity-60">If the map is wrong, paste the exact <b>HTML Embed code</b> from Google Maps here.</p>
            </Field>
            <Field label="Google Reviews">
              <div className="relative">
                <Star className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-yellow-500" />
                <Input
                  value={googleReviews}
                  onChange={(e) => setGoogleReviews(e.target.value)}
                  placeholder="https://g.page/r/…"
                  type="url"
                  className="pl-9"
                />
              </div>
            </Field>
            <Field label="Swiggy">
              <div className="relative">
                <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-[11px] font-bold text-orange-500">SW</span>
                <Input
                  value={swiggy}
                  onChange={(e) => setSwiggy(e.target.value)}
                  placeholder="https://swiggy.com/…"
                  type="url"
                  className="pl-9"
                />
              </div>
            </Field>
            <Field label="Zomato">
              <div className="relative">
                <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-[11px] font-bold text-red-500">ZO</span>
                <Input
                  value={zomato}
                  onChange={(e) => setZomato(e.target.value)}
                  placeholder="https://zomato.com/…"
                  type="url"
                  className="pl-9"
                />
              </div>
            </Field>
          </div>
        </SectionCard>

        {/* ── Branding ── */}
        <SectionCard icon={Palette} title="Branding" description="Logo, cover photo, and brand colour">
          <div className="flex flex-col gap-5 sm:flex-row sm:items-start">
            <div className="w-36 shrink-0">
              <p className="mb-1.5 text-xs font-medium text-neutral-600 dark:text-neutral-400 uppercase tracking-wide">Logo</p>
              <ImageUpload file={logoFile} existingUrl={cdnUrl(business.logo_r2_key)} onChange={setLogoFile} aspect="aspect-square" />
            </div>
            <div className="flex-1">
              <p className="mb-1.5 text-xs font-medium text-neutral-600 dark:text-neutral-400 uppercase tracking-wide">Cover image</p>
              <ImageUpload file={coverFile} existingUrl={cdnUrl(business.cover_r2_key)} onChange={setCoverFile} aspect="aspect-video" />
            </div>
          </div>
          <Divider />
          <Field label="Brand colour" hint="Used for buttons, accents, and highlights across your menu">
            <div className="flex flex-wrap items-center gap-3">
              <label className="relative cursor-pointer shrink-0">
                <input type="color" value={brand} onChange={(e) => setBrand(e.target.value)}
                  className="sr-only" />
                <span
                  className="block h-10 w-10 rounded-lg border-2 border-white dark:border-neutral-700 shadow ring-1 ring-black/10 transition hover:scale-105 cursor-pointer"
                  style={{ background: brand }}
                />
              </label>
              <Input
                value={brand}
                onChange={(e) => setBrand(e.target.value)}
                className="w-32 font-mono text-sm shrink-0"
                placeholder="#F59E0B"
              />
              <span className="text-xs text-neutral-400">Click the swatch to open colour picker</span>
            </div>
          </Field>
        </SectionCard>

        {/* ── Template ── */}
        <SectionCard icon={Layers} title="Template" description="Choose the visual style for your public menu">
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
            {availableThemes.map((t) => {
              const meta = THEMES[t]
              const active = theme === t
              return (
                <button
                  key={t}
                  type="button"
                  onClick={() => setTheme(t)}
                  className={cn(
                    'relative rounded-xl border-2 p-3.5 text-left transition-all',
                    active
                      ? 'border-amber-500 bg-amber-50 dark:bg-amber-500/10'
                      : 'border-neutral-200 dark:border-neutral-800 hover:border-neutral-300 dark:hover:border-neutral-700',
                  )}
                >
                  {active && (
                    <span className="absolute right-2.5 top-2.5 flex h-4.5 w-4.5 items-center justify-center rounded-full bg-amber-500">
                      <Check className="h-2.5 w-2.5 text-white" />
                    </span>
                  )}
                  <span className="mb-2.5 flex gap-1.5">
                    <span className="h-5 w-5 rounded-full shadow-sm ring-1 ring-black/10" style={{ background: meta.colors.brand }} />
                    <span className="h-5 w-5 rounded-full shadow-sm ring-1 ring-black/10" style={{ background: meta.colors.bg }} />
                  </span>
                  <span className="block text-sm font-medium capitalize text-neutral-800 dark:text-neutral-200">{t}</span>
                  <span className={cn(
                    'mt-0.5 block text-[10px] font-medium capitalize',
                    meta.tier === 'basic' ? 'text-neutral-400' : meta.tier === 'advanced' ? 'text-blue-500' : 'text-amber-500',
                  )}>
                    {meta.tier}
                  </span>
                </button>
              )
            })}
            {lockedThemes.map((t) => {
              const meta = THEMES[t]
              return (
                <div
                  key={t}
                  className="relative cursor-not-allowed rounded-xl border-2 border-dashed border-neutral-200 dark:border-neutral-800 p-3.5 opacity-50"
                >
                  <span className="mb-2.5 flex gap-1.5">
                    <span className="h-5 w-5 rounded-full" style={{ background: meta.colors.brand }} />
                    <span className="h-5 w-5 rounded-full" style={{ background: meta.colors.bg }} />
                  </span>
                  <span className="block text-sm font-medium capitalize text-neutral-500">{t}</span>
                  <span className={cn(
                    'mt-0.5 block text-[10px] font-medium capitalize',
                    meta.tier === 'advanced' ? 'text-blue-400' : 'text-amber-400',
                  )}>
                    {meta.tier} ↑
                  </span>
                </div>
              )
            })}
          </div>
        </SectionCard>

        {/* ── Opening hours ── */}
        <SectionCard icon={Clock} title="Opening hours">
          <div className="divide-y divide-black/[0.04] dark:divide-white/[0.05]">
            {DAYS.map(({ key, label }) => {
              const d = hours[key] ?? { open: '09:00', close: '22:00', closed: false }
              return (
                <div key={key} className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-3 py-3 sm:py-2.5 first:pt-0 last:pb-0">
                  <div className="flex items-center gap-3 shrink-0">
                    <span className="w-9 shrink-0 text-sm font-medium text-neutral-600 dark:text-neutral-400">{label}</span>
                    <Toggle checked={!d.closed} onChange={(open) => setDay(key, { closed: !open })} size="sm" label={`${label} open`} />
                  </div>
                  {d.closed ? (
                    <span className="text-sm text-neutral-400 sm:ml-2">Closed</span>
                  ) : (
                    <div className="flex items-center gap-2 sm:ml-auto">
                      <input
                        type="time"
                        value={d.open}
                        onChange={(e) => setDay(key, { open: e.target.value })}
                        className="h-9 w-full sm:w-auto rounded-lg border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-800 px-2 text-sm text-neutral-900 dark:text-neutral-100 focus:border-amber-500 focus:outline-none"
                      />
                      <span className="text-neutral-400 shrink-0">–</span>
                      <input
                        type="time"
                        value={d.close}
                        onChange={(e) => setDay(key, { close: e.target.value })}
                        className="h-9 w-full sm:w-auto rounded-lg border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-800 px-2 text-sm text-neutral-900 dark:text-neutral-100 focus:border-amber-500 focus:outline-none"
                      />
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        </SectionCard>

        {/* ── Features ── */}
        <SectionCard icon={Zap} title="Features" description="Tier-gated capabilities for your restaurant">
          {isAdvancedOrPremium ? (
            <FeatureRow
              title="Multiple menus"
              description="Create separate menus for Breakfast, Lunch, and Dinner with automated schedules."
              checked={multipleMenus}
              onChange={setMultipleMenus}
            />
          ) : (
            <UpgradePrompt feature="Multiple Menus" description="Create separate menus for Breakfast, Lunch, and Dinner with automated schedules." />
          )}

          <Divider />

          {isPremium ? (
            <FeatureRow
              title="Table reservations"
              description="Allow customers to book a table directly from your menu."
              checked={reservationsEnabled}
              onChange={setReservationsEnabled}
            />
          ) : (
            <UpgradePrompt feature="Table Reservations" description="Allow customers to request table bookings straight from your digital menu." />
          )}

          <Divider />

          {isPremium ? (
            <FeatureRow
              title="Multiple branches"
              description="Manage multiple outlet locations with branch-specific item availability."
              checked={multipleBranchesEnabled}
              onChange={setMultipleBranchesEnabled}
            />
          ) : (
            <UpgradePrompt feature="Multiple Branches" description="Expand your menu to support multiple outlets and branch-specific stock." />
          )}
        </SectionCard>

        {/* ── POS ── */}
        {features.posEnabled && (
          <SectionCard icon={Zap} title="Billing" description="Printed on every bill — GST/VAT rates, license numbers, footer">
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <Field label="GST on food (%)">
                <Input type="number" min={0} max={100} step="0.01" value={taxPercent} onChange={(e) => setTaxPercent(e.target.value)} />
              </Field>
              <Field label="VAT on bar/liquor (%)">
                <Input type="number" min={0} max={100} step="0.01" value={barTaxPercent} onChange={(e) => setBarTaxPercent(e.target.value)} />
              </Field>
              <Field label="GSTIN">
                <Input value={gstin} onChange={(e) => setGstin(e.target.value)} placeholder="e.g. 29ABCDE1234F1Z5" />
              </Field>
              <Field label="FSSAI license no.">
                <Input value={fssaiLicense} onChange={(e) => setFssaiLicense(e.target.value)} placeholder="e.g. 12345678901234" />
              </Field>
            </div>
            <Field label="Receipt footer">
              <Input value={receiptFooter} onChange={(e) => setReceiptFooter(e.target.value)} placeholder="Thank you! Visit again." />
            </Field>
          </SectionCard>
        )}

        {/* ── SEO ── */}
        <SectionCard icon={Globe} title="SEO" description="Control how your menu appears on Google and when shared">
          {isPremium ? (
            <>
              <Field label="SEO title">
                <Input {...register('seo_title')} placeholder={`${business.name} | Best Cafe in Town`} />
              </Field>
              <Field label="SEO description">
                <Input {...register('seo_description')} placeholder="Come visit our beautiful cafe…" />
              </Field>
              <div>
                <p className="mb-1.5 text-sm font-medium text-neutral-700 dark:text-neutral-300">OG image</p>
                <p className="mb-3 text-xs text-neutral-500 dark:text-neutral-400">Shown when your menu link is shared on WhatsApp, iMessage, Twitter, etc.</p>
                <div className="max-w-sm">
                  <ImageUpload file={seoOgFile} existingUrl={cdnUrl(business.seo_og_r2_key)} onChange={setSeoOgFile} aspect="aspect-[1.91/1]" />
                </div>
              </div>
            </>
          ) : (
            <UpgradePrompt feature="SEO Customization" description="Take full control of how your menu appears on Google and when shared on social media." />
          )}
        </SectionCard>

        <div className="pb-8" />
      </div>
    </form>
  )
}
