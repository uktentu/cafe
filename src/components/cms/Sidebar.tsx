'use client'

import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { useQuery } from '@tanstack/react-query'
import { AnimatePresence, m } from 'framer-motion'
import {
  Menu, LayoutList, Settings, QrCode, LogOut, BarChart3, Store, CalendarCheck, FileText,
  Megaphone, CalendarClock, Users, LayoutDashboard,
  Lock, Menu as MenuIcon, X, ExternalLink, type LucideIcon,
} from 'lucide-react'
import { getConfig } from '@/lib/config'
import type { Features } from '@/lib/config'
import { createClient } from '@/lib/supabase/client'
import { qk, fetchBranches } from '@/lib/cms-queries'
import { useCmsStore } from '@/stores/cms'
import { useCms } from '@/components/cms/Providers'
import { cn } from '@/lib/utils'

interface NavItem {
  href: string
  label: string
  icon: LucideIcon
  feature?: keyof Features
}

const PRIMARY: NavItem[] = [
  { href: '/cms/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/cms/items', label: 'Items', icon: Menu },
  { href: '/cms/categories', label: 'Categories', icon: LayoutList },
  { href: '/cms/qr-codes', label: 'QR Codes', icon: QrCode },
  { href: '/cms/branches', label: 'Branches', icon: Store, feature: 'multiBranch' },
  { href: '/cms/reservations', label: 'Reservations', icon: CalendarCheck, feature: 'reservations' },
  { href: '/cms/settings', label: 'Settings', icon: Settings },
  { href: '/cms/tools', label: 'Tools', icon: FileText },
]

// Tier-gated — shown with a lock when the feature is off (sales mechanism, not hidden).
const GATED: NavItem[] = [
  { href: '/cms/analytics', label: 'Analytics', icon: BarChart3, feature: 'analytics' },
  { href: '/cms/banners', label: 'Banners', icon: Megaphone, feature: 'banners' },
  { href: '/cms/menus', label: 'Menus', icon: CalendarClock, feature: 'menus' },
  { href: '/cms/staff', label: 'Staff', icon: Users, feature: 'staffAccounts' },
]

function NavRow({ item, active, locked, onNavigate }: { item: NavItem; active: boolean; locked: boolean; onNavigate: () => void }) {
  const Icon = item.icon
  const base = 'flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm transition'
  const router = useRouter()
  
  if (locked) {
    return (
      <button 
        type="button"
        className={cn(base, 'w-full text-left cursor-not-allowed text-neutral-500 bg-transparent border-0 hover:bg-white/5 hover:text-white transition-colors')} 
        onClick={() => {
          onNavigate()
          router.push(`/cms/upgrade?feature=${encodeURIComponent(item.label)}`)
        }}
        title="Upgrade to unlock"
      >
        <Icon className="h-[18px] w-[18px]" />
        <span className="flex-1">{item.label}</span>
        <Lock className="h-3.5 w-3.5" />
      </button>
    )
  }
  return (
    <Link
      href={item.href}
      onClick={onNavigate}
      className={cn(base, active ? 'bg-amber-500/15 font-medium text-amber-400' : 'text-neutral-300 hover:bg-white/5 hover:text-white')}
    >
      <Icon className="h-[18px] w-[18px]" />
      <span>{item.label}</span>
    </Link>
  )
}

function BranchSwitcher() {
  const { business } = useCms()
  const { features } = getConfig()
  const activeBranchId = useCmsStore((s) => s.activeBranchId)
  const setActiveBranch = useCmsStore((s) => s.setActiveBranch)
  
  const { data: branches = [] } = useQuery({
    queryKey: qk.branches(business.id),
    queryFn: () => fetchBranches(business.id),
    enabled: features.multiBranch
  })

  if (!features.multiBranch || branches.length === 0) return null

  return (
    <div className="px-5 pb-4">
      <select
        value={activeBranchId || ''}
        onChange={(e) => setActiveBranch(e.target.value || null)}
        className="w-full rounded-md border border-white/20 bg-white/5 px-2 py-1.5 text-xs text-white focus:border-amber-500 focus:outline-none"
      >
        <option value="">All Branches</option>
        {branches.map(b => (
          <option key={b.id} value={b.id}>{b.name}</option>
        ))}
      </select>
    </div>
  )
}

function SidebarContent({ businessName, userEmail, onNavigate }: { businessName: string; userEmail: string; onNavigate: () => void }) {
  const pathname = usePathname()
  const router = useRouter()
  const { features, siteUrl } = getConfig()
  const { business } = useCms()

  async function signOut() {
    await createClient().auth.signOut()
    router.replace('/cms/login')
    router.refresh()
  }

  const isActive = (href: string) => pathname === href || pathname.startsWith(href + '/')

  return (
    <div className="flex h-full flex-col bg-[#1A1917] text-white">
      <div className="border-b border-white/10 pt-4">
        <div className="px-5 pb-3">
          <p className="text-base font-semibold">{businessName}</p>
          <p className="truncate text-xs text-neutral-400">{userEmail}</p>
        </div>
        <BranchSwitcher />
      </div>

      <nav className="flex-1 space-y-1 overflow-y-auto p-3">
        {PRIMARY.map((item) => {
          const isLockedByTier = item.feature ? !features[item.feature] : false
          return <NavRow key={item.href} item={item} active={isActive(item.href)} locked={isLockedByTier} onNavigate={onNavigate} />
        })}
        <div className="my-3 border-t border-white/10" />
        {GATED.map((item) => {
          const isLockedByTier = item.feature ? !features[item.feature] : false
          let isHiddenByUser = false
          
          if (item.feature === 'menus' && !isLockedByTier) {
            if (business.social_links?.multiple_menus_enabled !== true) {
              isHiddenByUser = true
            }
          }
          
          if (isHiddenByUser) return null
          
          return (
            <NavRow key={item.href} item={item} active={isActive(item.href)} locked={isLockedByTier} onNavigate={onNavigate} />
          )
        })}
      </nav>

      <div className="space-y-1 border-t border-white/10 p-3">
        <a
          href={siteUrl || '/'}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm text-neutral-300 hover:bg-white/5 hover:text-white"
        >
          <ExternalLink className="h-[18px] w-[18px]" />
          View live menu
        </a>
        <button
          onClick={signOut}
          className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm text-neutral-300 hover:bg-white/5 hover:text-white"
        >
          <LogOut className="h-[18px] w-[18px]" />
          Sign out
        </button>
      </div>
    </div>
  )
}

export function Sidebar({ businessName, userEmail }: { businessName: string; userEmail: string }) {
  const open = useCmsStore((s) => s.sidebarOpen)
  const setSidebar = useCmsStore((s) => s.setSidebar)

  return (
    <>
      {/* Desktop: fixed rail */}
      <aside className="fixed inset-y-0 left-0 z-40 hidden w-64 md:block">
        <SidebarContent businessName={businessName} userEmail={userEmail} onNavigate={() => {}} />
      </aside>

      {/* Mobile: slide-in drawer */}
      <AnimatePresence>
        {open && (
          <>
            <m.div
              className="fixed inset-0 z-40 bg-black/50 md:hidden"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setSidebar(false)}
            />
            <m.aside
              className="fixed inset-y-0 left-0 z-50 w-[280px] md:hidden"
              initial={{ x: -300 }}
              animate={{ x: 0 }}
              exit={{ x: -300 }}
              transition={{ type: 'spring', stiffness: 400, damping: 40 }}
            >
              <SidebarContent businessName={businessName} userEmail={userEmail} onNavigate={() => setSidebar(false)} />
            </m.aside>
          </>
        )}
      </AnimatePresence>
    </>
  )
}

/** Mobile top bar with hamburger. Hidden on desktop (sidebar always visible). */
export function MobileTopbar({ businessName }: { businessName: string }) {
  const toggle = useCmsStore((s) => s.toggleSidebar)
  const open = useCmsStore((s) => s.sidebarOpen)
  return (
    <div className="sticky top-0 z-30 flex items-center gap-3 border-b border-neutral-200 bg-white px-4 py-3 md:hidden">
      <button onClick={toggle} aria-label="Toggle menu" className="text-neutral-700">
        {open ? <X className="h-6 w-6" /> : <MenuIcon className="h-6 w-6" />}
      </button>
      <span className="font-semibold text-neutral-800">{businessName}</span>
    </div>
  )
}
