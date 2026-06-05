# Phase Improvements and Refinements

This document tracks improvements needed for every phase completion. As we advance through the phases, we log identified UI/UX issues, technical debt, and new enhancements to be resolved in subsequent polish phases.

## ✅ Completed Refinements (Phases 0-6)

- **General (No Photos State)**: Integrated category icon fallbacks across all themes seamlessly.
- **General (Compare Price)**: 
  - Universally applied `compare_price` to all themes for regular items, not just best sellers.
  - Standardized horizontal inline placement with `gap-1.5` across all layouts, fixing `justify-between` spreading issues.
- **Theme Layout Fixes**: 
  - **Coastal**: Fixed `md+` overlapping issues with the fixed sidebar.
  - **Aether**: Replaced masonry with CSS Grid for correct card order, ensured sticky headers work.
  - **Onyx**: Corrected tablet `flex-col` to `flex-row` alignment. Added Golden Ratio text overlay for image cards.
  - **Studio**: Swapped the repeating diagonal stripe fallback with a luxury monogram locking.
  - **Frost**: Adjusted tablet grid sizes (2 columns instead of 3) for better proportions. Added glassmorphism tooltips and glow effects.
  - **Arcade**: Heavily gamified with `Press Start 2P` font, neon glows, scanlines, and animated headers.
  - **Nocturne**: Added a "Top" jump dot for quick navigation back to the Best Sellers/Hero area.
  - **Ember**: Dark fiery glow, glowing dividers and prices. Standardized badge placements.
  - **Bazaar**: Horizontal snapping, precise corner groupings for prices and badges. Floating pills.
  - **Terrain**: Accordion rows, inline dot-leader spacing.
- **Backend / Next.js Infrastructure**:
  - Replaced `compare_at_price` schema with `compare_price`.
  - Resolved static vs dynamic build failures by enforcing Edge runtime securely.
  - Fixed Cloudflare Pages caching/revalidation issues by enforcing dynamic rendering (`export const revalidate = 0`) on the public menu.
- **Phase 5: Aesthetic & Animation OCD Standardization**:
  - Implemented completely unique framer-motion scroll-driven animations for every theme (e.g., `arcDrop`, `emberRise`, `coastalFloat`).
  - Standardized anatomical locations for badges (`VegMark` and `ItemBadge`) and prices per-theme to eliminate visual clumsiness.
  - Redesigned text-only (no photo) menus utilizing category icons natively in the row components to dramatically improve readability.
  - Created rigorous standard boundaries so that card sizes and layouts look absolutely professional across devices.

---

## 🚀 Future Phases & Enhancements

### 1. Technical Debt & Performance
- **Webpack Caching Warnings**: Investigate and resolve Next.js build warnings: `<w> [webpack.cache.PackFileCacheStrategy] Serializing big strings impacts deserialization performance`.
- **QR Generator Hydration**: Monitor `qr-code-styling` for any potential SSR hydration issues on the CMS side.

### 2. UI/UX Enhancements
- **Accessibility (a11y) Audit**: Ensure full ARIA compliance, screen reader support, and robust keyboard navigation across all complex, highly-styled menu themes.
- **Dark/Light Mode Overrides**: Currently themes are locked to their designed color schemes; investigate adding user-level overrides or respecting system OS preferences without breaking brand aesthetics.
- **Micro-Animations**: Add layout transitions using `framer-motion` for smoother page transitions within the CMS dashboard.

### 3. Feature Additions (Roadmap)
- **Cart & Ordering System**: Extend the viewing menu to a full ordering system (Add to Cart, Checkout, Stripe integration).
- **Internationalization (i18n)**: Multi-language support for diverse tourist demographics.
- **Progressive Web App (PWA)**: Allow frequent customers to "Install" the menu app to their mobile devices.
- **Advanced Analytics**: Integrate a more robust charting library (e.g., Recharts) in the CMS to visualize item popularity, peak scan times, and dietary preference distributions.
