# CLAUDE.md — MenuOS QR Menu SaaS
## Master Build Context · Auto-read by Claude Code

---

## What This Project Is

**MenuOS** — A multi-tenant QR menu SaaS for Indian cafes and restaurants.
One codebase. Three tiers. Environment variables control everything.
Designed to scale to 5,000 restaurants with zero infrastructure drama.

---

## Reading Order — Do This Before Writing Any Code

1. `docs/01-PRD.md` — what we're building, for whom, at what scale
2. `docs/02-TRD.md` — final tech stack with full rationale
3. `docs/03-APP-FLOW.md` — every screen, every user journey, ISR flow
4. `docs/04-UI-UX-BRIEF.md` — 9 templates, motion system, mobile+tablet
5. `docs/05-BACKEND-SCHEMA.md` — full DB, RLS, stock images, R2 structure
6. `docs/06-IMPLEMENTATION-PLAN.md` — build sequence, phase by phase

---

## Stack Summary (Locked)

```
Package manager:  pnpm
Framework:        Next.js 14 (App Router, TypeScript)
Styling:          Tailwind CSS v3 + CSS Custom Properties
State (CMS):      Zustand
Data (CMS):       TanStack Query v5
Forms:            React Hook Form + Zod
Animations:       Framer Motion (all) + GSAP/Lenis (Advanced+ only, dynamic import)
Database:         Supabase (ONE shared project, multi-tenant via RLS)
Storage:          Cloudflare R2 (zero egress, scales to 5000 clients)
Image processing: sharp (server-side, on upload)
Email:            Brevo (9K/month free)
Analytics:        Firebase GA4 (unlimited)
Hosting:          Cloudflare Pages (unlimited bandwidth)
Keep-alive:       GitHub Actions cron
```

---

## Architecture in One Paragraph

One GitHub repo → one Cloudflare Pages project per client (same repo, different env vars).
`NEXT_PUBLIC_CLIENT_SLUG` identifies which row in the shared Supabase `businesses` table
to load. All tenant isolation is via `business_id` column + RLS. Menu pages are SSG + ISR
(revalidate: 30s) so 50,000 daily visitors hit Cloudflare edge cache, not Supabase.
Images live in Cloudflare R2 with zero egress fees. `sharp` processes uploads once.

---

## The Image Decision (Key for Every Component)

**Photo upload is OPTIONAL.** Every item card has 3 modes — all look great:
- `none`: text-only, category Lucide icon as left anchor
- `stock`: curated R2 library, owner picks from grid in CMS
- `custom`: owner uploads photo, processed by `sharp` → R2

Never assume an image exists. Design for text-only first.
CDN URL helper: `cdnUrl(key)` from `/src/types/database.ts`.

---

## 9 Templates (Awwwards References)

| `theme` value | Tier | Awwwards Reference | Character |
|---------------|------|--------------------|-----------|
| `mercado` | basic | [TMG Mexican](https://www.awwwards.com/sites/tmg-mexican-restaurant) ([tacosmyguey.com](https://tacosmyguey.com/)) | Bold street food, dark + red |
| `provenance` | basic | [Elevare Market](https://www.awwwards.com/sites/elevare) ([elevaremarket.com/en-qa](https://elevaremarket.com/en-qa)) | Premium white, organic/wellness |
| `terrain` | basic | [Platse](https://www.awwwards.com/sites/platse) ([rumbekeplatse.be](https://rumbekeplatse.be/)) | Contemporary European, linen tones |
| `bazaar` | advanced | [Gourou Indian Food](https://www.awwwards.com/sites/gourou-indian-food) ([gourouindianfood.fr](https://www.gourouindianfood.fr/)) | Vibrant Indian bazaar + Irani cafe |
| `nocturne` | advanced | [Timeless Club](https://www.awwwards.com/sites/timeless) ([timeless.club/en](https://timeless.club/en)) | Dark luxury lounge (CSS, no WebGL) |
| `coastal` | advanced | [Single Fin](https://www.awwwards.com/sites/single-fin) ([singlefin.nc/en](https://singlefin.nc/en/)) | Coastal/QR-native, ocean vibes |
| `aether` | premium | [Nube](https://www.awwwards.com/sites/nube) ([espaciolanube.com](https://www.espaciolanube.com/)) | Organic blobs, air/space feeling |
| `onyx` | premium | [Onyx Restaurant Paris](https://www.awwwards.com/sites/onyx-restaurant-paris) ([restaurantonyx.com/notre-menu](https://restaurantonyx.com/notre-menu)) | Dark Parisian fine dining |
| `studio` | premium | [RabenRifaie](https://www.awwwards.com/sites/rabenrifaie-studio-1) ([rabenrifaie.com](https://www.rabenrifaie.com/)) | Tactile textures, art gallery (CSS, no WebGL) |

Each template has: splash screen, hero variant, category nav variant, item card variant,
colour tokens, font pair, Lenis speed, GSAP easing. All in `docs/04-UI-UX-BRIEF.md`.

---

## Config System — Limits from Env

```typescript
// NEVER check process.env.NEXT_PUBLIC_TIER directly in components.
// ALWAYS use getConfig() from /src/lib/config.ts

const { limits, features, motion } = getConfig()
// limits.items     ← from env or tier default (not hardcoded)
// features.analytics ← boolean, gated by tier
// motion.gsap      ← false for Basic, dynamic import guard
```

Changing a client's item limit: update `NEXT_PUBLIC_MAX_ITEMS` in Cloudflare env vars.
No code change. No redeploy. Instant.

---

## Critical Rules — Never Break

1. **pnpm everywhere.** `pnpm add`, `pnpm run`, not npm.

2. **One shared Supabase project.** Never per-client Supabase projects.

3. **GSAP/Lenis never in Basic bundle.** Guard with `getConfig().motion.gsap`. Dynamic import always.

4. **R2 keys in DB, URLs derived at runtime.** `cdnUrl(item.custom_r2_key)` — never store full URLs.

5. **`revalidatePath('/')` on every CMS save** that affects the public menu.

6. **sharp runs server-side only.** Never import sharp in 'use client' files.

7. **SUPABASE_SERVICE_ROLE_KEY server-side only.** Never in 'use client'.

8. **Design for text-only first.** Every template must look award-winning with no photos.

9. **Mobile at 375px.** Then tablet at 768px. Test both before any component is done.

10. **Locked state, not hidden.** Tier-gated CMS features show with upgrade prompt.

---

## GitHub Actions Keep-Alive (Create This File Now)

```yaml
# .github/workflows/keepalive.yml
name: Supabase Keep-Alive
on:
  schedule:
    - cron: '0 8 */5 * *'
  workflow_dispatch:
jobs:
  ping:
    runs-on: ubuntu-latest
    steps:
      - name: Ping DB
        run: |
          curl -sf "${{ secrets.SUPABASE_URL }}/rest/v1/businesses?select=id&limit=1" \
            -H "apikey: ${{ secrets.SUPABASE_ANON_KEY }}" \
            -H "Authorization: Bearer ${{ secrets.SUPABASE_ANON_KEY }}" \
            && echo "OK $(date)" || echo "FAILED"
```

---

## Performance Targets

| Metric | Target |
|--------|--------|
| Lighthouse mobile | ≥ 92 |
| LCP (4G mobile) | < 1.2s |
| JS bundle (Basic) | < 120KB gzip |
| JS bundle (Advanced) | < 250KB gzip |
| ISR revalidation | 30s |
| DB query via ISR | ~0/request (edge cache) |
| New client deploy | < 30 minutes |

---

## Start Here

```bash
# Step 1: Read all 6 docs in /docs/
# Step 2: Answer PROMPT.md questions correctly
# Step 3: Begin Phase 0 from 06-IMPLEMENTATION-PLAN.md
pnpm create next-app@latest menuos --typescript --tailwind --app --src-dir --import-alias "@/*" --use-pnpm
```

*MenuOS · Solo developer project · Zero infra cost at scale*
*Target: 500 restaurants · ₹24,950+ MRR by Year 1*
