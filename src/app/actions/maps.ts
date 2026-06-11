'use server'

export async function resolveGoogleMapsShortlink(url: string): Promise<string | null> {
  if (!url.includes('goo.gl')) return null
  try {
    // Next.js fetch with manual redirect allows us to read the Location header
    const res = await fetch(url, { redirect: 'manual', cache: 'no-store' })
    if (res.status >= 300 && res.status < 400) {
      return res.headers.get('location')
    }
  } catch (e) {
    console.error('Failed to resolve map shortlink:', e)
  }
  return null
}
