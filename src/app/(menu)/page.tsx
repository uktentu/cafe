// Public QR menu — SSG + ISR (revalidate: 30). Statically generated and served
// from the Cloudflare edge cache, so 50K visitors/day cost ~0 DB reads; a CMS
// save calls revalidatePath('/') to push changes live within 30s.
import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { getConfig } from '@/lib/config'
import { getMenuData } from '@/lib/menu-data'
import { cdnUrl } from '@/types/database'
import { MenuLayoutClient } from '@/components/menu/MenuLayoutClient'

export const dynamic = process.env.STATIC_EXPORT === '1' ? 'force-static' : 'auto'
export const revalidate = 3600

export async function generateMetadata(): Promise<Metadata> {
  const { slug, siteUrl, features } = getConfig()
  const data = await getMenuData(slug)
  if (!data) return { title: 'Menu' }
  const { business } = data
  const hasSeo = features.seo
  const title = (hasSeo && business.seo_title) || `${business.name}${business.tagline ? ` · ${business.tagline}` : ''}`
  const description = (hasSeo && business.seo_description) || business.tagline || `View the menu for ${business.name}.`
  const ogImage = (hasSeo && cdnUrl(business.seo_og_r2_key)) || cdnUrl(business.cover_r2_key)

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

import { resolveTheme } from '@/lib/design-tokens'

export default async function MenuPage() {
  const { slug, theme: envTheme, tier } = getConfig()
  const data = await getMenuData(slug)
  if (!data?.business) notFound()
  const theme = resolveTheme(tier, data.business.theme ?? envTheme)

  const { business, categories, items, translations, banners, branches, menus, demo } = data

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
      />
    </>
  )
}



export const runtime = "edge";
