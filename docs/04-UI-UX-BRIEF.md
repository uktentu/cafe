# 04 — UI/UX Design Brief

---

## Aesthetic Direction

Every public menu must feel like the restaurant's own brand — not a SaaS template.
The CMS shares one consistent dark-sidebar shell across all tiers.

**Three mandates:**
1. Great with NO photos. Every template looks award-winning text-only.
2. Mobile-first at 375px. Tablet-first at 768px. Both tested before shipping.
3. Award-winning motion. Every element enters with purpose. Nothing is instant.

---

## Mobile + Tablet Priority Rules

```
Mobile (375–767px):    QR scans. Single column items. Bottom-anchor category tabs.
Tablet (768–1023px):   Hotel restaurants, food courts. 2-column items. Wider hero.
Desktop (1024px+):     CMS admin only. No dedicated public menu desktop layout needed.
```

Minimum tap target: **44×44px** everywhere.
Font-size minimum on inputs: **16px** (prevents iOS Safari auto-zoom).
Safe area insets: `padding-bottom: env(safe-area-inset-bottom)` on fixed elements.

---

## CSS Design Token System

All templates use CSS custom properties injected on `<html>` element.
`/src/lib/design-tokens.ts` exports the token set per theme.

```css
/* Applied to <html> via layout.tsx based on NEXT_PUBLIC_THEME */
:root {
  /* Brand (overridden per restaurant if they pick a custom color) */
  --brand: #E5292A;
  --brand-dim: rgba(229,41,42,0.12);
  --brand-glow: rgba(229,41,42,0.06);

  /* Surface layers */
  --bg:   #0D0B08;      /* deepest background */
  --sf1:  #1A1510;      /* card surface */
  --sf2:  #231E18;      /* elevated surface */
  --sf3:  #2E2820;      /* modal, sheet bg */

  /* Glass overlay (for sticky headers, modals) */
  --glass: rgba(13,11,8,0.85);  /* backdrop-filter: blur(16px) on this */

  /* Typography */
  --txt:  #F7EFE7;
  --txt2: #9A8878;
  --txt3: #5A4E44;      /* disabled */

  /* Border */
  --bdr:  rgba(247,239,231,0.08);
  --bdr2: rgba(247,239,231,0.14);

  /* Motion tokens */
  --ease-smooth: cubic-bezier(0.65, 0, 0.35, 1);
  --ease-spring: cubic-bezier(0.34, 1.56, 0.64, 1);
  --ease-pop:    cubic-bezier(0.22, 1, 0.36, 1);
  --dur-fast:    150ms;
  --dur-base:    280ms;
  --dur-slow:    450ms;
}
```

---

## Motion Primitives — Build These First

```typescript
// /src/components/motion/presets.ts

export const fadeUp = {
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0 },
  exit:    { opacity: 0, y: -10 },
  transition: { duration: 0.42, ease: [0.25, 0.46, 0.45, 0.94] }
}

export const stagger = {
  animate: { transition: { staggerChildren: 0.07, delayChildren: 0.08 } }
}

// Bottom-sheet modal with drag-dismiss (all templates except Onyx)
export const sheetModal = {
  initial: { y: '100%', opacity: 0 },
  animate: { y: 0, opacity: 1 },
  exit:    { y: '100%', opacity: 0 },
  transition: { type: 'spring', stiffness: 400, damping: 40 }
}

// Center modal (Onyx template only, tablet+)
export const centerModal = {
  initial: { scale: 0.93, opacity: 0 },
  animate: { scale: 1, opacity: 1 },
  exit:    { scale: 0.93, opacity: 0 },
  transition: { type: 'spring', stiffness: 350, damping: 30 }
}
```

**CSS Scroll-driven (Basic tier — zero JS cost):**
```css
@keyframes reveal-up {
  from { opacity: 0; transform: translateY(20px); }
  to   { opacity: 1; transform: translateY(0); }
}
.item-card {
  animation: reveal-up linear both;
  animation-timeline: view();
  animation-range: entry 0% entry 28%;
}
/* Tablet: more generous range */
@media (min-width: 768px) {
  .item-card { animation-range: entry 0% entry 20%; }
}
```

**WhatsApp CTA pulse ring (all templates, CSS keyframe):**
```css
@keyframes wa-pulse {
  0%   { transform: scale(1); opacity: 0.65; }
  100% { transform: scale(2.1); opacity: 0; }
}
```

**Skeleton shimmer (not opacity pulse):**
```css
@keyframes shimmer {
  0%   { background-position: -300px 0; }
  100% { background-position:  300px 0; }
}
.skeleton {
  background: linear-gradient(90deg, var(--sf1) 25%, var(--sf2) 50%, var(--sf1) 75%);
  background-size: 300px 100%;
  animation: shimmer 1.4s ease-in-out infinite;
}
```

---

## Item Image Modes — Design for All Three

Every item card must look intentional in all three modes:

**Mode 1 — No image (text-only)**
- 3-line height card: name, description, price + badge
- Left accent colour bar (2px, brand colour) provides visual rhythm
- Category icon (Lucide React, 20px, muted) serves as left visual anchor
- This is the DEFAULT for new items. Looks intentional, not broken.

**Mode 2 — Stock image**
- Left 88×88px rounded thumbnail (or top 16:9 in grid view)
- Loaded from `${CDN_URL}/stock/{category}/{name}.webp`
- Always served from Cloudflare edge cache (R2 + CDN)
- Sepia or slight brand-tint overlay optional per template

**Mode 3 — Custom photo**
- Same layout as stock image mode
- Served from `${CDN_URL}/clients/{slug}/items/{id}/thumb.webp`
- Thumbnail (320px) used in cards, full (1200px) in item detail modal

---

## 9 Design Templates — Awwwards Reference Mapped

---

### ─── TIER 1 — BASIC TEMPLATES ────────────────────────────────────────────
*Motion: Framer Motion + CSS Scroll-driven Animations (native, zero JS cost)*
*Bundle target: < 120KB JS gzipped*

---

#### MERCADO
`theme: 'mercado'`
**Reference:** [TMG Mexican Restaurant](https://www.awwwards.com/sites/tmg-mexican-restaurant) ([tacosmyguey.com](https://tacosmyguey.com/)) — Awwwards HM Nov 2025
**Awwwards:** "Born from Mexico's streets. A digital home that tastes like good vibes, real flavor, and pure joy."
**For:** Street food, biryanis, fast-casual, bold flavor brands, taco joints, quick-service.

**Colors:**
```css
--bg: #0E0B09; --sf1: #1C1410; --brand: #E5292A; --brand2: #F5A623;
--txt: #F7EFE7; --txt2: #9A8878;
```
**Fonts:** `Bebas Neue` 400 (all caps display) + `DM Sans` 400/500/600

**Mobile layout:** Full-bleed dark hero → Bestsellers horizontal strip → Category pills (red active) → Dense 2-col item grid
**Tablet layout:** Hero taller (50vh), items in 3-column grid

**Splash:** Brand red circle (`clip-path: circle(0→150%)`) expands from center in 0.5s. Restaurant name flashes white on red. Recedes 0.8s. Total: 1.3s. Energetic, like ripping packaging open.

**Category tabs:** Horizontal scroll pills. Active: `--brand` filled. Inactive: dark outline.

**Item cards (text-only mode):** Dark surface + 2px left red border. Name Bebas Neue 20px all-caps. Price in `--brand2` amber.

**WhatsApp ring:** `--brand` red.

**Tablet upgrade:** Category tabs become horizontal nav with brand underline indicator (Framer `layoutId`).

---

#### PROVENANCE
`theme: 'provenance'`
**Reference:** [Elevare Market](https://www.awwwards.com/sites/elevare) ([elevaremarket.com/en-qa](https://elevaremarket.com/en-qa)) — Awwwards recognized premium wellness
**Awwwards:** "Provenance and purity, no compromise."
**For:** Health cafes, organic restaurants, pure-veg, wellness brands, juice bars, curated menus.

**Colors:**
```css
--bg: #FAFAF7; --sf1: #FFFFFF; --brand: #1A2E22; --brand2: #8A6840;
--txt: #0D1A12; --txt2: #6B7A6E; --bdr: #E0DDD5;
```
**Fonts:** `DM Serif Display` 400/400i (display, editorial italic) + `DM Sans` 300/400/500

**Mobile layout:** Marquee ticker (CSS, restaurant tagline scrolling) → Centered logo + name → Hours → Text-only category links → Clean item rows (name left, price right)
**Tablet layout:** 2-column items; marquee runs faster.

**Splash:** Pure white. Logo fades in `y: 10→0, opacity: 0→1` over 0.7s. DM Serif Display name appears 0.3s delay. Elegant restraint.

**Category nav:** Plain text links, spaced. Active: `--brand` deep green underline. No pill.

**Item cards (text-only mode):** Pure white, thin `--bdr` bottom border. Name DM Serif Display italic. Price in `--brand2` warm brown, right-aligned. Generates premium product-list feel without photos.

**Marquee CSS:**
```css
@keyframes marquee { from { transform: translateX(0); } to { transform: translateX(-50%); } }
.ticker { animation: marquee 20s linear infinite; white-space: nowrap; }
```

---

#### TERRAIN
`theme: 'terrain'`
**Reference:** [Platse](https://www.awwwards.com/sites/platse) ([rumbekeplatse.be](https://rumbekeplatse.be/)) — Awwwards HM May 2026
**For:** Contemporary European dining, continental cafes, architectural restaurants, design-conscious brands.

**Colors:**
```css
--bg: #F2EDE6; --sf1: #EAE3D9; --sf2: #FFFFFF; --brand: #2C2218;
--brand2: #B85C2A; --txt: #1E160E; --txt2: #7A6A58; --bdr: #D4C9B8;
```
**Fonts:** `Space Grotesk` 500/700 (display + headings) + `Inter` 400 (body)

**Mobile layout:** Warm linen hero (cover image if available, else gradient) + Space Grotesk 700 name + "est. YEAR" small-caps → Section-based categories (full-width headers) → Items list with left thumbnail
**Tablet layout:** Hero 40vh with text right-aligned. Categories become side-anchored labels.

**Splash:** Warm linen bg. Horizontal thin line (`width: 0 → 100%`, CSS animation, 0.6s ease-out). Restaurant name Space Grotesk 700 appears above line at 0.8s. Architectural, minimal.

**Category nav:** Full-width section headers in Space Grotesk 700 with thin horizontal rule. Scroll-to-section on tap.

**Item cards (text-only mode):** Clean left-aligned. Category-coloured left dot (3px circle). Name Space Grotesk 500. Price Inter 400 right-aligned.

---

### ─── TIER 2 — ADVANCED TEMPLATES ─────────────────────────────────────────
*Motion: Framer Motion + GSAP (ScrollTrigger) + Lenis*
*All Basic features included. Bundle target: < 250KB JS gzipped*

---

#### BAZAAR
`theme: 'bazaar'`
**Reference:** [Gourou Indian Food](https://www.awwwards.com/sites/gourou-indian-food) ([gourouindianfood.fr](https://www.gourouindianfood.fr/)) — Awwwards HM Feb 2026
**Awwwards:** "Immersive, colorful, and creative — the raw energy of street food meets the timeless elegance of Irani cafes."
**For:** Indian restaurants, biryani houses, Irani cafes, street food elevated, vibrant flavor brands.

**Colors:**
```css
--bg: #0D0800; --sf1: #1A0E00; --brand: #F5A623; --brand2: #E84A2F;
--brand3: #2A9D8F; --txt: #FFF5E8; --txt2: #B89060;
```
**Fonts:** `Anton` 400 (all-caps display, bold impact) + `DM Sans` 400/500

**Signature — The Feast Transition (Gourou's award-winning element):**
When switching categories, GSAP sweeps a full-screen brand-colour wash:
```typescript
// FeastTransition.tsx
gsap.fromTo('.feast-veil',
  { clipPath: 'inset(0 100% 0 0)' },      // fully hidden right
  { clipPath: 'inset(0 0% 0 0)',           // reveal left-to-right
    duration: 0.28, ease: 'power2.inOut',
    onComplete: () => {                    // show new content while veil covers
      showNewContent()
      gsap.fromTo('.feast-veil',
        { clipPath: 'inset(0 0% 0 0)' },
        { clipPath: 'inset(0 0 0 100%)',   // hide left-to-right
          duration: 0.28, ease: 'power2.inOut' }
      )
    }
  }
)
```

**Mobile layout:** Dark hero + Anton 56px restaurant name + marigold marquee ticker → Category selection blocks (full-width colored blocks per category, not tabs) → Dense 2-col item grid
**Tablet layout:** Category blocks side-by-side in 2-col → items 3-col.

**Splash:** Black screen. Marigold radial expands from center. At 50%, Anton name slams in `y: -40→0`. Marigold recedes. Total: 1.8s.

**Lenis:** `duration: 1.0`. GSAP ScrollTrigger on item reveals (`y: 20→0` + fade).

---

#### NOCTURNE
`theme: 'nocturne'`
**Reference:** [Timeless Club](https://www.awwwards.com/sites/timeless) ([timeless.club/en](https://timeless.club/en)) — Awwwards HM (WebGL lounge experience)
**Awwwards:** "Immersive experience fusing 3D technology with the elegance of a premium lounge."
**Translation:** WebGL → CSS dark atmosphere. Gold + deep black. Lounge feel through type + motion, not 3D.
**For:** Cocktail bars, wine bars, members lounges, date-night restaurants, rooftop dining.

**Colors:**
```css
--bg: #080A0C; --sf1: #10131A; --sf2: #18202B; --brand: #C9A84C;
--txt: #EDE8DA; --txt2: #6E7280; --bdr: rgba(201,168,76,0.18);
```
**Fonts:** `Cormorant Garamond` 300i (hero display) / 600 (headings) + `Outfit` 300/400

**CSS Texture (replaces Timeless WebGL):**
```css
/* Subtle noise grain overlay — creates tactile depth without GPU cost */
.noise-overlay {
  position: fixed; inset: 0; pointer-events: none; z-index: 1;
  opacity: 0.04;
  background-image: url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.65' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E");
}
```

**Mobile layout:** Full-black hero. Cormorant 300 Italic huge name. Gold 1px rule. Category tabs as spaced text links with gold underline. Item cards: dark glass surface, name Cormorant, price gold.
**Tablet layout:** Category tabs become vertical left sidebar. Items fill right 75%.

**Splash:** Pure black. Gold hairline draws left-to-right (1.0s). Name fades in above at 0.7s. Gold flickers at 1.5s. Fades at 2.0s.

**Lenis:** `duration: 1.4`. GSAP: items slide in `x: -16→0` + fade on scroll enter.

---

#### COASTAL
`theme: 'coastal'`
**Reference:** [Single Fin](https://www.awwwards.com/sites/single-fin) ([singlefin.nc/en](https://singlefin.nc/en/)) — Awwwards Nominee Feb 2026
**Awwwards:** "Seamless QR code access for an immersive seaside experience."
**Note:** Single Fin was literally built with QR menu access as a feature. Closest Awwwards reference to our exact product.
**For:** Beach restaurants, coastal cafes, seafood dining, resort F&B, surf culture spots.

**Colors:**
```css
--bg: #F5F8F5; --sf1: #FFFFFF; --brand: #1B5E8A; --brand2: #E07B39;
--brand3: #4A9B6F; --txt: #162030; --txt2: #6A8090; --bdr: #C8D8D0;
```
**Fonts:** `Fraunces` variable (SOFT axis, display italic) + `Plus Jakarta Sans` 400/500

**Mobile layout:** Full-bleed cover photo hero. Fraunces italic restaurant name. "Today's Specials" featured strip (Framer drag scroll). Ocean-blue category tabs. Items: photo left / text right cards. Drinks section last, coral accent.
**Tablet layout:** Hero 45vh. Items in 2-col. Drinks section gets full-width featured image block.

**Splash:** Pale seafoam background. CSS clip-path wave sweep (blue polygon) crosses screen left→right in 1.2s, leaving restaurant name revealed as it passes over it.
```css
@keyframes wave-in {
  0%   { clip-path: polygon(0 0, 0 0, 0 100%, 0 100%); }
  50%  { clip-path: polygon(0 0, 60% 0, 100% 100%, 0 100%); }
  100% { clip-path: polygon(0 0, 100% 0, 100% 100%, 0 100%); }
}
```

**Lenis:** `duration: 1.2`. GSAP: items `scale: 0.96→1` + fade on scroll enter.

---

### ─── TIER 3 — PREMIUM / ELITE TEMPLATES ─────────────────────────────────
*Motion: Framer Motion + GSAP (ScrollTrigger + CustomEase) + Lenis*
*All Advanced features included. Bundle: < 400KB JS gzipped*

---

#### AETHER
`theme: 'aether'`
**Reference:** [Nube](https://www.awwwards.com/sites/nube) ([espaciolanube.com](https://www.espaciolanube.com/)) — Awwwards HM 2026
**Awwwards:** Architecture firm "building large-scale inflatable installations shaped by air."
**Translation:** Air + organic forms + space → extreme white space, CSS blob morphing, typography as hero, items float in breathable space.
**For:** Experimental fine dining, cloud kitchens with brand ambition, farm-to-table premium, avant-garde.

**Colors:**
```css
--bg: #F8F7F3; --sf1: #EEECEA; --brand: #1A1208; --brand2: #7C5C3A;
--accent: #C4A86A; --txt: #1A1208; --txt2: #8A7E6E;
```
**Fonts:** `Syne` 700/800 (geometric, air-like) + `Inter` 300/400

**CSS Organic Blobs (replaces WebGL):**
```css
@keyframes blob-morph {
  0%, 100% { border-radius: 60% 40% 30% 70% / 60% 30% 70% 40%; }
  33%      { border-radius: 30% 60% 70% 40% / 50% 60% 30% 60%; }
  66%      { border-radius: 40% 30% 60% 70% / 40% 70% 50% 30%; }
}
.hero-blob {
  position: absolute; width: 300px; height: 300px;
  background: var(--accent); opacity: 0.10;
  animation: blob-morph 9s ease-in-out infinite;
  will-change: border-radius;
}
/* Tablet: larger blobs, more spread out */
@media (min-width: 768px) {
  .hero-blob { width: 480px; height: 480px; }
}
```

**Mobile layout:** Near-white. Syne 800 restaurant name centered. Organic blobs float behind. Wide vertical padding. Items: no card containers — full-width rows, name large Syne, price right.
**Tablet layout:** 2-column item grid with generous gutters. Blobs scale up.

**Splash:** White. CSS blob grows from center (0→100vw via `clip-path: circle()`). At peak, Syne 800 name appears inside. Blob morphs as it recedes. Total: 2.0s.

**Lenis:** `duration: 1.5`. GSAP CustomEase: `'M0,0 C0.25,0.1 0.25,1 1,1'` on item float-ins.

---

#### ONYX
`theme: 'onyx'`
**Reference:** [Onyx Restaurant Paris](https://www.awwwards.com/sites/onyx-restaurant-paris) ([restaurantonyx.com/notre-menu](https://restaurantonyx.com/notre-menu)) — Awwwards Nominee 2025
**Awwwards:** "Bistronomic restaurant in Paris. Luxurious brasserie. Haven of refinement and conviviality."
**For:** Fine dining, luxury restaurants, Paris-inspired, Michelin-aspiring, heritage brasseries.

**Colors:**
```css
--bg: #060606; --sf1: #0E0E0E; --sf2: #181818; --brand: #FAFAF5;
--brand2: #C9A35A; --txt: #FAFAF5; --txt2: #6A6660; --bdr: rgba(250,250,245,0.08);
```
**Fonts:** `Playfair Display` 400/700/700i (masthead + editorial display) + `Jost` 300/400

**Layout — menu as editorial experience (from Onyx's actual menu at restaurantonyx.com):**

Each category = full-screen section (`min-height: 100svh`). No tabs — pure vertical scroll.

**Mobile layout:**
1. Pure black hero. Playfair 700 Italic enormous name. Gold rule. "Paris · Since XXXX".
2. Each category: category name runs vertically on left edge (`writing-mode: vertical-rl`). Items listed right.
3. Items: no borders, no cards. Playfair 400 italic name. Jost 300 description. Price right in gold.
4. Featured item: full-bleed food photo section with parallax (`yPercent: -15` GSAP scrub).

**Tablet layout:** Vertical category labels become larger (32px). Items in 2-column. Featured photo takes 60% width.

**Modal:** Centered (not bottom-sheet) on tablet+. Bottom-sheet on mobile.

**Splash:** Black. Nothing for 0.4s (bold). Playfair 700 Italic name letters appear `stagger: 0.04s` GSAP. Gold underline draws at 1.2s. Fades at 2.5s. Longest splash — most confident.

**Lenis:** `duration: 1.6`. GSAP: Photo parallax scrubbed to scroll. Category vertical text rotates on scroll.

---

#### STUDIO
`theme: 'studio'`
**Reference:** [RabenRifaie Studio](https://www.awwwards.com/sites/rabenrifaie-studio-1) ([rabenrifaie.com](https://www.rabenrifaie.com/)) — Awwwards HM Apr 2026
**Awwwards:** "Framer portfolio with high-quality 3D animations, tactile textures, seamless responsive experience."
**Translation:** Framer 3D → CSS perspective transforms. Tactile textures → SVG noise filter. Art gallery feel.
**For:** Experimental restaurants, tasting-menu concepts, art-forward dining, chef's table experiences.

**Colors:**
```css
--bg: #F0EEE8; --sf1: #FFFFFF; --brand: #0A0A0A; --brand2: #FF4500;
--txt: #0A0A0A; --txt2: #888880; --bdr: rgba(10,10,10,0.1);
```
**Fonts:** `Space Mono` 400/700 (monospace — editorial, unexpected) + `Inter` 400

**CSS Tactile Texture (replaces Framer 3D):**
```css
/* Grain texture simulates RabenRifaie's tactile surface feel */
.texture-overlay {
  position: fixed; inset: 0; pointer-events: none; z-index: 1; opacity: 0.035;
  background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='g'%3E%3CfeTurbulence type='turbulence' baseFrequency='0.75' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23g)'/%3E%3C/svg%3E");
}
```

**CSS 3D Tilt (item cards on hover — replaces Framer 3D):**
```typescript
const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
  const rect = e.currentTarget.getBoundingClientRect()
  const x = (e.clientX - rect.left) / rect.width - 0.5
  const y = (e.clientY - rect.top) / rect.height - 0.5
  e.currentTarget.style.transform = `perspective(500px) rotateY(${x*8}deg) rotateX(${y*-8}deg)`
}
```

**Mobile layout:** Warm paper. Space Mono restaurant name + single orange `--brand2` pill beside it (the only colour). Numbered category list (`01 / Starters`). Items: full-width, name large Space Mono, description Inter offset-right, tiny orange dot before each item name.
**Tablet layout:** 12-column grid baseline visible. Items in 2-column editorial grid.

**Splash:** Space Mono types restaurant name character by character GSAP `stagger: 0.06s`. At 80% typed, orange pill slides in from right. Total: 1.8s.

**Lenis:** `duration: 1.1`. GSAP: items slide in `x: -16→0` on scroll. 3D tilt desktop/tablet only.

---

## CMS Design Language (All Tiers — Same Shell)

```
Sidebar:   Dark (#1A1917), amber active highlight
Content:   Light (#F7F8FA)
Accent:    #F59E0B (amber — consistent across all tiers)
Danger:    #EF4444
Success:   #22C55E
Font:      Inter (via next/font)
```

**CMS inputs:** 42px height, 8px radius, 16px font (no iOS zoom), focus ring `0 0 0 3px rgba(245,158,11,0.2)`.

**Feature-locked state:** Tier-gated features show in sidebar with lock icon + "Upgrade to unlock" badge. NOT hidden. This is a sales mechanism.

**Mobile CMS:** Hamburger → slide-in drawer. Large toggle switches (easy on phones for sold-out). Stacked form fields with full-width inputs. Confirmation toasts bottom-center.

---

## Dark/Light Mode

Public menu: follows template (some dark, some light — no user toggle).
CMS: always light background, always dark sidebar. No dark mode toggle.

---

## Reference Apps

- Zomato (item card patterns, category tab behaviour)
- Swiggy (horizontal scroll UX)
- [TMG](https://www.awwwards.com/sites/tmg-mexican-restaurant) ([tacosmyguey.com](https://tacosmyguey.com/)) — Basic B1
- [Elevare](https://www.awwwards.com/sites/elevare) ([elevaremarket.com/en-qa](https://elevaremarket.com/en-qa)) — Basic B2
- [Platse](https://www.awwwards.com/sites/platse) ([rumbekeplatse.be](https://rumbekeplatse.be/)) — Basic B3
- [Gourou](https://www.awwwards.com/sites/gourou-indian-food) ([gourouindianfood.fr](https://www.gourouindianfood.fr/)) — Advanced A1
- [Timeless](https://www.awwwards.com/sites/timeless) ([timeless.club/en](https://timeless.club/en)) — Advanced A2
- [Single Fin](https://www.awwwards.com/sites/single-fin) ([singlefin.nc/en](https://singlefin.nc/en/)) — Advanced A3
- [Nube](https://www.awwwards.com/sites/nube) ([espaciolanube.com](https://www.espaciolanube.com/)) — Premium P1
- [Onyx](https://www.awwwards.com/sites/onyx-restaurant-paris) ([restaurantonyx.com/notre-menu](https://restaurantonyx.com/notre-menu)) — Premium P2
- [RabenRifaie](https://www.awwwards.com/sites/rabenrifaie-studio-1) ([rabenrifaie.com](https://www.rabenrifaie.com/)) — Premium P3

---

## Accessibility

- `prefers-reduced-motion: reduce` respected via Framer Motion `MotionConfig reducedMotion="user"`
- All CSS scroll-driven animations wrapped in `@media (prefers-reduced-motion: no-preference)`
- Dietary badges: colour + text (never colour-only)
- Focus rings visible on all interactive elements
- Skip-to-content link at top of public menu
- `aria-label` on all icon-only buttons
- CLS < 0.05: skeleton loaders with fixed heights before content loads
