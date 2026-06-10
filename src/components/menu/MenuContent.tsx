'use client'

import { useMemo, useEffect, useState } from 'react'
import type { Category, Item, Theme, DietaryPreference, Menu } from '@/types/database'
import { useMenuStore } from '@/stores/menu'
import { ThumbDock } from '@/components/menu/ThumbDock'
import { SearchBar } from '@/components/menu/SearchBar'
import { ItemCard } from '@/components/menu/ItemCard'
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
  menus: Menu[]
  multipleMenusEnabled: boolean
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

import { useLanguage } from './LanguageProvider'

export function MenuContent({ categories, items, businessId, theme, menus, multipleMenusEnabled }: MenuContentProps) {
  const { t } = useLanguage()
  const dietary = useMenuStore((s) => s.dietary)
  const Layout = LAYOUT_MAP[theme] ?? MercadoLayout
  const [searchQuery, setSearchQuery] = useState('')
  const showSearch = items.length >= 6

  const presentDietary = useMemo(() => {
    const set = new Set<DietaryPreference>()
    items.forEach((it) => { if (it.dietary !== 'none') set.add(it.dietary) })
    return (['veg', 'non-veg', 'egg', 'vegan'] as DietaryPreference[]).filter((d) => set.has(d))
  }, [items])

  // Determine active menu based on time (post-hydration to avoid SSR mismatch)
  const [activeMenuId, setActiveMenuId] = useState<string | null>(null)

  useEffect(() => {
    if (!multipleMenusEnabled || !menus || menus.length === 0) {
      setActiveMenuId(null)
      return
    }
    const now = new Date()
    const hh = now.getHours().toString().padStart(2, '0')
    const mm = now.getMinutes().toString().padStart(2, '0')
    const timeStr = `${hh}:${mm}`

    let defaultMenuId: string | null = null
    for (const m of menus) {
      if (m.is_default) defaultMenuId = m.id
      if (m.schedule_start && m.schedule_end) {
        if (timeStr >= m.schedule_start && timeStr <= m.schedule_end) {
          setActiveMenuId(m.id)
          return
        }
      }
    }
    // Fallback to default, or the first menu if no default exists
    setActiveMenuId(defaultMenuId ?? menus[0]?.id ?? null)
  }, [menus, multipleMenusEnabled])

  const filteredItems = useMemo(
    () => {
      const now = new Date()
      const hhmm = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`
      const base = (dietary === 'all' ? items : items.filter((it) => it.dietary === dietary))
        .filter((it) => {
          // Timed visibility: hide item outside its show window
          if (it.show_from && it.show_until) {
            return hhmm >= it.show_from && hhmm <= it.show_until
          }
          return true
        })
      return base.map(it => ({
        ...it,
        name: t('item', it.id, 'name', it.name),
        description: it.description ? t('item', it.id, 'description', it.description) : it.description,
      }))
    },
    [items, dietary, t],
  )

  const searchResults = useMemo(() => {
    if (!searchQuery.trim()) return []
    const q = searchQuery.toLowerCase()
    return filteredItems.filter(it =>
      it.name.toLowerCase().includes(q) ||
      (it.description ?? '').toLowerCase().includes(q)
    )
  }, [filteredItems, searchQuery])

  const visibleCategories = useMemo(
    () => {
      // First, filter categories by active menu ONLY IF multiple menus is explicitly turned on AND menus exist
      let menuCategories = categories
      if (multipleMenusEnabled && menus && menus.length > 0) {
        if (activeMenuId) {
          menuCategories = categories.filter(c => !c.menu_id || c.menu_id === activeMenuId)
        } else {
          // If multiple menus are enabled but NO menu is currently active
          // ONLY show "All Menus" categories (no menu_id assigned)
          menuCategories = categories.filter(c => !c.menu_id)
        }
      }
        
      // Then filter out categories with no items

      // Then, only show categories that have items matching the dietary filter
      const base = menuCategories.filter((c) => filteredItems.some((it) => it.category_id === c.id))
      return base.map(c => ({
        ...c,
        name: t('category', c.id, 'name', c.name),
        description: c.description ? t('category', c.id, 'description', c.description) : c.description,
      }))
    },
    [categories, activeMenuId, filteredItems, multipleMenusEnabled, menus, t],
  )

  const hasSidebar = ['provenance', 'onyx', 'sakura', 'coastal'].includes(theme)

  // Only show tabs if there are multiple menus, OR if there is 1 menu and it's not the default one
  const showTabs = multipleMenusEnabled && menus.length > 0 && (menus.length > 1 || menus[0].name.toLowerCase() !== 'default menu')
  const isSearching = searchQuery.trim().length > 0

  return (
    <main id="menu" className="pb-28" style={{ '--menu-tabs-offset': showTabs ? '54px' : '0px' } as React.CSSProperties}>
      {showTabs && (
        <div
          className={`sticky top-0 z-40 overflow-x-auto hide-scrollbar shadow-sm min-h-[54px] flex items-center ${hasSidebar ? "md:ml-[220px]" : "w-full"}`}
          style={{ background: 'var(--bg)', borderBottom: '1px solid var(--bdr)' }}
        >
          <div className="flex px-4 py-3 gap-2 md:justify-center">
            {menus.map(m => {
              const active = activeMenuId === m.id
              const displayName = m.name.toLowerCase() === 'default menu' ? 'Main Menu' : m.name
              return (
                <button
                  key={m.id}
                  onClick={() => setActiveMenuId(m.id)}
                  className="px-5 py-2 rounded-full text-sm whitespace-nowrap transition-all duration-300"
                  style={{
                    fontFamily: 'var(--font-display)',
                    letterSpacing: '0.02em',
                    fontWeight: active ? 700 : 500,
                    background: active ? 'var(--brand)' : 'transparent',
                    color: active ? 'var(--bg)' : 'var(--txt)',
                    border: active ? '1px solid var(--brand)' : '1px solid var(--bdr)'
                  }}
                >
                  {displayName}
                </button>
              )
            })}
          </div>
        </div>
      )}

      {showSearch && (
        <div className={hasSidebar ? 'md:ml-[220px]' : ''}>
          <SearchBar
            query={searchQuery}
            onChange={setSearchQuery}
            resultCount={searchResults.length}
          />
        </div>
      )}

      {isSearching ? (
        <div className={`px-4 pt-4 space-y-2 ${hasSidebar ? 'md:ml-[220px]' : ''}`}>
          {searchResults.length === 0 ? (
            <p className="py-16 text-center text-sm" style={{ color: 'var(--txt2)', fontFamily: 'var(--font-body)' }}>
              No items matched &ldquo;{searchQuery}&rdquo;
            </p>
          ) : (
            searchResults.map(item => (
              <ItemCard key={item.id} item={item} variant="row" theme={theme} />
            ))
          )}
        </div>
      ) : (
        <Layout categories={visibleCategories} items={filteredItems} businessId={businessId} />
      )}

      <ThumbDock categories={visibleCategories} presentDietary={presentDietary} />
    </main>
  )
}
