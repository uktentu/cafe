'use client'

import { useEffect, useRef, useState } from 'react'
import { Download, FileText } from 'lucide-react'
import { useCms } from './Providers'
import { Button } from '@/components/ui/Button'
import { Field, Input } from '@/components/ui/Input'
import { getConfig } from '@/lib/config'
import type QRCodeStylingType from 'qr-code-styling'

export function QRGenerator() {
  const { business } = useCms()
  const { siteUrl } = getConfig()
  const containerRef = useRef<HTMLDivElement>(null)
  const qrRef = useRef<QRCodeStylingType | null>(null)

  const initialUrl = siteUrl || (typeof window !== 'undefined' ? window.location.origin : '')
  const [url, setUrl] = useState(initialUrl)
  const [color, setColor] = useState(business.theme_color || '#111111')
  const [ready, setReady] = useState(false)

  // Build / update the QR (qr-code-styling is browser-only → dynamic import).
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
    await qrRef.current?.download({ name: `${business.slug}-qr`, extension: 'png' })
  }

  async function downloadPDF() {
    if (!qrRef.current) return
    const blob = await qrRef.current.getRawData('png')
    if (!blob) return
    const dataUrl = await blobToDataUrl(blob as Blob)
    const { jsPDF } = await import('jspdf')
    // A5 table-tent: centered QR + restaurant name + "Scan to view menu".
    const doc = new jsPDF({ unit: 'mm', format: 'a5' })
    const pageW = doc.internal.pageSize.getWidth()
    doc.setFontSize(22)
    doc.text(business.name, pageW / 2, 24, { align: 'center' })
    const size = 90
    doc.addImage(dataUrl, 'PNG', (pageW - size) / 2, 34, size, size)
    doc.setFontSize(14)
    doc.text('Scan to view our menu', pageW / 2, 138, { align: 'center' })
    doc.save(`${business.slug}-table-tent.pdf`)
  }

  return (
    <div className="space-y-5">
      <header>
        <h1 className="text-2xl font-semibold text-neutral-900">QR code</h1>
        <p className="mt-1 text-sm text-neutral-500">Print this on tables, counters, or packaging.</p>
      </header>

      <div className="grid gap-6 md:grid-cols-2">
        <div className="flex items-center justify-center rounded-2xl bg-white p-6 ring-1 ring-black/5">
          <div ref={containerRef} className="h-[256px] w-[256px] [&>*]:!h-full [&>*]:!w-full" />
        </div>

        <div className="space-y-4">
          <Field label="Menu URL"><Input value={url} onChange={(e) => setUrl(e.target.value)} /></Field>
          <Field label="QR colour">
            <div className="flex items-center gap-3">
              <input type="color" value={color} onChange={(e) => setColor(e.target.value)} className="h-10 w-12 cursor-pointer rounded border border-neutral-300" />
              <Input value={color} onChange={(e) => setColor(e.target.value)} className="w-32" />
            </div>
          </Field>
          <div className="flex flex-wrap gap-3">
            <Button onClick={downloadPNG} disabled={!ready}><Download className="h-4 w-4" /> PNG</Button>
            <Button onClick={downloadPDF} variant="secondary" disabled={!ready}><FileText className="h-4 w-4" /> PDF table tent</Button>
          </div>
        </div>
      </div>
    </div>
  )
}

function blobToDataUrl(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onloadend = () => resolve(reader.result as string)
    reader.onerror = reject
    reader.readAsDataURL(blob)
  })
}
