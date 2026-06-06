'use client'

import { useState } from 'react'
import Image from 'next/image'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Plus, Pencil, Trash2, X, Check, Image as ImageIcon, Megaphone } from 'lucide-react'
import { useCms } from './Providers'
import { Toggle } from '@/components/ui/Toggle'
import { useCmsStore } from '@/stores/cms'
import {
  qk, fetchBanners, createBanner, updateBanner, deleteBanner, uploadImage,
  type BannerInput,
} from '@/lib/cms-queries'
import { cdnUrl, type Banner } from '@/types/database'
import { getConfig } from '@/lib/config'

function BannerForm({
  banner,
  businessId,
  onClose,
}: {
  banner: Banner | null
  businessId: string
  onClose: () => void
}) {
  const qc = useQueryClient()
  const pushToast = useCmsStore((s) => s.pushToast)
  const [title, setTitle] = useState(banner?.title ?? '')
  const [subtitle, setSubtitle] = useState(banner?.subtitle ?? '')
  const [ctaText, setCtaText] = useState(banner?.cta_text ?? '')
  const [ctaUrl, setCtaUrl] = useState(banner?.cta_url ?? '')
  const [startsAt, setStartsAt] = useState(banner?.starts_at?.slice(0, 16) ?? '')
  const [endsAt, setEndsAt] = useState(banner?.ends_at?.slice(0, 16) ?? '')
  const [imageKey, setImageKey] = useState(banner?.image_r2_key ?? null)
  const [uploading, setUploading] = useState(false)

  const save = useMutation({
    mutationFn: async () => {
      const input: BannerInput = {
        business_id: businessId,
        title: title || null,
        subtitle: subtitle || null,
        cta_text: ctaText || null,
        cta_url: ctaUrl || null,
        starts_at: startsAt ? new Date(startsAt).toISOString() : null,
        ends_at: endsAt ? new Date(endsAt).toISOString() : null,
        image_r2_key: imageKey,
        is_active: banner?.is_active ?? true,
      }
      if (banner) return updateBanner(banner.id, input)
      return createBanner(input)
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: qk.banners(businessId) })
      pushToast(banner ? 'Banner updated' : 'Banner created', 'success')
      onClose()
    },
    onError: () => pushToast('Save failed', 'error'),
  })

  async function handleImagePick(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    setUploading(true)
    try {
      const res = await uploadImage(file, 'banner')
      if (res.r2_key) setImageKey(res.r2_key)
    } catch {
      pushToast('Upload failed', 'error')
    } finally {
      setUploading(false)
    }
  }

  const previewUrl = cdnUrl(imageKey)

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center sm:items-center">
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />
      <div className="relative z-10 w-full max-w-lg rounded-t-3xl bg-white dark:bg-neutral-900 p-6 shadow-2xl sm:rounded-2xl">
        <div className="mb-5 flex items-center justify-between">
          <h2 className="text-lg font-bold text-neutral-900 dark:text-neutral-100">{banner ? 'Edit banner' : 'New banner'}</h2>
          <button onClick={onClose} className="rounded-lg p-1.5 text-neutral-400 hover:bg-neutral-100">
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="space-y-4 overflow-y-auto max-h-[65vh]">
          {/* Image */}
          <div>
            <p className="mb-2 text-xs font-semibold uppercase tracking-widest text-neutral-500 dark:text-neutral-400">Image</p>
            {previewUrl ? (
              <div className="relative h-36 w-full overflow-hidden rounded-xl">
                <Image src={previewUrl} alt="Banner preview" fill className="object-cover" />
                <button
                  onClick={() => setImageKey(null)}
                  className="absolute right-2 top-2 rounded-full bg-black/50 p-1 text-white"
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              </div>
            ) : (
              <label className="flex h-24 cursor-pointer flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed border-neutral-200 dark:border-neutral-800 text-sm text-neutral-400 hover:border-amber-400 hover:text-amber-500 transition-colors">
                <ImageIcon className="h-6 w-6" />
                {uploading ? 'Uploading…' : 'Upload image'}
                <input type="file" accept="image/*" className="hidden" onChange={handleImagePick} disabled={uploading} />
              </label>
            )}
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase tracking-widest text-neutral-500 dark:text-neutral-400 mb-1">Title</label>
            <input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Summer sale!" className="w-full rounded-xl border border-neutral-200 dark:border-neutral-800 px-3.5 py-2.5 text-sm focus:border-amber-400 focus:outline-none" />
          </div>
          <div>
            <label className="block text-xs font-semibold uppercase tracking-widest text-neutral-500 dark:text-neutral-400 mb-1">Subtitle</label>
            <input value={subtitle} onChange={(e) => setSubtitle(e.target.value)} placeholder="20% off all desserts this weekend" className="w-full rounded-xl border border-neutral-200 dark:border-neutral-800 px-3.5 py-2.5 text-sm focus:border-amber-400 focus:outline-none" />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold uppercase tracking-widest text-neutral-500 dark:text-neutral-400 mb-1">CTA text</label>
              <input value={ctaText} onChange={(e) => setCtaText(e.target.value)} placeholder="Order now" className="w-full rounded-xl border border-neutral-200 dark:border-neutral-800 px-3.5 py-2.5 text-sm focus:border-amber-400 focus:outline-none" />
            </div>
            <div>
              <label className="block text-xs font-semibold uppercase tracking-widest text-neutral-500 dark:text-neutral-400 mb-1">CTA URL</label>
              <input value={ctaUrl} onChange={(e) => setCtaUrl(e.target.value)} placeholder="https://…" className="w-full rounded-xl border border-neutral-200 dark:border-neutral-800 px-3.5 py-2.5 text-sm focus:border-amber-400 focus:outline-none" />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold uppercase tracking-widest text-neutral-500 dark:text-neutral-400 mb-1">Starts at</label>
              <input type="datetime-local" value={startsAt} onChange={(e) => setStartsAt(e.target.value)} className="w-full rounded-xl border border-neutral-200 dark:border-neutral-800 px-3.5 py-2.5 text-sm focus:border-amber-400 focus:outline-none" />
            </div>
            <div>
              <label className="block text-xs font-semibold uppercase tracking-widest text-neutral-500 dark:text-neutral-400 mb-1">Ends at</label>
              <input type="datetime-local" value={endsAt} onChange={(e) => setEndsAt(e.target.value)} className="w-full rounded-xl border border-neutral-200 dark:border-neutral-800 px-3.5 py-2.5 text-sm focus:border-amber-400 focus:outline-none" />
            </div>
          </div>
        </div>

        <button
          onClick={() => save.mutate()}
          disabled={save.isPending}
          className="mt-5 flex w-full items-center justify-center gap-2 rounded-xl bg-amber-400 py-3 text-sm font-bold text-white hover:bg-amber-500 disabled:opacity-60 transition-colors"
        >
          <Check className="h-4 w-4" />
          {save.isPending ? 'Saving…' : 'Save banner'}
        </button>
      </div>
    </div>
  )
}

export function BannersManager() {
  const { business } = useCms()
  const bid = business.id
  const qc = useQueryClient()
  const pushToast = useCmsStore((s) => s.pushToast)
  const [editing, setEditing] = useState<Banner | null | 'new'>()

  const { data: banners = [], isLoading } = useQuery({
    queryKey: qk.banners(bid),
    queryFn: () => fetchBanners(bid),
  })

  const toggleMutation = useMutation({
    mutationFn: ({ id, active }: { id: string; active: boolean }) =>
      updateBanner(id, { is_active: active }),
    onSuccess: () => qc.invalidateQueries({ queryKey: qk.banners(bid) }),
    onError: () => pushToast('Toggle failed', 'error'),
  })

  const deleteMutation = useMutation({
    mutationFn: (id: string) => deleteBanner(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: qk.banners(bid) })
      pushToast('Banner deleted', 'success')
    },
    onError: () => pushToast('Delete failed', 'error'),
  })

  if (isLoading) return <div className="h-32 animate-pulse rounded-2xl bg-neutral-100" />

  return (
    <div className="space-y-4">
      {banners.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-2xl border-2 border-dashed border-neutral-200 dark:border-neutral-800 py-16">
          <Megaphone className="mb-3 h-10 w-10 text-neutral-300" />
          <p className="font-medium text-neutral-600 dark:text-neutral-400">No banners yet</p>
          <p className="mt-1 text-sm text-neutral-400">Create a promotional banner that shows on your menu.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {banners.map((banner) => {
            const img = cdnUrl(banner.image_r2_key)
            return (
              <div key={banner.id} className="flex items-center gap-3 rounded-xl bg-white dark:bg-neutral-900 p-3 ring-1 ring-black/5 dark:ring-white/10">
                <div className="relative h-14 w-20 shrink-0 overflow-hidden rounded-lg bg-neutral-100">
                  {img ? (
                    <Image src={img} alt="" fill className="object-cover" sizes="80px" />
                  ) : (
                    <div className="flex h-full w-full items-center justify-center text-neutral-300">
                      <ImageIcon className="h-5 w-5" />
                    </div>
                  )}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate font-medium text-neutral-900 dark:text-neutral-100">{banner.title ?? 'Untitled banner'}</p>
                  {banner.subtitle && <p className="truncate text-xs text-neutral-500 dark:text-neutral-400">{banner.subtitle}</p>}
                  {(banner.starts_at || banner.ends_at) && (
                    <p className="text-xs text-neutral-400 mt-0.5">
                      {banner.starts_at ? new Date(banner.starts_at).toLocaleDateString('en-IN') : '—'}
                      {' → '}
                      {banner.ends_at ? new Date(banner.ends_at).toLocaleDateString('en-IN') : 'ongoing'}
                    </p>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  <Toggle
                    checked={banner.is_active}
                    onChange={(v) => toggleMutation.mutate({ id: banner.id, active: v })}
                    label={`${banner.title} active`}
                    size="sm"
                  />
                  <button
                    onClick={() => setEditing(banner)}
                    className="flex h-8 w-8 items-center justify-center rounded-lg text-neutral-400 hover:bg-neutral-100"
                  >
                    <Pencil className="h-4 w-4" />
                  </button>
                  <button
                    onClick={() => { if (confirm('Delete this banner?')) deleteMutation.mutate(banner.id) }}
                    className="flex h-8 w-8 items-center justify-center rounded-lg text-red-400 hover:bg-red-50"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>
            )
          })}
        </div>
      )}

      {banners.length >= getConfig().limits.banners ? (
        <p className="text-xs text-amber-600 text-center mt-4">Banner limit reached for your tier. Upgrade for more.</p>
      ) : (
        <button
          onClick={() => setEditing('new')}
          className="flex w-full items-center justify-center gap-2 rounded-xl border-2 border-dashed border-neutral-200 dark:border-neutral-800 py-4 text-sm font-semibold text-neutral-500 dark:text-neutral-400 hover:border-amber-400 hover:text-amber-500 transition-colors"
        >
          <Plus className="h-4 w-4" /> New banner
        </button>
      )}

      {editing && (
        <BannerForm
          banner={editing === 'new' ? null : editing}
          businessId={bid}
          onClose={() => setEditing(undefined)}
        />
      )}
    </div>
  )
}
