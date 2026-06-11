const fs = require('fs')
const path = '.vercel/output/static/_routes.json'

// Cloudflare's _routes.json caps total rules at 100. This project ships ~148
// static assets, so next-on-pages' default ("include /*, exclude every asset")
// would blow that limit. We invert it: include ONLY the dynamic routes that must
// run the Worker, and serve everything else (static assets) directly from the CDN.
//
// CRITICAL: the public menu ("/") and "/loyalty" are dynamic edge functions now
// (they read fresh data from Supabase). They MUST be in `include`, or Cloudflare
// serves a stale/half-rendered static shell — broken CSS + no live CMS changes.
const INCLUDE = [
  '/',          // public menu — dynamic, fresh per request
  '/loyalty',   // loyalty card — dynamic
  '/cms',
  '/cms/*',
  '/api/*',
]

try {
  const data = JSON.parse(fs.readFileSync(path, 'utf8'))
  data.include = INCLUDE
  data.exclude = []
  fs.writeFileSync(path, JSON.stringify(data, null, 2))
  console.log('Patched _routes.json — Worker handles:', INCLUDE.join(', '))
} catch (err) {
  console.error('Failed to patch _routes.json:', err.message)
}
