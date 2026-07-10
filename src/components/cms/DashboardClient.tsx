'use client'

import Link from 'next/link'
import {
  Plus, UtensilsCrossed, FolderTree, PackageX, QrCode, Settings,
  BarChart3, Star, FileText, ExternalLink, CheckCircle2,
  AlertCircle, Megaphone, Users, CalendarCheck, Zap,
  Receipt, LayoutGrid, ChefHat, IndianRupee, KanbanSquare,
} from 'lucide-react'
import { AnimatedNumber } from '@/components/motion/AnimatedNumber'
import { StaggerList, StaggerItem } from '@/components/motion/StaggerList'
import type { Business } from '@/types/database'
import type { Features } from '@/lib/config'

interface DashboardStats {
  items: number
  soldOut: number
  categories: number
  featured: number
  qrCodes: number
}

interface PosSnapshot {
  todaySales: number
  todayBills: number
  occupiedTables: number
  activeTickets: number
}

interface DashboardClientProps {
  stats: DashboardStats
  business: Business
  features: Features
  pos?: PosSnapshot | null
}

interface SetupItem {
  label: string
  done: boolean
  href: string
}

function inr(n: number): string {
  return `₹${n.toLocaleString('en-IN', { maximumFractionDigits: 0 })}`
}

export function DashboardClient({ stats, business, features, pos }: DashboardClientProps) {
  const setupItems: SetupItem[] = [
    { label: 'Business name & logo', done: !!(business.name && business.logo_r2_key), href: '/cms/settings' },
    { label: 'WhatsApp number set', done: !!business.whatsapp, href: '/cms/settings' },
    { label: 'Opening hours configured', done: Object.keys(business.opening_hours ?? {}).length > 0, href: '/cms/settings' },
    { label: 'Menu items added', done: stats.items > 0, href: '/cms/items/new' },
    { label: 'QR code created', done: stats.qrCodes > 0, href: '/cms/qr-codes' },
  ]
  const setupDone = setupItems.filter((s) => s.done).length
  const allDone = setupDone === setupItems.length

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold text-neutral-900 dark:text-neutral-100">
            {business.name}
          </h1>
          <p className="mt-0.5 text-sm text-neutral-500 dark:text-neutral-400">
            {business.tier.charAt(0).toUpperCase() + business.tier.slice(1)} plan
            {' · '}
            {business.theme.charAt(0).toUpperCase() + business.theme.slice(1)} theme
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Link
            href="/cms/items/new"
            className="inline-flex h-9 items-center gap-2 rounded-lg bg-amber-500 px-4 text-sm font-medium text-white hover:bg-amber-600 transition-colors"
          >
            <Plus className="h-4 w-4" /> Add item
          </Link>
          <a
            href={`${process.env.NEXT_PUBLIC_SITE_URL || '/'}`}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex h-9 items-center gap-2 rounded-lg border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-900 px-4 text-sm font-medium text-neutral-700 dark:text-neutral-300 hover:bg-neutral-50 dark:hover:bg-neutral-800 transition-colors"
          >
            <ExternalLink className="h-4 w-4" /> View menu
          </a>
        </div>
      </div>

      {/* Command center — today's live POS numbers (only when POS is on) */}
      {pos && (
        <div className="rounded-2xl bg-gradient-to-br from-amber-500 to-orange-600 p-4 text-white shadow-sm sm:p-5">
          <div className="mb-3 flex items-center justify-between">
            <p className="text-sm font-semibold uppercase tracking-wide opacity-90">Today</p>
            <Link href="/cms/reports" className="text-xs font-medium underline-offset-2 hover:underline">Full report →</Link>
          </div>
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
            <div>
              <p className="text-2xl font-bold">{inr(pos.todaySales)}</p>
              <p className="text-xs opacity-80">Sales collected</p>
            </div>
            <div>
              <p className="text-2xl font-bold">{pos.todayBills}</p>
              <p className="text-xs opacity-80">Bills settled</p>
            </div>
            <Link href="/cms/tables" className="transition-opacity hover:opacity-90">
              <p className="text-2xl font-bold">{pos.occupiedTables}</p>
              <p className="text-xs opacity-80">Tables occupied</p>
            </Link>
            <Link href="/cms/kitchen" className="transition-opacity hover:opacity-90">
              <p className="text-2xl font-bold">{pos.activeTickets}</p>
              <p className="text-xs opacity-80">Kitchen tickets</p>
            </Link>
          </div>
          <div className="mt-4 flex flex-wrap gap-2">
            <Link href="/cms/pos" className="inline-flex h-8 items-center gap-1.5 rounded-lg bg-white/20 px-3 text-xs font-semibold backdrop-blur hover:bg-white/30">
              <Receipt className="h-3.5 w-3.5" /> New order
            </Link>
            <Link href="/cms/kitchen" className="inline-flex h-8 items-center gap-1.5 rounded-lg bg-white/20 px-3 text-xs font-semibold backdrop-blur hover:bg-white/30">
              <ChefHat className="h-3.5 w-3.5" /> Kitchen
            </Link>
            <Link href="/cms/reports" className="inline-flex h-8 items-center gap-1.5 rounded-lg bg-white/20 px-3 text-xs font-semibold backdrop-blur hover:bg-white/30">
              <IndianRupee className="h-3.5 w-3.5" /> Day close
            </Link>
          </div>
        </div>
      )}

      {/* Stat cards */}
      <StaggerList className="grid grid-cols-2 gap-3 sm:grid-cols-4 md:gap-4" whenVisible={false}>
        {[
          { label: 'Menu items',  value: stats.items,      icon: UtensilsCrossed, color: '#F59E0B', href: '/cms/items' },
          { label: 'Sold out',    value: stats.soldOut,    icon: PackageX,        color: '#EF4444', href: '/cms/items' },
          { label: 'Categories',  value: stats.categories, icon: FolderTree,      color: '#22C55E', href: '/cms/categories' },
          { label: 'QR codes',    value: stats.qrCodes,    icon: QrCode,          color: '#8B5CF6', href: '/cms/qr-codes' },
        ].map((c) => {
          const Icon = c.icon
          return (
            <StaggerItem key={c.label}>
              <Link
                href={c.href}
                className="block rounded-2xl bg-white dark:bg-neutral-900 p-4 ring-1 ring-black/5 dark:ring-white/10 md:p-5 hover:ring-black/10 dark:hover:ring-white/20 transition-shadow"
              >
                <Icon className="h-5 w-5" style={{ color: c.color }} />
                <div className="mt-3 text-2xl font-semibold text-neutral-900 dark:text-neutral-100 md:text-3xl">
                  <AnimatedNumber value={c.value} />
                </div>
                <div className="text-xs text-neutral-500 dark:text-neutral-400 md:text-sm">{c.label}</div>
              </Link>
            </StaggerItem>
          )
        })}
      </StaggerList>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Setup checklist */}
        <div className="rounded-2xl bg-white dark:bg-neutral-900 p-5 ring-1 ring-black/5 dark:ring-white/10 lg:col-span-1">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="font-semibold text-neutral-800 dark:text-neutral-200 text-sm">Setup checklist</h2>
            <span className="text-xs font-medium px-2 py-0.5 rounded-full" style={{ background: allDone ? '#22C55E20' : '#F59E0B20', color: allDone ? '#16A34A' : '#D97706' }}>
              {setupDone}/{setupItems.length}
            </span>
          </div>
          <ul className="space-y-2">
            {setupItems.map((s) => (
              <li key={s.label}>
                <Link
                  href={s.href}
                  className="flex items-center gap-2.5 rounded-lg px-2 py-1.5 text-sm transition-colors hover:bg-neutral-50 dark:hover:bg-neutral-800"
                >
                  {s.done
                    ? <CheckCircle2 className="h-4 w-4 shrink-0 text-green-500" />
                    : <AlertCircle className="h-4 w-4 shrink-0 text-amber-400" />
                  }
                  <span className={s.done ? 'text-neutral-500 dark:text-neutral-400 line-through' : 'text-neutral-700 dark:text-neutral-300'}>
                    {s.label}
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        </div>

        {/* Quick navigation tiles */}
        <div className="lg:col-span-2">
          <h2 className="mb-4 font-semibold text-neutral-800 dark:text-neutral-200 text-sm">Quick access</h2>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
            {[
              // POS tiles first — during service these are the screens staff reach for.
              ...(features.posEnabled
                ? [
                    { label: 'Orders Board',     icon: KanbanSquare, href: '/cms/orders', desc: 'Swiggy, Zomato & dine-in' },
                    { label: 'Orders & Billing', icon: Receipt,    href: '/cms/pos',     desc: 'Take orders, settle bills' },
                    { label: 'Tables',           icon: LayoutGrid, href: '/cms/tables',  desc: 'Floor & table status' },
                    { label: 'Kitchen',          icon: ChefHat,    href: '/cms/kitchen', desc: 'Live KOT board' },
                    { label: 'Sales',            icon: IndianRupee, href: '/cms/sales',  desc: 'Takings & bill history' },
                  ]
                : []),
              { label: 'Items',        icon: UtensilsCrossed, href: '/cms/items',        desc: 'Add, edit, sold-out' },
              { label: 'Categories',   icon: FolderTree,      href: '/cms/categories',   desc: 'Organise your menu' },
              { label: 'Settings',     icon: Settings,        href: '/cms/settings',     desc: 'Hours, links, theme' },
              { label: 'QR Codes',     icon: QrCode,          href: '/cms/qr-codes',     desc: 'Download & share' },
              { label: 'Tools',        icon: FileText,        href: '/cms/tools',        desc: 'PDF, WhatsApp, QR' },
              features.analytics
                ? { label: 'Analytics', icon: BarChart3, href: '/cms/analytics', desc: 'Views, taps, trends' }
                : { label: 'Analytics', icon: BarChart3, href: '/cms/upgrade?feature=Analytics', desc: 'Upgrade to unlock' },
              features.banners
                ? { label: 'Banners',  icon: Megaphone,   href: '/cms/banners',  desc: 'Promo banners' }
                : { label: 'Banners',  icon: Megaphone,   href: '/cms/upgrade?feature=Banners', desc: 'Upgrade to unlock' },
              features.staffAccounts
                ? { label: 'Staff',    icon: Users,       href: '/cms/staff',    desc: 'Team access' }
                : { label: 'Staff',    icon: Users,       href: '/cms/upgrade?feature=Staff', desc: 'Upgrade to unlock' },
              features.reservations
                ? { label: 'Reservations', icon: CalendarCheck, href: '/cms/reservations', desc: 'Manage bookings' }
                : { label: 'Reservations', icon: CalendarCheck, href: '/cms/upgrade?feature=Reservations', desc: 'Upgrade to unlock' },
            ].map((tile) => {
              const Icon = tile.icon
              const locked = tile.href.includes('/upgrade')
              return (
                <Link
                  key={tile.label}
                  href={tile.href}
                  className="flex flex-col gap-1.5 rounded-xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 p-3.5 transition-colors hover:border-neutral-300 dark:hover:border-neutral-700 hover:bg-neutral-50 dark:hover:bg-neutral-800"
                >
                  <div className="flex items-center justify-between">
                    <Icon className="h-[18px] w-[18px] text-neutral-500 dark:text-neutral-400" />
                    {locked && <Zap className="h-3.5 w-3.5 text-amber-400" />}
                  </div>
                  <span className="text-sm font-medium text-neutral-800 dark:text-neutral-200">{tile.label}</span>
                  <span className="text-[11px] text-neutral-400 dark:text-neutral-500 leading-tight">{tile.desc}</span>
                </Link>
              )
            })}
          </div>
        </div>
      </div>

      {/* Sold-out alert */}
      {stats.soldOut > 0 && (
        <div className="flex items-center gap-3 rounded-xl border border-red-200 dark:border-red-900 bg-red-50 dark:bg-red-950/30 px-4 py-3">
          <PackageX className="h-5 w-5 shrink-0 text-red-500" />
          <div className="flex-1 text-sm">
            <span className="font-medium text-red-700 dark:text-red-400">{stats.soldOut} item{stats.soldOut !== 1 ? 's' : ''} marked as sold out.</span>
            {' '}
            <span className="text-red-600/70 dark:text-red-500/70">Tap to restore availability.</span>
          </div>
          <Link
            href="/cms/items"
            className="shrink-0 text-xs font-semibold text-red-600 dark:text-red-400 hover:underline"
          >
            Manage →
          </Link>
        </div>
      )}

      {/* Tier info bar */}
      {business.tier === 'basic' && (
        <div className="flex items-center gap-3 rounded-xl border border-amber-200 dark:border-amber-900 bg-amber-50 dark:bg-amber-950/30 px-4 py-3">
          <Star className="h-5 w-5 shrink-0 text-amber-500" />
          <div className="flex-1 text-sm text-amber-700 dark:text-amber-400">
            You&apos;re on the <strong>Basic</strong> plan. Unlock Analytics, Banners, Staff accounts, and more.
          </div>
          <Link
            href="/cms/upgrade"
            className="shrink-0 rounded-lg bg-amber-500 px-3 py-1.5 text-xs font-semibold text-white hover:bg-amber-600 transition-colors"
          >
            Upgrade
          </Link>
        </div>
      )}

      {business.tier === 'advanced' && (
        <div className="flex items-center gap-3 rounded-xl border border-purple-200 dark:border-purple-900 bg-purple-50 dark:bg-purple-950/30 px-4 py-3">
          <Zap className="h-5 w-5 shrink-0 text-purple-500" />
          <div className="flex-1 text-sm text-purple-700 dark:text-purple-400">
            You&apos;re on the <strong>Advanced</strong> plan. Unlock GSAP animations, exclusive templates, and Premium support.
          </div>
          <Link
            href="/cms/upgrade"
            className="shrink-0 rounded-lg bg-purple-500 px-3 py-1.5 text-xs font-semibold text-white hover:bg-purple-600 transition-colors"
          >
            Go Premium
          </Link>
        </div>
      )}
    </div>
  )
}
