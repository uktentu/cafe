# MenuOS

The ultimate QR Menu SaaS platform. Built for 5,000+ restaurants on Cloudflare Pages + Supabase.

## Prerequisites

Before starting, ensure you have the following installed and created:
1. **pnpm**: Fast, disk space efficient package manager. (`curl -fsSL https://get.pnpm.io/install.sh | sh -`)
2. **Supabase CLI**: For running migrations locally (optional but recommended).
3. **Cloudflare Account**: With billing enabled (required for R2 storage).
4. **Firebase Account**: For GA4 analytics tracking per-client.
5. **Brevo Account**: For transactional emails (reservations, password resets).

---

## First-Time Setup (Platform Level)

You only need to do this **once** for your entire agency, not per client.

1. **Supabase**: 
   - Create a single project named `menuos-prod`.
   - Run the SQL migrations in order (`supabase/001_core.sql` → `004_premium.sql`).
   - Get your `URL`, `anon key`, and `service_role key`.
2. **Cloudflare R2**: 
   - Create a bucket named `menuos-prod`.
   - Make it public and attach a custom domain (e.g. `cdn.yourdomain.in`).
3. **Upload Stock Assets**:
   - Add your Supabase and R2 keys to `.env.local`.
   - Run `pnpm run upload-stock` to populate R2 with the default template images.
4. **Firebase Analytics**:
   - Create a single project `menuos-analytics`.
   - You will add a new "Web App" inside this project for every new client to get a unique `MEASUREMENT_ID`.
5. **Brevo**:
   - Get an API key for sending confirmation emails.

---

## Per-Client Deployment (The 10 Steps)

Every time you sign a new restaurant, follow these exact steps to deploy their instance:

1. **Run Setup CLI**: Run `pnpm run setup-client` in your terminal.
2. **Answer Prompts**: Enter the restaurant's name, slug, tier (basic/advanced/premium), theme, and owner email.
3. **Save Output**: The CLI will provision their database row, seed categories/items, create an admin account, and output a block of Environment Variables. **Copy these variables**.
4. **Firebase App**: Go to your Firebase project, add a new Web App named after the client, and copy the `MEASUREMENT_ID`.
5. **Cloudflare Pages**: Go to Cloudflare Dashboard → Pages → **Create a project** → Connect to your GitHub repository.
6. **Build Settings**: 
   - Framework: `Next.js`
   - Build command: `npx @cloudflare/next-on-pages`
   - Build output directory: `.vercel/output/static`
7. **Environment Variables**: Paste the variables outputted by the CLI + the shared Supabase/R2/Brevo keys + the new Firebase `MEASUREMENT_ID`.
8. **Add Node Version**: Add `NODE_VERSION = 20` to the environment variables.
9. **Deploy**: Click "Save and Deploy". Cloudflare will build the site using Edge infrastructure.
10. **Custom Domain**: Once deployed, go to the project's "Custom Domains" tab and link their custom domain (e.g., `menu.restaurant.com`). Cloudflare handles SSL automatically.

---

## Updating Limits via Env Vars

MenuOS does not hardcode limits in the database. Instead, limits are dictated by the client's `NEXT_PUBLIC_TIER` (basic, advanced, premium).

You can override *any* specific limit for a client without upgrading their tier by adding specific environment variables in their Cloudflare Pages settings. No code changes required!

**Available Limit Overrides:**
- `NEXT_PUBLIC_MAX_ITEMS` (e.g. `80`)
- `NEXT_PUBLIC_MAX_CATEGORIES` (e.g. `10`)
- `NEXT_PUBLIC_MAX_QR_CODES` (e.g. `5`)
- `NEXT_PUBLIC_MAX_STAFF` (e.g. `3`)
- `NEXT_PUBLIC_MAX_BRANCHES` (e.g. `2`)
- `NEXT_PUBLIC_MAX_PHOTOS_PER_ITEM` (e.g. `5`)
- `NEXT_PUBLIC_MAX_BANNERS` (e.g. `10`)

*Example: If a Basic client pays you an extra $5/mo for more categories, just add `NEXT_PUBLIC_MAX_CATEGORIES=10` to their Cloudflare project and redeploy.*

---

## Tier Upgrade Process

When a client upgrades from Basic to Advanced or Premium:

1. Go to their Cloudflare Pages project → Settings → Environment variables.
2. Change `NEXT_PUBLIC_TIER` to `advanced` or `premium`.
3. (Optional) Change `NEXT_PUBLIC_THEME` if they want to switch to a higher-tier template.
4. **Trigger a Redeploy**.
5. Once the build finishes, their CMS dashboard will instantly unlock the new features (analytics, reservations, banners, advanced themes, etc).
