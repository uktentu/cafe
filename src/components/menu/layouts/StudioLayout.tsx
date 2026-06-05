'use client'

// StudioLayout — Art gallery, tactile textures
// Each category is a labelled gallery block: a borderless grid of square cells.
// Default shows the image only; hover/tap reveals name + price from the bottom.
// Scroll-sync feeds the ThumbDock. Monospace prices.

import { useState } from 'react'
import Image from 'next/image'
import { m } from 'framer-motion'
import type { Category, Item } from '@/types/database'
import { cdnUrl, itemImageKey } from '@/types/database'
import { useMenuStore } from '@/stores/menu'
import { useScrollCategorySync } from '@/components/menu/useCategorySync'
import { glitchReveal, staggerContainer } from '@/components/menu/scrollVariants'
import { track } from '@/lib/firebase'
import { VegMark, ItemBadge } from '@/components/menu/badges'
import { formatPrice } from '@/lib/utils'
import { getCategoryIcon } from '@/components/menu/categoryIcon'
import type { LucideIcon } from 'lucide-react'
import type { LayoutProps } from './MercadoLayout'

const STUDIO_STYLES = `
  @keyframes aperture-open {
    0%   { clip-path: circle(0% at 50% 50%); opacity: 0; }
    100% { clip-path: circle(150% at 50% 50%); opacity: 1; }
  }
  @keyframes film-flash {
    0%   { filter: brightness(1); }
    15%  { filter: brightness(3) contrast(0.6); }
    30%  { filter: brightness(1); }
    100% { filter: brightness(1); }
  }
  .studio-cell-enter { animation: film-flash 0.5s ease-out both; }
  .studio-aperture { animation: aperture-open 0.7s cubic-bezier(0.22,1,0.36,1) both; }
`

function GalleryCell({ item, Icon, idx }: { item: Item; Icon: LucideIcon; idx: number }) {
  const openItem = useMenuStore((s) => s.openItem)
  const [revealed, setRevealed] = useState(false)
  const imgUrl = cdnUrl(itemImageKey(item))

  function tap() {
    if (!revealed) setRevealed(true)
    else { openItem(item); track('item_view', { business_id: item.business_id, item_id: item.id }) }
  }

  return (
    <m.button
      variants={glitchReveal}
      custom={idx}
      initial="hidden"
      whileInView="show"
      viewport={{ once: true, margin: '-20px' }}
      className={`studio-cell-enter group relative transition-transform duration-300 ${imgUrl ? 'aspect-square overflow-hidden border-b border-r' : 'aspect-square flex flex-col p-5 justify-between border-b border-r'}`}
      style={{ 
        background: imgUrl ? 'var(--sf2)' : 'transparent', 
        borderColor: 'var(--bdr2)',
        clipPath: revealed ? 'polygon(0 0, 100% 0, 100% 100%, 0 100%)' : 'polygon(4% 4%, 96% 0%, 100% 96%, 0% 100%)',
        transition: 'clip-path 0.3s cubic-bezier(0.25, 1, 0.5, 1)'
      }}
      onClick={tap}
      onMouseEnter={() => setRevealed(true)}
      onMouseLeave={() => setRevealed(false)}
      aria-label={`${item.name} — ${formatPrice(item.price)}`}
    >
      <div className="absolute inset-0 pointer-events-none opacity-20 mix-blend-overlay z-50" style={{ backgroundImage: 'url("data:image/svg+xml,%3Csvg viewBox=%220 0 200 200%22 xmlns=%22http://www.w3.org/2000/svg%22%3E%3Cfilter id=%22noiseFilter%22%3E%3CfeTurbulence type=%22fractalNoise%22 baseFrequency=%220.65%22 numOctaves=%223%22 stitchTiles=%22stitch%22/%3E%3C/filter%3E%3Crect width=%22100%25%22 height=%22100%25%22 filter=%22url(%23noiseFilter)%22/%3E%3C/svg%3E")' }} />
      {imgUrl ? (
        <>
          <Image src={imgUrl} alt={item.name} fill className="object-cover transition-transform duration-500 group-hover:scale-105" sizes="(max-width:768px) 50vw, (max-width:1024px) 33vw, 25vw" />
          {!item.is_available && (
            <div className="absolute left-2 top-2 rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase" style={{ background: 'rgba(0,0,0,0.6)', color: '#fff' }}>Out</div>
          )}
          <div className="absolute inset-x-0 bottom-0 flex flex-col justify-end px-3 pb-3 pt-10 transition-all duration-300" style={{ background: 'linear-gradient(to top, rgba(0,0,0,0.85) 0%, transparent 100%)', clipPath: revealed ? 'inset(0% 0 0 0)' : 'inset(100% 0 0 0)' }}>
            <div className="flex items-end justify-between gap-3 w-full">
              <div className="flex-1 min-w-0">
                <p className="truncate text-[15px] font-bold leading-tight text-white" style={{ fontFamily: 'var(--font-display)' }}>{item.name}</p>
                <div className="mt-1.5 flex items-center gap-1.5">
                  <VegMark dietary={item.dietary} size="sm" />
                  {item.badge && <ItemBadge badge={item.badge} />}
                </div>
              </div>
              <div className="flex flex-col items-end shrink-0">
                {item.compare_price && item.compare_price > item.price && <s className="text-white/60 font-medium text-[11px] mb-0.5">{formatPrice(item.compare_price)}</s>}
                <span className="text-sm font-bold text-white px-2 py-1" style={{ fontFamily: 'monospace', letterSpacing: '0.05em', border: '1px solid rgba(255,255,255,0.4)' }}>
                  {formatPrice(item.price)}
                </span>
              </div>
            </div>
          </div>
        </>
      ) : (
        <>
          <div className="flex flex-col w-full h-full justify-between">
            {/* Top Area: Name + Badges */}
            <div className="w-full text-left">
              <div className="flex flex-col gap-2 mb-2">
                <div className="flex flex-wrap items-center gap-1.5">
                  <VegMark dietary={item.dietary} size="sm" />
                  {item.badge && <ItemBadge badge={item.badge} />}
                  {!item.is_available && <span className="text-[9px] font-bold uppercase tracking-widest px-1.5 py-0.5 border" style={{ borderColor: 'var(--bdr2)', color: 'var(--txt3)' }}>Out</span>}
                </div>
                <p className="text-[15px] font-black leading-tight uppercase w-full" style={{ fontFamily: 'var(--font-display)', color: 'var(--txt)' }}>
                  {item.name}
                </p>
              </div>
              {item.description && <p className="text-[11px] leading-relaxed mb-4 line-clamp-3 font-mono" style={{ color: 'var(--txt2)' }}>{item.description}</p>}
            </div>
            
            {/* Bottom Row: Price Only (Monospace) */}
            <div className="flex items-end justify-between w-full pt-3 border-t mt-auto" style={{ borderColor: 'var(--bdr2)' }}>
              <div className="flex shrink-0 h-8 w-8 items-center justify-center border" style={{ borderColor: 'var(--bdr2)', color: 'var(--brand2, var(--brand))' }}>
                <Icon size={14} />
              </div>
              <div className="flex flex-col items-end shrink-0">
                {item.compare_price && item.compare_price > item.price && <s className="opacity-50 font-medium text-[11px] mb-0.5">{formatPrice(item.compare_price)}</s>}
                <span className="text-sm font-bold bg-[var(--sf1)] px-2 py-1 border" style={{ fontFamily: 'monospace', letterSpacing: '0.05em', color: 'var(--brand2, var(--brand))', borderColor: 'var(--bdr2)' }}>
                  {formatPrice(item.price)}
                </span>
              </div>
            </div>
          </div>
        </>
      )}
    </m.button>
  )
}

export function StudioLayout({ categories, items, businessId: _businessId }: LayoutProps) {
  const { register } = useScrollCategorySync(categories)
  const catMap: Record<string, Category> = Object.fromEntries(categories.map((c) => [c.id, c]))

  return (
    <div className="relative" style={{ background: 'var(--bg)', color: 'var(--txt)' }}>
      <style dangerouslySetInnerHTML={{ __html: STUDIO_STYLES }} />
      {/* Film grain fixed overlay */}
      <div className="pointer-events-none fixed inset-0 z-0 opacity-[0.06] mix-blend-overlay" style={{ backgroundImage: 'url("data:image/svg+xml,%3Csvg viewBox=%220 0 200 200%22 xmlns=%22http://www.w3.org/2000/svg%22%3E%3Cfilter id=%22n%22%3E%3CfeTurbulence type=%22fractalNoise%22 baseFrequency=%220.65%22 numOctaves=%223%22 stitchTiles=%22stitch%22/%3E%3C/filter%3E%3Crect width=%22100%25%22 height=%22100%25%22 filter=%22url(%23n)%22/%3E%3C/svg%3E")' }} />
      {categories.map((cat) => {
        const catItems = items.filter((i) => i.category_id === cat.id)
        return (
          <section key={cat.id} data-cat={cat.id} ref={register(cat.id)} className="scroll-mt-16">
            {/* Sticky block label */}
            <div
              className="sticky z-20 flex items-center justify-between border-b border-t px-4 py-3 md:px-6 md:py-4 studio-aperture"
              style={{ top: 'var(--menu-tabs-offset, 0px)', background: 'var(--bg)', backdropFilter: 'blur(10px)', borderColor: 'var(--bdr2)' }}
            >
              <h2 className="text-xs font-bold uppercase tracking-[0.25em] md:text-sm" style={{ fontFamily: 'var(--font-display)', color: 'var(--brand2, var(--brand))' }}>{cat.name}</h2>
              <div className="flex items-center gap-3">
                <span className="font-mono text-[9px] tracking-wider" style={{ color: 'var(--txt3)' }}>ISO 100 · f/2.8</span>
                <span className="font-mono text-[9px] opacity-50" style={{ color: 'var(--txt3)' }}>{String(catItems.length).padStart(2, '0')} ITEMS</span>
              </div>
            </div>
            {/* Added min-[360px]:grid-cols-2 for smoother column jump on narrow phones */}
            <m.div 
              className="grid grid-cols-1 min-[360px]:grid-cols-2 min-[420px]:grid-cols-2 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4" 
              style={{ borderLeft: '1px solid var(--bdr)' }}
              variants={staggerContainer}
              initial="hidden"
              whileInView="show"
              viewport={{ once: true, margin: '-20px' }}
            >
              {catItems.map((item, idx) => {
                const Icon = getCategoryIcon(catMap[item.category_id ?? '']?.icon)
                return <GalleryCell key={item.id} item={item} Icon={Icon} idx={idx} />
              })}
            </m.div>
          </section>
        )
      })}
    </div>
  )
}
