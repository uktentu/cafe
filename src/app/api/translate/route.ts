

import { NextResponse } from 'next/server'

import { getConfig } from '@/lib/config'

export async function POST(req: Request) {
  if (!getConfig().features.bilingual) {
    return NextResponse.json({ error: 'Bilingual feature is not enabled for this tier' }, { status: 403 })
  }
  try {
    const { text, to } = await req.json()

    if (!text || !to) {
      return NextResponse.json({ error: 'Missing text or target language' }, { status: 400 })
    }

    // Edge compatible Google Translate fetch
    const url = `https://translate.googleapis.com/translate_a/single?client=gtx&sl=auto&tl=${to}&dt=t&q=${encodeURIComponent(text)}`
    
    const response = await fetch(url)
    const data = await response.json()
    
    // Google Translate returns an array where the first element is an array of translated sentences
    const translatedText = data[0].map((item: unknown[]) => item[0]).join('')
    
    return NextResponse.json({ translatedText })
  } catch (error) {
    console.error('Translation error:', error)
    return NextResponse.json({ error: 'Translation failed' }, { status: 500 })
  }
}

export const runtime = "edge";
