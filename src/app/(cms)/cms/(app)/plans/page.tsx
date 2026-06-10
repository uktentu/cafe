import { getCmsContext } from '@/lib/cms-context'
import { getConfig } from '@/lib/config'
import { redirect } from 'next/navigation'
import { Check, X, Zap, Star, Crown } from 'lucide-react'

const TIERS = [
  {
    id: 'basic',
    name: 'Basic',
    price: '₹999',
    period: '/month',
    icon: Zap,
    color: 'text-blue-400',
    borderColor: 'border-blue-500/30',
    bgColor: 'bg-blue-500/5',
    features: [
      { label: 'Up to 30 menu items', included: true },
      { label: '3 categories', included: true },
      { label: '1 QR code', included: true },
      { label: '1 staff account', included: true },
      { label: 'Text-only or stock photos', included: true },
      { label: 'Sold-out toggle', included: true },
      { label: 'WhatsApp ordering', included: true },
      { label: 'Analytics dashboard', included: false },
      { label: 'Promotional banners', included: false },
      { label: 'Multiple menus', included: false },
      { label: 'Staff accounts', included: false },
      { label: 'Table-aware WhatsApp', included: false },
      { label: 'Reservations system', included: false },
      { label: 'Multi-branch support', included: false },
      { label: 'Bilingual menu', included: false },
    ],
  },
  {
    id: 'advanced',
    name: 'Advanced',
    price: '₹1,999',
    period: '/month',
    icon: Star,
    color: 'text-amber-400',
    borderColor: 'border-amber-500/40',
    bgColor: 'bg-amber-500/8',
    popular: true,
    features: [
      { label: 'Up to 100 menu items', included: true },
      { label: 'Unlimited categories', included: true },
      { label: '5 QR codes', included: true },
      { label: '2 staff accounts', included: true },
      { label: 'Custom photo uploads', included: true },
      { label: 'Sold-out toggle', included: true },
      { label: 'WhatsApp ordering', included: true },
      { label: 'Analytics dashboard', included: true },
      { label: 'Promotional banners', included: true },
      { label: 'Multiple menus', included: true },
      { label: 'Staff accounts (2)', included: true },
      { label: 'Table-aware WhatsApp', included: true },
      { label: 'Reservations system', included: false },
      { label: 'Multi-branch support', included: false },
      { label: 'Bilingual menu', included: false },
    ],
  },
  {
    id: 'premium',
    name: 'Premium',
    price: '₹3,499',
    period: '/month',
    icon: Crown,
    color: 'text-purple-400',
    borderColor: 'border-purple-500/40',
    bgColor: 'bg-purple-500/5',
    features: [
      { label: 'Unlimited menu items', included: true },
      { label: 'Unlimited categories', included: true },
      { label: 'Unlimited QR codes', included: true },
      { label: '5 staff accounts', included: true },
      { label: 'Custom photo uploads (9/item)', included: true },
      { label: 'Sold-out toggle', included: true },
      { label: 'WhatsApp ordering', included: true },
      { label: 'Analytics dashboard', included: true },
      { label: 'Promotional banners (20)', included: true },
      { label: 'Multiple menus', included: true },
      { label: 'Staff accounts (5)', included: true },
      { label: 'Table-aware WhatsApp', included: true },
      { label: 'Reservations system', included: true },
      { label: 'Multi-branch support (3)', included: true },
      { label: 'Bilingual menu', included: true },
    ],
  },
]

export default async function PlansPage() {
  const ctx = await getCmsContext()
  if (ctx.state !== 'ok') redirect('/cms/login')

  const { tier } = getConfig()
  const devContact = process.env.NEXT_PUBLIC_DEVELOPER_CONTACT

  function upgradeMessage(targetTier: string) {
    const msg = `Hi! I'd like to upgrade my menu (${ctx.state === 'ok' ? ctx.business.name : ''}) from ${tier} to ${targetTier} plan. Please let me know the next steps.`
    return `https://wa.me/${devContact}?text=${encodeURIComponent(msg)}`
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-neutral-900 dark:text-white">Plans &amp; Pricing</h1>
        <p className="mt-1 text-sm text-neutral-500 dark:text-neutral-400">
          Your current plan: <span className="font-semibold capitalize text-amber-500">{tier}</span>
        </p>
      </div>

      {/* Current tier highlight */}
      <div className="rounded-xl border border-amber-500/30 bg-amber-500/5 p-4 flex items-center justify-between gap-4 flex-wrap">
        <div>
          <p className="text-sm font-medium text-amber-600 dark:text-amber-400">Active Plan</p>
          <p className="text-lg font-bold capitalize text-neutral-900 dark:text-white">{tier}</p>
          <p className="text-xs text-neutral-500 mt-0.5">
            {tier === 'basic' && '30 items · 1 QR code · 1 staff account'}
            {tier === 'advanced' && '100 items · 5 QR codes · 2 staff accounts · Analytics'}
            {tier === 'premium' && 'Unlimited items · All features · 5 staff · 3 branches'}
          </p>
        </div>
        {tier !== 'premium' && devContact && (
          <a
            href={upgradeMessage(tier === 'basic' ? 'advanced' : 'premium')}
            target="_blank"
            rel="noopener noreferrer"
            className="shrink-0 rounded-lg bg-amber-500 px-5 py-2.5 text-sm font-semibold text-white hover:bg-amber-600 transition-colors"
          >
            Upgrade Plan →
          </a>
        )}
      </div>

      {/* Pricing cards */}
      <div className="grid gap-6 md:grid-cols-3">
        {TIERS.map((t) => {
          const Icon = t.icon
          const isCurrent = tier === t.id
          const isDowngrade = TIERS.findIndex(x => x.id === tier) > TIERS.findIndex(x => x.id === t.id)

          return (
            <div
              key={t.id}
              className={`relative rounded-2xl border p-6 flex flex-col gap-5 ${t.borderColor} ${t.bgColor} ${isCurrent ? 'ring-2 ring-amber-500/50' : ''}`}
            >
              {t.popular && !isCurrent && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                  <span className="rounded-full bg-amber-500 px-3 py-1 text-[10px] font-bold uppercase tracking-wider text-white shadow">
                    Most Popular
                  </span>
                </div>
              )}
              {isCurrent && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                  <span className="rounded-full bg-green-500 px-3 py-1 text-[10px] font-bold uppercase tracking-wider text-white shadow">
                    Current Plan
                  </span>
                </div>
              )}

              <div className="flex items-center gap-3">
                <div className={`rounded-lg p-2 ${t.bgColor} border ${t.borderColor}`}>
                  <Icon className={`h-5 w-5 ${t.color}`} />
                </div>
                <div>
                  <p className="font-bold text-neutral-900 dark:text-white">{t.name}</p>
                  <p className={`text-xl font-bold ${t.color}`}>
                    {t.price}<span className="text-xs font-normal text-neutral-500">{t.period}</span>
                  </p>
                </div>
              </div>

              <ul className="space-y-2 flex-1">
                {t.features.map((f) => (
                  <li key={f.label} className="flex items-center gap-2 text-sm">
                    {f.included ? (
                      <Check className="h-4 w-4 shrink-0 text-green-500" />
                    ) : (
                      <X className="h-4 w-4 shrink-0 text-neutral-300 dark:text-neutral-600" />
                    )}
                    <span className={f.included ? 'text-neutral-700 dark:text-neutral-200' : 'text-neutral-400 dark:text-neutral-500'}>
                      {f.label}
                    </span>
                  </li>
                ))}
              </ul>

              {devContact && !isCurrent && !isDowngrade && (
                <a
                  href={upgradeMessage(t.id)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={`block w-full rounded-lg py-2.5 text-center text-sm font-semibold transition-colors ${
                    t.id === 'premium'
                      ? 'bg-purple-500 text-white hover:bg-purple-600'
                      : 'bg-amber-500 text-white hover:bg-amber-600'
                  }`}
                >
                  Upgrade to {t.name}
                </a>
              )}
              {isCurrent && (
                <div className="block w-full rounded-lg py-2.5 text-center text-sm font-semibold bg-neutral-100 dark:bg-neutral-800 text-neutral-500">
                  Current Plan
                </div>
              )}
            </div>
          )
        })}
      </div>

      {/* How upgrade works */}
      {devContact && (
        <div className="rounded-xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 p-6 space-y-3">
          <h2 className="font-semibold text-neutral-900 dark:text-white">How upgrades work</h2>
          <ol className="space-y-2 text-sm text-neutral-600 dark:text-neutral-400 list-decimal list-inside">
            <li>Click the upgrade button above — it opens a WhatsApp chat with us</li>
            <li>We confirm the plan and share payment details (UPI / bank transfer)</li>
            <li>Once payment is confirmed, your plan is upgraded within 24 hours</li>
            <li>No downtime — your menu stays live the whole time</li>
          </ol>
        </div>
      )}

      {/* Competitor comparison */}
      <div className="space-y-4">
        <h2 className="font-semibold text-neutral-900 dark:text-white">Why MenuOS vs the alternatives?</h2>
        <div className="overflow-x-auto rounded-xl border border-neutral-200 dark:border-neutral-800">
          <table className="w-full text-sm">
            <thead className="bg-neutral-50 dark:bg-neutral-800/50">
              <tr>
                <th className="px-4 py-3 text-left font-medium text-neutral-600 dark:text-neutral-400">Solution</th>
                <th className="px-4 py-3 text-left font-medium text-neutral-600 dark:text-neutral-400">Cost</th>
                <th className="px-4 py-3 text-left font-medium text-neutral-600 dark:text-neutral-400">QR Menu</th>
                <th className="px-4 py-3 text-left font-medium text-neutral-600 dark:text-neutral-400">Custom Domain</th>
                <th className="px-4 py-3 text-left font-medium text-neutral-600 dark:text-neutral-400">WhatsApp Orders</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-100 dark:divide-neutral-800">
              <tr className="bg-amber-50/50 dark:bg-amber-500/5">
                <td className="px-4 py-3 font-semibold text-amber-600">MenuOS (Advanced)</td>
                <td className="px-4 py-3 font-semibold text-green-600">₹1,999/mo</td>
                <td className="px-4 py-3 text-green-600">✓ Unlimited scans</td>
                <td className="px-4 py-3 text-green-600">✓ Included</td>
                <td className="px-4 py-3 text-green-600">✓ Table-aware</td>
              </tr>
              <tr>
                <td className="px-4 py-3 text-neutral-600 dark:text-neutral-400">Dotpe / Petpooja</td>
                <td className="px-4 py-3 text-neutral-600 dark:text-neutral-400">₹3,000–8,000/mo</td>
                <td className="px-4 py-3 text-neutral-500">✓ Basic</td>
                <td className="px-4 py-3 text-red-400">✗ Subdomain only</td>
                <td className="px-4 py-3 text-red-400">✗ Not included</td>
              </tr>
              <tr>
                <td className="px-4 py-3 text-neutral-600 dark:text-neutral-400">Custom website agency</td>
                <td className="px-4 py-3 text-neutral-600 dark:text-neutral-400">₹50,000+ setup + ₹2,000/mo hosting</td>
                <td className="px-4 py-3 text-red-400">✗ Static, no CMS</td>
                <td className="px-4 py-3 text-green-600">✓</td>
                <td className="px-4 py-3 text-red-400">✗</td>
              </tr>
              <tr>
                <td className="px-4 py-3 text-neutral-600 dark:text-neutral-400">Printed menu</td>
                <td className="px-4 py-3 text-neutral-600 dark:text-neutral-400">₹500–2,000 per reprint</td>
                <td className="px-4 py-3 text-red-400">✗</td>
                <td className="px-4 py-3 text-red-400">✗</td>
                <td className="px-4 py-3 text-red-400">✗</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
