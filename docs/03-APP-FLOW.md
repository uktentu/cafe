# 03 — App Flow: Navigation & User Journey Map

---

## Pages List

### Public Menu (customer-facing, no auth)
| Route | Description |
|-------|-------------|
| `/` | Menu home — hero + featured + categories + items |
| `/reserve` | Reservation form (Premium only) |

### CMS Admin (owner-facing, auth required)
| Route | Description |
|-------|-------------|
| `/cms/login` | Login page |
| `/cms/dashboard` | Overview stats + quick actions |
| `/cms/items` | All menu items |
| `/cms/items/new` | Add item form |
| `/cms/items/[id]` | Edit item form |
| `/cms/categories` | Category management |
| `/cms/qr-codes` | QR code generation |
| `/cms/settings` | Business info, branding, hours |
| `/cms/analytics` | Views + interactions (Advanced+) |
| `/cms/banners` | Promo banners (Advanced+) |
| `/cms/menus` | Multiple menus / schedules (Advanced+) |
| `/cms/reservations` | Reservation management (Premium) |
| `/cms/branches` | Multi-branch (Premium) |
| `/cms/staff` | Staff accounts (Advanced+) |

### API
| Route | Description |
|-------|-------------|
| `/api/upload` | Image upload → sharp → R2 |
| `/api/items/[id]/avail` | Sold-out toggle + ISR revalidate |
| `/api/reservations` | Public reservation submit |
| `/api/qr/[id]` | Dynamic QR redirect (Premium) |

---

## Navigation Type

**Public menu:** Single-page scroll experience. No page navigation. Everything on one vertical scroll.
Exception: Premium reservation form may be `/reserve` separate route for OG sharing.

**CMS:** App-style navigation. Sidebar + main content area.
Mobile CMS: Hamburger → slide-in sidebar drawer. Full sidebar on tablet/desktop.

---

## First Screen

**Public menu:** Splash screen → Hero section (immediately visible, above fold)
No loading spinner. Skeleton or splash animation covers the fetch time.

**CMS:** Login page if unauthenticated → Dashboard after login.

---

## Auth Flow

```
Owner visits /cms/* (any CMS route)
  ↓
middleware.ts checks Supabase session cookie
  ↓ No session                    ↓ Session valid
Redirect /cms/login?next={path}   Continue to route
  ↓
Owner enters email + password
  ↓ Invalid                       ↓ Valid
Show inline error                 supabase.auth.signInWithPassword()
                                    ↓
                                  Set httpOnly cookie (@supabase/ssr)
                                    ↓
                                  Redirect to /cms/dashboard
                                  (or ?next= path if set)
```

**Password reset:** Supabase sends email → `/cms/reset-password?token=` route.
**Staff invite:** Owner invites → Supabase sends invite email → staff sets password.

---

## Core User Journey 1: Diner Scans QR

```
QR code scanned
  ↓
Browser opens: https://clientname.yourdomain.in
  ↓
[Splash screen animates] ← per theme, 1.2–2.4s
  ↓
Hero section visible:
  - Restaurant logo + name
  - Open / Closed status
  - Cover image (or gradient hero if no image)
  - WhatsApp CTA (floating, always visible)
  ↓
User scrolls down
  ↓
[Bestsellers strip] (if any items are is_featured=true)
  → Horizontal scroll card strip
  → [Motion: Framer drag scroll]
  ↓
Category tabs (sticky, below hero)
  → Tap tab → smooth scroll to section
  → [Motion: layoutId pill slides to active tab]
  ↓
Item cards load (ISR-cached, instant)
  → [Motion: CSS scroll-driven reveal (Basic) / GSAP reveal (Advanced/Premium)]
  → 3 image modes: text-only / stock image / custom photo
  ↓
User taps item card
  → [Motion: spring bottom-sheet slides up from bottom]
  → Item detail: name, description, price, image (if any), dietary badges
  → Drag down → sheet dismisses
  ↓
User taps WhatsApp CTA
  → Opens wa.me/{number}?text=Hi, ordering from your menu
  → [Firebase event: whatsapp_click]
  ↓
Done.
```

**Tablet variant (≥ 768px):**
- Items render in 2-column grid (not single column)
- Hero image and restaurant name are larger
- Category tabs may be left sidebar (Nocturne, Onyx templates)
- Bottom sheet becomes centered modal (centered on wider screen)

---

## Core User Journey 2: Owner Updates Menu

```
Owner opens: https://clientname.yourdomain.in/cms/login
  ↓
Enters email + password
  ↓
Dashboard shows:
  - Total items, sold-out count, categories
  - [AnimatedNumber: count-up on load]
  - Quick actions: Add Item, Toggle Sold Out, View Live Menu
  ↓
Taps "Items" in sidebar
  ↓
Items list:
  - Each row: thumbnail (or category icon if no photo), name, price, availability toggle
  - [@formkit/auto-animate: smooth row add/remove]
  - Availability toggle: [Motion: spring thumb slide, instant Supabase PATCH]
  - Toggle fires: PATCH /api/items/{id}/avail → revalidatePath('/') → menu live in ≤30s
  ↓
Taps "Edit" on item
  ↓
Edit form:
  - Name, price, description, category
  - Dietary toggles (Veg/Vegan/Jain/GF)
  - Image section: 3 tabs:
      [No Image]  [Stock Library]  [Upload Photo]
    Stock Library:
      → Grid of curated stock images by category
      → Tap to select → preview appears
    Upload Photo:
      → File input → drag-drop or camera capture on mobile
      → Preview on select
      → On save: POST /api/upload → sharp processes → R2 stores → URL saved
  - Badge: none / Bestseller / Chef's Special / New / Spicy
  ↓
Saves → success toast (Framer Motion slide-in)
→ revalidatePath('/') fires automatically
→ Changes visible in ≤30 seconds
```

---

## Core User Journey 3: Developer Deploys New Client

```
Terminal:
  pnpm run setup-client

Interactive prompts:
  ? Client slug:    (e.g. spice-garden)
  ? Client name:    Spice Garden
  ? Tier:           (basic / advanced / premium)
  ? Theme:          (mercado / provenance / terrain / bazaar / nocturne / coastal / aether / onyx / studio)
  ? Owner email:    owner@spicegarden.com
  ? WhatsApp:       919876543210
  ↓
Script:
  1. Inserts row into businesses table (Supabase Admin API)
  2. Creates owner auth account (supabase.auth.admin.createUser)
  3. Creates staff_accounts record (role: 'owner')
  4. Seeds 3 categories + 12 items with stock images
  5. Prints .env vars to copy into Cloudflare Pages:
     NEXT_PUBLIC_CLIENT_SLUG=spice-garden
     NEXT_PUBLIC_TIER=basic
     NEXT_PUBLIC_THEME=mercado
     ... (all vars)
  ↓
Developer:
  6. In Cloudflare Pages: Create new project → connect GitHub repo
  7. Paste env vars into Cloudflare environment variables
  8. Add custom domain: spice-garden.yourdomain.in
     (CNAME → [project].pages.dev in DNS)
  9. Deploy: git push (or manual deploy button)
  10. Go to /cms/qr-codes → Download QR PNG + PDF
  11. Send client:
      - Live menu URL
      - CMS URL + credentials
      - QR files
      ↓
  Total time: ≤ 30 minutes
```

---

## Empty States

| Screen | Empty state |
|--------|-------------|
| Items list (CMS) | "No items yet. Add your first menu item." + Add button |
| Category (public menu) | "Nothing here yet — check back soon!" |
| Analytics (CMS) | "Start getting scans to see your data." |
| Reservations | "No reservations yet." |
| Banners | "No banners yet. Create one for promotions." |

---

## Error States

| Scenario | Behaviour |
|----------|-----------|
| Menu page slug not found | Branded 404: restaurant name + WhatsApp contact |
| Supabase connection fails | Toast: "Failed to load. Pull to refresh." |
| Image upload fails | Inline error: "Upload failed. Try again or pick a stock image." |
| Reservation submit fails | Inline error + retry button |
| CMS save fails | Toast: "Save failed. Your changes were not lost." + retry |
| Dynamic QR not found | Redirect to menu home |

---

## Redirects

| Trigger | Action |
|---------|--------|
| `/cms/*` without session | → `/cms/login?next={path}` |
| `/cms/login` with valid session | → `/cms/dashboard` |
| Premium feature, non-premium client | → Stay on page, show locked upgrade prompt |
| Dynamic QR `/api/qr/{id}` | → 302 to `qr_codes.target_url` |
| Invalid QR ID | → 302 to `/` |

---

## Mobile + Tablet Breakpoints

```
Mobile:  320px–767px   (priority — QR scans happen here)
Tablet:  768px–1023px  (hotel restaurants, food courts, lounges)
Desktop: 1024px+       (CMS admin, developer tools)
```

**Public menu rules:**
- Mobile: single-column items, bottom-anchored category tabs, floating WhatsApp
- Tablet: 2-column items, larger hero, category tabs stay horizontal (wider screen)
- No desktop-specific public menu layout needed (QR menus = phones + tablets)

**CMS rules:**
- Mobile: hamburger sidebar, full-width forms, large tap targets (44px min)
- Tablet: side-by-side sidebar + content
- Desktop: full sidebar always visible

---

## ISR + Live Update Flow

```
Owner changes item price in CMS
  ↓
PATCH /api/items/{id}/avail (or general save)
  ↓
Supabase UPDATE
  ↓
revalidatePath('/') called server-side
  ↓
Cloudflare Pages ISR: marks cached page as stale
  ↓
Next visitor's request: page regenerated from Supabase
  ↓
All subsequent visitors: served from fresh Cloudflare edge cache
  ↓
Total time from save to live: ≤ 30 seconds
```
