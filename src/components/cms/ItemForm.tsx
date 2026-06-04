'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { Trash2, ImageOff, Images, Upload } from 'lucide-react'
import { useCms } from './Providers'
import { StockImagePicker } from './StockImagePicker'
import { ImageUpload } from './ImageUpload'
import { Button } from '@/components/ui/Button'
import { Input, Textarea, Select, Field } from '@/components/ui/Input'
import { Toggle } from '@/components/ui/Toggle'
import { useCmsStore } from '@/stores/cms'
import {
  qk, fetchItem, fetchCategories, createItem, updateItem, deleteItem, uploadImage,
} from '@/lib/cms-queries'
import { cdnUrl, type Badge, type ImageMode, type Item, type DietaryPreference } from '@/types/database'
import { cn } from '@/lib/utils'

const schema = z.object({
  name: z.string().min(1, 'Name is required'),
  description: z.string().optional(),
  price: z.number({ invalid_type_error: 'Price is required' }).min(0, 'Price must be ≥ 0'),
  compare_price: z.number().min(0).nullable().optional(),
  category_id: z.string().optional(),
  badge: z.string().optional(),
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

  // Image + non-native fields kept outside RHF.
  const [imageMode, setImageMode] = useState<ImageMode>('none')
  const [stockKey, setStockKey] = useState<string | null>(null)
  const [pendingFile, setPendingFile] = useState<File | null>(null)
  const [existing, setExisting] = useState<Pick<Item, 'custom_r2_key' | 'custom_thumb_key'>>({ custom_r2_key: null, custom_thumb_key: null })
  const [dietary, setDietary] = useState<DietaryPreference>('none')
  const [jain, setJain] = useState(false)
  const [gf, setGf] = useState(false)
  const [featured, setFeatured] = useState(false)
  const [saving, setSaving] = useState(false)
  const [imgErr, setImgErr] = useState<string | null>(null)

  const { register, handleSubmit, reset, formState: { errors } } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { name: '', description: '', price: 0, compare_price: null, category_id: '', badge: '' },
  })

  // Populate when editing.
  useEffect(() => {
    const it = itemQ.data
    if (!it) return
    reset({
      name: it.name,
      description: it.description ?? '',
      price: it.price,
      compare_price: it.compare_price,
      category_id: it.category_id ?? '',
      badge: it.badge ?? '',
    })
    setImageMode(it.image_mode)
    setStockKey(it.stock_image_key)
    setExisting({ custom_r2_key: it.custom_r2_key, custom_thumb_key: it.custom_thumb_key })
    setDietary(it.dietary); setJain(it.is_jain); setGf(it.is_gluten_free)
    setFeatured(it.is_featured)
  }, [itemQ.data, reset])

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
        category_id: values.category_id || null,
        badge: (values.badge || null) as Badge | null,
        dietary, is_jain: jain, is_gluten_free: gf,
        is_featured: featured,
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

      await qc.invalidateQueries({ queryKey: qk.items(business.id) })
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
    return <div className="h-64 animate-pulse rounded-2xl bg-neutral-200" />
  }

  const dietaryFlags: [string, boolean, (v: boolean) => void][] = [
    ['Jain', jain, setJain],
    ['Gluten-free', gf, setGf],
  ]

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      <header className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold text-neutral-900">{editing ? 'Edit item' : 'Add item'}</h1>
        {editing && (
          <Button type="button" variant="ghost" onClick={onDelete} className="text-red-500">
            <Trash2 className="h-4 w-4" /> Delete
          </Button>
        )}
      </header>

      <div className="space-y-4 rounded-2xl bg-white p-5 ring-1 ring-black/5">
        <Field label="Name" required error={errors.name?.message}>
          <Input {...register('name')} placeholder="e.g. Paneer Tikka" />
        </Field>
        <Field label="Description">
          <Textarea {...register('description')} placeholder="Short, appetising description…" />
        </Field>
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
      </div>

      {/* Image section */}
      <div className="space-y-3 rounded-2xl bg-white p-5 ring-1 ring-black/5">
        <p className="text-sm font-medium text-neutral-700">Photo</p>
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
                  imageMode === t.mode ? 'border-amber-500 bg-amber-50 text-amber-600' : 'border-neutral-200 text-neutral-600',
                )}
              >
                <Icon className="h-4 w-4" /> {t.label}
              </button>
            )
          })}
        </div>

        {imageMode === 'none' && (
          <p className="rounded-lg bg-neutral-50 p-3 text-xs text-neutral-500">
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
      <div className="space-y-4 rounded-2xl bg-white p-5 ring-1 ring-black/5">
        <p className="text-sm font-medium text-neutral-700">Dietary</p>
        
        <Field label="Dietary Preference">
          <Select value={dietary} onChange={(e) => setDietary(e.target.value as DietaryPreference)}>
            <option value="none">None / Not Specified</option>
            <option value="veg">Vegetarian</option>
            <option value="non-veg">Non-Vegetarian</option>
            <option value="egg">Contains Egg</option>
            <option value="vegan">Vegan</option>
          </Select>
        </Field>

        <div className="grid grid-cols-2 gap-3 mt-3">
          {dietaryFlags.map(([label, val, set]) => (
            <div key={label} className="flex items-center justify-between rounded-lg bg-neutral-50 px-3 py-2.5">
              <span className="text-sm text-neutral-700">{label}</span>
              <Toggle checked={val} onChange={set} label={label} size="sm" />
            </div>
          ))}
        </div>
        <div className="flex items-center justify-between rounded-lg bg-neutral-50 px-3 py-2.5">
          <div>
            <span className="text-sm font-medium text-neutral-700">Featured</span>
            <p className="text-xs text-neutral-400">Show in the bestsellers strip</p>
          </div>
          <Toggle checked={featured} onChange={setFeatured} label="Featured" size="sm" />
        </div>
      </div>

      <div className="flex gap-3">
        <Button type="submit" loading={saving} className="flex-1">{editing ? 'Save changes' : 'Add item'}</Button>
        <Button type="button" variant="secondary" onClick={() => router.push('/cms/items')}>Cancel</Button>
      </div>
    </form>
  )
}
