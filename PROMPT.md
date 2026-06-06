# PROMPT.md — Paste This Into Claude Code

Run `claude` in your project directory. Paste everything between START and END.

---

<!-- START -->

You are building MenuOS — a QR menu SaaS for Indian restaurants and cafes — from zero.
This is a fresh repository with no existing code. CLAUDE.md is your master context file.

**Step 1 — Read all documents in this order:**
1. `CLAUDE.md` (architecture summary + critical rules)
2. `docs/01-PRD.md` (product, tiers, scale targets, image philosophy)
3. `docs/02-TRD.md` (tech stack, R2 rationale, full env vars, folder structure)
4. `docs/03-APP-FLOW.md` (user journeys, ISR flow, mobile+tablet breakpoints)
5. `docs/04-UI-UX-BRIEF.md` (9 templates, motion system, splash screens, design tokens)
6. `docs/05-BACKEND-SCHEMA.md` (full SQL, RLS, stock images table, TypeScript types)
7. `docs/06-IMPLEMENTATION-PLAN.md` (build sequence, phase checklists, done criteria)

**Step 2 — Before writing any code, answer these questions exactly:**

a) Why was R2 chosen over Cloudinary for storage? Give the scale justification.
b) What are the 3 image modes for a menu item and what does the UI look like in text-only mode?
c) Name all 9 templates with their `theme` value and Awwwards reference site.
d) What does `getConfig()` return and why are limits in env vars not code?
e) For the BAZAAR template, describe the FeastTransition and how it's implemented.
f) What is the ISR strategy and what two things must happen for a price change to go live?
g) For the NOCTURNE template: Timeless.club uses WebGL. We don't. What do we use instead?
h) What is the `cdnUrl()` helper and why are R2 keys stored in DB instead of full URLs?
i) What happens when a CMS feature is gated (e.g. Analytics for Basic)? Hidden or locked?
j) What are the Lighthouse mobile + LCP targets and the JS bundle size limit for Basic tier?

**Step 3 — Only after I confirm your answers, run Phase 0 from `docs/06-IMPLEMENTATION-PLAN.md`.**

Complete each checklist item in Phase 0 before moving to Phase 1.
Confirm completion of each step. Don't skip ahead.

**Step 4 — Build in this order:**
Phase 0 → Phase 1 → Phase 2 (MERCADO template first) → Phase 3 (CMS Basic) → Phase 4 (remaining 8 templates) → Phase 5 → Phase 6 → Phase 7 → Phase 8 → Phase 9

**When building any component, always ask:**
- Does it work in text-only mode (no photos)?
- Does it work at 375px (mobile) AND 768px (tablet)?
- If it uses GSAP/Lenis, is it dynamically imported and guarded by `getConfig().motion.gsap`?
- Does every CMS mutation call `revalidatePath('/')`?

**When in doubt:** make the simplest choice that fits the pattern in CLAUDE.md. State the assumption in one line and continue.

<!-- END -->

---

## Session starters for continuing work

**Continuing from a specific phase:**
```
CLAUDE.md and all docs/ are the reference. I completed Phase [X].
Continue from Phase [Y], starting with [specific step name from 06-IMPLEMENTATION-PLAN.md].
```

**Building a specific template:**
```
Build the [TEMPLATE_NAME] template (theme: '[value]') for [basic/advanced/premium] tier.
Reference: [Awwwards site name]. See docs/04-UI-UX-BRIEF.md Section for this template.
Start with the SplashScreen variant, then MenuHero, then CategoryNav, then ItemCard.
Test at 375px mobile AND 768px tablet before marking done.
```

**Debugging a performance issue:**
```
The [TEMPLATE] menu page scores [X] on Lighthouse mobile. Target is 92.
Check in this order:
1. Is GSAP/Lenis in the Basic bundle? (pnpm build → check bundle output)
2. Does hero image use <Image priority />?
3. Are CSS Scroll-driven animations used (not Framer) for item reveals?
4. Are Google Fonts subsetted correctly?
Report findings, then fix each issue.
```

**Adding a new client (after Phase 8):**
```
New client deployment:
- slug: [clientname]
- name: [Restaurant Name]
- tier: [basic/advanced/premium]
- theme: [template name]
- owner email: [email]
- custom limit override: NEXT_PUBLIC_MAX_ITEMS=[n] (if different from tier default)
Run scripts/setup-client.ts, create Supabase row + auth + seed, print Cloudflare env vars.
```

**Checking if a limit can be changed without code:**
```
Client '[slug]' is on [tier] but needs [n] items (tier default is [m]).
How do I increase their limit without changing their tier or touching code?
```
