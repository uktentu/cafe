# Phase Improvements and Refinements

This document tracks improvements needed for every phase completion. As we advance through the phases, we log identified UI/UX issues, technical debt, and new enhancements to be resolved in subsequent polish phases.

## ✅ Completed Refinements (Phases 0-8)

### Phase 7 & 8: Scale Hardening & DX
- **Database Hygiene:** Configured Supabase DB Size monitoring cron and SQL RPC to trigger alerts at 400MB (80% of free tier).
- **Analytics Retention:** Implemented automatic Analytics Data Cleanup (90-day retention) via GitHub actions to prevent bloating.
- **Scale Testing:** Load-tested seamlessly with 50,000 items and optimized Cloudflare R2 Cache-Control headers for immutable image delivery.
- **Automated Provisioning:** Created interactive CLI `setup-client.ts` to fully automate the tedious client provisioning process (DB row, Admin Auth, seed data, ENV generation).
- **Limit Flexibility:** Refactored `.env` system to allow limit overrides strictly via Cloudflare Pages GUI, enabling custom client billing without codebase changes.
- **Font Rendering Bug:** Fixed a missing `@import` bug in `globals.css` where custom theme Google Fonts were failing to download and falling back to system sans-serif.
- **Edge Build Integrity:** Preserved `set-runtime.js` as a critical AST build hook for Next.js to compile correctly for Cloudflare's Edge architecture.

### UI/UX & Layout Fixes (Phases 0-6)
- **General (No Photos State):** Integrated category icon fallbacks across all themes seamlessly.
- **General (Compare Price):** Universally applied `compare_price` to all themes for regular items, standardized horizontal inline placement.
- **Theme Layout Fixes:** 
  - **Coastal**: Fixed `md+` overlapping issues with the fixed sidebar.
  - **Aether**: Replaced masonry with CSS Grid for correct card order, ensured sticky headers work.
  - **Onyx**: Corrected tablet `flex-col` to `flex-row` alignment. Added Golden Ratio text overlay.
  - **Frost**: Adjusted tablet grid sizes (2 columns instead of 3). Added glassmorphism tooltips and glow effects.
  - **Arcade**: Heavily gamified with `Press Start 2P` font, neon glows, scanlines.
  - **Bazaar**: Horizontal snapping, precise corner groupings for prices and badges. Floating pills.
- **Aesthetic Standardization:** Implemented unique framer-motion scroll-driven animations for every theme, rigorously standardized badge placements (`VegMark` and `ItemBadge`).

---

## 🚀 Future Enhancements (Post-V1 Launch)

### 1. Technical Debt & Integrations
- **Reservation Emails:** Integrate the `BREVO_API_KEY` into `api/reservations/route.ts` to send automated confirmation receipts to customers. The database insertion is complete, but the email pipeline is a lingering `TODO`.
- **Automated Image Compression:** Add an edge worker or webhook to compress user-uploaded `custom_thumb` images aggressively to `.webp` format to minimize R2 bandwidth costs over thousands of menus.
- **Webpack Caching Warnings:** Investigate and resolve Next.js build warnings: `<w> [webpack.cache.PackFileCacheStrategy] Serializing big strings impacts deserialization performance`.

### 2. UI/UX Enhancements
- **Accessibility (a11y) Audit:** Ensure full ARIA compliance, screen reader support, and robust keyboard navigation across all complex, highly-styled menu themes.
- **Dark/Light Mode Overrides:** Currently themes are locked to their designed color schemes; investigate adding user-level overrides or respecting system OS preferences without breaking brand aesthetics.
- **Micro-Animations:** Add layout transitions using `framer-motion` for smoother page transitions within the CMS dashboard.

### 3. Feature Additions (Roadmap)
- **Cart & Ordering System:** Extend the viewing menu to a full POS ordering system (Add to Cart, Checkout, Stripe integration).
- **Internationalization (i18n):** Multi-language support for diverse tourist demographics using automated Google Translate wrappers.
- **Progressive Web App (PWA):** Allow frequent customers to "Install" the menu app directly to their mobile device homescreens.
- **Advanced Analytics:** Integrate a robust charting library (e.g., Recharts) in the CMS to visualize peak scan times and dietary preference distributions.
