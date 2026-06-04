/**
 * upload-stock.ts — one-time: process + upload the stock image library to R2.
 *
 * Usage:
 *   pnpm tsx scripts/upload-stock.ts [sourceDir]
 *
 * Source layout (default ./assets/stock):
 *   assets/stock/indian/biryani.jpg
 *   assets/stock/drinks/chai.png
 *   ...
 * Each <category>/<name>.<ext> becomes R2 key  stock/<category>/<name>.webp
 * (max 1200px wide, WebP q80) to match stock_images.r2_key in the DB seed.
 *
 * Requires in .env.local: R2_ACCOUNT_ID, R2_ACCESS_KEY_ID, R2_SECRET_ACCESS_KEY,
 * R2_BUCKET_NAME.
 */
import { readdirSync, statSync, readFileSync } from 'node:fs'
import { join, extname, basename } from 'node:path'
import { config as loadEnv } from 'dotenv'
import sharp from 'sharp'
import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3'

loadEnv({ path: '.env.local' })

const SOURCE = process.argv[2] ?? 'assets/stock'
const VALID_EXT = new Set(['.jpg', '.jpeg', '.png', '.webp', '.avif'])
const {
  R2_ACCOUNT_ID,
  R2_ACCESS_KEY_ID,
  R2_SECRET_ACCESS_KEY,
  R2_BUCKET_NAME = 'menuos-prod',
} = process.env

function requireEnv() {
  const missing = ['R2_ACCOUNT_ID', 'R2_ACCESS_KEY_ID', 'R2_SECRET_ACCESS_KEY'].filter(
    (k) => !process.env[k],
  )
  if (missing.length) {
    console.error(`✗ Missing env vars: ${missing.join(', ')}  (set them in .env.local)`)
    process.exit(1)
  }
}

const s3 = () =>
  new S3Client({
    region: 'auto',
    endpoint: `https://${R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
    credentials: {
      accessKeyId: R2_ACCESS_KEY_ID!,
      secretAccessKey: R2_SECRET_ACCESS_KEY!,
    },
  })

async function main() {
  let categories: string[]
  try {
    categories = readdirSync(SOURCE).filter((d) => statSync(join(SOURCE, d)).isDirectory())
  } catch {
    console.error(
      `✗ Source dir "${SOURCE}" not found.\n` +
        `  Create it with one subfolder per category (indian, chinese, continental,\n` +
        `  drinks, desserts, street, hero) and drop source images inside, then re-run.`,
    )
    process.exit(1)
  }
  if (categories.length === 0) {
    console.warn(`! No category subfolders in "${SOURCE}". Nothing to upload.`)
    return
  }

  requireEnv()
  const client = s3()
  let uploaded = 0

  for (const category of categories) {
    const dir = join(SOURCE, category)
    const files = readdirSync(dir).filter((f) => VALID_EXT.has(extname(f).toLowerCase()))
    for (const file of files) {
      const name = basename(file, extname(file))
      const key = `stock/${category}/${name}.webp`
      const webp = await sharp(readFileSync(join(dir, file)))
        .resize({ width: 1200, withoutEnlargement: true })
        .webp({ quality: 80 })
        .toBuffer()
      await client.send(
        new PutObjectCommand({
          Bucket: R2_BUCKET_NAME,
          Key: key,
          Body: webp,
          ContentType: 'image/webp',
          CacheControl: 'public, max-age=31536000, immutable',
        }),
      )
      uploaded++
      console.log(`  ✓ ${key}`)
    }
  }
  console.log(`\nDone. Uploaded ${uploaded} stock image(s) to bucket "${R2_BUCKET_NAME}".`)
  console.log(`Next: run supabase/seed/stock-images.sql so the CMS picker can list them.`)
}

main().catch((e) => {
  console.error(e)
  process.exit(1)
})
