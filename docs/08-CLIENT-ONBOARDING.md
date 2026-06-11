# 08 — Client Onboarding Guide

**For the developer.** Everything needed to go from "new restaurant signed up" to "their QR menu is live" in under 30 minutes.

---

## How it works (one-minute summary)

```
One GitHub repo → many Cloudflare Pages projects
One Supabase project → many businesses (multi-tenant via RLS)
One KV namespace → many cache entries (isolated by menu:<slug>)
```

Each client gets:
- Their own Cloudflare Pages project (with their env vars)
- Their own row in the `businesses` table
- Their own `menu:<slug>` key in the shared KV cache
- Their own CMS login at `https://<their-domain>/cms`

---

## Prerequisites (one-time setup, already done)

- [x] `ADMIN_EMAIL` env var set in your **primary** CF Pages project
- [x] `MENU_CACHE` KV namespace created (`598ed8cc005d4108888d324ee7ba7acd`)
- [x] Shared repo secrets set in GitHub (Supabase, Cloudflare, R2)

---

## Step 1 — Create the business in Supabase (2 min)

Open your admin panel: `https://<your-primary-domain>/cms/admin`

Log in with your `ADMIN_EMAIL` account. Click **Add Business** and fill in:

| Field | Example | Notes |
|-------|---------|-------|
| Business name | Spice Garden | Shown in the menu header |
| Slug | `spice-garden` | URL-safe, unique, **cannot change later** |
| City | Mumbai | Optional, shown in footer |
| Phone | +91 98765 43210 | Click-to-call on menu |
| Owner email | owner@spicegarden.com | Used to create their CMS login |
| Tier | `advanced` | `basic` / `advanced` / `premium` |

Click **Create**. The API will:
1. Insert a row into `businesses`
2. Create a Supabase Auth user for the owner
3. Link them in `staff_accounts` (role: `owner`)
4. Seed 3 starter categories + 3 sample items
5. Return a ready-to-paste env vars block — **copy it**

The owner's temporary password is in the response. Share it securely; they can change it from the CMS settings.

---

## Step 2 — Create a Cloudflare Pages project (3 min)

1. Go to [Cloudflare Dashboard → Workers & Pages → Create → Pages](https://dash.cloudflare.com/)
2. Connect to GitHub → select this repo
3. Set the **project name** to match the slug (e.g. `spice-garden`)
4. **Build settings** — Cloudflare will read these from the repo automatically:
   - Build command: `pnpm run pages:build`
   - Build output: `.vercel/output/static`
5. Under **Environment variables**, paste the env vars from Step 1
6. Click **Save and Deploy** — skip this first deploy; it'll use wrong vars until Step 3

> **Add the KV binding before the first real deploy:**
> Pages project → Settings → Bindings → KV namespace → Add:
> - Variable name: `MENU_CACHE`
> - KV namespace ID: `598ed8cc005d4108888d324ee7ba7acd`

---

## Step 3 — Add a deploy job (2 min)

Open `.github/workflows/deploy.yml` and add one job block at the bottom:

```yaml
  deploy-spice-garden:
    name: Deploy → spice-garden
    needs: ci
    if: github.ref == 'refs/heads/main' && github.event_name != 'pull_request'
    uses: ./.github/workflows/_deploy-client.yml
    with:
      project-name: spice-garden          # must match CF Pages project name
      client-slug: spice-garden           # must match businesses.slug in Supabase
      site-url: https://spicegarden.com   # or https://spice-garden.pages.dev for now
      tier: advanced
      theme: bazaar
      whatsapp: '919876543210'
      phone: '+91 98765 43210'
      owner-email: owner@spicegarden.com
      reservations: 'false'
      multi-branch: 'false'
      bilingual: 'false'
    secrets: inherit
```

Commit and push. The new client deploys in parallel with all other clients. CI runs once for all.

---

## Step 4 — Connect a custom domain (2 min, optional)

In the CF Pages project → Custom domains → Add domain → enter `spicegarden.com`.
Cloudflare walks through the DNS steps. SSL is automatic.

Once active, update `site-url` in the deploy job:
```yaml
      site-url: https://spicegarden.com
```

Push again to rebuild with the correct URL in the bundle.

---

## Step 5 — Hand off to the owner (1 min)

Send the owner:
- CMS URL: `https://spicegarden.com/cms`
- Email: `owner@spicegarden.com`
- Temporary password: *(from Step 1 response)*

They log in, go to Settings, change their password, and start adding their menu.

---

## Post-deploy checklist

```
[ ] Visit https://<domain>/ — menu loads correctly
[ ] Visit https://<domain>/cms — login works
[ ] Make a test CMS edit → check the public menu updates within ~5s
[ ] Check KV cache is populating (CF Dashboard → KV → MENU_CACHE → browse keys)
[ ] Verify custom domain SSL is green
[ ] Set up QR code in CMS → QR Codes → Generate
```

---

## Managing existing clients

All admin actions are available at `/cms/admin` (only visible when logged in as `ADMIN_EMAIL`).

### Upgrade / downgrade tier
From the admin panel click the tier badge next to any business, or call the API directly:
```bash
curl -X PATCH https://<your-domain>/api/admin/set-tier \
  -H "Content-Type: application/json" \
  -d '{"businessId":"<uuid>","tier":"premium"}'
# Must be authenticated as ADMIN_EMAIL
```

After a tier change, also update `tier:` in the `deploy.yml` job and push — the new tier limits are baked into the JS bundle at build time.

### Suspend / reactivate a client
From the admin panel toggle the **Active** switch, or:
```bash
curl -X PATCH https://<your-domain>/api/admin/set-active \
  -d '{"businessId":"<uuid>","isActive":false}'
```
Suspending sets `is_active = false` in Supabase. The public menu immediately returns 404. The KV cache entry for that slug will be stale but harmless — the menu page checks `is_active` on every Supabase read.

### Clear a client's KV cache manually
If a client reports stale data and can't wait for their next CMS save:
```bash
pnpm exec wrangler kv key delete --binding MENU_CACHE "menu:<slug>"
# e.g. "menu:spice-garden"
```

### Off-board a client
1. Suspend them (above)
2. Delete their CF Pages project
3. Remove their deploy job from `deploy.yml`
4. Optionally delete their KV entry and Supabase rows

---

## Troubleshooting

| Symptom | Likely cause | Fix |
|---------|-------------|-----|
| Menu shows 404 | `is_active = false` or wrong slug | Check `businesses` table |
| Menu shows demo data | `NEXT_PUBLIC_SUPABASE_URL` missing in Pages env | Add env var, redeploy |
| CMS changes not live | KV binding missing | Add `MENU_CACHE` binding in CF Pages settings |
| Build fails on type-check | None — CI uses a placeholder slug | Check actual TS errors |
| Custom domain not working | DNS not propagated yet | Wait 5 min, check CNAME in CF DNS |
| Owner can't log in | Auth user creation failed | Check Supabase Auth → Users for their email |

---

## Theme reference

| Theme | Tier | Character |
|-------|------|-----------|
| `mercado` | basic | Bold street food, dark + red |
| `provenance` | basic | Premium white, organic/wellness |
| `terrain` | basic | Contemporary European, linen tones |
| `bazaar` | advanced | Vibrant Indian bazaar + Irani cafe |
| `nocturne` | advanced | Dark luxury lounge |
| `coastal` | advanced | Coastal/QR-native, ocean vibes |
| `aether` | premium | Organic blobs, air/space feeling |
| `onyx` | premium | Dark Parisian fine dining |
| `studio` | premium | Tactile textures, art gallery |

---

## Typical timings

| Step | Time |
|------|------|
| Create business (admin panel) | 1 min |
| Create CF Pages project | 3 min |
| Add deploy job + push | 2 min |
| GitHub Actions build + deploy | ~4 min |
| Custom domain SSL | 2–5 min |
| **Total** | **< 15 min** |
