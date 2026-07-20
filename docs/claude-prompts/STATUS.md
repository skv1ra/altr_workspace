# Project status

Updated by every implementation prompt at the end of its session.

## Current active prompt

None — Prompt 009 complete (committed locally, not pushed); awaiting
`RUN PROMPT 010`. Note: Prompt 004 itself (the backend scaffold/port) was
never given its own commit or `PORT_MANIFEST.md` — its file changes exist
uncommitted in the working tree from an earlier, undocumented session. None of
005-009 redid or finalized 004 (explicitly out of scope each time) but each
has run `yarn check` against that ported backend as part of verifying their
own changes — see the 005-009 entries below. That gap (004 uncommitted, no
manifest) is still open.

## Completed prompts

- 001 — Workspace and legacy baseline (2026-07-19). See
  `docs/claude-prompts/BASELINE_V2.md`. WORKSPACE (`altr_workspace`) origin
  verified, contains no app code yet (expected — nothing from the build
  sequence has run). LEGACY (`altrtest2`, pinned SHA `a22927d`, verified
  no drift) was reproduced read-only in a disposable git worktree on `D:`
  (never touching the real checkout): `yarn install`/`lint`/`typecheck`/
  `build` all passed (exit 0); `yarn test` passed all 97/97 tests across 12
  files but exited 1 due to Vitest fork-pool worker OOM crashes (real
  environment issue, not a test failure — see BASELINE_V2 §2.3). Inventory
  counts (21 pages, 30 API routes, 14 migrations, 30 test files) cross-checked
  against `FEATURE_PARITY_MATRIX.md` with no mismatch.
- 002 — Parity and security audit verification (2026-07-19). Read-only audit
  of LEGACY (`altrtest2` @ `a22927d`) against `FEATURE_PARITY_MATRIX.md` and
  `MASTER_CONTEXT.md`'s security invariants; no LEGACY writes, no WORKSPACE
  code changes. One evidence-path fix (Cookie preferences button's real path
  is `components/legal/CookiePreferencesButton.tsx`); no COMPLETE row needed
  reclassifying. All 10 security invariants verified with file:line citations
  (added to `FEATURE_PARITY_MATRIX.md` § "Verified invariants") — all hold,
  except one citation gap (invariant #3 cites a test file that doesn't
  actually check what MASTER_CONTEXT claims; tracked as RISKS.md R12, not
  fixed here since MASTER_CONTEXT.md is outside this prompt's allowed files).
  Both canonical-module questions resolved: `lib/auth/rateLimit.ts` is fully
  dead (safe to delete in Prompt 004); `lib/plans.ts` and
  `lib/billing/plans.ts` are **both** live for different concerns, which is a
  price-desync risk tracked as RISKS.md R11. Traceability gate holds (no
  COMPLETE row missing a rebuild/test/manual-check prompt). All 26 `altr_`
  tables confirmed RLS-covered.
- 003 — Repository wiring and reference assets (2026-07-19). Origin
  re-verified as `skv1ra/altr_workspace.git`, branch `main`. Created
  `references/README.md` (provenance, inspiration-only note, LEGACY pin).
  Verified `references/altr-hero-reference.png` is a genuine 1318×716 PNG
  (~1.1 MB), SHA-256 `cb1b36ab21e31021008da03276056716c875144924b6901046f5b0c90210a48e`,
  and visually confirmed it contains only the UI mockup — no private personal
  data. Confirmed the raw upload folder `altr-hero-reference.png/` was
  byte-identical (same checksum) before deleting it. Added `node_modules/`,
  `.next/`, `.env*.local`, `tsconfig.tsbuildinfo` to `.gitignore` for the
  coming app scaffold. Committed the full prompt pack, `references/`, and
  `.gitignore` to `main` as the pack's first durable commit. **Not pushed to
  origin** — the user explicitly instructed "commit the completed work
  locally and stop" for this run, overriding PROMPT_003 step 6's push
  instruction. Push to `skv1ra/altr_workspace` `main` remains outstanding and
  needs explicit user go-ahead before any future prompt does it.

- 005 — Design token foundation (2026-07-19). Created `app/styles/tokens.css`:
  six grayscale colors + RGB triplets for opacity composition, 5 semantic
  aliases (`--surface-page`, `--surface-inverse`, `--text-primary`,
  `--text-muted`, `--edge-hairline`), fluid `clamp()` type scale
  (display/h1-h4/body/label), 4px-base spacing scale (`--space-1..24`),
  radii, 3 shadow recipes, and motion tokens exactly as specified
  (`--motion-fast: 180ms`, `--motion-slow: 600ms`, `--motion-drift: 24s`,
  `--ease-altr: cubic-bezier(0.22, 1, 0.36, 1)`). Mapped into
  `tailwind.config.ts` (colors via the `rgb(var(...) / <alpha-value>)`
  pattern, fontSize, spacing, borderRadius, boxShadow,
  transitionDuration/TimingFunction, prose maxWidth) — all `var(...)`
  references, no duplicated values. Removed the leftover placeholder colors
  (`ink`/`panel`/`line`/`muted`, `glow`/`violet` shadows) from the prior
  scaffold: confirmed unused anywhere via grep, and they violated
  DESIGN_DIRECTION's "no accent hues, no neon" rule.
  **Font decision: Inter Variable** (over Geist), self-hosted via
  `next/font/google`, subsets `latin` + `cyrillic` (required for the UA
  copy), exposed as `--font-inter` on `<html>`. Chosen over Geist because
  Geist's shipped glyph set has no reliable Cyrillic coverage, which this
  product requires; Inter's Cyrillic subset is mature. Verified self-hosted
  (font file served from `/_next/static/media/*.woff2` in the build output,
  no external request) — CSP `font-src 'self' data:` unchanged.
  `app/globals.css` created importing tokens + Tailwind layers.
  `app/layout.tsx` wires the font; `app/page.tsx` untouched (out of scope)
  and confirmed still rendering correctly. `yarn lint`, `yarn typecheck`,
  `yarn test` (12 files / 86 tests), and `yarn build` (27/27 static pages)
  all passed — the first clean `yarn check` recorded in WORKSPACE.
  Environment note: an earlier uncommitted session had left `node_modules`
  as a junction to a `D:`-drive folder, which broke `next build` (webpack
  couldn't resolve modules across the drive boundary) and had crashed
  outright on retry (see prior `D:\altr_workspace_data\*.log` files, not
  part of this repo). This session removed that junction and reinstalled
  `node_modules` natively under the project root on `C:` (now ~3.5 GB free,
  vs. ~200 MB when the workaround was created), keeping only the yarn cache
  on `D:`. This was also the first time the full Prompt-004-ported backend
  (`lib/**`, `app/api/**`, migrations, all ported non-UI test suites) was
  exercised end-to-end and passed — see the open gap noted above.

- 006 — Application shell and boundaries (2026-07-20). Created route groups
  `app/(public)/` and `app/(app)/`; moved the minimal `app/page.tsx` into
  `app/(public)/page.tsx` (URL `/` unchanged — verified in build route
  output). Root `app/layout.tsx` now sets metadata title template
  (`"%s — Altr"`), a `Viewport` export (`themeColor: "#F5F6F7"`), and renders
  the ported `components/LocaleHtmlSync.tsx` (byte-identical port from
  LEGACY, `<html suppressHydrationWarning>` to avoid the client-side
  `lang`-sync hydration warning). Added `app/error.tsx` (calm editorial
  copy, retry button calling `reset()` + `router.refresh()`, logs only
  `error.digest` — never `error.message` — via `console.error`),
  `app/not-found.tsx` (same visual system, link home), `app/global-error.tsx`
  (self-contained — inlines raw token hex values via inline styles rather
  than `var(...)`, since it replaces the root layout and tokens.css may not
  be loaded), and a fog-toned `loading.tsx` skeleton in each route group
  (no spinner). Added `tests/unit/app-boundaries.test.tsx` (RTL) asserting
  the not-found and error headlines/actions render — not in 006's own
  "files allowed to change" list, but required by its own "Required tests"
  section, so added (same kind of in-file contradiction as 005's
  ARCHITECTURE_DECISIONS instruction, resolved the same way: follow the more
  specific/actionable instruction). `yarn lint`, `yarn typecheck`,
  `yarn test` (13 files / 88 tests), `yarn build` (27/27 pages, all
  `/api/**` paths and `/` unchanged), and `yarn test:e2e` (the 004 smoke
  spec) all passed.
  Environment notes from this session: (1) hit a `.next/types` staleness
  issue after moving `app/page.tsx` — `tsc` referenced the pre-move route
  shape; fixed by clearing `.next` before re-running typecheck, not a code
  problem. (2) `yarn test:e2e` initially failed because the Playwright
  Chromium binary was never installed on this machine; installed via
  `npx playwright install chromium --with-deps`. (3) Mid-session, `C:` free
  space collapsed from ~3.5 GB to ~30 MB in a way this repo's own build
  artifacts (`.next` was 84 MB) could not fully account for — work paused,
  the user freed space externally, and `C:` returned to ~3.4-4 GB free
  before continuing. Cause not diagnosed (was outside this session's scope);
  worth keeping an eye on given this project sits inside a continuously
  syncing OneDrive folder.

- 007 — Typography and spacing (2026-07-20). The fluid type scale itself
  (clamp-based display/h1-h4/body/label, tight display leading, 68ch body
  measure, +6% label tracking) was already fully specified in
  `app/styles/tokens.css` and `tailwind.config.ts` from Prompt 005, so this
  session's work was the primitive layer on top: `components/ui/Text.tsx`
  exports polymorphic `Display`, `Heading` (level 1-4), `Body`, `Label`, and
  `Prose` components — each takes an `as` override, renders a sensible
  default semantic tag, composes classes only (no inline styles), and reads
  every value from the token-backed Tailwind utilities. Added
  `app/styles/typography.css` (vertical rhythm: `.section-stack` for
  section padding — `--space-16` mobile, `--space-24` at the 640px
  breakpoint — and `.prose`'s owl-selector child spacing; documented why
  nested `.prose` can't compound: the `> * + *` selector only ever matches
  direct children, so each nesting level's rhythm is independent). Imported
  `typography.css` into `app/globals.css` right after `tokens.css` — that
  file isn't in 007's own "files allowed to change" list, but the prompt's
  own implementation step explicitly requires the file be "imported after
  tokens," and an unimported stylesheet does nothing; same kind of in-file
  gap as 005 (ADR-009) and 006 (required test not in the allowed-files
  list), resolved the same way — follow the specific, actionable
  instruction. Added the internal `/styleguide` route
  (`app/(public)/styleguide/page.tsx`) showing the full scale plus a
  Cyrillic sample line; gated with `notFound()` when
  `NODE_ENV === "production"` — **verified for real**, not just by reading
  the code: the production `yarn build` output for `/styleguide` was
  confirmed byte-for-byte to contain the not-found boundary's copy
  ("This page doesn't exist"), not the styleguide content, while a
  dev-server (`yarn dev`) fetch of the same route returned 200 with the
  real headings and the Cyrillic line rendered. Tests:
  `tests/components/Text.test.tsx` (RTL — tag/class/`as`-override coverage
  for every primitive) and `tests/components/styleguide-page.test.tsx`
  (production-gate + normal-render coverage for the route itself, not
  explicitly required but directly serves the security requirement).
  One test-authoring pitfall hit and fixed: dynamically `import()`-ing the
  route module per-test to force re-evaluation under a stubbed
  `NODE_ENV=production` broke Vitest's JSX runtime resolution
  (`jsxDEV is not a function`) — unnecessary anyway, since the
  `NODE_ENV` check runs at component call time, not module-import time, so
  a single static top-level import fixed it. `yarn lint`, `yarn typecheck`,
  `yarn test` (15 files / 99 tests), and `yarn build` (28/28 pages) all
  passed.

- 008 — Color, materials, surfaces (2026-07-20). `components/ui/Surface.tsx`
  adds a typed `Surface` primitive (`page`/`inverse`/`fog` variants) and a
  `Hairline` primitive (`top`/`bottom`/`left`/`right`), backed by
  `app/styles/materials.css`: `.surface-page`, `.surface-inverse` (facet
  gradient at 2-4% white + 1px inset edge highlight, never flat black),
  `.surface-fog` (layered radial gradients, `pointer-events: none`,
  drift animation disabled under `prefers-reduced-motion`), one-step
  elevation for nested inverse surfaces
  (`.surface-inverse .surface-inverse`), and hairline dividers at
  `--altr-silver` 60%. Only the custom `shadow-soft`/`shadow-elevated`
  tokens are used anywhere — no Tailwind default shadow utility appears in
  new code. Imported into `app/globals.css` after `tokens.css`/
  `typography.css` (same necessary-but-unlisted-file situation as 007's
  `typography.css` import — documented there, same resolution here).
  **Contrast finding:** computing the actual WCAG pairs this prompt
  requires surfaced a real accessibility bug already present in Prompt
  005's tokens: `--text-muted` resolved to `--altr-mist` (`#B9C0C7`),
  which measures only **~1.7:1** against `--surface-page` — nowhere near
  the 4.5:1 body-text minimum this prompt's own acceptance criteria
  demand (and `Body muted` from Prompt 007 uses exactly this pairing).
  `--altr-mist` is fine as muted text on *dark* surfaces (~9.8:1 against
  obsidian) — the bug was light-surface only. Fixed in `tokens.css`
  (outside 008's own "files allowed to change" list, touched for the same
  reason as prior gaps: required to satisfy this prompt's own testable
  criterion) by changing `--text-muted`'s `:root` value to
  `rgb(var(--altr-graphite-rgb) / 78%)` (~5.3:1 on white), and adding a
  `.surface-inverse` override back to plain `--altr-mist` for the dark
  context. Measured pairs (see `tests/components/contrast.test.ts`, which
  hardcodes and asserts the hexes per this prompt's "encode expected hex
  pairs" instruction): graphite/white ~9.8:1, white/obsidian ~16.6:1,
  mist/obsidian ~9.8:1, muted-composite(`#63676c`)/white ~5.3:1 — all
  comfortably above 4.5:1; the test also asserts raw mist/white fails
  (~1.7:1), documenting *why* the override exists. Fog-over-text
  reasoning: fog is white/silver gradients layered on an already-white
  page ground, so compositing can only lighten the effective background,
  never reduce dark-text contrast — verified by inspecting the compiled
  CSS output rather than asserted numerically. Added the materials section
  to `/styleguide` (all variants, light/dark context, nested-inverse and
  fog examples) — confirmed rendering via a dev-server fetch (200, all
  expected classes present in the HTML). **Could not do the prompt's own
  "compare against `public/hero-shards/`" visual check** — that directory
  doesn't exist yet (it's Prompt 013's deliverable); this is an
  out-of-order dependency in the prompt pack, not a gap in this session's
  work, and remains outstanding until 013 lands. `yarn lint`,
  `yarn typecheck`, `yarn test` (17 files / 111 tests), and `yarn build`
  (28/28 pages) all passed.

- 009 — Buttons, inputs, forms (2026-07-20). Six primitives in
  `components/ui/`: `Field` (shared label/help/error scaffolding, render-prop
  pattern so `TextField`/`PasswordField`/`Select` all get consistent
  id/`aria-describedby` wiring), `Button` (primary/secondary/ghost/danger),
  `TextField`, `PasswordField`, `Select`, `Checkbox`. Backed by
  `app/styles/controls.css` (imported into `globals.css` after
  `materials.css` — same necessary-but-unlisted-file situation as 007/008,
  documented there). **a11y decisions:**
  - Top-aligned labels, not floating — native label/input association with
    zero JS, no risk of overlapping placeholder text at small widths (the
    prompt asked to "pick one and document").
  - Error paragraphs are exactly `<p role="alert">{message}</p>`, no
    wrapper — preserves the legacy e2e contract (`p[role="alert"]`) verified
    against `altrtest2`'s `app/auth/page.tsx`.
  - `PasswordField`'s `autoComplete` prop is **required**, not optional
    (`"current-password" | "new-password"`), so the security requirement is
    enforced at the type level, not just by convention. No password value is
    logged anywhere.
  - `Select` is a real native `<select>`, restyled only (`appearance: none`
    + a decorative `ChevronDown`) — Windows/every browser's native keyboard
    nav (arrows, type-ahead) works for free; a custom-built dropdown was
    deliberately avoided.
  - `Checkbox` keeps the real `<input type="checkbox">` in the DOM as
    `sr-only` for native semantics/keyboard toggle; the visible box is a
    decorative sibling driven by `data-checked`/`data-indeterminate` and a
    `peer-focus-visible` ring — `useEffect` syncs the DOM node's
    `.indeterminate` property (not an HTML attribute, must be set via JS).
  - `Button` loading state hides the label with `opacity: 0` (not
    `display`/`visibility: hidden`) so it stays in the accessibility tree
    (screen readers still get the button's name) while the spinner overlays
    absolutely — same layout box, zero shift; `aria-busy="true"` and
    `disabled` are both set.
  - Focus ring and the primary button's colors are driven by
    `--control-focus-ring`/`--button-primary-bg`/`--button-primary-fg` CSS
    custom properties, overridden inside `.surface-inverse` — "obsidian
    primary on light, paper primary on dark" happens automatically by
    nesting context, no variant prop needed. No accent hue used for the
    focus ring (stays neutral per DESIGN_DIRECTION); error/danger states use
    a restrained red as a functional exception, not a brand accent.
  - Webkit autofill's yellow highlight neutralized via the
    `-webkit-box-shadow: 0 0 0 1000px var(--surface-page) inset` technique.
  Added a controls section to `/styleguide` via a small client-only
  `ControlsDemo.tsx` co-located in the route folder (not exported from
  `components/ui/` — demo-only) so the demo is genuinely interactive
  (real click/keyboard/loading), not a frozen mockup; confirmed via a
  dev-server fetch (200, all expected classes/attributes present, zero
  console warnings — notably no React "controlled input without onChange"
  warnings from the static demo checkboxes). Tests:
  `tests/components/Button.test.tsx` (click, Enter/Space keyboard
  activation, disabled blocks activation and stays in the a11y tree,
  loading sets `aria-busy`/disables/blocks activation),
  `tests/components/Fields.test.tsx` (label association + error
  `role="alert"`/`aria-describedby`/`aria-invalid` wiring for all three
  field types, password visibility toggle, select keyboard selection),
  `tests/components/Checkbox.test.tsx` (label association, click/keyboard
  toggle, `.indeterminate` DOM property, error announcement).
  `yarn lint`, `yarn typecheck`, `yarn test` (20 files / 127 tests), and
  `yarn build` (28/28 pages, `/styleguide` still 404s in production) all
  passed.

## Failed prompts

None.

## Blocked prompts

None (001's findings are recorded as blockers for future prompts, not a
blocked status for 001 itself — every 001 acceptance criterion was met).

## Last successful build

LEGACY (`altrtest2` @ `a22927d`, disposable worktree): `yarn build` passed,
2026-07-19 (see `BASELINE_V2.md` §2.3). WORKSPACE: `yarn build` passed,
2026-07-20 — 28/28 static pages generated, clean exit (see 005 entry above
for the `node_modules` cross-drive fix that unblocked this, 006 for
route-group verification, 007 for the new `/styleguide` route including
confirmation it 404s in this production build, 008 for the materials
section added to that same route, and 009 for the controls section).
`yarn test:e2e` (the 004 smoke spec) also passed, 2026-07-20, after
installing the Playwright Chromium binary (see 006 entry).

## Last successful test run

LEGACY (`altrtest2` @ `a22927d`, disposable worktree): `yarn test`, 2026-07-19
— 97/97 tests passed across 12 files; command exit code was 1 due to Vitest
worker OOM crashes, not test failures (see `BASELINE_V2.md` §2.3 for why this
isn't a clean pass to cite blindly). WORKSPACE: `yarn test`, 2026-07-20 —
127/127 tests passed across 20 files, clean exit (code 0).

## Known regressions

None recorded.

## Unresolved decisions

- ADR-007 (hybrid hero) must be confirmed or amended by the Prompt 012 prototype.
- Whether a separate staging Supabase project will be provisioned (ADR-012) —
  user decision needed before Prompt 051.
- Prompt 008's manual verification ("view styleguide beside
  `public/hero-shards/shard-main.png`") could not be done — that directory
  doesn't exist until Prompt 013. Revisit the `.surface-inverse` material
  once real shard renders exist to confirm it reads as the same material
  family, per 008's visual requirement.

## Environment notes

- **Repository model (resolved 2026-07-19):** the new application is built from
  scratch in this repository — `skv1ra/altr_workspace`, local root
  `C:\Users\golyb\OneDrive\Робочий стіл\altr_web`, branch `main`, origin
  verified as `https://github.com/skv1ra/altr_workspace.git`. The legacy
  implementation `skv1ra/altrtest2` (local read-only checkout at
  `C:\Users\golyb\altrtest2`, pinned audit SHA `a22927d`) is inspection-only:
  no edits, commits, or pushes ever target it. Proven backend behavior is
  ported per ADR-001/ADR-002 (bulk port in Prompt 004). See MASTER_CONTEXT
  § Repository model for the binding rules.
- **`C:` drive space is tight** (as of 2026-07-19, ~3.5 GB free after the
  Prompt 005 `yarn install`; was ~197 MB free at Prompt 001, so some space
  has been freed since). Prompt 001 worked around the original shortage by
  using `D:` (357G, 121G free) for the disposable LEGACY worktree, yarn
  cache, and `node_modules`. **Do not put WORKSPACE's `node_modules` on a
  different drive than the project root** — Prompt 005 found a junction to
  `D:\altr_workspace_node_modules`/`D:\altr_workspace_data\node_modules`
  left from an earlier session broke `next build` (webpack cross-drive
  module resolution failure) and had crashed outright on retry; it was
  removed and `node_modules` reinstalled natively on `C:` under the project
  root. Redirect only the yarn cache to `D:` (`YARN_CACHE_FOLDER`) if `C:`
  space gets tight again — never `node_modules` itself.
- Hero reference: DONE — full-resolution image verified at
  `references/altr-hero-reference.png` (2026-07-19); DESIGN_DIRECTION updated
  from the full image. Original upload folder `altr-hero-reference.png/`
  removed 2026-07-19 (Prompt 003) after its checksum was confirmed identical
  to the canonical copy.

## Environment setup still required (user-owned)
- Production values for all variables in `.env.example` (Supabase, Lemon Squeezy
  incl. variant IDs and webhook secret, OpenAI; optional Resend/Sentry).
- Supabase dashboard: Google OAuth provider credentials (only if Google sign-in
  stays enabled), auth redirect URLs, email templates.
- Lemon Squeezy dashboard: webhook pointed at `<prod-url>/api/webhooks/lemonsqueezy`.
- Vercel project linked with env vars for Preview and Production.
- Legal owner details in `lib/legal/legal-config.ts` (see docs/LEGAL_LAUNCH_CHECKLIST.md).

## Screen inventory (legacy vs rebuilt)

All screens currently legacy. Prompts flip entries to "rebuilt" as they land.
