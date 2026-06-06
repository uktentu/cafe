/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/no-unused-vars */

'use client'

import { useState } from 'react'
import { Download, FileText, Database, Loader2 } from 'lucide-react'
import { useCms } from './Providers'
import { Button } from '@/components/ui/Button'
import { getConfig } from '@/lib/config'
import { UpgradePrompt } from './UpgradePrompt'

export function ToolsManager() {
  const { business } = useCms()
  const { tier } = getConfig()
  const [exporting, setExporting] = useState(false)

  const isPremium = tier === 'premium'

  const handleExport = async () => {
    setExporting(true)
    try {
      const res = await fetch(`/api/export?businessId=${business.id}`)
      if (!res.ok) throw new Error('Export failed')
      
      const blob = await res.blob()
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `${business.slug}-backup-${new Date().toISOString().split('T')[0]}.json`
      document.body.appendChild(a)
      a.click()
      a.remove()
      window.URL.revokeObjectURL(url)
    } catch {
      alert('Failed to export data')
    } finally {
      setExporting(false)
    }
  }

  const [generating, setGenerating] = useState(false)

  const handleReport = async () => {
    setGenerating(true)
    try {
      const { default: jsPDF } = await import('jspdf')
      const { default: autoTable } = await import('jspdf-autotable')
      
      const res = await fetch(`/api/export?businessId=${business.id}`)
      if (!res.ok) throw new Error('Failed to fetch data')
      const data = await res.json()
      
      const doc = new jsPDF()
      const pageWidth = doc.internal.pageSize.width
      
      // Theme colors
      const themeColor = business.theme_color || '#111111'
      const hex2rgb = (hex: string) => {
        const v = hex.replace('#', '')
        return [
          parseInt(v.substring(0, 2), 16) || 20,
          parseInt(v.substring(2, 4), 16) || 20,
          parseInt(v.substring(4, 6), 16) || 20
        ]
      }
      const [r, g, b] = hex2rgb(themeColor)
      
      // First Page Header - Premium Cover Style
      doc.setFillColor(r, g, b)
      doc.rect(0, 0, pageWidth, 40, 'F')
      
      doc.setFont('helvetica', 'bold')
      doc.setFontSize(28)
      doc.setTextColor(255, 255, 255)
      doc.text(business.name, 14, 25)
      
      doc.setFont('helvetica', 'normal')
      doc.setFontSize(12)
      doc.setTextColor(255, 255, 255)
      doc.text(`Executive Menu Audit & Analytics Report`, 14, 33)
      
      // Date generated right aligned
      doc.setFontSize(10)
      const dateStr = `Date: ${new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}`
      doc.text(dateStr, pageWidth - 14 - doc.getTextWidth(dateStr), 33)
      
      const categories = data.categories || []
      const items = data.items || []
      
      // Calculate Advanced Analytics
      const activeCount = items.filter((i: any) => i.is_available).length
      const soldOutCount = items.length - activeCount
      
      const withPhotos = items.filter((i: any) => i.image_mode !== 'none').length
      const photoPct = Math.round((withPhotos / Math.max(1, items.length)) * 100)
      
      const withDesc = items.filter((i: any) => i.description && i.description.length > 5).length
      const descPct = Math.round((withDesc / Math.max(1, items.length)) * 100)
      
      const healthScore = Math.round((photoPct + descPct) / 2)
      
      const avgPrice = items.length > 0 ? (items.reduce((acc: number, i: any) => acc + (Number(i.price) || 0), 0) / items.length).toFixed(0) : '0'
      const highestPriceItem = items.length > 0 ? items.reduce((prev: any, current: any) => (Number(prev.price) > Number(current.price) ? prev : current)) : null
      
      const dietaryCounts: Record<string, number> = {}
      items.forEach((i: any) => {
        if (Array.isArray(i.dietary)) {
          i.dietary.forEach((d: string) => {
            dietaryCounts[d] = (dietaryCounts[d] || 0) + 1
          })
        }
      })
      const topDietary = Object.keys(dietaryCounts).sort((a, b) => dietaryCounts[b] - dietaryCounts[a]).slice(0, 3)

      // Section: Menu Health & Conversion
      doc.setFont('helvetica', 'bold')
      doc.setFontSize(16)
      doc.setTextColor(40, 40, 40)
      doc.text('1. Menu Health & Conversion Metrics', 14, 55)
      
      // Health Score Box
      doc.setFillColor(healthScore > 80 ? 34 : healthScore > 50 ? 245 : 239, healthScore > 80 ? 197 : 158, healthScore > 80 ? 94 : 11) // Green / Amber / Red
      doc.roundedRect(14, 62, 55, 30, 3, 3, 'F')
      doc.setFont('helvetica', 'bold')
      doc.setFontSize(28)
      doc.setTextColor(255, 255, 255)
      doc.text(`${healthScore}/100`, 41.5, 78, { align: 'center' })
      doc.setFontSize(10)
      doc.text('MENU HEALTH SCORE', 41.5, 86, { align: 'center' })
      
      // Detailed Health Metrics
      doc.setDrawColor(229, 231, 235)
      doc.roundedRect(75, 62, 121, 30, 3, 3, 'S')
      
      doc.setFont('helvetica', 'bold')
      doc.setFontSize(18)
      doc.setTextColor(r, g, b)
      doc.text(`${photoPct}%`, 90, 75)
      doc.text(`${descPct}%`, 140, 75)
      
      doc.setFont('helvetica', 'normal')
      doc.setFontSize(10)
      doc.setTextColor(100, 100, 100)
      doc.text('Items with Photos', 90, 83)
      doc.text('Items with Descriptions', 140, 83)
      doc.setFontSize(8)
      doc.setTextColor(150, 150, 150)
      doc.text('* Photos increase conversion by 30%', 90, 88)
      doc.text('* Descriptions reduce waitstaff questions', 140, 88)
      
      // Section: Price Analysis
      doc.setFont('helvetica', 'bold')
      doc.setFontSize(16)
      doc.setTextColor(40, 40, 40)
      doc.text('2. Pricing & Catalog Analysis', 14, 110)
      
      doc.setFillColor(249, 250, 251)
      doc.roundedRect(14, 117, 182, 35, 3, 3, 'FD')
      
      doc.setFont('helvetica', 'normal')
      doc.setFontSize(11)
      doc.setTextColor(80, 80, 80)
      doc.text('Average Item Price:', 20, 130)
      doc.setFont('helvetica', 'bold')
      doc.setTextColor(20, 20, 20)
      doc.text(`INR ${avgPrice}`, 60, 130)
      
      if (highestPriceItem) {
        doc.setFont('helvetica', 'normal')
        doc.setTextColor(80, 80, 80)
        doc.text('Most Expensive Item:', 100, 130)
        doc.setFont('helvetica', 'bold')
        doc.setTextColor(20, 20, 20)
        const highestName = highestPriceItem.name.length > 20 ? highestPriceItem.name.substring(0, 20) + '...' : highestPriceItem.name
        doc.text(`${highestName} (INR ${highestPriceItem.price})`, 140, 130)
      }
      
      doc.setFont('helvetica', 'normal')
      doc.setTextColor(80, 80, 80)
      doc.text('Total Categories:', 20, 142)
      doc.setFont('helvetica', 'bold')
      doc.text(`${categories.length}`, 60, 142)
      
      doc.setFont('helvetica', 'normal')
      doc.text('Total Items:', 80, 142)
      doc.setFont('helvetica', 'bold')
      doc.text(`${items.length}`, 105, 142)
      
      doc.setFont('helvetica', 'normal')
      doc.text('Active:', 125, 142)
      doc.setFont('helvetica', 'bold')
      doc.setTextColor(34, 197, 94)
      doc.text(`${activeCount}`, 140, 142)
      
      doc.setFont('helvetica', 'normal')
      doc.setTextColor(80, 80, 80)
      doc.text('Sold Out:', 155, 142)
      doc.setFont('helvetica', 'bold')
      doc.setTextColor(239, 68, 68)
      doc.text(`${soldOutCount}`, 175, 142)
      
      // Section: Dietary Distribution
      doc.setFont('helvetica', 'bold')
      doc.setFontSize(16)
      doc.setTextColor(40, 40, 40)
      doc.text('3. Dietary Distribution', 14, 170)
      
      if (topDietary.length > 0) {
        let offsetX = 14
        topDietary.forEach((diet) => {
          doc.setFillColor(243, 244, 246)
          doc.roundedRect(offsetX, 177, 50, 20, 2, 2, 'F')
          doc.setFont('helvetica', 'bold')
          doc.setFontSize(14)
          doc.setTextColor(r, g, b)
          doc.text(`${dietaryCounts[diet]}`, offsetX + 5, 189)
          doc.setFont('helvetica', 'normal')
          doc.setFontSize(10)
          doc.setTextColor(100, 100, 100)
          doc.text(`items marked ${diet}`, offsetX + 15, 189)
          offsetX += 55
        })
      } else {
        doc.setFont('helvetica', 'normal')
        doc.setFontSize(11)
        doc.setTextColor(150, 150, 150)
        doc.text('No dietary tags assigned to items yet. Adding them helps customers filter the menu easily.', 14, 185)
      }
      
      // Page break before the detailed catalog
      doc.addPage()
      
      let startY = 20
      doc.setFont('helvetica', 'bold')
      doc.setFontSize(16)
      doc.setTextColor(40, 40, 40)
      doc.text('4. Full Menu Catalog', 14, startY)
      startY += 10
      
      const drawCategoryTable = (catName: string, catItems: any[]) => {
        if (catItems.length === 0) return
        
        autoTable(doc, {
          startY: startY,
          head: [[catName.toUpperCase(), 'Description', 'Price', 'Status']],
          body: catItems.map((i: any) => [
            i.name,
            i.description || '-',
            `INR ${i.price}`, // No rupee symbol to prevent broken font characters
            i.is_available ? 'Available' : 'Sold Out'
          ]),
          theme: 'plain',
          headStyles: { 
            fillColor: [255, 255, 255], 
            textColor: [r, g, b], 
            fontStyle: 'bold', 
            fontSize: 12,
            lineWidth: { bottom: 0.5 },
            lineColor: [r, g, b]
          },
          bodyStyles: {
            textColor: [60, 60, 60],
            fontSize: 10,
          },
          alternateRowStyles: {
            fillColor: [252, 252, 252]
          },
          margin: { left: 14, right: 14, bottom: 20, top: 20 },
          styles: { cellPadding: 5 },
          columnStyles: {
            0: { cellWidth: 45, fontStyle: 'bold', textColor: [20, 20, 20] },
            1: { cellWidth: 'auto' },
            2: { cellWidth: 25, halign: 'right' },
            3: { cellWidth: 25, halign: 'center' }
          },
          willDrawCell: function(data: any) {
            if (data.section === 'body' && data.column.index === 3) {
              if (data.cell.raw === 'Sold Out') {
                doc.setTextColor(239, 68, 68)
                doc.setFont('helvetica', 'bold')
              } else {
                doc.setTextColor(34, 197, 94)
              }
            }
          }
        })
        
        startY = (doc as any).lastAutoTable.finalY + 15
      }
      
      categories.forEach((cat: any) => {
        const catItems = items.filter((i: any) => i.category_id === cat.id)
        drawCategoryTable(cat.name, catItems)
      })
      
      const uncategorised = items.filter((i: any) => !i.category_id)
      drawCategoryTable('Uncategorised', uncategorised)
      
      // Add Premium Page Decorations to all pages
      const pageCount = (doc as any).internal.getNumberOfPages()
      const pageHeight = doc.internal.pageSize.height
      for (let i = 1; i <= pageCount; i++) {
        doc.setPage(i)
        
        // Header Accent Bar
        doc.setFillColor(r, g, b)
        doc.rect(0, 0, pageWidth, 6, 'F')
        
        // Footer Accent Bar
        doc.setFillColor(r, g, b)
        doc.rect(0, pageHeight - 8, pageWidth, 8, 'F')
        
        // Footer Text
        doc.setFont('helvetica', 'normal')
        doc.setFontSize(8)
        doc.setTextColor(255, 255, 255)
        doc.text(`Generated securely by MenuOS`, 14, pageHeight - 2.5)
        doc.text(`Page ${i} of ${pageCount}`, pageWidth - 30, pageHeight - 2.5)
      }
      
      doc.save(`${business.slug}-menu-report.pdf`)
      
    } catch (err) {
      alert('Failed to generate PDF')
    } finally {
      setGenerating(false)
    }
  }

  return (
    <div className="space-y-6">
      <header>
        <h2 className="text-xl font-semibold">Tools & Reports</h2>
        <p className="text-sm text-neutral-400 mt-1">Export your data and generate insights.</p>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* JSON Export */}
        <div className="rounded-2xl bg-white dark:bg-neutral-900 p-6 ring-1 ring-black/5 dark:ring-white/10 flex flex-col gap-4">
          <div className="flex items-start gap-4">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-blue-50 text-blue-600">
              <Database className="h-6 w-6" />
            </div>
            <div>
              <h3 className="font-semibold text-neutral-900 dark:text-neutral-100">Data Backup (JSON)</h3>
              <p className="text-sm text-neutral-500 dark:text-neutral-400 mt-1">
                Download a complete JSON export of your business data, categories, items, and settings. Useful for migrations or offline backups.
              </p>
            </div>
          </div>
          <div className="mt-auto pt-4">
            <Button onClick={handleExport} disabled={exporting} className="w-full sm:w-auto">
              {exporting ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Download className="h-4 w-4 mr-2" />}
              {exporting ? 'Exporting...' : 'Export JSON'}
            </Button>
          </div>
        </div>

        {/* PDF Reports */}
        {isPremium ? (
          <div className="rounded-2xl bg-white dark:bg-neutral-900 p-6 ring-1 ring-black/5 dark:ring-white/10 flex flex-col gap-4">
            <div className="flex items-start gap-4">
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-emerald-50 text-emerald-600">
                <FileText className="h-6 w-6" />
              </div>
              <div>
                <h3 className="font-semibold text-neutral-900 dark:text-neutral-100">Menu PDF Report</h3>
                <p className="text-sm text-neutral-500 dark:text-neutral-400 mt-1">
                  Generate a printable PDF version of your menu layout and pricing.
                </p>
              </div>
            </div>
            <div className="mt-auto pt-4">
              <Button onClick={handleReport} disabled={generating} variant="secondary" className="w-full sm:w-auto">
                {generating ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <FileText className="h-4 w-4 mr-2" />}
                {generating ? 'Generating...' : 'Generate PDF'}
              </Button>
            </div>
          </div>
        ) : (
          <UpgradePrompt feature="PDF Exports" description="Generate printable PDF versions of your menu layouts and pricing." />
        )}
      </div>
    </div>
  )
}
