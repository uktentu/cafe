// Full-screen notice for non-OK CMS states (server component).
import Link from 'next/link'

const COPY: Record<string, { title: string; body: React.ReactNode; cta?: { href: string; label: string } }> = {
  unconfigured: {
    title: 'Supabase not configured',
    body: (
      <>
        Add <code>NEXT_PUBLIC_SUPABASE_URL</code>, <code>NEXT_PUBLIC_SUPABASE_ANON_KEY</code> and{' '}
        <code>SUPABASE_SERVICE_ROLE_KEY</code> to <code>.env.local</code>, then reload.
      </>
    ),
  },
  unauthed: {
    title: 'Please sign in',
    body: 'Your session has expired or you are not signed in.',
    cta: { href: '/cms/login', label: 'Go to login' },
  },
  'no-business': {
    title: 'Business not found',
    body: 'No business matches this deployment’s slug. Run the setup script to create it.',
  },
  forbidden: {
    title: 'No access',
    body: 'Your account is not staff of this restaurant. Ask the owner for an invite.',
    cta: { href: '/cms/login?clear=1', label: 'Switch account' },
  },
}

export function CmsNotice({ state }: { state: string }) {
  const c = COPY[state] ?? COPY.unconfigured
  return (
    <main className="flex min-h-[100svh] items-center justify-center bg-[#F7F8FA] px-4">
      <div className="w-full max-w-md rounded-2xl bg-white p-7 text-center shadow-sm ring-1 ring-black/5">
        <h1 className="text-lg font-semibold text-[#1A1917]">{c.title}</h1>
        <p className="mt-2 text-sm leading-relaxed text-neutral-500">{c.body}</p>
        {c.cta && (
          <Link
            href={c.cta.href}
            className="mt-5 inline-flex h-[42px] items-center justify-center rounded-lg bg-amber-500 px-5 text-sm font-medium text-white"
          >
            {c.cta.label}
          </Link>
        )}
      </div>
    </main>
  )
}
