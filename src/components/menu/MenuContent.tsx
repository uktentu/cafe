'use client'

import { useMemo } from 'react'
import type { Category, Item, Theme, DietaryPreference } from '@/types/database'
import { useMenuStore } from '@/stores/menu'
import { ThumbDock } from '@/components/menu/ThumbDock'
import {
  MercadoLayout,
  ProvenanceLayout,
  TerrainLayout,
  BazaarLayout,
  NocturneLayout,
  CoastalLayout,
  AetherLayout,
  OnyxLayout,
  StudioLayout,
  SakuraLayout,
  FrostLayout,
  EmberLayout,
  ArcadeLayout,
  type LayoutProps,
} from '@/components/menu/layouts'

interface MenuContentProps {
  categories: Category[]
  items: Item[]
  businessId: string
  theme: Theme
}

const LAYOUT_MAP: Record<Theme, React.ComponentType<LayoutProps>> = {
  // Classic 9
  mercado:    MercadoLayout,
  provenance: ProvenanceLayout,
  terrain:    TerrainLayout,
  bazaar:     BazaarLayout,
  nocturne:   NocturneLayout,
  coastal:    CoastalLayout,
  aether:     AetherLayout,
  onyx:       OnyxLayout,
  studio:     StudioLayout,
  // Specialty 4
  sakura:     SakuraLayout,
  frost:      FrostLayout,
  ember:      EmberLayout,
  arcade:     ArcadeLayout,
}

export function MenuContent({ categories, items, businessId, theme }: MenuContentProps) {
  const dietary = useMenuStore((s) => s.dietary)
  const Layout = LAYOUT_MAP[theme] ?? MercadoLayout

  // Which dietary tags actually exist across the whole menu (for the dock).
  const presentDietary = useMemo(() => {
    const set = new Set<DietaryPreference>()
    items.forEach((it) => { if (it.dietary !== 'none') set.add(it.dietary) })
    // Stable, sensible order.
    return (['veg', 'non-veg', 'egg', 'vegan'] as DietaryPreference[]).filter((d) => set.has(d))
  }, [items])

  // Apply the global dietary filter centrally — every template just renders
  // whatever it's handed, so the filter works everywhere with zero per-template code.
  const filteredItems = useMemo(
    () => (dietary === 'all' ? items : items.filter((it) => it.dietary === dietary)),
    [items, dietary],
  )

  // Hide categories that have no items after filtering.
  const visibleCategories = useMemo(
    () => categories.filter((c) => filteredItems.some((it) => it.category_id === c.id)),
    [categories, filteredItems],
  )

  return (
    <main id="menu" className="pb-28">
      <Layout categories={visibleCategories} items={filteredItems} businessId={businessId} />
      <ThumbDock categories={visibleCategories} presentDietary={presentDietary} />
    </main>
  )
}
