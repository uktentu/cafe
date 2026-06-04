export const runtime = 'edge'
// Authed CMS shell: dark sidebar + content. Lives in the (app) route group so
// /cms/login (outside it) stays shell-free. Resolves the business/role once and
// passes them to client components via CmsProviders.
//
// STATIC_EXPORT=1 (GitHub Pages demo): force-static so Next.js can export this
// as a shell — the CmsNotice renders "login required" without hitting Supabase.
import { CmsProviders } from '@/components/cms/Providers'
import { Sidebar, MobileTopbar } from '@/components/cms/Sidebar'
import { CmsNotice } from '@/components/cms/CmsNotice'
import { ToastViewport } from '@/components/ui/Toast'

// In static export mode we cannot hit cookies/auth, so force-static and skip
// auth resolution — the page renders as an unauthenticated shell.
export const dynamic =
  process.env.STATIC_EXPORT === '1' ? 'force-static' : 'force-dynamic'

export default async function CmsAppLayout({ children }: { children: React.ReactNode }) {
  // In static export there's no auth runtime, show the "login required" notice.
  if (process.env.STATIC_EXPORT === '1') {
    return <CmsNotice state="unauthed" />
  }

  // Dynamic (runtime) path — normal auth resolution.
  const { getCmsContext } = await import('@/lib/cms-context')
  const ctx = await getCmsContext()
  if (ctx.state !== 'ok') return <CmsNotice state={ctx.state} />

  return (
    <CmsProviders business={ctx.business} role={ctx.role}>
      <div className="min-h-[100svh] bg-[#F7F8FA]">
        <Sidebar businessName={ctx.business.name} userEmail={ctx.userEmail} />
        <MobileTopbar businessName={ctx.business.name} />
        <div className="md:pl-64">
          <main className="mx-auto max-w-5xl p-4 md:p-8">{children}</main>
        </div>
      </div>
      <ToastViewport />
    </CmsProviders>
  )
}
