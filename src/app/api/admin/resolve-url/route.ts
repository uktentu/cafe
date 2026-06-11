import { NextResponse } from 'next/server'

export async function POST(req: Request) {
  try {
    const { url } = await req.json()
    if (!url || !url.includes('goo.gl')) {
      return NextResponse.json({ error: 'Invalid URL' }, { status: 400 })
    }
    const res = await fetch(url, { redirect: 'manual', cache: 'no-store' })
    if (res.status >= 300 && res.status < 400) {
      return NextResponse.json({ expandedUrl: res.headers.get('location') })
    }
    return NextResponse.json({ error: 'No redirect found' }, { status: 404 })
  } catch (error) {
    return NextResponse.json({ error: 'Failed' }, { status: 500 })
  }
}
