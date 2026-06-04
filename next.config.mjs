/** @type {import('next').NextConfig} */

// STATIC_EXPORT=1 → output: 'export' for GitHub Pages static demo.
// All other environments (dev, Cloudflare Pages) run as normal SSR.
const isStaticExport = process.env.STATIC_EXPORT === '1'

// Allow next/image to optimise images served from the R2 CDN domain.
const cdn = process.env.NEXT_PUBLIC_CDN_URL
let cdnHost
try {
  if (cdn) cdnHost = new URL(cdn).hostname
} catch {
  cdnHost = undefined
}

const remotePatterns = [
  { protocol: 'https', hostname: '*.r2.dev' },
  { protocol: 'https', hostname: '*.r2.cloudflarestorage.com' },
  { protocol: 'https', hostname: 'aawmpdrvzmysttqhhqkw.supabase.co' },
]
if (cdnHost) {
  remotePatterns.push({ protocol: 'https', hostname: cdnHost })
}

const nextConfig = {
  // Static export for GitHub Pages demo. Undefined = SSR (Cloudflare Pages / local dev).
  output: isStaticExport ? 'export' : undefined,
  // basePath: GitHub Pages needs /cafe (repo name); Cloudflare Pages serves at root.
  // NEXT_BASEPATH env var overrides; defaults to /cafe for static export.
  basePath: process.env.NEXT_BASEPATH !== undefined
    ? process.env.NEXT_BASEPATH
    : (isStaticExport ? '/cafe' : ''),
  // Static export requires unoptimized images (no image API).
  images: {
    unoptimized: isStaticExport,
    remotePatterns: isStaticExport ? remotePatterns : remotePatterns,
    formats: ['image/webp'],
  },
  // sharp runs in the upload route (Node runtime); keep it external to the bundle.
  experimental: {
    serverComponentsExternalPackages: ['sharp'],
  },
  // Trailing slashes make GitHub Pages work correctly (each page → folder/index.html).
  trailingSlash: isStaticExport,
}

export default nextConfig
