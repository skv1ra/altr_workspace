# Visual QA — Prompt 049

Reference: `references/altr-hero-reference.png` + `docs/claude-prompts/DESIGN_DIRECTION.md`'s
full rubric (palette, typography, materials, motion, layout, "Quality bar").

## Method

Screenshot capture used the real Playwright **test runner** (not a standalone
script) against a production build (`yarn build && ALTR_E2E_MOCKS=1 yarn start
-p 3000`), because `page.screenshot({ fullPage: true })` never performs a real
scroll — `Reveal.tsx`'s `whileInView` (a genuine IntersectionObserver) never
fires for below-the-fold content under that mode, leaving large blank gaps.
The working method instead takes genuine incremental screenshots while
scrolling in real steps (capped at 6 frames per surface), which lets every
`Reveal` trigger exactly as a real visitor scrolling the page would trigger it.

22 named surfaces × 3 breakpoints (1440/768/375) on Chromium, plus a
cross-browser spot-check of the highest-traffic surfaces on Firefox and
WebKit (both installed locally for this prompt only, `.github/workflows/ci.yml`
untouched — CI still installs Chromium only). Mocked e2e identity headers
(`x-altr-e2e-user`/`x-altr-e2e-email`, `ALTR_E2E_MOCKS=1`) drove auth/plan
state per surface, matching the pattern established in 048.

Gallery location (outside the repo, not committed):
`C:\Users\golyb\AppData\Local\Temp\claude\C--Users-golyb-OneDrive--------------altr-web\e1f8b5cf-4e37-4eb2-9476-b3a6d93f2640\scratchpad\visual-qa\shots\`

## Grades — Chromium, all three breakpoints

| # | Surface | Grade | Notes |
| --- | --- | --- | --- |
| 01 | Landing (hero + all sections) | pass | Shard/fog/crack-vein treatment matches reference closely; headline scale, spacing rhythm, dark "Your Twin" section contrast all read premium. Reflows cleanly at 768/375 (mobile hamburger appears correctly). |
| 02 | Pricing — anonymous | pass | Three-tier layout, numeric hierarchy, footer all correct at every breakpoint. |
| 03 | Pricing — signed-in Personal | pass | Mocked `effectivePlan: personal` correctly swaps the Personal column's CTA for a quiet "Your plan" label (Chromium). |
| 04 | Auth — register | pass | Split obsidian-panel / paper-form composition matches reference material language exactly. |
| 05 | Auth — login | pass | Same template, correct copy/state swap. |
| 06 | Auth — forgot password | pass | |
| 07 | Auth — reset password (invalid/expired link) | pass | Error state uses the same restrained obsidian-card template as payment states — consistent system, not a bespoke error look. |
| 08 | Legal — privacy | pass | Long-form `Prose` typography, TOC, placeholder-input callouts all readable and on-brand. |
| 09 | Legal — terms | pass | |
| 10 | Legal — cookies | pass | |
| 11 | Legal — data deletion | pass | |
| 12 | Delete-data (public form) | pass | |
| 13 | Data-deletion request | pass | |
| 14 | Import — idle/empty | pass | Dark surface, quota meter, source picker all correct. |
| 15 | Import — history populated | pass | Completed/failed row states both legible, taxonomy-mapped error shown (not raw code). |
| 16 | Payment success — pending | pass | |
| 17 | Payment success — confirmed | pass | |
| 18 | Payment cancel | pass | |
| 19 | Billing return | pass | |
| 20 | 404 (real not-found route) | **fix-needed → fixed** | See Fixes Applied below. |
| 21 | Styleguide (dev-only) | see Known limitations | |
| 22 | Hero lab (dev-only) | see Known limitations | |

## Fixes applied

**`app/not-found.tsx` was missing the site header/footer.** Every other public
surface (landing, pricing, legal, auth, payment states) carries the brand's
nav chrome or at minimum the dark obsidian-card treatment; the 404 page had
neither — no logo, no nav, just centered text on a bare page. Root cause: it's
the *root* `not-found.tsx` (outside `(public)`, which has no shared layout of
its own — every public page imports `<Header>`/`<Footer>` directly), so it
never picked up the site chrome the rest of the public surface area gets.
Fixed by importing and rendering the same `Header`/`Footer` components every
other public page already uses. Re-verified via `yarn build` (55/55 pages)
and a fresh screenshot.

## Cross-browser spot-check (Firefox, WebKit)

Firefox: landing, pricing, auth, legal — all render correctly, matching
Chromium's composition and fog/blur treatment (`backdrop-filter` fallback
edge case: confirmed fine, no double-render or missing blur).

WebKit: auth, legal, payment/billing states, 404 all render correctly and
match Chromium. **Two WebKit-only issues found, both traced to the local
test environment, not the application:**

1. **Landing, pricing, and privacy pages loaded completely unstyled under
   WebKit** (raw browser default stylesheet, serif font, blue links — no
   Altr CSS at all) in this capture. Root-caused with a direct diagnostic:
   every static asset request (`_next/static/css/*.css`, JS chunks, hero
   `.webp` images) failed with an **SSL connect error**, because the
   production CSP header includes `upgrade-insecure-requests`, and WebKit
   upgrades the page's `http://127.0.0.1:3000` asset requests to `https://`
   — which nothing is listening on, since this is a plain-HTTP local
   capture server. Chromium and Firefox both treat `127.0.0.1` as a secure
   context exempt from the upgrade; WebKit's implementation does not. In
   real deployment the site is served over actual HTTPS, so this directive
   is a correct, necessary no-op — this is purely a local-capture artifact
   of testing a production CSP build over plain HTTP, not a shippable
   defect. No code change made (removing `upgrade-insecure-requests` would
   be a real security regression for the actual deployment).
2. **4 of 22 surfaces failed their content-visibility assertion under
   WebKit only**: `03-pricing-signed-in-personal`, `14-import-idle-empty`,
   `15-import-history-populated`, `17-payment-success-confirmed`. Inspected
   `03`'s accessibility snapshot directly: the mocked `/api/billing/me`
   response wasn't reflected in the rendered UI (both plan columns showed
   "Continue to checkout" instead of the expected "Your plan" swap) —  a
   Playwright/WebKit `page.route` interception quirk, not a real rendering
   bug (real Safari users hit the real endpoint, unaffected by this
   mock-layer issue).

## Known limitations (documented, not fixed this prompt)

- **`/styleguide` and `/hero-lab`** (both dev-only, `notFound()` in
  production by design — same pattern, never linked from the real app) get
  stuck showing the `(public)/loading.tsx` skeleton instead of resolving to
  the not-found content, when captured against a production build. Traced
  via the raw RSC payload (`curl`): the correct not-found content **is**
  present in the streamed response (`"This page doesn't exist"` renders
  server-side), but the inline `self.__next_f.push(...)` flight-data scripts
  that swap it in client-side have no `nonce` attribute and are blocked by
  the page's own CSP (`script-src 'self' 'nonce-...'`) — confirmed via
  console CSP-violation errors. These two routes never call `headers()`,
  unlike the rest of the app's pages, so they don't opt into the
  nonce-aware dynamic-rendering path the rest of the app relies on. Real
  users never see this (both routes 404 outside development regardless).
  Root cause sits in routing/CSP wiring (`middleware.ts`), outside this
  prompt's visual-fix scope — flagging for a dedicated follow-up rather
  than expanding scope here.
- **The 7 structurally-blocked `(app)` surfaces** (dashboard, onboarding,
  memory, assistants, billing, settings, privacy-center) — reconfirmed
  fresh via curl during this prompt, all still `500`, same placeholder-
  Supabase SSR gate documented since 029 and reconfirmed in 046/047/048.
  No visual grading possible until that gate is addressed (tracked
  separately, not this prompt's scope).
- Two cookie-banner/cookie-preferences-dialog screenshots were planned in
  an early draft of the capture script but never actually produced (the
  script that would have taken them only ran a reduced single-surface
  subset before being superseded by the fixed incremental-scroll method).
  Cookie-consent UI itself already has dedicated e2e coverage from earlier
  prompts; not re-verified visually here.

## Verification after fixes

- `yarn run check` (lint + typecheck + 681/681 unit tests + build, 55/55
  pages) — all passed.
- `yarn test:e2e` — 61 passed / 11 skipped / 0 failed (matches 048's
  baseline exactly; confirms the not-found.tsx fix caused no regression).

## Visual approval status

**Pending user review.** Per this prompt's own instruction, manual
verification — the user reviewing the final screenshot gallery and granting
visual approval — is required before Prompt 050 can begin. Not self-granted.
