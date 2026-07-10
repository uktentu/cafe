// Public QR menu.
//   • Cloudflare/live  → dynamically edge-rendered each request (fresh Supabase
//     read) and cached at the CDN for 30s via Cache-Control: s-maxage=30. This is
//     what makes CMS edits go live within 30s — Cloudflare's next-on-pages does
//     NOT run Next ISR / revalidatePath, so a force-static menu would freeze at
//     build time.
//   • STATIC_EXPORT=1 → force-static for the GitHub Pages demo (no server).
import type { Metadata } from 'next'
import { getConfig } from '@/lib/config'
import { getMenuData } from '@/lib/menu-data'
import { cdnUrl } from '@/types/database'
import { MenuLayoutClient } from '@/components/menu/MenuLayoutClient'

export const dynamic = process.env.STATIC_EXPORT === '1' ? 'force-static' : 'force-dynamic'

export async function generateMetadata(): Promise<Metadata> {
  const { slug, siteUrl, features } = getConfig()
  const data = await getMenuData(slug)
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  if ((data as any)?._error || !data?.business) return { title: 'Menu' }
  const { business } = data
  const hasSeo = features.seo
  const title = (hasSeo && business.seo_title) || `${business.name}${business.tagline ? ` · ${business.tagline}` : ''}`
  const description = (hasSeo && business.seo_description) || business.tagline || `View the menu for ${business.name}.`
  const ogImage = (hasSeo && cdnUrl(business.seo_og_r2_key)) || cdnUrl(business.cover_r2_key)

  return {
    title,
    description,
    metadataBase: (() => {
      if (!siteUrl) return undefined
      try {
        return new URL(siteUrl.startsWith('http') ? siteUrl : `https://${siteUrl}`)
      } catch {
        return undefined
      }
    })(),
    openGraph: {
      title,
      description,
      type: 'website',
      images: ogImage ? [{ url: ogImage }] : undefined,
    },
  }
}

import { resolveTheme } from '@/lib/design-tokens'
import { notFound } from 'next/navigation'
import { resolveTableByToken } from '@/lib/order-data'

export default async function MenuPage({ searchParams }: { searchParams?: { t?: string } }) {
  const { slug, theme: envTheme, tier, features } = getConfig()

  const data = await getMenuData(slug)
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  if ((data as any)?._error || !data?.business) notFound()
  const theme = resolveTheme(tier, data.business.theme ?? envTheme)

  const { business, categories, items, translations, banners, branches, menus, demo } = data

  // POS self-order: a QR scan carries the table's secret token. Resolve it
  // server-side (the token is column-revoked from anon), then the customer
  // orders in-app from THIS themed menu — no separate page, no leaving the
  // brand experience. Invalid/absent token → normal display menu.
  const posTableRow =
    features.selfOrder && searchParams?.t ? await resolveTableByToken(business.id, searchParams.t) : null
  const posTable = posTableRow?.qr_token
    ? { token: posTableRow.qr_token, label: posTableRow.label }
    : null

  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Restaurant',
    name: business.name,
    image: cdnUrl(business.cover_r2_key) || cdnUrl(business.logo_r2_key),
    description: business.seo_description || business.tagline,
    address: {
      '@type': 'PostalAddress',
      streetAddress: business.address,
      addressLocality: business.city,
    },
    telephone: business.phone,
    url: getConfig().siteUrl,
    menu: getConfig().siteUrl,
    servesCuisine: business.tagline,
  }

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <MenuLayoutClient
        business={business}
        categories={categories}
        items={items}
        translations={translations}
        banners={banners}
        branches={branches}
        menus={menus}
        initialTheme={theme}
        isDemo={demo}
        selfOrderEnabled={features.selfOrder}
        posTable={posTable}
      />
    </>
  )
}



export const runtime = "edge";
