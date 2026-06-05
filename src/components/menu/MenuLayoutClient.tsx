'use client'

import React, { useState, useEffect, Suspense } from 'react'
import { useSearchParams } from 'next/navigation'
import { THEMES, themeCssVars } from '@/lib/design-tokens'
import type { Theme, Business, Category, Item, Translation, Banner, Branch, Menu } from '@/types/database'
import { SplashScreen } from './SplashScreen'
import { LanguageProvider } from './LanguageProvider'
import { FloatingLanguageToggle } from './FloatingLanguageToggle'
import { MenuHero } from './MenuHero'
import { BestsellerStrip } from './BestsellerStrip'
import { MenuContent } from './MenuContent'
import { MenuFooter } from './MenuFooter'
import { WhatsAppCTA } from './WhatsAppCTA'
import { DeferredItemModal } from './DeferredItemModal'
import { DeferredReservationModal } from './DeferredReservationModal'
import { Palette } from 'lucide-react'
import { BannerStrip } from './BannerStrip'
import { BranchSelector } from './BranchSelector'
import { useMenuStore } from '@/stores/menu'
import { getConfig } from '@/lib/config'

// Reads ?theme=xyz from the URL for the demo without breaking static export
function ThemeReader({ setTheme }: { setTheme: (t: Theme) => void }) {
  const params = useSearchParams()
  useEffect(() => {
    const t = params.get('theme') as Theme
    if (t && THEMES[t]) {
      setTheme(t)
    }
  }, [params, setTheme])
  return null
}

function DemoThemeSwitcher({ currentTheme, setTheme }: { currentTheme: Theme; setTheme: (t: Theme) => void }) {
  const [open, setOpen] = useState(false)
  
  return (
    <div className="fixed bottom-4 left-4 z-[100] flex flex-col gap-2">
      {open && (
        <div 
          className="flex flex-col gap-1 rounded-2xl p-2 border shadow-lg max-h-[60vh] overflow-y-auto"
          style={{ 
            background: 'var(--bg)', 
            borderColor: 'var(--border)',
            color: 'var(--txt)'
          }}
        >
          <div className="px-2 py-1 text-xs font-bold uppercase tracking-wider opacity-50">Templates</div>
          {(Object.keys(THEMES) as Theme[]).map(t => (
            <button
              key={t}
              onClick={() => {
                setTheme(t)
                setOpen(false)
              }}
              className={`px-3 py-2 text-sm font-medium rounded-xl text-left transition-colors ${
                currentTheme === t ? 'bg-black text-white dark:bg-white dark:text-black' : 'hover:bg-black/5 dark:hover:bg-white/10'
              }`}
            >
              {t.charAt(0).toUpperCase() + t.slice(1)}
            </button>
          ))}
        </div>
      )}
      <button
        onClick={() => setOpen(!open)}
        className="flex items-center justify-center w-12 h-12 rounded-full shadow-lg border transition-transform hover:scale-105 active:scale-95"
        style={{ 
          background: 'var(--glass)', 
          borderColor: 'var(--border)',
          backdropFilter: 'blur(12px)',
          color: 'var(--txt)'
        }}
        aria-label="Theme Demo Switcher"
      >
        <Palette className="w-5 h-5 opacity-80" />
      </button>
    </div>
  )
}

interface MenuLayoutClientProps {
  business: Business
  categories: Category[]
  items: Item[]
  translations: Translation[]
  banners: Banner[]
  branches: Branch[]
  menus: Menu[]
  initialTheme: Theme
  isDemo?: boolean
}

export function MenuLayoutClient({ business, categories, items, translations, banners, branches, menus, initialTheme, isDemo }: MenuLayoutClientProps) {
  const [theme, setTheme] = useState<Theme>(initialTheme)
  
  const themeMeta = THEMES[theme] ?? THEMES.mercado
  const splashMs = themeMeta.splashMs
  
  const selectedBranchId = useMenuStore(s => s.selectedBranchId)

  // Inject CSS variables for the current theme dynamically on the client
  // so that switching themes applies immediately.
  useEffect(() => {
    if (typeof document === 'undefined') return
    const root = document.documentElement
    const vars = themeCssVars(theme, business.theme_color)
    Object.entries(vars).forEach(([k, v]) => {
      root.style.setProperty(k, v)
    })
  }, [theme, business.theme_color])

  const [showDemo, setShowDemo] = useState(false)
  useEffect(() => {
    // Show demo toggle if backend tells us we're in demo mode, or via env
    if (isDemo || process.env.NEXT_PUBLIC_DEMO_MODE === 'true') {
      setShowDemo(true)
    }
  }, [isDemo])

  return (
    <>
      <Suspense fallback={null}>
        <ThemeReader setTheme={setTheme} />
      </Suspense>

      <SplashScreen name={business.name} splashMs={splashMs} theme={theme} />

      {showDemo && <DemoThemeSwitcher currentTheme={theme} setTheme={setTheme} />}

      <LanguageProvider translations={translations}>
        <FloatingLanguageToggle />
        <a
          href="#menu"
          className="sr-only focus:not-sr-only focus:absolute focus:left-3 focus:top-3 focus:z-[110] focus:rounded focus:bg-white focus:px-3 focus:py-2 focus:text-sm focus:text-black"
        >
          Skip to menu
        </a>

        <div className={['provenance', 'onyx', 'sakura', 'coastal'].includes(theme) ? "md:ml-[220px]" : ""}>
          {banners.length > 0 && <BannerStrip banners={banners} theme={theme} />}
          {branches.length > 1 && <BranchSelector branches={branches} theme={theme} />}
          <MenuHero business={business} theme={theme} />
          {getConfig().features.featuredCarousel && <BestsellerStrip items={items} categories={categories} theme={theme} />}
        </div>

        <MenuContent categories={categories} items={items} menus={menus} businessId={business.id} theme={theme} multipleMenusEnabled={business.social_links?.multiple_menus_enabled ?? false} />

        <div className={['provenance', 'onyx', 'sakura', 'coastal'].includes(theme) ? "md:ml-[220px]" : ""}>
          <MenuFooter business={business} theme={theme} />
        </div>

        <WhatsAppCTA
          whatsapp={business.whatsapp ?? ''}
          businessId={business.id}
          businessName={business.name}
        />
        <DeferredItemModal businessName={business.name} whatsapp={business.whatsapp ?? ''} theme={theme} />
        <DeferredReservationModal businessId={business.id} businessName={business.name} branchId={selectedBranchId ?? undefined} theme={theme} />
      </LanguageProvider>
    </>
  )
}
