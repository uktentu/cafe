// ════════════════════════════════════════════════════════════════════
// r2.ts — Cloudflare R2 (S3-compatible) helpers. SERVER-ONLY.
// We store R2 keys in the DB; URLs are derived at runtime via cdnUrl().
// R2 has zero egress fees, so it scales to 50M image requests/month at ₹0.
// ════════════════════════════════════════════════════════════════════
import 'server-only'
import { S3Client, PutObjectCommand, DeleteObjectCommand } from '@aws-sdk/client-s3'
import { getSignedUrl } from '@aws-sdk/s3-request-presigner'

const BUCKET = process.env.R2_BUCKET_NAME ?? 'menuos-prod'

let _client: S3Client | null = null
function client(): S3Client {
  if (_client) return _client
  _client = new S3Client({
    region: 'auto',
    endpoint: `https://${process.env.R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
    credentials: {
      accessKeyId: process.env.R2_ACCESS_KEY_ID!,
      secretAccessKey: process.env.R2_SECRET_ACCESS_KEY!,
    },
  })
  return _client
}

const IMMUTABLE = 'public, max-age=31536000, immutable'

/** Upload a buffer to R2. Returns the key (store this in the DB, not a URL). */
export async function uploadToR2(
  key: string,
  body: Buffer | Uint8Array,
  contentType = 'image/webp',
): Promise<string> {
  await client().send(
    new PutObjectCommand({
      Bucket: BUCKET,
      Key: key,
      Body: body,
      ContentType: contentType,
      CacheControl: IMMUTABLE,
    }),
  )
  return key
}

/** Delete an object by key. No-op-safe if it doesn't exist. */
export async function deleteFromR2(key: string): Promise<void> {
  await client().send(new DeleteObjectCommand({ Bucket: BUCKET, Key: key }))
}

/** Presigned PUT URL (for future direct browser→R2 uploads). */
export async function presignUpload(
  key: string,
  contentType = 'image/webp',
  expiresIn = 600,
): Promise<string> {
  return getSignedUrl(
    client(),
    new PutObjectCommand({ Bucket: BUCKET, Key: key, ContentType: contentType }),
    { expiresIn },
  )
}

/** Canonical R2 key builders — keep the convention in one place. */
export const r2keys = {
  itemFull: (slug: string, itemId: string) => `clients/${slug}/items/${itemId}/full.webp`,
  itemThumb: (slug: string, itemId: string) => `clients/${slug}/items/${itemId}/thumb.webp`,
  logo: (slug: string) => `clients/${slug}/logo.webp`,
  cover: (slug: string) => `clients/${slug}/cover.webp`,
  banner: (slug: string, id: string) => `clients/${slug}/banners/${id}.webp`,
  ogImage: (slug: string) => `clients/${slug}/og.webp`,
}
