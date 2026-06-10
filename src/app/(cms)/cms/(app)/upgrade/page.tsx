import { Check, X, Phone, Sparkles, Zap, Crown, Star } from 'lucide-react'
import Link from 'next/link'

export const metadata = {
  title: 'Upgrade Plan | MenuOS',
}

const TIERS = [
  {
    name: 'Basic',
    price: '₹999',
    period: '/month',
    tagline: 'Perfect to launch',
    accent: 'border-neutral-300 dark:border-neutral-700',
    badge: null,
    icon: Star,
    features: [
      '30 menu items',
      '3 categories',
      '1 QR code',
      'WhatsApp ordering',
      'Real-time sold-out toggle',
      'Live open/closed badge',
      'Item search',
      '3 Awwwards-quality templates',
    ],
    missing: [
      'Analytics dashboard',
      'Promotional banners',
      'Staff accounts',
      'Bilingual toggle',
      'Table reservations',
    ],
  },
  {
    name: 'Advanced',
    price: '₹1,999',
    period: '/month',
    tagline: 'Most popular',
    accent: 'border-amber-400 shadow-amber-100 dark:shadow-amber-900/30',
    badge: 'Most Popular',
    icon: Zap,
    features: [
      '100 menu items',
      'Unlimited categories',
      '5 QR codes',
      'Analytics dashboard',
      'Promotional banners',
      'Staff accounts (2 seats)',
      'Time-based menus',
      '6 premium templates',
      'WhatsApp + table ordering',
      'Real-time sold-out toggle',
      'Item search',
    ],
    missing: [
      'Bilingual toggle',
      'Table reservations',
      'Multi-branch (up to 3)',
    ],
  },
  {
    name: 'Premium',
    price: '₹3,499',
    period: '/month',
    tagline: 'Full power',
    accent: 'border-purple-400 shadow-purple-100 dark:shadow-purple-900/30',
    badge: 'Full Power',
    icon: Crown,
    features: [
      'Unlimited menu items',
      '99 QR codes',
      'Full analytics',
      'Bilingual toggle (EN + regional)',
      'Table reservations',
      'Multi-branch (up to 3 locations)',
      '5 staff accounts',
      'All 13 award-winning templates',
      'Custom brand colour',
      'SEO meta tags',
      'PDF menu export',
      'Priority support',
    ],
    missing: [],
  },
]

const COMPETITOR_ROWS = [
  { label: 'Award-winning design', menuos: true, dotpe: false, custom: 'Maybe' },
  { label: 'Realtime sold-out toggle', menuos: true, dotpe: true, custom: 'Expensive' },
  { label: 'Item search', menuos: true, dotpe: false, custom: 'Maybe' },
  { label: 'WhatsApp ordering', menuos: true, dotpe: false, custom: 'Expensive' },
  { label: 'Table-aware WhatsApp', menuos: true, dotpe: false, custom: false },
  { label: 'Bilingual menu', menuos: true, dotpe: false, custom: false },
  { label: 'Live open / closed badge', menuos: true, dotpe: false, custom: 'Maybe' },
  { label: 'Updates without reprinting', menuos: true, dotpe: true, custom: true },
  { label: 'Your brand, not theirs', menuos: true, dotpe: false, custom: true },
  { label: 'Price per month', menuos: 'From ₹999', dotpe: '₹3K–8K', custom: '₹2K+ maintenance' },
]

const FEATURE_PITCHES: Record<string, { title: string; desc: string }> = {
  Analytics:        { title: 'Analytics Dashboard',     desc: 'See which items get the most views, track WhatsApp conversions, and know exactly what your customers look at before ordering.' },
  Banners:          { title: 'Promotional Banners',      desc: 'Flash today\'s special or a limited-time offer at the top of every scan. Drive high-margin sales with zero printing cost.' },
  Menus:            { title: 'Time-Based Menus',         desc: 'Show Breakfast, Lunch, or Dinner menus automatically by time. Customers always see what\'s actually available right now.' },
  'Multiple Menus': { title: 'Time-Based Menus',         desc: 'Show Breakfast, Lunch, or Dinner menus automatically by time. Customers always see what\'s actually available right now.' },
  'Staff Accounts': { title: 'Staff Accounts',           desc: 'Let your manager update sold-out items or change prices without sharing your owner login. Full audit trail.' },
  Reservations:     { title: 'Table Reservations',       desc: 'Customers book directly from the QR menu, no third-party app. You get WhatsApp + email confirmation for every booking.' },
  'Multi-Branch':   { title: 'Multi-Branch Management',  desc: 'Run up to 3 locations from one dashboard. Each branch gets its own QR codes, menu overrides, and analytics.' },
  Branches:         { title: 'Multi-Branch Management',  desc: 'Run up to 3 locations from one dashboard. Each branch gets its own QR codes, menu overrides, and analytics.' },
}


export default function UpgradePage({ searchParams }: { searchParams: { feature?: string } }) {
  const featureKey = searchParams.feature || ''
  const pitch = FEATURE_PITCHES[featureKey]
  const devContact = process.env.NEXT_PUBLIC_DEVELOPER_CONTACT || ''

  return (
    <div className="mx-auto max-w-5xl space-y-16 px-4 py-10">

      {/* Feature-specific pitch */}
      {pitch && (
        <div className="rounded-2xl border border-amber-200 bg-amber-50 p-6 dark:border-amber-500/20 dark:bg-amber-500/5">
          <div className="flex items-start gap-4">
            <div className="rounded-xl bg-amber-100 p-3 dark:bg-amber-500/10">
              <Sparkles className="h-6 w-6 text-amber-600 dark:text-amber-400" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-neutral-900 dark:text-neutral-100">{pitch.title}</h2>
              <p className="mt-1 text-sm text-neutral-600 dark:text-neutral-400">{pitch.desc}</p>
            </div>
          </div>
        </div>
      )}

      {/* Headline */}
      <div className="text-center">
        <h1 className="text-3xl font-bold tracking-tight text-neutral-900 dark:text-neutral-100 sm:text-4xl">
          Choose the right plan
        </h1>
        <p className="mx-auto mt-3 max-w-xl text-neutral-500 dark:text-neutral-400">
          Award-winning QR menus from <strong className="text-neutral-800 dark:text-neutral-200">₹999/month</strong>.
          Competitors charge ₹3,000–8,000 for inferior design. No contracts, cancel anytime.
        </p>
      </div>

      {/* Pricing cards */}
      <div className="grid gap-6 sm:grid-cols-3">
        {TIERS.map((tier) => {
          const Icon = tier.icon
          const isFeatured = tier.badge === 'Most Popular'
          return (
            <div
              key={tier.name}
              className={`relative flex flex-col rounded-2xl border-2 bg-white p-6 shadow-sm dark:bg-neutral-900 ${tier.accent} ${isFeatured ? 'shadow-lg' : ''}`}
            >
              {tier.badge && (
                <div className={`absolute -top-3.5 left-1/2 -translate-x-1/2 rounded-full px-3 py-1 text-xs font-bold text-white ${isFeatured ? 'bg-amber-500' : 'bg-purple-500'}`}>
                  {tier.badge}
                </div>
              )}
              <div className="flex items-center gap-2 mb-4">
                <Icon className={`h-5 w-5 ${isFeatured ? 'text-amber-500' : tier.name === 'Premium' ? 'text-purple-500' : 'text-neutral-400'}`} />
                <span className="font-bold text-neutral-900 dark:text-neutral-100">{tier.name}</span>
              </div>
              <div className="mb-1 flex items-baseline gap-1">
                <span className="text-3xl font-extrabold text-neutral-900 dark:text-neutral-100">{tier.price}</span>
                <span className="text-sm text-neutral-500">{tier.period}</span>
              </div>
              <p className="mb-5 text-xs text-neutral-400">{tier.tagline}</p>

              <div className="flex-1 space-y-2.5">
                {tier.features.map((f) => (
                  <div key={f} className="flex items-start gap-2">
                    <Check className={`mt-0.5 h-4 w-4 shrink-0 ${isFeatured ? 'text-amber-500' : tier.name === 'Premium' ? 'text-purple-500' : 'text-emerald-500'}`} />
                    <span className="text-sm text-neutral-700 dark:text-neutral-300">{f}</span>
                  </div>
                ))}
                {tier.missing.map((f) => (
                  <div key={f} className="flex items-start gap-2 opacity-35">
                    <X className="mt-0.5 h-4 w-4 shrink-0" />
                    <span className="text-sm line-through">{f}</span>
                  </div>
                ))}
              </div>

              {devContact && (
                <a
                  href={`https://wa.me/${devContact.replace(/[^0-9]/g, '')}?text=${encodeURIComponent(`Hi, I'd like to upgrade to the MenuOS ${tier.name} plan.`)}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={`mt-6 flex w-full items-center justify-center gap-2 rounded-xl py-2.5 text-sm font-semibold transition-opacity hover:opacity-90 ${isFeatured ? 'bg-amber-500 text-white' : tier.name === 'Premium' ? 'bg-purple-500 text-white' : 'border border-neutral-200 bg-transparent text-neutral-700 dark:border-neutral-700 dark:text-neutral-300'}`}
                >
                  Upgrade to {tier.name}
                </a>
              )}
            </div>
          )
        })}
      </div>

      {/* ROI box */}
      <div className="rounded-2xl bg-emerald-50 p-6 dark:bg-emerald-900/10 border border-emerald-100 dark:border-emerald-500/20">
        <h3 className="mb-3 font-bold text-emerald-800 dark:text-emerald-300">The ROI case</h3>
        <div className="grid gap-4 sm:grid-cols-3 text-sm">
          <div>
            <p className="font-semibold text-neutral-800 dark:text-neutral-200">2 extra covers/day</p>
            <p className="text-neutral-500 dark:text-neutral-400">A beautiful menu = better first impression = customers stay longer and order more. Just 2 extra tables daily adds ₹6,000+ revenue per month.</p>
          </div>
          <div>
            <p className="font-semibold text-neutral-800 dark:text-neutral-200">Zero printing forever</p>
            <p className="text-neutral-500 dark:text-neutral-400">Update prices, add specials, mark sold-out — all in seconds. One QR printed once. Typical menu printing costs ₹2,000–5,000 every update.</p>
          </div>
          <div>
            <p className="font-semibold text-neutral-800 dark:text-neutral-200">WhatsApp orders = less staff</p>
            <p className="text-neutral-500 dark:text-neutral-400">Customers self-order via WhatsApp from the table. Reduces order-taking load, lets you run with a leaner team on busy nights.</p>
          </div>
        </div>
      </div>

      {/* Competitor comparison */}
      <div>
        <h2 className="mb-6 text-center text-xl font-bold text-neutral-900 dark:text-neutral-100">
          How MenuOS compares
        </h2>
        <div className="overflow-x-auto rounded-2xl border border-neutral-200 dark:border-neutral-800">
          <table className="w-full min-w-[500px] text-sm">
            <thead>
              <tr className="border-b border-neutral-200 dark:border-neutral-800">
                <th className="p-4 text-left font-semibold text-neutral-500">Feature</th>
                <th className="p-4 text-center font-bold text-amber-600">MenuOS</th>
                <th className="p-4 text-center font-semibold text-neutral-500">Dotpe / Petpooja</th>
                <th className="p-4 text-center font-semibold text-neutral-500">Custom Website</th>
              </tr>
            </thead>
            <tbody>
              {COMPETITOR_ROWS.map((row, i) => (
                <tr key={row.label} className={`border-b border-neutral-100 dark:border-neutral-800/50 ${i % 2 === 0 ? '' : 'bg-neutral-50/50 dark:bg-neutral-800/20'}`}>
                  <td className="p-4 text-neutral-700 dark:text-neutral-300">{row.label}</td>
                  <td className="p-4 text-center">
                    {row.menuos === true ? <Check className="mx-auto h-4 w-4 text-emerald-500" /> :
                     row.menuos === false ? <X className="mx-auto h-4 w-4 text-red-400 opacity-50" /> :
                     <span className="font-semibold text-amber-600">{row.menuos}</span>}
                  </td>
                  <td className="p-4 text-center">
                    {row.dotpe === true ? <Check className="mx-auto h-4 w-4 text-emerald-500" /> :
                     row.dotpe === false ? <X className="mx-auto h-4 w-4 text-neutral-400 opacity-50" /> :
                     <span className="text-neutral-500">{row.dotpe}</span>}
                  </td>
                  <td className="p-4 text-center">
                    {row.custom === true ? <Check className="mx-auto h-4 w-4 text-emerald-500" /> :
                     row.custom === false ? <X className="mx-auto h-4 w-4 text-neutral-400 opacity-50" /> :
                     <span className="text-neutral-500">{row.custom}</span>}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p className="mt-3 text-center text-xs text-neutral-400">
          Dotpe / Petpooja pricing as of 2024. Custom website assumes ₹50K–2L setup + ongoing maintenance.
        </p>
      </div>

      {/* CTA */}
      {devContact && (
        <div className="rounded-2xl bg-neutral-900 dark:bg-neutral-800 p-8 text-center text-white">
          <h3 className="mb-2 text-xl font-bold">Ready to upgrade?</h3>
          <p className="mb-6 text-sm text-neutral-400">Message the developer on WhatsApp and we&apos;ll switch your plan within the hour.</p>
          <a
            href={`https://wa.me/${devContact.replace(/[^0-9]/g, '')}?text=${encodeURIComponent('Hi, I\'d like to discuss upgrading my MenuOS plan.')}`}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 rounded-xl bg-[#25D366] px-6 py-3 font-semibold text-white transition-opacity hover:opacity-90"
          >
            <Phone className="h-5 w-5" />
            WhatsApp the developer
          </a>
        </div>
      )}

      <div className="text-center">
        <Link href="/cms/dashboard" className="text-sm text-neutral-400 hover:text-neutral-600 dark:hover:text-neutral-300 transition-colors">
          ← Back to dashboard
        </Link>
      </div>
    </div>
  )
}

export const runtime = "edge";
