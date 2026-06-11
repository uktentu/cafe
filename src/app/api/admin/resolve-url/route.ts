import { NextResponse } from 'next/server'

export async function POST(req: Request) {
  try {
    const { url } = await req.json()
    if (!url || !url.includes('goo.gl')) {
      return NextResponse.json({ error: 'Invalid URL' }, { status: 400 })
    }
    // Follow the full redirect chain (goo.gl → maps.google.com → google.com/maps/place/...)
    let current: string = url
    for (let i = 0; i < 5; i++) {
      const res = await fetch(current, { redirect: 'manual', cache: 'no-store' })
      if (res.status >= 300 && res.status < 400) {
        const next = res.headers.get('location')
        if (!next) break
        current = next.startsWith('http') ? next : new URL(next, current).href
        if (current.includes('google.com/maps')) break
      } else {
        break
      }
    }
    return NextResponse.json({ expandedUrl: current })
  } catch {
    return NextResponse.json({ error: 'Failed' }, { status: 500 })
  }
}

export const runtime = 'edge'
