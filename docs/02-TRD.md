# 02 — TRD: Technical Requirements Document

---

## Frontend

| Concern | Choice | Version |
|---------|--------|---------|
| Framework | **Next.js** (App Router, TypeScript) | 14.x |
| Styling | **Tailwind CSS** + CSS Custom Properties | 3.x |
| State (CMS) | **Zustand** | 4.x |
| Data (CMS) | **TanStack Query** | 5.x |
| Forms | **React Hook Form** + **Zod** | 7.x / 3.x |
| Icons | **Lucide React** | latest |
| Charts | **Recharts** | latest |
| PDF | **jsPDF** + **html2canvas** | latest |
| QR codes | **qr-code-styling** | latest |
| Package manager | **pnpm** | 9.x |

### Animation Libraries (tier-gated, dynamically imported)

```
Basic tier:    Framer Motion 11 + CSS Scroll-driven Animations (native browser API)
Advanced tier: + GSAP 3 (ScrollTrigger) + Lenis 1
Premium tier:  + GSAP CustomEase (CSS tactile textures via SVG noise filter)
```

**CSS Scroll-driven Animations** are zero-JS cost native browser animations (Chrome 115+,
Firefox 110+, Safari 16+). Used in Basic tier so the bundle stays < 120KB gzipped.
GSAP and Lenis are always dynamically imported — never in the Basic bundle.

---

## Backend / Runtime

| Concern | Choice | Notes |
|---------|--------|-------|
| API routes | **Next.js Route Handlers** | Edge runtime on Cloudflare |
| Image processing (upload) | **sharp** (npm) | Runs in API route, converts to WebP, generates thumbnail |
| Email | **Brevo** (REST API) | 9,000 emails/month free |
| Analytics | **Firebase Analytics (GA4)** | Unlimited events, no card |
| Keep-alive | **GitHub Actions** cron | Prevents Supabase 7-day pause |

---

## Database

**Supabase — ONE shared project for ALL clients.**

Multi-tenant via `business_id` column on every table + RLS policies.
At 500+ clients, per-client Supabase projects hit the 2-project free tier limit immediately.

### Why shared project scales

| Concern | Solution |
|---------|---------|
| Tenant isolation | `business_id` on every row + RLS `is_staff_of(bid)` function |
| Query performance | Composite indexes `(business_id, is_available)`, `(business_id, sort_order)` |
| Connection limits | Supabase pooler on port 6543 (transaction mode, handles 10K+ concurrent) |
| Pause prevention | GitHub Actions cron pings every 5 days |
| DB size | 500MB free → upgrade to Pro ($25/mo) at ~400+ active clients |

### Scaling thresholds

| Metric | Free tier limit | Action |
|--------|----------------|--------|
| DB storage | 500MB | Upgrade Supabase Pro ($25/mo) at ~80% |
| Bandwidth | 5GB/month | Covered by Cloudflare CDN caching |
| Requests | 500K/month | Covered by ISR caching |
| Auth MAUs | 50K/month | Well above what we need |

---

## Storage — Cloudflare R2

**Why R2 over Cloudinary at scale:**

| | Cloudinary (free) | Cloudflare R2 (free tier) |
|--|--|--|
| Storage | 25GB | 10GB |
| Bandwidth/month | 25GB | **Zero egress fees (always)** |
| Card required | ❌ No | ✅ Yes (one-time developer account) |
| At 50M requests/month | Expensive | **Still ₹0** |
| Image optimization | Built-in | Must process on upload (sharp) |

At 500 restaurants × 20 images × 50,000 visitors/day:
- Cloudinary: would exhaust 25GB bandwidth in days, then costly overages
- R2: **₹0 egress forever**, regardless of request volume

Credit card requirement is a one-time setup for the developer's Cloudflare account.
Not per client. Pay once, serve all clients at zero marginal cost forever.

### R2 Image Architecture

```
Bucket: menuos-prod (public)
Folder structure:
  /stock/indian/{name}.webp      ← curated stock images, pre-converted
  /stock/chinese/{name}.webp
  /stock/continental/{name}.webp
  /stock/drinks/{name}.webp
  /stock/desserts/{name}.webp
  /stock/street/{name}.webp
  /stock/hero/{name}.webp        ← restaurant cover/hero stock images
  /clients/{slug}/logo.webp
  /clients/{slug}/cover.webp
  /clients/{slug}/items/{id}/full.webp    ← processed on upload
  /clients/{slug}/items/{id}/thumb.webp   ← 320px thumbnail

Public URL: https://cdn.yourdomain.in/{key}
  (custom domain CNAME → r2 public bucket domain)
```

### Image processing pipeline (on upload)
```typescript
// /src/app/api/upload/route.ts — runs on Cloudflare Workers (edge)
import sharp from 'sharp'
// 1. Receive file buffer
// 2. sharp: resize max 1200px wide, convert to WebP, quality 80
// 3. sharp: thumbnail 320px wide, WebP, quality 70
// 4. Upload both to R2 via S3-compatible API (@aws-sdk/client-s3)
// 5. Return { full_url, thumb_url, r2_key }
// Store r2_key in DB (not URL — derive URL at runtime)
```

---

## Authentication

**Supabase Auth** — email + password. Session via cookies (httpOnly).
- Browser client: `@supabase/ssr` `createBrowserClient`
- Server client: `@supabase/ssr` `createServerClient` with cookie jar
- Middleware: `/src/middleware.ts` protects all `/cms/*` routes

Owner accounts created by developer during setup (Supabase Admin API).
Staff accounts created by owner in CMS (limited by tier).

---

## Hosting

**Cloudflare Pages** — unlimited bandwidth, commercial use allowed, no card required.

```
Build command: pnpm build (via @cloudflare/next-on-pages)
Output:        .vercel/output/static
Node version:  20
```

One Cloudflare Pages project per client. Same repo, different env vars.
Per-client custom subdomain: `clientname.yourdomain.in` (CNAME → project.pages.dev)

---

## Third-Party APIs

| Service | What for | Free limit | Card? |
|---------|---------|------------|-------|
| Supabase | DB + Auth | 500MB, 50K MAU | No |
| Cloudflare R2 | Image storage | 10GB, zero egress | Yes (developer once) |
| Cloudflare Pages | Hosting | Unlimited BW | No |
| Brevo | Email | 9,000/month | No |
| Firebase GA4 | Analytics | Unlimited | No |
| GitHub Actions | Cron (keep-alive) | Free | No |

---

## Key Libraries — Full List

```json
{
  "dependencies": {
    "next": "14.x",
    "react": "18.x",
    "typescript": "5.x",
    "tailwindcss": "3.x",
    "framer-motion": "11.x",
    "gsap": "3.x",
    "lenis": "1.x",
    "zustand": "4.x",
    "@tanstack/react-query": "5.x",
    "react-hook-form": "7.x",
    "zod": "3.x",
    "lucide-react": "latest",
    "recharts": "latest",
    "@supabase/supabase-js": "2.x",
    "@supabase/ssr": "latest",
    "@aws-sdk/client-s3": "latest",
    "@aws-sdk/s3-request-presigner": "latest",
    "sharp": "0.33.x",
    "qr-code-styling": "latest",
    "jspdf": "latest",
    "html2canvas": "latest",
    "@dnd-kit/core": "latest",
    "@dnd-kit/sortable": "latest",
    "@formkit/auto-animate": "latest",
    "clsx": "latest",
    "tailwind-merge": "latest"
  }
}
```

---

## Environment Variables — Complete Reference

### All limits are env-configurable. No hardcoded numbers in code.

```bash
# ── Client identity ─────────────────────────────────────────────────
NEXT_PUBLIC_CLIENT_SLUG=taj-cafe
# Must match businesses.slug in Supabase. Used to identify which tenant's data to load.

NEXT_PUBLIC_SITE_URL=https://taj-cafe.yourdomain.in

# ── Tier ────────────────────────────────────────────────────────────
NEXT_PUBLIC_TIER=advanced
# Values: basic | advanced | premium

# ── Tier limits — ENV OVERRIDES TIER DEFAULTS ───────────────────────
# Change these per-client without touching code. Deployed via Cloudflare env vars.
# Example: give a Basic client 80 items → NEXT_PUBLIC_MAX_ITEMS=80 (no tier change)
NEXT_PUBLIC_MAX_ITEMS=100           # basic default: 30, advanced: 100, premium: 9999
NEXT_PUBLIC_MAX_CATEGORIES=99       # basic: 3, advanced: 99, premium: 99
NEXT_PUBLIC_MAX_QR_CODES=5          # basic: 1, advanced: 5, premium: 99
NEXT_PUBLIC_MAX_STAFF=2             # basic: 1, advanced: 2, premium: 5
NEXT_PUBLIC_MAX_BRANCHES=1          # basic: 1, advanced: 1, premium: 3
NEXT_PUBLIC_MAX_PHOTOS_PER_ITEM=3   # basic: 1, advanced: 3, premium: 9
NEXT_PUBLIC_MAX_BANNERS=5           # basic: 0, advanced: 5, premium: 20

# ── Supabase (SHARED project — SAME for ALL clients) ────────────────
NEXT_PUBLIC_SUPABASE_URL=https://xyzxyz.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbG...
SUPABASE_SERVICE_ROLE_KEY=eyJhbG...
# Service role: server-side ONLY. Never in 'use client' files.

# ── Cloudflare R2 ───────────────────────────────────────────────────
R2_ACCOUNT_ID=
R2_ACCESS_KEY_ID=
R2_SECRET_ACCESS_KEY=
R2_BUCKET_NAME=menuos-prod
NEXT_PUBLIC_CDN_URL=https://cdn.yourdomain.in
# Custom domain CNAME pointing to R2 public bucket domain.
# Images served as: ${CDN_URL}/clients/{slug}/items/{id}/full.webp

# ── Client contact ──────────────────────────────────────────────────
NEXT_PUBLIC_WHATSAPP=919876543210   # country code + number, no spaces or +
NEXT_PUBLIC_PHONE=+91-98765-43210

# ── Email (Brevo) ───────────────────────────────────────────────────
BREVO_API_KEY=xkeysib-...
OWNER_EMAIL=owner@tajcafe.com

# ── Analytics (Firebase GA4) ────────────────────────────────────────
NEXT_PUBLIC_FIREBASE_API_KEY=
NEXT_PUBLIC_FIREBASE_PROJECT_ID=menuos-analytics
NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID=G-XXXXXXXXXX
# Each client gets their own Measurement ID from Firebase console.
# One shared Firebase project, multiple Web Apps (one per client).

# ── Feature toggles (Premium only — default false) ──────────────────
NEXT_PUBLIC_RESERVATIONS=false
NEXT_PUBLIC_MULTI_BRANCH=false
NEXT_PUBLIC_BILINGUAL=false
NEXT_PUBLIC_SECONDARY_LOCALE=hi   # hi | mr | ta | te | kn | bn | gu

# ── Template ────────────────────────────────────────────────────────
NEXT_PUBLIC_THEME=mercado
# Values: mercado | provenance | terrain (basic)
#         bazaar | nocturne | coastal (advanced)
#         aether | onyx | studio (premium)
```

---

## Folder Structure

```
menuos/
├── CLAUDE.md
├── PROMPT.md
├── docs/
│   ├── 01-PRD.md
│   ├── 02-TRD.md
│   ├── 03-APP-FLOW.md
│   ├── 04-UI-UX-BRIEF.md
│   ├── 05-BACKEND-SCHEMA.md
│   └── 06-IMPLEMENTATION-PLAN.md
├── .github/workflows/keepalive.yml
├── supabase/
│   ├── migrations/
│   │   ├── 001_core.sql
│   │   ├── 002_rls.sql
│   │   ├── 003_advanced.sql
│   │   └── 004_premium.sql
│   └── seed/
│       ├── demo.sql          ← demo business + items
│       └── stock-images.sql  ← stock image library metadata
├── scripts/
│   ├── setup-client.ts       ← interactive CLI: new client → Supabase row + auth + seed
│   └── upload-stock.ts       ← one-time: upload stock images to R2
├── src/
│   ├── app/
│   │   ├── (menu)/           ← public QR menu (SSG + ISR revalidate:30)
│   │   │   ├── layout.tsx
│   │   │   └── page.tsx
│   │   ├── (cms)/cms/        ← admin CMS (SSR, Supabase auth-gated)
│   │   │   ├── layout.tsx
│   │   │   ├── dashboard/page.tsx
│   │   │   ├── items/
│   │   │   ├── categories/
│   │   │   ├── qr-codes/
│   │   │   ├── settings/
│   │   │   ├── analytics/     ← Advanced+ (locked state for Basic)
│   │   │   ├── banners/       ← Advanced+
│   │   │   ├── menus/         ← Advanced+
│   │   │   ├── reservations/  ← Premium
│   │   │   ├── branches/      ← Premium
│   │   │   └── staff/
│   │   └── api/
│   │       ├── upload/route.ts          ← image upload → sharp → R2
│   │       ├── items/[id]/avail/route.ts ← sold-out toggle + revalidate
│   │       ├── reservations/route.ts
│   │       └── qr/[id]/route.ts         ← dynamic QR redirect
│   ├── components/
│   │   ├── menu/
│   │   │   ├── SplashScreen.tsx         ← per-theme splash (9 variants)
│   │   │   ├── MenuHero.tsx
│   │   │   ├── CategoryNav.tsx          ← pills | sections | text per theme
│   │   │   ├── ItemGrid.tsx             ← mobile: 1-col | tablet: 2-col
│   │   │   ├── ItemCard.tsx             ← 3 image modes: none/stock/custom
│   │   │   ├── ItemModal.tsx            ← spring bottom-sheet (all) / center (Onyx)
│   │   │   ├── WhatsAppCTA.tsx          ← fixed, permanent pulse ring
│   │   │   ├── BestsellerStrip.tsx      ← featured items carousel
│   │   │   ├── PromoBanner.tsx          ← Advanced+
│   │   │   ├── FeastTransition.tsx      ← Bazaar theme only (GSAP color sweep)
│   │   │   └── ReservationForm.tsx      ← Premium
│   │   ├── motion/
│   │   │   ├── FadeUp.tsx
│   │   │   ├── StaggerList.tsx
│   │   │   ├── SpringModal.tsx
│   │   │   └── AnimatedNumber.tsx
│   │   ├── cms/
│   │   │   ├── Sidebar.tsx             ← shows locked state for gated features
│   │   │   ├── ItemForm.tsx
│   │   │   ├── StockImagePicker.tsx    ← browse + select stock images
│   │   │   ├── ImageUpload.tsx         ← upload custom photo
│   │   │   └── QRGenerator.tsx
│   │   └── ui/                          ← Button, Input, Badge, Toast, Modal
│   ├── lib/
│   │   ├── config.ts                    ← getConfig() — all limits + feature flags
│   │   ├── design-tokens.ts             ← CSS vars per theme
│   │   ├── supabase/
│   │   │   ├── client.ts                ← browser client
│   │   │   └── server.ts                ← server/edge client
│   │   ├── r2.ts                        ← upload + delete + presigned URL
│   │   ├── brevo.ts
│   │   └── firebase.ts
│   ├── stores/
│   │   └── cms.ts                       ← Zustand: activeBranch, isDragging, etc.
│   └── types/
│       └── database.ts
├── .env.template                         ← commit this, all vars with comments
├── .env.local                            ← never commit
└── package.json
```

---

## Technical Constraints

1. **No WebGL.** Reference sites (Timeless, Rabenrifaie) use WebGL. We translate their AESTHETIC to CSS/GSAP. Mobile performance is non-negotiable. CSS transforms, clip-path animations, SVG noise filters achieve the same feel at zero GPU cost.

2. **No SSR for menu pages.** Menu pages are SSG (static) + ISR (revalidate: 30s). This means 50,000 visitors/day hit Cloudflare's CDN cache, not Supabase. DB only queried once per 30 seconds per menu page.

3. **GSAP/Lenis always dynamically imported.** Never bundled into Basic tier. Checked via `getConfig().motion.gsap` before import.

4. **sharp runs server-side only** (API route / edge function). Never client-side. Image processing happens once on upload, not on every request.

5. **Supabase pooler for connections.** Use port 6543 (transaction mode) for API routes. Direct connection (port 5432) only for migrations and scripts.

6. **Every mutation calls `revalidatePath`.** ISR only revalidates when we tell it to. A price change must call `revalidatePath('/')` or it takes up to 30s + next deployment.

7. **R2 keys in DB, not URLs.** Derive full CDN URL at runtime: `${NEXT_PUBLIC_CDN_URL}/{r2_key}`. If CDN domain changes, update one env var — no DB migration needed.
