// Public QR menu — SSG + ISR (revalidate: 30). Statically generated and served
// from the Cloudflare edge cache, so 50K visitors/day cost ~0 DB reads; a CMS
// save calls revalidatePath('/') to push changes live within 30s.
import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { getConfig } from '@/lib/config'
import { THEMES } from '@/lib/design-tokens'
import { getMenuData } from '@/lib/menu-data'
import { cdnUrl } from '@/types/database'
import { SplashScreen } from '@/components/menu/SplashScreen'
import { MenuHero } from '@/components/menu/MenuHero'
import { BestsellerStrip } from '@/components/menu/BestsellerStrip'
import { MenuContent } from '@/components/menu/MenuContent'
import { WhatsAppCTA } from '@/components/menu/WhatsAppCTA'
import { DeferredItemModal } from '@/components/menu/DeferredItemModal'

export const revalidate = 30

export async function generateMetadata(): Promise<Metadata> {
  const { slug, siteUrl } = getConfig()
  const data = await getMenuData(slug)
  if (!data) return { title: 'Menu' }
  const { business } = data
  const title = business.seo_title || `${business.name}${business.tagline ? ` · ${business.tagline}` : ''}`
  const description = business.seo_description || business.tagline || `View the menu for ${business.name}.`
  const ogImage = cdnUrl(business.seo_og_r2_key) || cdnUrl(business.cover_r2_key)

  return {
    title,
    description,
    metadataBase: siteUrl ? new URL(siteUrl) : undefined,
    openGraph: {
      title,
      description,
      type: 'website',
      images: ogImage ? [{ url: ogImage }] : undefined,
    },
  }
}

export default async function MenuPage() {
  const { slug, theme: envTheme } = getConfig()
  const data = await getMenuData(slug)
  if (!data?.business) notFound()
  const theme = data.business.theme ?? envTheme
  const themeMeta = THEMES[theme] ?? THEMES.mercado
  const splashMs = themeMeta.splashMs

  const { business, categories, items } = data

  return (
    <>
      <SplashScreen name={business.name} splashMs={splashMs} theme={theme} />

      <a
        href="#menu"
        className="sr-only focus:not-sr-only focus:absolute focus:left-3 focus:top-3 focus:z-[110] focus:rounded focus:bg-white focus:px-3 focus:py-2 focus:text-sm focus:text-black"
      >
        Skip to menu
      </a>

      <MenuHero business={business} theme={theme} />

      <BestsellerStrip items={items} categories={categories} theme={theme} />

      <MenuContent categories={categories} items={items} businessId={business.id} theme={theme} />

      <WhatsAppCTA
        whatsapp={business.whatsapp ?? ''}
        businessId={business.id}
        businessName={business.name}
      />
      <DeferredItemModal businessName={business.name} whatsapp={business.whatsapp ?? ''} theme={theme} />
    </>
  )
}
