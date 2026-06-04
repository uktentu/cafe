/** @type {import('next').NextConfig} */

// Allow next/image to optimise images served from the R2 CDN domain.
const cdn = process.env.NEXT_PUBLIC_CDN_URL
let cdnHost
try {
  if (cdn) cdnHost = new URL(cdn).hostname
} catch {
  cdnHost = undefined
}

const remotePatterns = [
  // R2 public bucket dev domains
  { protocol: 'https', hostname: '*.r2.dev' },
  { protocol: 'https', hostname: '*.r2.cloudflarestorage.com' },
]
if (cdnHost) {
  remotePatterns.push({ protocol: 'https', hostname: cdnHost })
}

const nextConfig = {
  images: {
    remotePatterns,
    formats: ['image/webp'],
  },
  // sharp runs in the upload route (Node runtime); keep it external to the bundle.
  experimental: {
    serverComponentsExternalPackages: ['sharp'],
  },
}

export default nextConfig
