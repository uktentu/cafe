# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [0.1.1] - 2026-06-11

### Added
- **Google Maps Integration:** Added interactive embedded Google Maps widget to `MenuFooter.tsx` when a Google Maps link is provided in Settings.
- **Google Reviews Integration:** Added a "Review Us" button with star icons next to social links, configurable via the CMS Settings page.
- **Analytics Tracking:** Added `maps_embed_click` and `reviews_click` to `AnalyticsEventType` for telemetry tracking.

### Fixed
- **CI/CD Deployment:** Replaced buggy `cloudflare/wrangler-action@v3` with direct `pnpm exec wrangler` to fix global npm install permission failures on GitHub runners.
- **PNPM Workspace:** Allowed `core-js` postinstall build scripts in `pnpm-workspace.yaml` to prevent non-interactive build failures during dependency resolution.
- **Dependencies Sync:** Synced `pnpm-lock.yaml` across the workspace to ensure deterministic Edge environment builds.

## [0.1.0] - Initial Release
- Core multi-tenant infrastructure established using Next.js Edge Runtime and Cloudflare Pages.
- Supabase Integration (Auth, Database, RLS).
- Dynamic theming and CMS architecture.
