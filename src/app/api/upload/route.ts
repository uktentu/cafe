// ════════════════════════════════════════════════════════════════════
// POST /api/upload — process an uploaded image with sharp and store on R2.
// Auth required (must be signed-in staff). Returns R2 KEYS (never URLs).
// sharp is Node-only → this route runs on the Node runtime.
// ════════════════════════════════════════════════════════════════════
import { NextResponse } from 'next/server'
import sharp from 'sharp'
import { createClient } from '@/lib/supabase/server'
import { uploadToR2, r2keys } from '@/lib/r2'
import { getConfig } from '@/lib/config'
import { supabaseConfigured } from '@/lib/env'

export const runtime = 'nodejs'
export const maxDuration = 30

type UploadType = 'item' | 'logo' | 'cover' | 'banner' | 'og'
const VALID_TYPES: UploadType[] = ['item', 'logo', 'cover', 'banner', 'og']
const MAX_BYTES = 10 * 1024 * 1024 // 10MB raw upload cap

export async function POST(request: Request) {
  if (!supabaseConfigured()) {
    return NextResponse.json({ error: 'Supabase not configured' }, { status: 503 })
  }
  // 1. Auth — only signed-in staff can upload.
  const supabase = createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  // 2. Parse multipart form.
  let form: FormData
  try {
    form = await request.formData()
  } catch {
    return NextResponse.json({ error: 'Invalid form data' }, { status: 400 })
  }

  const file = form.get('file')
  const type = String(form.get('type') ?? 'item') as UploadType
  const id = form.get('id') ? String(form.get('id')) : ''

  if (!(file instanceof File)) {
    return NextResponse.json({ error: 'No file provided' }, { status: 400 })
  }
  if (!VALID_TYPES.includes(type)) {
    return NextResponse.json({ error: `Invalid type "${type}"` }, { status: 400 })
  }
  if (file.size > MAX_BYTES) {
    return NextResponse.json({ error: 'File too large (max 10MB)' }, { status: 413 })
  }
  if ((type === 'item' || type === 'banner') && !id) {
    return NextResponse.json({ error: `"${type}" upload requires an id` }, { status: 400 })
  }

  const slug = getConfig().slug
  const input = Buffer.from(await file.arrayBuffer())

  // 3. Process with sharp. HEIC/JPEG/PNG → WebP. Strip metadata, no enlarge.
  let full: Buffer
  try {
    full = await sharp(input)
      .rotate() // honour EXIF orientation (iPhone photos)
      .resize({ width: 1200, withoutEnlargement: true })
      .webp({ quality: 80 })
      .toBuffer()
  } catch {
    return NextResponse.json({ error: 'Unsupported or corrupt image' }, { status: 422 })
  }

  // 4. Upload to R2 under the canonical key convention.
  try {
    if (type === 'item') {
      const thumb = await sharp(input)
        .rotate()
        .resize({ width: 320, withoutEnlargement: true })
        .webp({ quality: 70 })
        .toBuffer()
      const fullKey = r2keys.itemFull(slug, id)
      const thumbKey = r2keys.itemThumb(slug, id)
      await Promise.all([uploadToR2(fullKey, full), uploadToR2(thumbKey, thumb)])
      return NextResponse.json({
        image_mode: 'custom',
        custom_r2_key: fullKey,
        custom_thumb_key: thumbKey,
      })
    }

    const key =
      type === 'logo' ? r2keys.logo(slug)
      : type === 'cover' ? r2keys.cover(slug)
      : type === 'og' ? r2keys.ogImage(slug)
      : r2keys.banner(slug, id)
    await uploadToR2(key, full)
    return NextResponse.json({ r2_key: key })
  } catch (e) {
    return NextResponse.json(
      { error: 'Storage upload failed', detail: (e as Error).message },
      { status: 502 },
    )
  }
}
