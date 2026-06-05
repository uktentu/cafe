import { Lock, Phone, Sparkles, TrendingUp, CheckCircle2 } from 'lucide-react'
import Link from 'next/link'
import { Button } from '@/components/ui/Button'

export const runtime = 'edge'

export const metadata = {
  title: 'Upgrade Plan | MenuOS',
}

const FEATURE_PITCHES: Record<string, { title: string, subtitle: string, benefits: string[] }> = {
  'Branches': {
    title: 'Multi-Branch Management',
    subtitle: 'Scale your restaurant empire from a single dashboard.',
    benefits: [
      'Manage multiple locations seamlessly from one account.',
      'Synchronize menus across branches instantly.',
      'Maintain brand consistency while allowing local variations.',
    ]
  },
  'Analytics': {
    title: 'Advanced Analytics',
    subtitle: 'Stop guessing what works and start knowing.',
    benefits: [
      'See exactly which items get the most views and interactions.',
      'Track WhatsApp order conversions in real-time.',
      'Optimize your menu layout to drive up to 30% more revenue.',
    ]
  },
  'Menus': {
    title: 'Time-Based Menus',
    subtitle: 'Show the right menu at exactly the right time.',
    benefits: [
      'Automatically switch between Breakfast, Lunch, and Dinner menus.',
      'Create special weekend or holiday menus that activate automatically.',
      'Reduce customer confusion and highlight what is actually available.',
    ]
  },
  'Banners': {
    title: 'Promotional Banners',
    subtitle: 'Capture attention and drive high-margin sales.',
    benefits: [
      'Display eye-catching promotional banners at the top of your menu.',
      "Highlight today's specials, discounts, or new arrivals.",
      'Directly influence customer purchasing decisions the moment they scan.',
    ]
  },
  'Reservations': {
    title: 'Table Reservations',
    subtitle: 'Turn your menu into an automated booking engine.',
    benefits: [
      'Allow customers to book tables directly from their phones.',
      'Manage all reservations in a clean, calendar-based interface.',
      'Reduce no-shows and optimize your seating capacity.',
    ]
  },
  'Staff': {
    title: 'Staff Accounts',
    subtitle: 'Delegate safely and empower your team.',
    benefits: [
      'Invite managers and staff to help run your digital menu.',
      'Assign specific roles and permissions to protect sensitive data.',
      'Track who made changes and keep your operations secure.',
    ]
  }
}

export default function UpgradePage({ searchParams }: { searchParams: { feature?: string } }) {
  const featureKey = searchParams.feature || ''
  const pitch = FEATURE_PITCHES[featureKey] || {
    title: `Premium Features`,
    subtitle: 'Take your restaurant to the next level.',
    benefits: [
      'Unlock powerful tools designed to scale your business.',
      'Increase customer engagement and streamline operations.',
      'Get dedicated support and advanced customization.'
    ]
  }
  
  const devContact = process.env.NEXT_PUBLIC_DEVELOPER_CONTACT || 'your developer'

  return (
    <div className="flex min-h-[70vh] flex-col items-center justify-center p-4">
      <div className="w-full max-w-2xl text-center">
        
        <div className="relative mx-auto mb-6 flex w-fit">
          <div className="flex h-20 w-20 items-center justify-center rounded-2xl bg-amber-500/10 text-amber-500">
            <Lock className="h-10 w-10" />
          </div>
          <div className="absolute -bottom-2 -right-2 flex h-8 w-8 items-center justify-center rounded-full bg-white ring-4 ring-[#F7F8FA]">
            <Sparkles className="h-4 w-4 text-amber-500" />
          </div>
        </div>

        <h1 className="mb-3 text-3xl font-bold tracking-tight text-neutral-900 sm:text-4xl">
          Unlock {pitch.title}
        </h1>
        
        <p className="mx-auto mb-10 max-w-lg text-lg text-neutral-500">
          {pitch.subtitle}
        </p>

        <div className="mx-auto mb-10 max-w-md text-left">
          <div className="space-y-4">
            {pitch.benefits.map((benefit, i) => (
              <div key={i} className="flex items-start gap-3">
                <div className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-emerald-500/10 text-emerald-600">
                  <CheckCircle2 className="h-4 w-4" />
                </div>
                <span className="text-neutral-700">{benefit}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="mx-auto mb-8 w-full max-w-md overflow-hidden rounded-2xl border border-amber-200 bg-amber-50 shadow-sm">
          <div className="bg-amber-100/50 p-4 pb-3">
            <h3 className="flex items-center justify-center gap-2 text-sm font-semibold uppercase tracking-wider text-amber-800">
              <TrendingUp className="h-4 w-4" />
              Ready to Upgrade?
            </h3>
          </div>
          <div className="p-6">
            <p className="mb-5 text-sm text-amber-900/80">
              This powerful capability is reserved for upgraded plans. Contact your developer today to unlock this feature and supercharge your business.
            </p>
            <div className="flex flex-col items-center gap-2">
              <a 
                href={`tel:${devContact.replace(/[^0-9+]/g, '')}`}
                className="flex w-full items-center justify-center gap-2 rounded-lg bg-amber-500 px-4 py-3 font-semibold text-white transition-colors hover:bg-amber-600 shadow-sm"
              >
                <Phone className="h-5 w-5" />
                Call {devContact}
              </a>
              <span className="text-xs text-amber-700/60 mt-2">Tap to call instantly</span>
            </div>
          </div>
        </div>

        <Link href="/cms/dashboard">
          <Button variant="secondary" className="text-neutral-500">Return to Dashboard</Button>
        </Link>
      </div>
    </div>
  )
}
