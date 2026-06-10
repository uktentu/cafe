# 06 — Implementation Plan

---

## Build Philosophy

**Speed and quality, not shortcuts.** Build the foundation correct for 5,000 restaurants.
Do phases in order. Each phase must pass its done-check before starting the next.

**Tier order:** Basic → Advanced → Premium.
**Template order:** Build one template fully, then reuse its patterns for the rest.

---

## Phase 0: Project Setup
*Goal: Running dev environment. No UI yet.*

- [ ] Install pnpm: `curl -fsSL https://get.pnpm.io/install.sh | sh -`
- [ ] Create Next.js 14 app:
  ```bash
  pnpm create next-app@latest menuos --typescript --tailwind --app --src-dir --import-alias "@/*" --use-pnpm
  ```
- [ ] Install all dependencies from `02-TRD.md` packages list
- [ ] Create `.env.template` (copy all vars from `02-TRD.md`, blank values)
- [ ] Create `.env.local` with dev values
- [ ] Create all docs in `/docs/` (copy from this repo)
- [ ] Create Supabase project: supabase.com → new project named `menuos-prod`
- [ ] Run `001_core.sql` + `002_rls.sql` in Supabase SQL editor
- [ ] Set up Cloudflare account + enable R2 (requires credit card — once)
- [ ] Create R2 bucket `menuos-prod` → set public → CNAME `cdn.yourdomain.in`
- [ ] Run `scripts/upload-stock.ts` to upload initial stock images to R2
- [ ] Run seed SQL (demo business + categories + items using stock images)
- [ ] Create Firebase project → Web App per demo client → get measurement ID
- [ ] Create GitHub repo → push code → set secrets (SUPABASE_URL, ANON_KEY)
- [ ] Create `.github/workflows/keepalive.yml` → test manually

**✅ Done when:** `pnpm dev` runs, Supabase connects, demo business exists in DB, stock images serve via CDN URL.

---

## Phase 1: Core Architecture
*Goal: Config system, motion primitives, CMS auth shell — before any UI.*

- [ ] `/src/lib/config.ts` — `getConfig()` with env-driven limits (see `02-TRD.md`)
- [ ] `/src/lib/design-tokens.ts` — 9 theme token sets as CSS var objects
- [ ] `/src/types/database.ts` — all TypeScript interfaces + `cdnUrl()` helper
- [ ] `/src/lib/r2.ts` — upload helper, presigned URL, delete
- [ ] `/src/lib/supabase/client.ts` + `server.ts` (@supabase/ssr)
- [ ] `/src/lib/brevo.ts` — `sendEmail()` wrapper
- [ ] `/src/lib/firebase.ts` — `initAnalytics()` + `track()` wrapper
- [ ] `/src/middleware.ts` — protect `/cms/*` routes, redirect to login
- [ ] `/src/stores/cms.ts` — Zustand store (activeBranchId, isDragging, etc.)
- [ ] `/src/components/motion/` — FadeUp, StaggerList, SpringModal, AnimatedNumber
- [ ] `/src/app/api/upload/route.ts` — image upload → sharp → R2
- [ ] `/src/app/api/items/[id]/avail/route.ts` — sold-out PATCH + `revalidatePath`
- [ ] CMS auth: `/cms/login/page.tsx` + middleware protecting `/cms/*`

**✅ Done when:** `getConfig()` returns correct values, upload API processes an image and serves from CDN URL, CMS login works.

---

## Phase 2: Public Menu — Basic Tier (MERCADO template first)
*Goal: A working QR-scannable mobile menu. One template. All image modes.*

### 2.1 SplashScreen component
- [ ] `/src/components/menu/SplashScreen.tsx`
  - Reads `NEXT_PUBLIC_THEME` env var
  - Renders one of 9 splash animations
  - Start with MERCADO splash (red circle expand/recede, 1.3s)
  - Session-storage flag: only shows once per session
  - `AnimatePresence` wraps it for exit animation

### 2.2 MenuHero
- [ ] `/src/components/menu/MenuHero.tsx`
  - Cover image (R2 CDN URL) OR gradient fallback
  - Logo (R2 CDN URL) OR initials circle fallback
  - Restaurant name in template display font
  - Open/Closed badge (derived from `opening_hours` + current time)
  - Tagline
  - No cover image: template renders with brand-color gradient — looks intentional

### 2.3 CategoryNav
- [ ] `/src/components/menu/CategoryNav.tsx`
  - Mobile: horizontal scroll pills, sticky top-0, backdrop blur
  - Tablet (768px+): wider pills, or horizontal underline nav
  - Framer Motion `layoutId="active-pill"` slides between tabs
  - Tap → smooth scroll to category section ID

### 2.4 ItemCard — all three image modes
- [ ] `/src/components/menu/ItemCard.tsx`
  - **None mode:** Category icon (Lucide) left + name + description + price + badge
  - **Stock mode:** `<Image>` from `cdnUrl(stock_image_key)`, 88×88px rounded
  - **Custom mode:** `<Image>` from `cdnUrl(custom_thumb_key)`, 88×88px rounded
  - Tablet: same card scales to 2-column grid (CSS grid, no JS)
  - Sold-out: `filter: grayscale(0.6)` + opacity + red "Sold Out" chip
  - `whileHover: { y: -2 }`, `whileTap: { scale: 0.97 }`

### 2.5 BestsellerStrip
- [ ] `/src/components/menu/BestsellerStrip.tsx`
  - Only renders if `items.some(i => i.is_featured)`
  - Horizontal scroll strip of featured item cards
  - Framer Motion `drag="x"` with `dragConstraints`

### 2.6 WhatsAppCTA
- [ ] `/src/components/menu/WhatsAppCTA.tsx`
  - Fixed bottom-right, z-index 70
  - `wa.me/{whatsapp}?text=Hi, viewing your menu`
  - CSS pulse ring: `@keyframes wa-pulse`
  - `whileHover: { scale: 1.1 }`, `whileTap: { scale: 0.9 }`
  - Fires Firebase `track('whatsapp_click', { business_slug })`

### 2.7 Menu home page
- [ ] `/src/app/(menu)/layout.tsx`
  - Injects CSS custom properties from `design-tokens.ts` based on `NEXT_PUBLIC_THEME`
  - Loads Google Fonts for template via `next/font/google`
  - Wraps with Framer Motion `MotionConfig reducedMotion="user"`
  - Initialises Firebase analytics
- [ ] `/src/app/(menu)/page.tsx`
  - Server Component, fetches: `businesses.select('*').eq('slug', CLIENT_SLUG)`
  - Fetches: categories + items (with indexes)
  - `export const revalidate = 30`
  - `export async function generateMetadata()` for SEO

### 2.8 CSS Scroll-driven animations (Basic — no GSAP)
- [ ] In `globals.css`: add `@keyframes reveal-up` + `.item-card { animation-timeline: view() }`
- [ ] Wrap in `@media (prefers-reduced-motion: no-preference)`
- [ ] Tablet variant in media query

### 2.9 ItemModal (bottom-sheet)
- [ ] `/src/components/menu/ItemModal.tsx` using `SpringModal` primitive
  - Full item details: image (if any), name, description, price, dietary badges
  - Swipeable image gallery (Advanced+: up to 3 images)
  - Drag-to-dismiss on mobile

### 2.10 Performance audit
- [ ] `pnpm build && pnpm start` → Lighthouse mobile audit
- [ ] Target: ≥ 92 Lighthouse mobile score
- [ ] LCP < 1.2s on "Fast 3G" throttle in Chrome DevTools
- [ ] Verify: no GSAP/Lenis in the JS bundle (`pnpm build` output)
- [ ] Test on real devices: iPhone Safari + Android Chrome

**✅ Done when:** Demo menu QR-scannable, Lighthouse ≥ 92, all 3 image modes work, tablet 2-column grid works.

---

## Phase 3: CMS — Basic Tier
*Goal: Owner can manage their menu completely independently.*

### 3.1 CMS Shell
- [ ] `/src/app/(cms)/cms/layout.tsx` — Sidebar + QueryClientProvider + ZustandProvider
- [ ] Sidebar: dark `#1A1917`, amber active, NavItem with locked state for gated features
- [ ] Mobile sidebar: hamburger → drawer (Framer Motion `x: -280 → 0`)
- [ ] Toast notification system (Framer Motion slide-in, bottom-center mobile)

### 3.2 Dashboard
- [ ] Stats: total items, sold-out count, category count
- [ ] AnimatedNumber count-up on mount
- [ ] Quick actions: Add Item, View Live Menu (opens new tab)

### 3.3 Items list
- [ ] TanStack Query: `useQuery(['items', slug], fetchItems)`
- [ ] Each row: image mode icon, name, price, sold-out toggle, Edit link
- [ ] **Optimistic sold-out toggle** via `useMutation` (instant feel)
  - `onMutate`: update local cache immediately
  - `onError`: revert
  - `onSettled`: fire `revalidatePath` via API + invalidate query
- [ ] `@formkit/auto-animate` on list (smooth row transitions)
- [ ] Search: client-side filter by name

### 3.4 Add/Edit Item form
- [ ] React Hook Form + Zod schema matching `Item` interface
- [ ] **Image section — 3 tabs:**
  - "No Image": clears image fields
  - "Stock Library": `StockImagePicker` grid — categorised, searchable, tap to select
  - "Upload Photo": file input → preview → POST `/api/upload` → set R2 keys
- [ ] Dietary toggles (large, mobile-friendly)
- [ ] Badge selector
- [ ] Category selector (fetches from DB)
- [ ] Save: PATCH or POST → success toast

### 3.5 StockImagePicker
- [ ] `/src/components/cms/StockImagePicker.tsx`
- [ ] Fetches `stock_images` from Supabase (public read, anon, no auth needed)
- [ ] Category filter tabs + text search by tags
- [ ] Grid of 80×80px thumbnails from CDN
- [ ] Tap to select → `stock_image_key` saved to item

### 3.6 Categories
- [ ] CRUD: name + icon (Lucide icon picker) + sort order
- [ ] Reorder: up/down buttons (Simple for Basic; drag for Advanced)
- [ ] Delete: prompt if items exist → reassign prompt

### 3.7 QR Code Generator
- [ ] `qr-code-styling`: generate QR from site URL
- [ ] Apply `--brand` colour + logo from business settings
- [ ] Download PNG (512×512) + PDF (A5 table tent)
- [ ] Basic tier: 1 QR only

### 3.8 Settings
- [ ] Business info: name, tagline, phone, WhatsApp, address
- [ ] Hours: day-by-day toggle + time inputs
- [ ] Logo upload → `/api/upload` → R2 → `businesses.logo_r2_key`
- [ ] Cover image upload → R2 → `businesses.cover_r2_key`
- [ ] Theme picker: 3 swatches for Basic (Mercado / Provenance / Terrain)
- [ ] Custom brand color: `<input type="color">` + hex input

**✅ Done when:** Owner can add/edit/delete items (all 3 image modes), toggle sold-out (instant feel), change settings, download QR — zero developer help needed.

---

## Phase 4: Remaining 8 Templates
*Goal: All 9 themes fully working. Test each at mobile + tablet.*

### Order:
1. PROVENANCE (Basic B2) — light/clean, simple adaptation of Mercado base
2. TERRAIN (Basic B3) — warm linen, section headers
3. *(run Migration 003 before continuing to Advanced)*
4. BAZAAR (Advanced A1) — FeastTransition + Lenis + GSAP install
5. NOCTURNE (Advanced A2) — dark lounge, CSS noise texture, glass effect
6. COASTAL (Advanced A3) — CSS wave splash, Framer photo-category strip
7. *(run Migration 004 before continuing to Premium)*
8. AETHER (Premium P1) — CSS blob morphing, floating layout
9. ONYX (Premium P2) — full-page sections, editorial typography
10. STUDIO (Premium P3) — monospace, CSS grain texture, 3D tilt

### For each template:
- [ ] Add token set to `design-tokens.ts`
- [ ] Add font import to `layout.tsx` (conditional on `NEXT_PUBLIC_THEME`)
- [ ] Implement `SplashScreen` variant
- [ ] Implement `MenuHero` variant (or confirm base handles it)
- [ ] Implement `CategoryNav` variant (pills vs text vs sections)
- [ ] Implement `ItemCard` variant (any template-specific style)
- [ ] Mobile Lighthouse ≥ 92 on real Cloudflare Pages deployment
- [ ] Test on real tablet (768–1023px)
- [ ] Test text-only mode (no photos) — must look intentional

---

## Phase 5: Advanced Tier CMS Features

- [ ] Run migration 003 (menus + banners)
- [ ] `/cms/menus` — CRUD + schedule start/end time
- [ ] `/cms/banners` — CRUD + R2 image upload + start/end dates
- [ ] Advanced theme picker (5 options: Bazaar, Nocturne, Coastal + 2 more from Basic)
- [ ] Drag-to-reorder items + categories (`@dnd-kit`)
- [ ] `/cms/analytics` — Recharts charts (line: page views, bar: top items)
  - Data from `analytics_events` table (Supabase query)
  - TanStack Query with 5-minute stale time
- [ ] Multiple QR codes: up to 5 with table labels
- [ ] Staff accounts: 2 accounts, invite by email (Supabase `inviteUserByEmail`)
- [ ] Multiple menu toggle in settings

---

## Phase 6: Premium Tier CMS Features

- [ ] Run migration 004 (branches, reservations, translations)
- [ ] `/cms/branches` — CRUD
- [ ] Branch switcher in CMS header (Zustand `activeBranchId`)
- [ ] Reservation form on public menu (`/api/reservations` → Supabase + Brevo email)
- [ ] `/cms/reservations` — table, confirm/cancel/notes
- [ ] Bilingual CMS editor (secondary language fields per item)
- [ ] `useLanguage` hook on public menu (toggle + localStorage)
- [ ] Advanced analytics: heatmap, branch comparison
- [ ] jsPDF monthly report (triggered from CMS, emailed via Brevo)
- [ ] Dynamic QR: `/api/qr/[id]` route + `is_dynamic` flag in QR table
- [ ] SEO settings form + `generateMetadata()` + JSON-LD schema
- [ ] Custom domain setup guide (Cloudflare Pages docs in README)
- [ ] Backup/restore: JSON export of all business data

---

## Phase 7: Scale Hardening

- [ ] Database connection: switch to Supabase pooler (port 6543) in all API routes
- [ ] Analytics cleanup cron: GitHub Actions weekly → `DELETE FROM analytics_events WHERE created_at < NOW() - INTERVAL '90 days'`
- [ ] Supabase DB size monitor: alert at 400MB (80% of free 500MB limit)
- [ ] R2 usage dashboard check (monthly)
- [ ] Cache-Control headers on R2: `public, max-age=31536000, immutable` on image keys
- [ ] Test at scale: seed 500 businesses, 50K items — verify query performance
- [ ] Load test: k6 or autocannon simulating 50K visitors/day across 500 menus

---

## Phase 8: Developer Tools

- [ ] `scripts/setup-client.ts` — interactive CLI (slug, name, tier, theme, owner email)
  - Creates Supabase row
  - Creates auth user (Admin API)
  - Creates staff_accounts record
  - Seeds 3 categories + 12 items with stock images
  - Prints all env vars ready to paste into Cloudflare Pages
- [ ] `scripts/upload-stock.ts` — uploads all stock images to R2 (run once)
- [ ] `README.md`:
  - Prerequisites (pnpm, Supabase CLI, Cloudflare account)
  - First-time setup (Supabase + R2 + Brevo + Firebase + Cloudflare Pages)
  - Per-client deployment (10 steps)
  - Updating limits via env vars
  - Tier upgrade process
- [ ] `.env.template` — all vars with comments

---

## Phase 9: QA

- [ ] Lighthouse mobile ≥ 92 on all 13 themes (deployed on Cloudflare Pages)
- [ ] LCP < 1.2s on real 4G (use WebPageTest or Chrome DevTools throttle)
- [ ] CLS < 0.05 on all themes
- [ ] Test: text-only mode — all 9 themes look intentional without photos
- [ ] Test: stock image mode on all 9 themes
- [ ] Test: custom photo upload on all image types (JPEG, PNG, HEIC from iPhone camera)
- [ ] Test: QR scan flow on iPhone Safari + Android Chrome + iPad Safari
- [ ] Test: sold-out toggle → menu updates within 30 seconds
- [ ] Test: `prefers-reduced-motion` reduces to opacity-only fades
- [ ] Test: tablet (768px) layout for all 9 themes
- [x] `pnpm tsc --noEmit` → zero TypeScript errors
- [x] `pnpm lint` → zero ESLint errors
- [ ] 30-minute client deploy using setup script

---

## Done Criteria

- [ ] All 13 templates mobile Lighthouse ≥ 92
- [ ] All 13 templates text-only mode looks great (no photos required)
- [ ] New client deployed in < 30 minutes
- [ ] Owner can manage all content without developer after setup
- [ ] Sold-out toggle reflects within 30 seconds
- [ ] 500 restaurants at 50K visits/day: Supabase queries < 100ms via ISR cache
- [ ] Infrastructure cost at 500 clients: < ₹2,000/month
- [ ] GitHub Actions keepalive running (Supabase never pauses)
- [ ] CMS locked-state visible for tier-gated features (not hidden)
- [ ] Dynamic QR redirect works (Premium)
- [ ] Bilingual toggle works (Premium)
