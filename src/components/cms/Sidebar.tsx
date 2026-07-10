'use client'

import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { useQuery } from '@tanstack/react-query'
import { m } from 'framer-motion'
import {
  Menu, LayoutList, Settings, QrCode, LogOut, BarChart3, Store, CalendarCheck, FileText,
  Megaphone, CalendarClock, Users, LayoutDashboard, LayoutGrid, Receipt, IndianRupee,
  LineChart, Wallet, Contact, KanbanSquare,
  Lock, Menu as MenuIcon, X, ExternalLink, CreditCard, ShieldCheck, Moon, Sun, type LucideIcon,
} from 'lucide-react'
import { useTheme } from 'next-themes'
import { getConfig } from '@/lib/config'
import type { Features } from '@/lib/config'
import { createClient } from '@/lib/supabase/client'
import { qk, fetchBranches } from '@/lib/cms-queries'
import { useCmsStore } from '@/stores/cms'
import { useCms } from '@/components/cms/Providers'
import { cn } from '@/lib/utils'

// Owner opt-in toggles (set in Settings) — separate from tier gating. When the
// tier supports a feature but the owner hasn't switched it on, we hide the nav
// item (not lock it); tier-locked items are always shown with a lock as upsell.
type UserToggle = 'multiBranch' | 'reservations' | 'menus'

interface NavItem {
  href: string
  label: string
  icon: LucideIcon
  feature?: keyof Features
  userToggle?: UserToggle
}

interface NavSection {
  label: string
  items: NavItem[]
}

// Grouped by the job the owner is doing — editing the menu, running the floor,
// or managing the business — instead of one long flat list.
const SECTIONS: NavSection[] = [
  {
    label: 'Overview',
    items: [
      { href: '/cms/dashboard', label: 'Dashboard', icon: LayoutDashboard },
      { href: '/cms/analytics', label: 'Analytics', icon: BarChart3, feature: 'analytics' },
    ],
  },
  {
    label: 'Menu',
    items: [
      { href: '/cms/items', label: 'Items', icon: Menu },
      { href: '/cms/categories', label: 'Categories', icon: LayoutList },
      { href: '/cms/menus', label: 'Menus', icon: CalendarClock, feature: 'menus', userToggle: 'menus' },
      { href: '/cms/banners', label: 'Banners', icon: Megaphone, feature: 'banners' },
    ],
  },
  {
    label: 'Front of House',
    items: [
      { href: '/cms/qr-codes', label: 'QR Codes', icon: QrCode },
      { href: '/cms/reservations', label: 'Reservations', icon: CalendarCheck, feature: 'reservations', userToggle: 'reservations' },
      { href: '/cms/branches', label: 'Branches', icon: Store, feature: 'multiBranch', userToggle: 'multiBranch' },
    ],
  },
  {
    label: 'POS',
    items: [
      { href: '/cms/orders', label: 'Orders Board', icon: KanbanSquare, feature: 'aggregator' },
      { href: '/cms/tables', label: 'Tables', icon: LayoutGrid, feature: 'tableManagement' },
      { href: '/cms/pos', label: 'Orders & Billing', icon: Receipt, feature: 'staffOrderTaking' },
    ],
  },
  {
    label: 'Manage',
    items: [
      { href: '/cms/reports', label: 'Reports & Day Close', icon: LineChart, feature: 'reports' },
      { href: '/cms/sales', label: 'Sales', icon: IndianRupee, feature: 'billing' },
      { href: '/cms/expenses', label: 'Expenses', icon: Wallet, feature: 'expenses' },
      { href: '/cms/customers', label: 'Customers', icon: Contact, feature: 'crm' },
    ],
  },
  {
    label: 'Business',
    items: [
      { href: '/cms/staff', label: 'Staff', icon: Users, feature: 'staffAccounts' },
      { href: '/cms/settings', label: 'Settings', icon: Settings },
      { href: '/cms/tools', label: 'Tools', icon: FileText },
    ],
  },
]

type NavState = 'show' | 'locked' | 'hidden'

// POS features are an orthogonal add-on, not a tier upgrade — their nav items
// navigate to their own page (which renders its own add-on-specific
// UpgradePrompt) instead of being intercepted and redirected to the generic
// tier-comparison /cms/upgrade page.
const POS_FEATURES: ReadonlySet<keyof Features> = new Set<keyof Features>(['tableManagement', 'staffOrderTaking', 'kotDisplay', 'billing', 'reports', 'expenses', 'crm', 'aggregator'])

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function navStateFor(item: NavItem, features: Features, business: any): NavState {
  const lockedByTier = item.feature && !POS_FEATURES.has(item.feature) ? !features[item.feature] : false
  if (lockedByTier) return 'locked' // tier upsell — always visible with a lock
  const links = business?.social_links ?? {}
  if (item.userToggle === 'multiBranch' && links.multiple_branches_enabled !== true) return 'hidden'
  if (item.userToggle === 'reservations' && links.reservations_enabled !== true) return 'hidden'
  if (item.userToggle === 'menus' && links.multiple_menus_enabled !== true) return 'hidden'
  return 'show'
}

function NavRow({ item, active, locked, onNavigate }: { item: NavItem; active: boolean; locked: boolean; onNavigate: () => void }) {
  const Icon = item.icon
  const base = 'flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm transition'
  const router = useRouter()
  
  if (locked) {
    return (
      <button 
        type="button"
        className={cn(base, 'w-full text-left cursor-not-allowed text-neutral-500 dark:text-neutral-400 bg-transparent border-0 hover:bg-white/5 hover:text-white transition-colors')} 
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
      className={cn(base, 'relative', active ? 'text-amber-400 font-medium' : 'text-neutral-300 hover:text-white')}
    >
      {active && (
        <m.div
          layoutId="sidebar-active-bg"
          className="absolute inset-0 rounded-lg bg-amber-500/15"
          initial={false}
          transition={{ type: 'spring', stiffness: 350, damping: 30 }}
        />
      )}
      <Icon className="relative z-10 h-[18px] w-[18px]" />
      <span className="relative z-10">{item.label}</span>
    </Link>
  )
}

function BranchSwitcher() {
  const { business } = useCms()
  const { features } = getConfig()
  const activeBranchId = useCmsStore((s) => s.activeBranchId)
  const setActiveBranch = useCmsStore((s) => s.setActiveBranch)
  
  const isTenantEnabled = business.social_links?.multiple_branches_enabled === true
  
  const { data: branches = [] } = useQuery({
    queryKey: qk.branches(business.id),
    queryFn: () => fetchBranches(business.id),
    enabled: features.multiBranch && isTenantEnabled
  })

  if (!features.multiBranch || !isTenantEnabled || branches.length === 0) return null

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

function SidebarContent({ businessName, userEmail, isAdmin, onNavigate }: { businessName: string; userEmail: string; isAdmin: boolean; onNavigate: () => void }) {
  const pathname = usePathname()
  const router = useRouter()
  const { features, siteUrl } = getConfig()
  const { business } = useCms()
  const { resolvedTheme, setTheme } = useTheme()

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

      <nav className="flex-1 space-y-5 overflow-y-auto p-3">
        {SECTIONS.map((section) => {
          // Resolve each item's state; drop hidden ones, hide the whole section if empty.
          const visible = section.items
            .map((item) => ({ item, state: navStateFor(item, features, business) }))
            .filter(({ state }) => state !== 'hidden')

          if (visible.length === 0) return null

          return (
            <div key={section.label} className="space-y-1">
              <p className="px-3 pb-1 text-[10px] font-semibold uppercase tracking-wider text-neutral-500">
                {section.label}
              </p>
              {visible.map(({ item, state }) => (
                <NavRow
                  key={item.href}
                  item={item}
                  active={isActive(item.href)}
                  locked={state === 'locked'}
                  onNavigate={onNavigate}
                />
              ))}
            </div>
          )
        })}
      </nav>

      <div className="space-y-1 border-t border-white/10 p-3">
        <Link
          href="/cms/plans"
          onClick={onNavigate}
          className={cn(
            'flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm transition',
            isActive('/cms/plans') ? 'text-amber-400 font-medium' : 'text-neutral-300 hover:bg-white/5 hover:text-white'
          )}
        >
          <CreditCard className="h-[18px] w-[18px]" />
          Plans &amp; Pricing
        </Link>

        {isAdmin && (
          <Link
            href="/cms/admin"
            onClick={onNavigate}
            className={cn(
              'flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm transition',
              isActive('/cms/admin')
                ? 'bg-purple-500/20 text-purple-300 font-medium'
                : 'text-purple-400 hover:bg-purple-500/10 hover:text-purple-300'
            )}
          >
            <ShieldCheck className="h-[18px] w-[18px]" />
            Admin Panel
          </Link>
        )}

        <button
          type="button"
          onClick={() => setTheme(resolvedTheme === 'dark' ? 'light' : 'dark')}
          className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm text-neutral-300 hover:bg-white/5 hover:text-white transition-colors"
        >
          {resolvedTheme === 'dark'
            ? <Moon className="h-[18px] w-[18px]" />
            : <Sun className="h-[18px] w-[18px]" />
          }
          {resolvedTheme === 'dark' ? 'Dark mode' : 'Light mode'}
        </button>
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

export function Sidebar({ businessName, userEmail, isAdmin }: { businessName: string; userEmail: string; isAdmin: boolean }) {
  const open = useCmsStore((s) => s.sidebarOpen)
  const setSidebar = useCmsStore((s) => s.setSidebar)

  return (
    <>
      {/* Desktop: fixed rail */}
      <aside className="fixed inset-y-0 left-0 z-40 hidden w-64 md:block">
        <SidebarContent businessName={businessName} userEmail={userEmail} isAdmin={isAdmin} onNavigate={() => {}} />
      </aside>

      {/* Mobile: slide-in drawer */}
      <m.div
        className="fixed inset-0 z-40 bg-black/50 md:hidden"
        initial={false}
        animate={{ 
          opacity: open ? 1 : 0, 
          pointerEvents: open ? 'auto' : 'none' 
        }}
        onClick={() => setSidebar(false)}
      />
      <m.aside
        className="fixed inset-y-0 left-0 z-50 w-[280px] md:hidden"
        initial={false}
        animate={{ x: open ? 0 : -300 }}
        transition={{ type: 'spring', stiffness: 400, damping: 40 }}
      >
        <SidebarContent businessName={businessName} userEmail={userEmail} isAdmin={isAdmin} onNavigate={() => setSidebar(false)} />
      </m.aside>
    </>
  )
}

/** Mobile top bar with hamburger. Hidden on desktop (sidebar always visible). */
export function MobileTopbar({ businessName }: { businessName: string }) {
  const toggle = useCmsStore((s) => s.toggleSidebar)
  const open = useCmsStore((s) => s.sidebarOpen)
  return (
    <div className="sticky top-0 z-30 flex items-center gap-3 border-b border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 px-4 py-3 md:hidden">
      <button onClick={toggle} aria-label="Toggle menu" className="text-neutral-700 dark:text-neutral-300 flex-shrink-0">
        {open ? <X className="h-6 w-6" /> : <MenuIcon className="h-6 w-6" />}
      </button>
      <span className="font-semibold text-neutral-800 dark:text-neutral-200 truncate flex-1 min-w-0">{businessName}</span>
    </div>
  )
}
