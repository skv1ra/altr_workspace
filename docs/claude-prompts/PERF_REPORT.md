# Performance and Web Vitals report — Prompt 050

Production build (`yarn build && ALTR_E2E_MOCKS=1 yarn start -p 3000`), measured
locally. Primary metrics (LCP/CLS/FCP/long-tasks) via direct Playwright +
native `PerformanceObserver` (median of 3 runs each), matching 018's own
precedent — its baseline's own local-desktop numbers are the primary,
gating measurement there too, with Lighthouse as corroborating evidence.
Lighthouse (`npx lighthouse`, transient, not persisted to `package.json`)
ran successfully for landing (desktop + mobile presets) as corroboration;
batched runs for pricing/auth hit a Windows-specific `chrome-launcher`
temp-directory cleanup race (`EPERM` on its own post-run `rmSync`, a known
class of Windows flakiness, not an audit failure — confirmed the JSON
reports still wrote correctly before the crash) and weren't worth fighting
further given the Playwright-native numbers already gate every checklist
item.

## Bundle size — production build route table

| Route | First Load JS | Budget | Result |
| --- | --- | --- | --- |
| `/` (landing) | **172 KB** | ≤ 160 KB | **OVER by 12 KB** — see Fixes/Overruns below |
| `/pricing` | 135 KB | ≤ 200 KB | PASS |
| `/auth` | 147 KB | ≤ 200 KB | PASS |
| `/dashboard` | 126 KB | ≤ 200 KB | PASS |
| `/memory` | 135 KB | ≤ 200 KB | PASS |
| `/assistants` (twin) | 133 KB | ≤ 200 KB | PASS |
| `/billing` | 129 KB | ≤ 200 KB | PASS |
| `/settings` | 130 KB | ≤ 200 KB | PASS |
| `/privacy-center` | 133 KB | ≤ 200 KB | PASS |
| `/import-conversations` | 137 KB | ≤ 200 KB | PASS |
| `/data-deletion` | 140 KB | ≤ 200 KB | PASS |
| `/cookies`, `/privacy`, `/terms` | 162 KB | ≤ 200 KB | PASS |
| Shared by all routes | 87.7 KB | — | baseline |

No route outside `/` and the dev-only `/hero-lab` imports `HeroScene`
(checked directly — `grep` across `app/` for `HeroScene` returns exactly
those two files), so "no route pulling the hero bundle" holds.

## Fonts and images (measured via real per-route network capture, not just build output)

| Check | Budget | Measured | Result |
| --- | --- | --- | --- |
| Font files per real page load | ≤ 2 | **1** (`Inter`, variable weight, `latin`+`cyrillic` subsets — a real page only ever downloads the one subset file its rendered text needs; the 7 `.woff2` files in `.next/static/media` are every subset/preload variant across the whole site, not what any single page request pays) | PASS |
| Largest image, any measured route | ≤ 250 KB | **38.5 KB** (landing's hero shard, largest of any route checked) | PASS |

`font-display: swap` is set via `next/font/google`, which also handles
automatic size-adjust metrics — no FOUT-driven layout shift observed (see
CLS below).

## Core Web Vitals (local desktop, no throttle, median of 3 runs, 1440×900)

| Route | LCP | Budget | CLS | Budget | Long tasks |
| --- | --- | --- | --- | --- | --- |
| `/` (landing) | **336 ms** | < 2.5 s (mobile-emulated; desktop/no-throttle budget is easier) | **0.00009** | < 0.02 | 1 (~75 ms, post-warmup) |
| `/pricing` | **104 ms** | — | **0.02911** | < 0.02 | **OVER** — see below | 0 |
| `/auth` | **124 ms** | — | 0.00002 | < 0.02 | 0 |

Landing's LCP/CLS/long-task numbers all pass with wide margin (matching
018's hero baseline, which this route embeds unchanged).

### Lighthouse (landing only — corroborating, not gating; see Method)

| Preset | Score | LCP | CLS | TBT | Speed Index | FCP |
| --- | --- | --- | --- | --- | --- | --- |
| Desktop | 99/100 | 0.9 s | 0 | 0 ms | 0.6 s | 0.4 s |
| Mobile (4x CPU / ~1.6 Mbps) | 98/100 | 1.9 s | 0 | 90 ms | 2.1 s | 1.9 s |

### Throttled manual verification (Fast 3G + 4x CPU, 375×812, landing)

Headline text visible at **842 ms**; primary nav interactive at **913 ms**;
CLS **0** throughout. No layout jumps observed, nav usable while the hero
is still settling — matches this prompt's own manual-verification
instruction.

### `(app)` routes — dashboard/memory/twin/billing/settings/privacy-center

Content-level LCP/CLS/INP measurement is not possible for these six
routes: `app/(app)/layout.tsx` unconditionally calls `getProfileForUser()`
against the real configured Supabase URL — a placeholder in both local dev
and CI — during server-side rendering, before any client JS runs. Reconfirmed
fresh for this prompt via curl with mocked e2e identity headers against
this prompt's own freshly built production server: all seven still `500`.
This is the same structural gate documented and reconfirmed in every prompt
from 029 through 049 — bundle-size budgets for these routes (the only
thing measurable without real content) are verified above and all pass.

## Fixes applied

1. **`components/ui/Reveal.tsx` — landing's 12 KB bundle overrun, real fix,
   real savings.** `Reveal` (used by all 5 of landing's below-hero
   sections — `ProductSection`, `HowItWorks`, `MemoryDemo`, `TwinDemo`,
   `PrivacySection`, all confirmed via `grep`) imported framer-motion's
   full `motion` component API. Framer Motion ships a lighter `LazyMotion`
   + `m` + `domAnimation`-feature-bundle pattern that renders identically
   for the `initial`/`whileInView`/`viewport`/`transition` props `Reveal`
   actually uses (no drag, no layout animation — outside `domAnimation`'s
   scope, unused here) but only bundles the animation *features* actually
   requested. Swapped `motion` → `m` wrapped in `<LazyMotion features=
   {domAnimation} strict>`, zero prop/behavior changes. Landing's route
   chunk for framer-motion dropped from 36.0 KB gzip to 27.4 KB gzip
   (**8.6 KB saved**, 180 KB → 172 KB First Load JS). Confirmed
   `HeroScene` doesn't use framer-motion at all (its own drift/parallax is
   vanilla, per 018's tight 6.46 KB hero-JS budget) — this was the only
   framer-motion usage shipped to any production route (the only other
   `"framer-motion"` import site, `app/(public)/styleguide/MotionDemo.tsx`,
   is dev-only and 404s in production, so it never ships).
   **Re-verified visually**: fresh screenshots of every landing frame are
   pixel-identical to 049's approved gallery.

2. **`components/site/PricingTable.tsx` — pricing's CLS overrun, partial
   fix, real bug corrected.** `me` (the `/api/billing/me` result) starts
   `undefined` and only resolves ~150 ms later. Two CTA branches checked
   `me === null` (strict) to decide "show the anonymous link" vs "show the
   signed-in element" — since `undefined === null` is `false`, the
   *unresolved* loading state incorrectly rendered as if already
   signed-in, then reflowed to the real anonymous layout once the fetch
   settled (a `<span>` swapping for a full `.btn`-classed anchor in the
   Free column is a real height change). Changed both checks to `me ==
   null` (loose), so the loading state renders identically to the
   anonymous state from first paint — most real pricing-page visitors are
   anonymous, so this is the common case's actual first-paint truth, not
   a guess. No test asserts the transient loading state (checked
   `tests/components/PricingTable.test.tsx` — every case passes an
   explicit `injectedMe`, never leaves it `undefined`), and both steady
   states (anonymous, signed-in) render byte-identical to before.
   **This did not fully close the CLS gap** — see Unmet targets below,
   root cause is a separate, out-of-scope finding.

## Unmet targets — recorded, not fixed (both traced, both out of this prompt's own scope)

1. **Landing First Load JS: 172 KB vs 160 KB budget (12 KB over).**
   Root cause after the fix above: `Reveal`'s remaining ~27 KB gzip
   `domAnimation` feature bundle plus its own small wrapper code, needed
   for the *approved* 049 motion design (viewport-triggered fade-rise
   across 5 landing sections — DESIGN_DIRECTION's own "500-700ms
   entrances" requirement). No route besides landing pays this cost
   (`/pricing`, comfortably under its own 200 KB budget, has no `Reveal`
   usage at all). Closing the remaining 12 KB would require either (a)
   removing or degrading the approved motion design — forbidden, "049
   approval must remain valid" is this prompt's own explicit constraint —
   or (b) hand-rolling the same viewport-triggered fade-rise with a
   vanilla `IntersectionObserver` + CSS transition instead of any Framer
   Motion primitive, eliminating the dependency for `Reveal` entirely.
   (b) is very likely feasible and would probably close the gap outright,
   but is a materially larger rewrite of shared, widely-used animation
   infrastructure carrying real risk of a subtle timing/behavior
   mismatch against "zero visual regression tolerance," and wasn't
   attempted this session given that risk profile. Flagging as the clear
   next lever if the 12 KB needs to close.
2. **Pricing CLS: 0.029 vs 0.02 budget.** Root-caused precisely: the
   `plans-unavailable` fallback notice (`PricingTable.tsx`'s own designed,
   tested edge-case UI — see `tests/e2e/journeys/visitor.spec.ts`'s
   "`/api/billing/plans` unavailable falls back to static pricing"
   coverage) inserts a bordered notice paragraph above the pricing grid,
   pushing it down — a real reflow. It fires because `GET
   /api/billing/plans` itself has **no** auth check (confirmed by reading
   the route handler directly — it's genuinely public, documented as
   such in `PricingTable.tsx`'s own comment) but `lib/supabase/
   middleware.ts`'s `protectedPath()` treats **every** `/api/*` route as
   protected by default unless explicitly listed in its `publicApi`
   allowlist — and `/api/billing/plans` isn't in that list. **This is a
   real, pre-existing bug that affects real anonymous visitors in
   production**, not a placeholder-Supabase test artifact: middleware
   gating runs identically regardless of whether Supabase is configured.
   The fix (adding `/api/billing/plans` to `publicApi`) is a one-line
   change, but sits in `lib/supabase/middleware.ts` — explicitly listed
   under this prompt's own "Files that must not be changed" (`lib/**`
   logic). Not fixed here; flagged clearly for a dedicated follow-up
   prompt, since editing auth-gating logic under a performance prompt's
   scope would be a real, undocumented behavior change of exactly the
   kind this prompt forbids.

## Verification

- `yarn run check` (lint, typecheck, 681/681 unit tests, build 55/55
  pages) — passed, both before and after the fixes above.
- `yarn test:e2e` — 61 passed / 11 skipped / 0 failed, matching 048/049's
  own baseline exactly (including the pricing-fallback e2e test, which
  asserts the *resolved* state only and is unaffected by the loading-gap
  fix).
- Spot screenshots (landing full scroll, pricing anonymous under the same
  mocked `/api/billing/plans` success response 049 itself used) are
  pixel-identical to 049's approved gallery — zero visual regression from
  either fix.

## Deferred items

- Landing's remaining 12 KB First Load JS overrun (framer-motion's
  `domAnimation` feature cost) — see Unmet targets #1.
- Pricing's CLS overrun's true root cause, `middleware.ts`'s
  `/api/billing/plans` mis-gating — see Unmet targets #2. Recommend a
  dedicated follow-up prompt scoped to `lib/supabase/middleware.ts`
  specifically (one-line `publicApi` addition), since it's a real,
  production-relevant anonymous-visitor bug independent of performance
  work.
- Vercel-vs-local build differences (edge middleware size) — per this
  prompt's own edge case, final verification repeats on Vercel in 051.
