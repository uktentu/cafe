'use client'

import { useEffect, useRef, useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Plus, Trash2, X, Check, Download, FileText, QrCode as QrIcon } from 'lucide-react'
import { useCms } from './Providers'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { useCmsStore } from '@/stores/cms'
import { getConfig } from '@/lib/config'
import { qk, fetchQrCodes, createQrCode, updateQrCode, deleteQrCode, type QrCodeInput } from '@/lib/cms-queries'
import type { QrCode } from '@/types/database'
import type QRCodeStylingType from 'qr-code-styling'

function blobToDataUrl(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onloadend = () => resolve(reader.result as string)
    reader.onerror = reject
    reader.readAsDataURL(blob)
  })
}

// A single QR code preview and download functionality
function QrPreview({ url, color, businessName, slug }: { url: string; color: string; businessName: string; slug: string }) {
  const containerRef = useRef<HTMLDivElement>(null)
  const qrRef = useRef<QRCodeStylingType | null>(null)
  const [ready, setReady] = useState(false)

  useEffect(() => {
    let cancelled = false
    ;(async () => {
      const QRCodeStyling = (await import('qr-code-styling')).default
      if (cancelled) return
      if (!qrRef.current) {
        qrRef.current = new QRCodeStyling({
          width: 512,
          height: 512,
          type: 'svg',
          data: url || ' ',
          dotsOptions: { color, type: 'rounded' },
          cornersSquareOptions: { color, type: 'extra-rounded' },
          backgroundOptions: { color: '#ffffff' },
        })
        if (containerRef.current) {
          containerRef.current.innerHTML = ''
          qrRef.current.append(containerRef.current)
        }
        setReady(true)
      } else {
        qrRef.current.update({ data: url || ' ', dotsOptions: { color, type: 'rounded' }, cornersSquareOptions: { color, type: 'extra-rounded' } })
      }
    })()
    return () => { cancelled = true }
  }, [url, color])

  async function downloadPNG() {
    await qrRef.current?.download({ name: `${slug}-qr`, extension: 'png' })
  }

  async function downloadPDF() {
    if (!qrRef.current) return
    const blob = await qrRef.current.getRawData('png')
    if (!blob) return
    const dataUrl = await blobToDataUrl(blob as Blob)
    const { jsPDF } = await import('jspdf')
    const doc = new jsPDF({ unit: 'mm', format: 'a5' })
    const pageW = doc.internal.pageSize.getWidth()
    doc.setFontSize(22)
    doc.text(businessName, pageW / 2, 24, { align: 'center' })
    const size = 90
    doc.addImage(dataUrl, 'PNG', (pageW - size) / 2, 34, size, size)
    doc.setFontSize(14)
    doc.text('Scan to view our menu', pageW / 2, 138, { align: 'center' })
    doc.save(`${slug}-table-tent.pdf`)
  }

  return (
    <div className="flex flex-col items-center gap-4">
      <div className="flex items-center justify-center rounded-2xl bg-white p-4 ring-1 ring-black/5 w-full max-w-[200px] mx-auto">
        <div ref={containerRef} className="h-[150px] w-[150px] [&>*]:!h-full [&>*]:!w-full" />
      </div>
      <div className="flex flex-wrap gap-2 justify-center">
        <Button type="button" onClick={downloadPNG} disabled={!ready} size="sm"><Download className="h-4 w-4" /> PNG</Button>
        <Button type="button" onClick={downloadPDF} variant="secondary" disabled={!ready} size="sm"><FileText className="h-4 w-4" /> PDF</Button>
      </div>
    </div>
  )
}

function QrForm({
  qr,
  businessId,
  businessThemeColor,
  siteUrl,
  onClose,
}: {
  qr: QrCode | null
  businessId: string
  businessThemeColor: string
  siteUrl: string
  onClose: () => void
}) {
  const qc = useQueryClient()
  const pushToast = useCmsStore((s) => s.pushToast)
  const initialUrl = siteUrl || (typeof window !== 'undefined' ? window.location.origin : '')
  
  const [label, setLabel] = useState(qr?.label ?? 'Table 1')
  const [url, setUrl] = useState(qr?.target_url ?? initialUrl)
  const [color, setColor] = useState(qr?.qr_color ?? businessThemeColor)

  const save = useMutation({
    mutationFn: async () => {
      const input: QrCodeInput = {
        business_id: businessId,
        label: label.trim(),
        target_url: url.trim() || initialUrl,
        qr_color: color,
        qr_bg_color: '#FFFFFF',
      }
      if (qr) return updateQrCode(qr.id, input)
      return createQrCode(input)
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: qk.qrs(businessId) })
      pushToast(qr ? 'QR updated' : 'QR created', 'success')
      onClose()
    },
    onError: () => pushToast('Save failed', 'error'),
  })

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center sm:items-center">
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />
      <div className="relative z-10 w-full max-w-md rounded-t-3xl bg-white p-6 shadow-2xl sm:rounded-2xl">
        <div className="mb-5 flex items-center justify-between">
          <h2 className="text-lg font-bold text-neutral-900">{qr ? 'Edit QR Code' : 'New QR Code'}</h2>
          <button onClick={onClose} className="rounded-lg p-1.5 text-neutral-400 hover:bg-neutral-100">
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="space-y-4">
          <div>
            <label className="block text-xs font-semibold uppercase tracking-widest text-neutral-500 mb-1.5">Label (e.g. Table 1, Counter)</label>
            <input
              value={label}
              onChange={(e) => setLabel(e.target.value)}
              placeholder="Table 1"
              className="w-full rounded-xl border border-neutral-200 px-3.5 py-2.5 text-sm focus:border-amber-400 focus:outline-none"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase tracking-widest text-neutral-500 mb-1.5">Target URL</label>
            <input
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              placeholder="https://..."
              className="w-full rounded-xl border border-neutral-200 px-3.5 py-2.5 text-sm focus:border-amber-400 focus:outline-none"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase tracking-widest text-neutral-500 mb-1.5">QR Colour</label>
            <div className="flex items-center gap-3">
              <input type="color" value={color} onChange={(e) => setColor(e.target.value)} className="h-10 w-12 cursor-pointer rounded border border-neutral-300" />
              <Input value={color} onChange={(e) => setColor(e.target.value)} className="w-32" />
            </div>
          </div>
        </div>

        <button
          onClick={() => save.mutate()}
          disabled={save.isPending || !label.trim()}
          className="mt-5 flex w-full items-center justify-center gap-2 rounded-xl bg-amber-400 py-3 text-sm font-bold text-white hover:bg-amber-500 disabled:opacity-60 transition-colors"
        >
          <Check className="h-4 w-4" />
          {save.isPending ? 'Saving…' : 'Save QR'}
        </button>
      </div>
    </div>
  )
}

export function QRGenerator() {
  const { business } = useCms()
  const bid = business.id
  const qc = useQueryClient()
  const pushToast = useCmsStore((s) => s.pushToast)
  const { tier, siteUrl } = getConfig()
  const [editing, setEditing] = useState<QrCode | null | 'new'>()

  const { data: qrs = [], isLoading } = useQuery({
    queryKey: qk.qrs(bid),
    queryFn: () => fetchQrCodes(bid),
  })

  const deleteMutation = useMutation({
    mutationFn: (id: string) => deleteQrCode(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: qk.qrs(bid) })
      pushToast('QR deleted', 'success')
    },
    onError: () => pushToast('Delete failed', 'error'),
  })

  if (isLoading) return <div className="h-32 animate-pulse rounded-2xl bg-neutral-100" />

  const qrLimit = tier === 'premium' ? 9999 : tier === 'advanced' ? 5 : 1
  const atLimit = qrs.length >= qrLimit

  return (
    <div className="space-y-5">
      <header>
        <h1 className="text-2xl font-semibold text-neutral-900">QR codes</h1>
        <p className="mt-1 text-sm text-neutral-500">
          Print these on tables, counters, or packaging. 
          {qrLimit < 9999 && ` (${qrs.length} / ${qrLimit} used)`}
        </p>
      </header>

      {qrs.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-2xl border-2 border-dashed border-neutral-200 py-16">
          <QrIcon className="mb-3 h-10 w-10 text-neutral-300" />
          <p className="font-medium text-neutral-600">No QR codes yet</p>
          <p className="mt-1 text-sm text-neutral-400">Create a QR code for your menu.</p>
        </div>
      ) : (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {qrs.map((qr) => (
            <div key={qr.id} className="flex flex-col gap-3 rounded-xl bg-white p-5 ring-1 ring-black/5 relative">
              <div className="flex items-start justify-between border-b border-neutral-100 pb-3 mb-1">
                <div>
                  <h3 className="font-semibold text-neutral-900 truncate pr-2" title={qr.label}>{qr.label}</h3>
                  <p className="text-xs text-neutral-500 truncate mt-0.5" title={qr.target_url}>{qr.target_url}</p>
                </div>
                <div className="flex items-center">
                  <button onClick={() => { if (confirm('Delete this QR code?')) deleteMutation.mutate(qr.id) }} className="text-red-400 hover:text-red-500 p-1">
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>
              
              <QrPreview url={qr.target_url} color={qr.qr_color ?? '#111'} businessName={business.name} slug={business.slug} />
            </div>
          ))}
        </div>
      )}

      <Button
        onClick={() => setEditing('new')}
        disabled={atLimit}
        className="w-full md:w-auto mt-4"
      >
        <Plus className="h-4 w-4" /> New QR code
      </Button>
      {atLimit && <p className="text-xs text-amber-600">QR limit reached for your tier.</p>}

      {editing && (
        <QrForm
          qr={editing === 'new' ? null : editing}
          businessId={bid}
          businessThemeColor={business.theme_color || '#111111'}
          siteUrl={siteUrl ?? ''}
          onClose={() => setEditing(undefined)}
        />
      )}
    </div>
  )
}
