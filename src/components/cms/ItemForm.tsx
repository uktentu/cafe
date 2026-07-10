'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { Trash2, ImageOff, Images, Upload, Plus, X } from 'lucide-react'
import { useCms } from './Providers'
import { StockImagePicker } from './StockImagePicker'
import { ImageUpload } from './ImageUpload'
import { Button } from '@/components/ui/Button'
import { Input, Textarea, Select, Field } from '@/components/ui/Input'
import { Toggle } from '@/components/ui/Toggle'
import { useCmsStore } from '@/stores/cms'
import {
  qk, fetchItem, fetchCategories, createItem, updateItem, deleteItem, uploadImage, fetchBranches,
  fetchTranslations, upsertTranslation
} from '@/lib/cms-queries'
import { cdnUrl, type Badge, type ImageMode, type Item, type DietaryPreference, type AddOn } from '@/types/database'
import { getConfig } from '@/lib/config'
import { cn } from '@/lib/utils'

const schema = z.object({
  name: z.string().min(1, 'Name is required'),
  description: z.string().optional(),
  price: z.number({ invalid_type_error: 'Price is required' }).min(0, 'Price must be ≥ 0'),
  compare_price: z.number().min(0).nullable().optional(),
  category_id: z.string().optional(),
  branch_id: z.string().nullable().optional(),
  badge: z.string().optional(),
  name_tl: z.string().optional(),
  description_tl: z.string().optional(),
})
type FormValues = z.infer<typeof schema>

const BADGES: { value: Badge | ''; label: string }[] = [
  { value: '', label: 'None' },
  { value: 'bestseller', label: 'Bestseller' },
  { value: 'chef_special', label: "Chef's Special" },
  { value: 'new', label: 'New' },
  { value: 'spicy', label: 'Spicy' },
]

const IMAGE_TABS: { mode: ImageMode; label: string; icon: typeof ImageOff }[] = [
  { mode: 'none', label: 'No image', icon: ImageOff },
  { mode: 'stock', label: 'Stock', icon: Images },
  { mode: 'custom', label: 'Upload', icon: Upload },
]

export function ItemForm({ itemId }: { itemId?: string }) {
  const editing = Boolean(itemId)
  const { business } = useCms()
  const router = useRouter()
  const qc = useQueryClient()
  const pushToast = useCmsStore((s) => s.pushToast)

  const catsQ = useQuery({ queryKey: qk.categories(business.id), queryFn: () => fetchCategories(business.id) })
  const itemQ = useQuery({ queryKey: ['item', itemId], queryFn: () => fetchItem(itemId!), enabled: editing })
  const { features } = getConfig()
  const isBranchesEnabled = features.multiBranch && business.social_links?.multiple_branches_enabled === true
  const branchesQ = useQuery({ queryKey: qk.branches(business.id), queryFn: () => fetchBranches(business.id), enabled: isBranchesEnabled })
  const transQ = useQuery({ queryKey: qk.translations(business.id), queryFn: () => fetchTranslations(business.id) })
  const activeBranchId = useCmsStore((s) => s.activeBranchId)

  const translations = Array.isArray(transQ.data) ? transQ.data : []
  const secondaryLocaleSetting = translations.find((t) => t.entity_type === 'business' && t.field === '_system_secondary_locale')
  const secondaryLocale = secondaryLocaleSetting?.value || null

  // Image + non-native fields kept outside RHF.
  const [imageMode, setImageMode] = useState<ImageMode>('none')
  const [stockKey, setStockKey] = useState<string | null>(null)
  const [pendingFile, setPendingFile] = useState<File | null>(null)
  const [existing, setExisting] = useState<Pick<Item, 'custom_r2_key' | 'custom_thumb_key'>>({ custom_r2_key: null, custom_thumb_key: null })
  const [dietary, setDietary] = useState<DietaryPreference>('none')
  const [jain, setJain] = useState(false)
  const [gf, setGf] = useState(false)
  const [featured, setFeatured] = useState(false)
  const [isSpecial, setIsSpecial] = useState(false)
  const [isBar, setIsBar] = useState(false)
  const [spice, setSpice] = useState(0)
  const [showFrom, setShowFrom] = useState('')
  const [showUntil, setShowUntil] = useState('')
  const [allergens, setAllergens] = useState<string[]>([])
  const [addOns, setAddOns] = useState<AddOn[]>([])
  const [newAddOn, setNewAddOn] = useState({ name: '', price: '' })
  const [saving, setSaving] = useState(false)
  const [imgErr, setImgErr] = useState<string | null>(null)

  const { register, handleSubmit, reset, formState: { errors } } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { name: '', description: '', price: 0, compare_price: null, category_id: '', badge: '', branch_id: activeBranchId || '', name_tl: '', description_tl: '' },
  })

  // Populate when editing.
  useEffect(() => {
    const it = itemQ.data
    if (!it) return
    const ts = Array.isArray(transQ.data) ? transQ.data : []
    reset({
      name: it.name,
      description: it.description ?? '',
      price: it.price,
      compare_price: it.compare_price,
      category_id: it.category_id ?? '',
      branch_id: it.branch_id ?? '',
      badge: it.badge ?? '',
      name_tl: ts.find(t => t.entity_id === it.id && t.field === 'name')?.value || '',
      description_tl: ts.find(t => t.entity_id === it.id && t.field === 'description')?.value || '',
    })
    setImageMode(it.image_mode)
    setStockKey(it.stock_image_key)
    setExisting({ custom_r2_key: it.custom_r2_key, custom_thumb_key: it.custom_thumb_key })
    setDietary(it.dietary); setJain(it.is_jain); setGf(it.is_gluten_free)
    setFeatured(it.is_featured)
    setIsSpecial(it.is_special ?? false)
    setIsBar(it.is_bar ?? false)
    setSpice(it.spice_level ?? 0)
    setShowFrom(it.show_from ?? '')
    setShowUntil(it.show_until ?? '')
    setAllergens(it.allergens ?? [])
    setAddOns(it.add_ons ?? [])
  }, [itemQ.data, transQ.data, reset])

  async function onSubmit(values: FormValues) {
    setImgErr(null)
    // Validate image source.
    if (imageMode === 'stock' && !stockKey) {
      setImgErr('Pick a stock photo or choose “No image”.')
      return
    }
    const hasExistingCustom = Boolean(existing.custom_thumb_key)
    if (imageMode === 'custom' && !pendingFile && !hasExistingCustom) {
      setImgErr('Upload a photo or choose another option.')
      return
    }

    setSaving(true)
    try {
      const scalar = {
        business_id: business.id,
        name: values.name,
        description: values.description?.trim() || null,
        price: Number(values.price),
        compare_price: values.compare_price ?? null,
        category_id: values.category_id || undefined,
        branch_id: values.branch_id || null,
        badge: (values.badge || null) as Badge | null,
        dietary, is_jain: jain, is_gluten_free: gf,
        is_featured: featured,
        is_special: isSpecial,
        // Only sent when POS is on, so item saves keep working on databases
        // where migration 010 (which adds items.is_bar) hasn't run yet.
        ...(getConfig().features.posEnabled ? { is_bar: isBar } : {}),
        spice_level: spice,
        show_from: showFrom || null,
        show_until: showUntil || null,
        allergens,
        add_ons: addOns,
      }

      // Image fields that don't require an upload.
      const imageFields: Partial<Item> =
        imageMode === 'stock'
          ? { image_mode: 'stock', stock_image_key: stockKey, custom_r2_key: null, custom_thumb_key: null }
          : imageMode === 'none'
            ? { image_mode: 'none', stock_image_key: null, custom_r2_key: null, custom_thumb_key: null }
            : { image_mode: 'custom', stock_image_key: null } // keep custom keys unless a new file is uploaded

      let id = itemId
      if (editing) {
        await updateItem(id!, { ...scalar, ...imageFields })
      } else {
        const created = await createItem({ ...scalar, ...imageFields, sort_order: Math.floor(Date.now() / 1000) })
        id = created.id
      }

      if (imageMode === 'custom' && pendingFile && id) {
        const up = await uploadImage(pendingFile, 'item', id)
        await updateItem(id, {
          image_mode: 'custom',
          custom_r2_key: up.custom_r2_key ?? null,
          custom_thumb_key: up.custom_thumb_key ?? null,
          stock_image_key: null,
        })
      }

      // Upsert translations
      if (id && secondaryLocale) {
        let nameTl = values.name_tl?.trim() || ''
        let descTl = values.description_tl?.trim() || ''

        // Auto-translate using Google if empty
        if (!nameTl && values.name) {
          try {
            const res = await fetch('/api/translate', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ text: values.name, to: secondaryLocale })
            })
            const data = await res.json()
            if (data.translatedText) nameTl = data.translatedText
          } catch (err) { console.error('Failed to auto-translate name:', err) }
        }

        if (!descTl && values.description) {
          try {
            const res = await fetch('/api/translate', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ text: values.description, to: secondaryLocale })
            })
            const data = await res.json()
            if (data.translatedText) descTl = data.translatedText
          } catch (err) { console.error('Failed to auto-translate description:', err) }
        }

        await upsertTranslation(business.id, 'item', id, secondaryLocale, 'name', nameTl)
        await upsertTranslation(business.id, 'item', id, secondaryLocale, 'description', descTl)
      }

      qc.invalidateQueries({ queryKey: qk.items(business.id, activeBranchId) })
      qc.invalidateQueries({ queryKey: qk.translations(business.id) })
      pushToast(editing ? 'Item saved' : 'Item added')
      router.push('/cms/items')
      router.refresh()
    } catch (e) {
      pushToast((e as Error).message || 'Save failed', 'error')
    } finally {
      setSaving(false)
    }
  }

  async function onDelete() {
    if (!itemId || !confirm('Delete this item? This cannot be undone.')) return
    setSaving(true)
    try {
      await deleteItem(itemId)
      await qc.invalidateQueries({ queryKey: qk.items(business.id) })
      pushToast('Item deleted')
      router.push('/cms/items')
      router.refresh()
    } catch (e) {
      pushToast((e as Error).message || 'Delete failed', 'error')
      setSaving(false)
    }
  }

  if (editing && itemQ.isLoading) {
    return <div className="h-64 animate-pulse rounded-2xl bg-neutral-200 dark:bg-neutral-800" />
  }

  const dietaryFlags: [string, boolean, (v: boolean) => void][] = [
    ['Jain', jain, setJain],
    ['Gluten-free', gf, setGf],
  ]

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      <header className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold text-neutral-900 dark:text-neutral-100">{editing ? 'Edit item' : 'Add item'}</h1>
        {editing && (
          <Button type="button" variant="ghost" onClick={onDelete} className="text-red-500">
            <Trash2 className="h-4 w-4" /> Delete
          </Button>
        )}
      </header>

      <div className="space-y-4 rounded-2xl bg-white dark:bg-neutral-900 p-5 ring-1 ring-black/5 dark:ring-white/10">
        <Field label="Name" required error={errors.name?.message}>
          <Input {...register('name')} placeholder="e.g. Paneer Tikka" />
        </Field>
        {secondaryLocale && (
          <Field label={`Name (${secondaryLocale.toUpperCase()})`} hint="Translation for secondary locale">
            <Input {...register('name_tl')} dir={secondaryLocale === 'ar' ? 'rtl' : 'ltr'} />
          </Field>
        )}
        <Field label="Description">
          <Textarea {...register('description')} placeholder="Short, appetising description…" />
        </Field>
        {secondaryLocale && (
          <Field label={`Description (${secondaryLocale.toUpperCase()})`} hint="Translation for secondary locale">
            <Textarea {...register('description_tl')} dir={secondaryLocale === 'ar' ? 'rtl' : 'ltr'} />
          </Field>
        )}
        <div className="grid grid-cols-2 gap-4">
          <Field label="Price (₹)" required error={errors.price?.message}>
            <Input type="number" step="0.01" inputMode="decimal" {...register('price', { valueAsNumber: true })} />
          </Field>
          <Field label="Compare-at (₹)" hint="Shows a strikethrough">
            <Input
              type="number"
              step="0.01"
              inputMode="decimal"
              {...register('compare_price', { setValueAs: (v) => (v === '' || v == null ? null : Number(v)) })}
            />
          </Field>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <Field label="Category">
            <Select {...register('category_id')}>
              <option value="">Uncategorised</option>
              {catsQ.data?.map((c) => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </Select>
          </Field>
          <Field label="Badge">
            <Select {...register('badge')}>
              {BADGES.map((b) => <option key={b.value} value={b.value}>{b.label}</option>)}
            </Select>
          </Field>
        </div>
        
        {isBranchesEnabled && (branchesQ.data?.length ?? 0) > 0 && (
          <div className="grid grid-cols-2 gap-4">
            <Field label="Branch">
              <Select {...register('branch_id')}>
                <option value="">All Branches</option>
                {branchesQ.data?.map((b) => (
                  <option key={b.id} value={b.id}>{b.name}</option>
                ))}
              </Select>
            </Field>
          </div>
        )}
      </div>

      {/* Image section */}
      <div className="space-y-3 rounded-2xl bg-white dark:bg-neutral-900 p-5 ring-1 ring-black/5 dark:ring-white/10">
        <p className="text-sm font-medium text-neutral-700 dark:text-neutral-300">Photo</p>
        <div className="flex gap-2">
          {IMAGE_TABS.map((t) => {
            const Icon = t.icon
            return (
              <button
                key={t.mode}
                type="button"
                onClick={() => { setImageMode(t.mode); setImgErr(null) }}
                className={cn(
                  'flex flex-1 items-center justify-center gap-1.5 rounded-lg border py-2 text-sm font-medium',
                  imageMode === t.mode ? 'border-amber-500 bg-amber-50 dark:bg-amber-500/10 text-amber-600 dark:text-amber-500' : 'border-neutral-200 dark:border-neutral-800 text-neutral-600 dark:text-neutral-400',
                )}
              >
                <Icon className="h-4 w-4" /> {t.label}
              </button>
            )
          })}
        </div>

        {imageMode === 'none' && (
          <p className="rounded-lg bg-neutral-50 dark:bg-neutral-800/50 p-3 text-xs text-neutral-500 dark:text-neutral-400">
            Text-only — the card shows the category icon. Looks intentional, not broken.
          </p>
        )}
        {imageMode === 'stock' && (
          <StockImagePicker selected={stockKey} onSelect={(k) => { setStockKey(k); setImgErr(null) }} />
        )}
        {imageMode === 'custom' && (
          <ImageUpload
            file={pendingFile}
            existingUrl={cdnUrl(existing.custom_thumb_key)}
            onChange={(f) => { setPendingFile(f); setImgErr(null) }}
          />
        )}
        {imgErr && <p className="text-xs text-red-500">{imgErr}</p>}
      </div>

      {/* Dietary + featured */}
      <div className="space-y-4 rounded-2xl bg-white dark:bg-neutral-900 p-5 ring-1 ring-black/5 dark:ring-white/10">
        <p className="text-sm font-medium text-neutral-700 dark:text-neutral-300">Dietary</p>
        
        <Field label="Dietary Preference">
          <Select value={dietary} onChange={(e) => setDietary(e.target.value as DietaryPreference)}>
            <option value="none">None / Not Specified</option>
            <option value="veg">Vegetarian</option>
            <option value="non-veg">Non-Vegetarian</option>
            <option value="egg">Contains Egg</option>
            <option value="vegan">Vegan</option>
          </Select>
        </Field>

        <Field label="Spice level" hint="Shown as 🌶️ chillies on the menu">
          <div className="flex gap-2">
            {[['None', 0], ['Mild', 1], ['Medium', 2], ['Hot', 3]].map(([lbl, v]) => (
              <button
                key={v as number}
                type="button"
                onClick={() => setSpice(v as number)}
                className={`flex-1 rounded-lg px-2 py-2 text-sm font-medium transition-colors ${
                  spice === v
                    ? 'bg-amber-500 text-white'
                    : 'bg-neutral-50 dark:bg-neutral-800/50 text-neutral-600 dark:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-neutral-800'
                }`}
              >
                {lbl}
              </button>
            ))}
          </div>
        </Field>

        <div className="grid grid-cols-2 gap-3 mt-3">
          {dietaryFlags.map(([label, val, set]) => (
            <div key={label} className="flex items-center justify-between rounded-lg bg-neutral-50 dark:bg-neutral-800/50 px-3 py-2.5">
              <span className="text-sm text-neutral-700 dark:text-neutral-300">{label}</span>
              <Toggle checked={val} onChange={set} label={label} size="sm" />
            </div>
          ))}
        </div>
        <div className="flex items-center justify-between rounded-lg bg-neutral-50 dark:bg-neutral-800/50 px-3 py-2.5">
          <div>
            <span className="text-sm font-medium text-neutral-700 dark:text-neutral-300">Featured</span>
            <p className="text-xs text-neutral-400">Show in the bestsellers strip</p>
          </div>
          <Toggle checked={featured} onChange={setFeatured} label="Featured" size="sm" />
        </div>
        <div className="flex items-center justify-between rounded-lg bg-amber-50 dark:bg-amber-500/10 px-3 py-2.5">
          <div>
            <span className="text-sm font-medium text-amber-700 dark:text-amber-400">✦ Today&apos;s Special</span>
            <p className="text-xs text-neutral-400">Shows amber badge on item card</p>
          </div>
          <Toggle checked={isSpecial} onChange={setIsSpecial} label="Today's Special" size="sm" />
        </div>
        {features.posEnabled && (
          <div className="flex items-center justify-between rounded-lg bg-purple-50 dark:bg-purple-500/10 px-3 py-2.5">
            <div>
              <span className="text-sm font-medium text-purple-700 dark:text-purple-400">Bar item (liquor)</span>
              <p className="text-xs text-neutral-400">Billed separately under VAT, on its own bar bill</p>
            </div>
            <Toggle checked={isBar} onChange={setIsBar} label="Bar item" size="sm" />
          </div>
        )}
        {isSpecial && (
          <div className="grid grid-cols-2 gap-3">
            <Field label="Show from (HH:MM)">
              <Input type="time" value={showFrom} onChange={(e) => setShowFrom(e.target.value)} placeholder="09:00" />
            </Field>
            <Field label="Hide after (HH:MM)">
              <Input type="time" value={showUntil} onChange={(e) => setShowUntil(e.target.value)} placeholder="22:00" />
            </Field>
          </div>
        )}
      </div>

      {/* Allergens */}
      <div className="space-y-3 rounded-2xl bg-white dark:bg-neutral-900 p-5 ring-1 ring-black/5 dark:ring-white/10">
        <p className="text-sm font-medium text-neutral-700 dark:text-neutral-300">Allergens</p>
        <div className="flex flex-wrap gap-2">
          {['Gluten', 'Nuts', 'Peanuts', 'Dairy', 'Eggs', 'Soy', 'Shellfish', 'Fish'].map((a) => {
            const active = allergens.includes(a)
            return (
              <button
                key={a}
                type="button"
                onClick={() => setAllergens(active ? allergens.filter(x => x !== a) : [...allergens, a])}
                className={cn(
                  'rounded-full border px-3 py-1 text-xs font-medium transition-colors',
                  active
                    ? 'border-amber-500 bg-amber-50 dark:bg-amber-500/15 text-amber-700 dark:text-amber-400'
                    : 'border-neutral-200 dark:border-neutral-700 text-neutral-500 dark:text-neutral-400 hover:border-amber-300'
                )}
              >
                {a}
              </button>
            )
          })}
        </div>
        {allergens.length > 0 && (
          <p className="text-xs text-neutral-400">Tagged: {allergens.join(', ')}</p>
        )}
      </div>

      {/* Add-ons */}
      <div className="space-y-3 rounded-2xl bg-white dark:bg-neutral-900 p-5 ring-1 ring-black/5 dark:ring-white/10">
        <p className="text-sm font-medium text-neutral-700 dark:text-neutral-300">Add-ons / Modifiers</p>
        <p className="text-xs text-neutral-400">Customers can select these in the item modal before adding to cart.</p>
        <div className="space-y-2">
          {addOns.map((ao) => (
            <div key={ao.id} className="flex items-center gap-2 rounded-lg bg-neutral-50 dark:bg-neutral-800/50 px-3 py-2">
              <span className="flex-1 text-sm text-neutral-700 dark:text-neutral-300">{ao.name}</span>
              <span className="text-sm font-semibold text-amber-600">{ao.price > 0 ? `+₹${ao.price}` : 'Free'}</span>
              <button
                type="button"
                onClick={() => setAddOns(addOns.filter(a => a.id !== ao.id))}
                className="rounded p-0.5 text-neutral-400 hover:text-red-500"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            </div>
          ))}
          <div className="flex gap-2">
            <input
              type="text"
              placeholder="Add-on name (e.g. Extra Cheese)"
              value={newAddOn.name}
              onChange={(e) => setNewAddOn(n => ({ ...n, name: e.target.value }))}
              className="flex-1 rounded-lg border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-800 px-3 py-2 text-sm text-neutral-900 dark:text-white focus:border-amber-500 focus:outline-none"
            />
            <input
              type="number"
              placeholder="₹0"
              value={newAddOn.price}
              onChange={(e) => setNewAddOn(n => ({ ...n, price: e.target.value }))}
              className="w-20 rounded-lg border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-800 px-3 py-2 text-sm text-neutral-900 dark:text-white focus:border-amber-500 focus:outline-none"
            />
            <button
              type="button"
              onClick={() => {
                if (!newAddOn.name.trim()) return
                setAddOns([...addOns, { id: crypto.randomUUID(), name: newAddOn.name.trim(), price: Number(newAddOn.price) || 0 }])
                setNewAddOn({ name: '', price: '' })
              }}
              className="flex h-9 w-9 items-center justify-center rounded-lg bg-amber-500 text-white hover:bg-amber-600"
            >
              <Plus className="h-4 w-4" />
            </button>
          </div>
        </div>
      </div>

      <div className="flex gap-3">
        <Button type="submit" loading={saving} className="flex-1">{editing ? 'Save changes' : 'Add item'}</Button>
        <Button type="button" variant="secondary" onClick={() => router.push('/cms/items')}>Cancel</Button>
      </div>
    </form>
  )
}
