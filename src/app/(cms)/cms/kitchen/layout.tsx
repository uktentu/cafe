// Kitchen Display (KOT) shell — deliberately outside the (app) route group so
// it skips the standard Sidebar/topbar entirely: a kitchen tablet needs a
// full-bleed, high-contrast board, not the owner's CMS chrome.
import { CmsProviders } from '@/components/cms/Providers'
import { CmsNotice } from '@/components/cms/CmsNotice'
import { ToastViewport } from '@/components/ui/Toast'
import { getConfig } from '@/lib/config'

export const dynamic = process.env.STATIC_EXPORT === '1' ? 'force-static' : 'force-dynamic'

export default async function KitchenLayout({ children }: { children: React.ReactNode }) {
  if (process.env.STATIC_EXPORT === '1') {
    return <CmsNotice state="unauthed" />
  }

  const { getCmsContext } = await import('@/lib/cms-context')
  const ctx = await getCmsContext()
  if (ctx.state !== 'ok') return <CmsNotice state={ctx.state} />

  if (!getConfig().features.kotDisplay) {
    return (
      <div className="flex min-h-[100svh] items-center justify-center bg-[#0A0A0A] p-6 text-center">
        <p className="text-neutral-400">Kitchen Display is part of the POS add-on and is not enabled for this business.</p>
      </div>
    )
  }

  return (
    <CmsProviders business={ctx.business} role={ctx.role}>
      {children}
      <ToastViewport />
    </CmsProviders>
  )
}
