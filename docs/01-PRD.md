# 01 — PRD: Product Requirements Document

---

## App Name
**MenuOS**

## Tagline
*"Your restaurant's digital identity — live in 15 minutes."*

---

## Problem

7.5 lakh+ registered restaurants in India use printed menus, WhatsApp PDFs, or Instagram screenshots.
Every price change costs ₹500–₹2,000 in reprinting. Most have zero branded digital presence.
For a diner scanning a QR code, the first impression is a blurry photo of a laminated card.

This is a solved problem everywhere except the Indian restaurant long-tail.

**Three specific pains:**
1. Reprinting cost and friction (especially for street food + fast-casual)
2. No mobile-optimised branded menu (Zomato is the aggregator's brand, not yours)
3. Developer dependency — owners can't update anything themselves

---

## Target Users

### Buyer (restaurant/cafe owner)
- Owns a cafe, dhaba, cloud kitchen, bakery, tiffin center, or restaurant
- Located anywhere in India (Tier 1, 2, or 3 city)
- Has a smartphone and WhatsApp
- Currently uses: printed menu, laminated card, or phone-screenshot shared on WhatsApp
- Budget-conscious: can justify ₹499–₹1,999/month if the outcome is clear
- Does NOT want to be dependent on a developer after setup

### End User (diner/customer)
- Scans QR code at table / counter / shared via WhatsApp
- Needs the menu in under 2 seconds on their phone
- Browses items, checks dietary info, places order via WhatsApp
- No app install. No login. No friction.
- Also uses tablet (hotel restaurants, food courts, lounges)

### Operator (you — solo developer)
- Deploys and manages all client sites from one codebase
- Earns ₹4,999–₹24,999 setup fee + ₹499–₹1,999/month per client
- Wants zero per-client developer work after go-live
- Needs to scale to 500+ clients without proportional time increase

---

## Scale Target

| Milestone | Restaurants | Visitors/day | Image requests/month |
|-----------|-------------|--------------|----------------------|
| Month 3   | 30          | 1,500        | ~300K                |
| Month 6   | 150         | 7,500        | ~1.5M                |
| Year 1    | 500         | 25,000       | ~5M                  |
| Year 2    | 5,000       | 250,000      | ~50M                 |

Architecture decisions must be correct for Year 2 scale. Build for it now.

---

## Three Product Tiers

### Tier 1 — QR Starter (Basic) `basic`
**Price:** ₹4,999 setup + ₹499/month
**Delivery time:** 2–3 days

| Feature | Value |
|---------|-------|
| Menu items | 30 (env override) |
| Categories | 3 (env override) |
| QR codes | 1 (env override) |
| Staff accounts | 1 |
| Photos | Optional — pick from stock library OR upload 1 per item |
| Themes | 3 (Mercado, Provenance, Terrain) |
| Analytics | Basic (page views + WhatsApp clicks) |
| WhatsApp CTA | ✅ |
| Custom domain | ❌ (subdomain only) |
| Reservation form | ❌ |
| Multi-branch | ❌ |

### Tier 2 — Menu Pro (Advanced) `advanced`
**Price:** ₹12,999 setup + ₹999/month
**Delivery time:** 4–5 days

Everything in Basic, plus:

| Feature | Value |
|---------|-------|
| Menu items | 100 (env override) |
| Categories | Unlimited |
| QR codes | 5 (env override) |
| Staff accounts | 2 |
| Photos | 3 per item (stock or upload) |
| Themes | 3 additional (Bazaar, Nocturne, Coastal) |
| Multiple menus | Breakfast/Lunch/Dinner schedule |
| Promo banners | 5 max (env override) |
| Featured items carousel | ✅ |
| Analytics dashboard | Full (Recharts charts) |
| Social links | Instagram, Swiggy, Zomato, Maps |
| Drag-to-reorder | ✅ |

### Tier 3 — Brand Elite (Premium) `premium`
**Price:** ₹24,999 setup + ₹1,999/month
**Delivery time:** 7–10 days

Everything in Advanced, plus:

| Feature | Value |
|---------|-------|
| Menu items | Unlimited |
| QR codes | Unlimited |
| Staff accounts | 5 with roles |
| Photos | 9 per item |
| Themes | 3 additional (Aether, Onyx, Studio) |
| Custom domain | 1 year free |
| Multi-branch | Up to 3 |
| Table reservations | ✅ |
| Bilingual menu | ✅ (English + 1 regional) |
| PDF reports | Monthly auto-generated |
| Dynamic QR codes | ✅ (redirect without reprinting) |
| SEO settings | ✅ |

---

## Image Philosophy (Critical Decision)

**Uploading a dish photo is OPTIONAL, not required.**

Three image modes per menu item:
1. **No image** — item renders beautifully text-only. Templates designed to look great without photos.
2. **Stock image** — pick from curated library of 100+ food images organised by category (Indian, Chinese, Continental, Drinks, Desserts, Street Food). Pre-converted to WebP, hosted on R2.
3. **Custom image** — upload own photo. Processed on upload (compressed, WebP, thumbnail generated).

**Result:** A cafe can go live in 15 minutes with just text — type their menu, publish. Photos come later if ever.

---

## User Stories

**Diner (Customer)**
- I scan a QR and the menu loads in under 2 seconds on my phone.
- I can switch between Veg and All in one tap.
- I tap an item and see a description + photo (if available).
- I tap WhatsApp and my order is pre-filled.
- I can browse on my tablet at a hotel restaurant with a proper 2-column layout.

**Restaurant Owner**
- I add all my menu items in one sitting without needing a developer.
- I mark an item as Sold Out in 30 seconds from my phone.
- I change a price and it's live within 30 seconds.
- I don't need to know anything about hosting, DNS, or code.

**Developer (You)**
- I deploy a new client in under 30 minutes using the setup script.
- I never touch a client's code after go-live unless they upgrade.
- At 500 clients, I'm spending 2 hours/month on infrastructure, not 200.

---

## Out of Scope (All Tiers)

- Online ordering / cart / checkout
- Payment gateway integration
- Kitchen display system / POS
- Customer accounts or loyalty programs
- Delivery management
- Push notifications
- Live chat

---

## Success Metrics

| Metric | Target |
|--------|--------|
| New client deploy time | ≤ 30 minutes |
| Owner: update a price | ≤ 60 seconds end-to-end |
| Menu LCP on real 4G | < 1.2s |
| Lighthouse mobile score | ≥ 92 |
| Monthly churn | < 4% |
| Infrastructure cost at 500 clients | < ₹2,000/month |
| Year 1 MRR target | ₹24,950+/month |

---

## Nice to Have (Post-MVP)

- WhatsApp Business API integration (send order confirmation)
- Review display (manually curated)
- Staff ordering pad (table-side use mode)
- Customer feedback form
- Menu QR printed on packaging/stickers via print-on-demand partner
