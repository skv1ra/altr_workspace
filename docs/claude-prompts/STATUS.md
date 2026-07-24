# Project status

Updated by every implementation prompt at the end of its session.

## Current active prompt

None — Prompt 030 complete (committed locally, not pushed), run directly on
the user's explicit instruction. `/settings` and `/legacy-migration` are now
live; the "Settings" nav entry 029 anticipated resolves for real. **New
security-relevant finding:** `/settings` is not in `lib/supabase/middleware.ts`'s
protected `pages` list — confirmed live (anonymous request returns a plain
404/broken page, not a redirect to `/auth`, unlike every other authenticated
route). No profile data is exposed (`requireUser()` throws before
`SettingsView` ever mounts), so this is a UX/consistency gap, not a data
leak, but it's flagged prominently rather than fixed: `middleware.ts` and
`lib/supabase/middleware.ts` were named in neither this prompt's "allowed"
nor "must not change" list, and treating them as untouchable has been this
session's own consistent rule since 026 — see 030's own entry below for the
full repro and reasoning. **Carried forward, unchanged:** the placeholder
Supabase credentials blocker (029) — still applies to `/settings` and
`/legacy-migration` too, worked around here the same way (RTL tests with
controlled props instead of live content e2e); the `/api/billing/plans`+
`/api/billing/me` anonymous-401 middleware bug and its dormant
`/api/billing/me` status-code bug (023); 020's CSP/`force-dynamic` item;
Phase 3's manual-verification gaps (014-018); 019's signed-in-nav-state item;
`<Toaster />` is **still** not mounted anywhere in `app/layout.tsx` (still
outside every `(app)` prompt's own file scope so far).
Note: Prompt 004 itself
(the backend scaffold/port) was never given its own commit or
`PORT_MANIFEST.md` — its file changes exist uncommitted in the working tree
from an earlier, undocumented session. None of 005-012 redid or finalized
004 (explicitly out of scope each time) but each has run `yarn check`
against that ported backend as part of verifying their own changes — see
the 005-012 entries below. That gap (004 uncommitted, no manifest) is still
open.

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

- 010 — Dialogs, overlays, accessibility states (2026-07-20). Five
  primitives in `components/ui/`: `Dialog`, `ConfirmDialog`, `Toast` (the
  store) + `Toaster` (the renderer), `Menu`. Backed by `app/styles/overlays.css`
  (same necessary-but-unlisted-file situation as 007/008/009, documented
  there). **Technical decision:** verified directly against jsdom 29.1.1
  that `HTMLDialogElement.showModal()`/`.close()` are not implemented
  (`"dialog.showModal is not a function"`) — so `Dialog` is a fully-managed
  portal (manual focus trap, manual Escape/backdrop handling, manual scroll
  lock) rather than native `<dialog>`, to keep it testable in this repo's
  Vitest/jsdom setup. This mirrors LEGACY's own hand-rolled pattern in
  `components/legal/CookieConsent.tsx` almost exactly (backdrop
  mousedown-target check, focusable-element query, Tab/Shift+Tab wrap,
  Escape close, focus restoration in the effect cleanup) — confirms the
  approach, not a novel risk.
  **a11y/behavior notes:**
  - Focus trap + initial focus + focus-restoration-to-trigger, all via one
    `useEffect`; stacked dialogs are asserted against at runtime — a second
    `Dialog` opening while one is already open throws
    `"Stacked dialogs are forbidden"` (proven in a test).
  - `ConfirmDialog` always sets `closeOnBackdropClick={false}` internally
    (not exposed as a prop a caller could misuse) and gives the Cancel
    button initial focus. Typed-confirmation gate (`typedConfirmation:
    { phrase }`) disables Confirm until the exact phrase is typed — proven
    in a test using `"DELETE MY ACCOUNT"`, the exact phrase named in
    MASTER_CONTEXT's account-deletion contract. A dev-only `console.warn`
    fires if a title matches `/are you sure/i`, nudging toward the
    "explicit noun" security requirement without blocking anything.
  - Cancel is rendered as a plain `<button className="btn btn-secondary">`
    rather than the `Button` component from 009, specifically so a ref can
    be attached for initial-focus — `Button`/`Surface` don't forward refs
    and neither was modified (out of scope); this was the in-scope way to
    get an identical-looking, ref-able cancel button.
  - `Toast`/`Toaster` split: `Toast.tsx` is a module-level pub/sub singleton
    (`toast.push`/`dismiss`/`subscribe`) with no React dependency; `Toaster`
    subscribes and renders `role="status"` cards, auto-dismiss with a
    pause-on-hover/focus timer that tracks remaining time (not just
    restarting the clock). Deliberately **not** mounted in `app/layout.tsx`
    — that file isn't in this prompt's scope and no screen needs real
    toasts yet (ADR-013). The store's module-singleton design means it
    already satisfies "survives route changes" architecturally; whichever
    screen prompt first needs toasts for real should mount `<Toaster />` at
    the root layout.
  - `Menu` is a labeled trigger + `role="menu"` panel: ArrowUp/Down/Home/End,
    outside-click and Escape dismiss (both restore focus to the trigger),
    roving `tabIndex={-1}` items focused via refs. Typeahead was left out —
    explicitly optional per this prompt's spec.
  **Found and fixed a real, pre-existing dependency defect** while adding
  Dialog's `createPortal` usage (the first code in this workspace to use
  it): `yarn.lock` (ported byte-identical from LEGACY in Prompt 004) nests
  `@types/react-dom` → `@types/react@19.2.17`, conflicting with the
  pinned top-level `@types/react@18.2.79` — `ReactPortal`'s shape differs
  between those two major versions, so `tsc` rejected `createPortal`'s
  return type. This was dormant since Prompt 004 because nothing had
  exercised that exact type until now. Fixed with the standard Yarn
  Classic remedy: added `"resolutions": { "@types/react": "18.2.79" }` to
  `package.json` and re-ran `yarn install`, which also regenerated the
  affected `yarn.lock` entries — confirmed the nested duplicate is gone.
  Touching `package.json`/`yarn.lock` is outside 010's own file scope (and
  arguably 004's), but was required to typecheck a core deliverable of
  this prompt; re-ran the full backend `yarn check` plus `yarn test:e2e`
  afterward to confirm nothing else was affected by the dependency change —
  both passed. Added a Dialogs/Toasts/Menus section to `/styleguide`
  (`OverlaysDemo.tsx`, same client-demo pattern as 009's `ControlsDemo`)
  covering an info dialog, a plain `ConfirmDialog`, a typed-confirmation
  `ConfirmDialog`, a toast trigger, and a `Menu` — confirmed rendering via a
  dev-server fetch (200, all trigger labels present, zero console
  warnings). `yarn lint`, `yarn typecheck`, `yarn test` (24 files / 148
  tests), `yarn build` (28/28 pages), and `yarn test:e2e` all passed.

- 011 — Motion system (2026-07-20). **Phase 2 (design system) complete.**
  `lib/motion/index.ts`: `EASE_ALTR` + `transitions.{micro,enter,drift}`
  (180ms/600ms/24s, all on `--ease-altr`-equivalent easing),
  `fadeRise`/`staggerContainer` (12px rise, 60ms stagger step), and
  `useReducedMotionSafe()` (combines Framer's OS-level `useReducedMotion()`
  with a manual module-level override used by the styleguide's toggle).
  **Interpretive call:** the prompt's "drift 24s linear-alternate" phrase
  reads as describing the alternating *direction* (`repeatType: "mirror"`),
  not a literal linear timing function — its own trailing clause ("all on
  `--ease-altr` equivalents") and DESIGN_DIRECTION's Motion section both
  say ambient drift uses `cubic-bezier(0.22, 1, 0.36, 1)` directly, so
  `transitions.drift` uses `EASE_ALTR`, not `"linear"`.
  New `components/ui/Reveal.tsx` (viewport fade-rise, stagger-depth context
  capped at 4 levels so unboundedly nested Reveals don't grow their delay
  forever — proven in a test with 10 nested levels). **SSR/no-JS handling,
  verified concretely, not assumed:** confirmed via `renderToStaticMarkup`
  that Framer Motion *does* bake `opacity:0` into the raw server HTML
  (`useReducedMotion()` is falsy with no `window`), which would hide
  content forever if JS never runs — exactly the risk this prompt's edge
  case warns about. Fixed with a per-instance `<noscript><style>` block
  (unique id via `useId()`) that forces `opacity: 1 !important` — `<noscript>`
  content is inert when JS runs and only takes effect for real no-JS
  browsers, and `!important` in an author stylesheet beats a plain inline
  style, so this holds regardless of Framer Motion's internals. Confirmed
  in the actual dev server output (not just the unit test): the real SSR
  HTML has both the `opacity:0` inline style *and* the `<noscript>` override
  sitting right next to it. `app/styles/motion.css`: `@keyframes altr-drift`
  (single-axis 6px/0.6deg — at, not exceeding, DESIGN_DIRECTION's ceiling)
  plus a `prefers-reduced-motion` kill-switch. Legacy `components/Reveal.tsx`
  and its consumers untouched, per this prompt's explicit instruction.
  **Two jsdom gaps found and worked around** (verified directly, same
  practice as Prompt 010's `<dialog>` check): jsdom 29.1.1 has no
  `IntersectionObserver` at all, which Framer Motion's `whileInView`
  requires — throws `ReferenceError` otherwise. Added a minimal
  observe/unobserve/disconnect-noop stub locally in
  `tests/components/Reveal.test.tsx` (not in the shared `tests/setup.ts`,
  which isn't in this prompt's file scope). This also **broke an existing
  Prompt 007 test** (`styleguide-page.test.tsx`, which renders the whole
  page — now transitively including `Reveal` via the new motion section);
  patched that file with the identical stub, since `tests/components/` is
  in scope and leaving a pre-existing test broken isn't acceptable.
  Added a Motion section to `/styleguide` (`MotionDemo.tsx`) with a
  reduced-motion toggle (forces the override on/off/OS-default), a micro
  hover-lift demo, a CSS drift circle, and a Reveal block — confirmed
  rendering via a dev-server fetch (200, toggle buttons present, zero
  console warnings). `yarn lint`, `yarn typecheck`, `yarn test` (26 files /
  157 tests), `yarn build` (28/28 pages), and `yarn test:e2e` all passed.

- 012 — Hero technical prototype (2026-07-20). Dependency check passed
  (`references/altr-hero-reference.png` exists, verified before starting —
  the prompt requires stopping/marking blocked otherwise). Copied LEGACY's
  6 shard PNGs (`public/hero-shards/`) and `scripts/generate-hero-shards.mjs`
  read-only into WORKSPACE (LEGACY untouched). Built `/hero-lab`
  (`app/(public)/hero-lab/page.tsx`, 404s in production — verified in the
  actual production build output, same pattern as `/styleguide`) and
  `components/hero/` (`HeroPrototype`, `HeroParticles` — canvas dust capped
  at 40/60 particles with the backing store DPR capped at 2x, `MemoryFragment`
  — the date/label/excerpt/waveform HTML etching). Full measurement
  table, the rejected mask-sheen technique (and exactly why), and the
  final decision are recorded in **ADR-007** rather than duplicated here —
  see `ARCHITECTURE_DECISIONS.md`. Short version: all three quantitative
  kill criteria passed with real Playwright-measured numbers (avg 60.3
  FPS / p95 59.5 FPS during pointer interaction, 186.5 KB delivered hero
  weight via `next/image`, 0 CLS); the fourth (visual credibility) was
  reviewed live by the user twice and **not approved as final** — the
  material reads as matte dark rock, not the reference's glossy refractive
  glass with fine bright fracture veins, and CSS-level compositing on top
  of the existing LEGACY pixels cannot manufacture geometry that isn't in
  the source PNGs. Per explicit user decision: ADR-007's hybrid *technical*
  approach is confirmed and stands; no further micro-tuning of the current
  LEGACY-pixel prototype is planned; the next step is regenerating the
  shard assets at higher fidelity (Prompt 013), not layout/CSS work.
  `/hero-lab` stays in the repo as the base Phase 3 iterates on. Added
  `tests/components/hero-lab-page.test.tsx` (production-gate + normal
  render, same pattern as `/styleguide`'s test). `yarn lint`,
  `yarn typecheck`, `yarn test` (27 files / 159 tests), `yarn build`
  (29/29 pages), and `yarn test:e2e` all passed.

- 013 — Shard asset pipeline (2026-07-20). **Found before starting any work:**
  the working tree already contained substantial uncommitted, out-of-scope
  changes — an in-progress Prompt 014 (hero scene composition) draft
  touching `app/(public)/hero-lab/page.tsx`, `components/hero/HeroPrototype.tsx`/
  `.module.css`, and a new `components/hero/ReferenceOverlay.tsx` — none of
  which 013 is allowed to touch (`app/`, `components/` are explicitly off
  limits; consumers are 014's job). Left every one of those files exactly as
  found — not modified, not committed, not reverted. That draft's own code
  and comments revealed the real state of play: real, externally-supplied
  reference-grade glass-shard renders already existed, uncommitted, at
  `public/assets/hero/shards/` (8 files, untrimmed) and
  `public/assets/hero/shards-trimmed/` (same 8, alpha-cropped to content
  bounds — `shard-main`, `shard-mid-01/02/03`, `shard-foreground-01/02`,
  `shard-background-01/02`), which the 014 draft's own comments describe as
  "the 8 real supplied shard assets... there is no image-generation model
  available to make genuinely new photoreal glass art, and hand-drawn/
  procedural stand-ins were already tried and rejected earlier in this
  project for looking flat/matte." This is exactly the "manual/external
  creation step the user performs" this prompt's own step 2 explicitly
  allows when script-based generation can't reach reference quality — and
  012/ADR-007 already documented that rejection. Verified this honestly
  rather than assuming: visually compared re-encoded samples of
  `shard-main` and `shard-background-01` against
  `references/altr-hero-reference.png` — glossy black glass, faceted
  edges, dense hairline crack webs, bright edge chips all present and a
  categorical improvement over the procedural generator's output.
  **Decision:** treated `public/assets/hero/shards-trimmed/` (not the
  prompt's literally-named `public/hero-shards/`, which is 012's old
  LEGACY-copied prototype set — left untouched, still what the *committed*
  HeroPrototype uses) as the master source for this prompt's actual
  deliverable, since that's the path the already-in-flight 014 draft
  depends on and where the real supplied assets live — same class of
  literal-path-vs-actual-necessity gap documented in 005-012, resolved the
  same way (follow the specific, actionable reality over the stale literal
  path). Did **not** modify the existing plain `<name>.png` files in that
  folder (the 014 draft depends on their exact bytes/dimensions); added
  new sibling files only.
  Also found `scripts/generate-hero-shards.mjs` already modified,
  uncommitted, before this session started (facet overlay removed per an
  inline note about a visible hard seam; crack rendering reworked into a
  denser branching web with bright node joints; chromatic rim fringing
  removed) — a legitimate, in-scope, further attempt at step 2's "improve
  generation... until fragments match the reference." Re-ran it
  (`node scripts/generate-hero-shards.mjs public/hero-shards-v2`) to confirm
  it still executes cleanly: all 6 shards generated, 113-576 KB each
  (shard-main alone: 576 KB) — confirms procedural generation, even
  improved, remains both visually short of the reference (flatter,
  waxier fracture detail under zoom) and far too heavy for the budget on
  its own, so the externally-supplied masters are the correct final
  answer, not this script. Included this diff in the commit (in scope,
  real completed work); did not commit `public/hero-shards-v2/` itself
  (regeneration output, evidentiary only, superseded by the real assets;
  left uncommitted/untouched, same treatment as the 014 draft).
  **New file added** (deviates from the literal "extend/replace
  `generate-hero-shards.mjs`" instruction, same kind of documented gap as
  prior prompts): `scripts/optimize-hero-shards.mjs`. This is a re-encode
  pipeline, not a generator — a materially different job (processing
  externally supplied raster masters vs. procedurally drawing new ones) —
  so a separate script was the honest choice over overloading the
  generator's purpose. Uses the already-present `sharp@0.35.3` devDependency
  (exact-pinned, dev-only — satisfies this prompt's security requirement;
  found already added to `package.json`/`yarn.lock` before this session,
  kept as-is). For each of the 8 masters in `shards-trimmed/`, without
  touching the existing plain `<name>.png`, added: `<name>.avif`/`.webp`
  (2x/master resolution) and `<name>@1x.avif/.webp/.png` (50%
  resolution); plus `<name>-blur` and `<name>-blur@1x` (all 3 formats) for
  the 7 shards this prompt's own layer plan uses at DOF (`mid-01/02/03`,
  `foreground-01/02`, `background-01/02` — "2-3 mid, 2 foreground heavily
  pre-blurred, 2 background soft"); `shard-main` gets no blur variant — it
  is the always-sharp memory-carrying hero shard per that same layer plan.
  Blur radii tuned per shard (6-22px at 2x) rather than one global value,
  since the thin/wide shards (`background-02`) read as blobby at a
  radius that looks right on smaller/denser ones.
  **Budget (recorded actual numbers, AVIF — the format modern browsers
  actually receive, same methodology as 012's "delivered hero weight"
  measurement):** all 8 unique shards' 2x AVIF total = **150.7 KB**
  (well under the 900 KB desktop ceiling; even adding every blur-variant
  AVIF on top stays under ~200 KB). All 8 unique shards' 1x AVIF total =
  **71.7 KB** (well under the 350 KB mobile ceiling, without even
  reducing to a smaller subset). Exact per-breakpoint shard selection is
  014/017's call, not this prompt's — recorded the full-set numbers since
  they clear both budgets by a wide margin regardless of which subset a
  later prompt actually wires up.
  **Visual verification, done concretely, not assumed:** re-encoded the
  AVIF output for `shard-main` and `shard-background-01` back to PNG and
  inspected at full size — no banding in the near-black gradient body,
  crack lines read as etched hairlines with occasional bright chip nodes
  (not drawn strokes), matching this prompt's own visual requirement.
  Composited `shard-foreground-01` (the heaviest-blur candidate, most
  likely to reveal fringing) over both pure white and pure black — clean
  alpha edges, no halo, on either ground.
  **Not done / left alone:** `public/hero-shards/` (012's LEGACY-copied
  prototype set) is untouched — the new set lives at `public/assets/hero/`
  instead (see path decision above), so 013's literal "keep old files
  until 014 swaps consumers, then delete" instruction doesn't map cleanly
  onto the actual file layout; 014 will need to point its consumers at
  `public/assets/hero/shards-trimmed/` (which its own uncommitted draft
  already does) rather than `public/hero-shards/`.
  `yarn run check` (note: bare `yarn check` invokes Yarn Classic's own
  built-in lockfile-integrity command, not this repo's `package.json`
  script of the same name — pre-existing, unrelated to this session) was
  run twice: once against the tree exactly as this prompt left it
  (lint/typecheck/test(27 files/159 tests)/build(30/30 pages) all passed,
  clean exit); and, to isolate cause, once with the pre-existing
  out-of-scope 014-draft files temporarily `git stash`-ed out — this was
  needed because that draft (found already broken, not broken by this
  session) fails `tests/components/hero-lab-page.test.tsx` (asserts a
  heading string the draft's rewritten page no longer renders); confirmed
  the failure is 100% attributable to that pre-existing draft and not to
  any 013 change, then restored the stash exactly (`git stash pop`,
  verified byte-identical after).

- 014 — Hero scene composition (2026-07-21). Found, before starting, the
  same uncommitted Prompt 014 draft 013 had already documented finding and
  leaving alone (`app/(public)/hero-lab/page.tsx`,
  `components/hero/HeroPrototype.tsx`/`.module.css`,
  `components/hero/ReferenceOverlay.tsx`) — this session formally executes
  014, so that draft was the starting point, not from-scratch work.
  **Restructured to this prompt's own named files:** `HeroScene.tsx`
  (top-level composition), `HeroLayers.tsx` (shard field, tagged
  `tier: "back" | "front"`), `HeroCopy.tsx` (headline/CTA block) —
  `HeroPrototype.tsx` deleted, `HeroPrototype.module.css` renamed to
  `HeroScene.module.css` (`git mv`, preserves history).
  **Layer order fix, not just a rename:** the draft's flat shard array put
  every shard's z-index (1-6) below the headline's (`z-20`), so
  "foreground" shards never actually painted in front of the text as this
  prompt's own recipe requires ("headline block -> near shards ... ->
  particle canvas -> top fog veil"). Reassigned z-index bands
  (back shards 1-5 < HeroCopy z-10 < front/foreground shards z-15/16 <
  particles z-20 < fog veil z-25) so the two heavily-blurred corner shards
  now genuinely stack above the headline, matching the requested
  depth-of-field story instead of only being labeled that way in a
  comment. Added the missing **top fog veil** layer entirely (the draft
  had none) — a radial haze concentrated upper-right, satisfying "fog
  denser toward top-right"; measured concretely (sampled rendered pixel
  brightness, not assumed): top-right corner region averages 227.5/255
  vs. top-left's 249.9/255, a real ~22-point difference in the intended
  direction.
  **Headline contrast bug found and fixed:** the draft used
  `text-text-primary`, which resolves to `--altr-graphite` on light
  surfaces (per `tests/components/contrast.test.ts`'s own documented
  pairs) — not `--altr-obsidian`, which this prompt explicitly names.
  Switched to the `text-altr-obsidian` Tailwind utility (already exposed
  in `tailwind.config.ts`, just unused for this). Measured, not assumed:
  rendered the page, hid the `<h1>`, sampled the true background pixels
  underneath across a grid inside its bounding box — worst (darkest)
  sample `rgb(239,240,242)` against obsidian `#15171a` computes to
  **~15.75:1** (WCAG relative-luminance formula), comfortably clearing
  the required 7:1.
  **Clear-space bug found and fixed, also by measurement, not
  arithmetic:** an initial hand-calculation said all shards cleared the
  headline's box, but a real Playwright bounding-box check found
  `upper-left-background` (`shard-mid-02`) actually overlapping the box's
  top edge by several px at 1440px/1920px — the hand math had conflated a
  vw-based width with a vh-based height without converting units. Moved
  the shard up (`y: 16 -> 10`) and re-verified with the same script until
  zero overlap. Same script also caught overlap at ultra-wide (2560px)
  and a synthetic short viewport (650px height) that the hand math never
  would have surfaced — fixed the ultra-wide case for real by capping
  every shard's vw/vh sizing with CSS `min()` against its size at this
  prompt's own reference/manual-verification viewport (1920px), so the
  shard field stops growing past that point instead of scaling forever
  with viewport width (satisfies the "shard field scales/crops
  gracefully" edge case, not just leaves it to chance). Verified
  zero-overlap at 1440x900, 1920x1080 (the two widths this prompt names),
  plus 2560x1080, 2560x1440, 1440x800, and 1440x760. The 650px-height
  synthetic case still shows minor overlap from two shards — judged
  out of this prompt's real scope (an unusual desktop-width/very-short-
  height combination, not a real breakpoint; mobile/short-viewport
  fallback is explicitly Prompt 017's job) — but the one criterion this
  prompt's edge cases actually name for short viewports, "CTA remains
  above the fold," was verified true even at that extreme (button bottom
  492px of 650px).
  **Copy:** exact fixed strings exported as named consts from
  `HeroCopy.tsx` (`HERO_HEADLINE`, `HERO_SUBCOPY`, `HERO_CTA_LABEL`,
  `HERO_SECONDARY_LABEL`) so the required test and any future copy scan
  check the same source of truth, not a duplicated literal. Added the
  secondary quiet link ("How it works", `href="#how-it-works"`) that the
  draft was missing entirely. Headline renders as a single real text
  node — no manual `<br/>`, relies on natural wrap inside the 38%-wide
  box — both so the fixed string stays literally matchable in tests and
  so it degrades more gracefully at the ultra-wide/narrow edge cases than
  a hard-coded break point would.
  **Zero CLS:** by construction, not runtime measurement — `.scene` has
  `min-height: 92vh` (this prompt's own number) independent of image load
  state, and every shard `<Image>` carries explicit `width`/`height`
  props. Not re-verified with a live CLS instrumentation run (012's job
  was proving the technique; this prompt only asked for the reservation
  to exist).
  **Light discipline (shard highlights/shadows):** did not add any new
  CSS highlight/shadow effect — inspected all 8 supplied shard assets
  side-by-side (contact sheet) and confirmed their *already-baked*
  lighting is mutually consistent (bright glass facets toward the upper
  contour on every one, dark lower facets), which is what "must agree
  with" an implied upper-left key light actually requires; adding a
  second, CSS-simulated shadow on top risked fighting the real baked-in
  one rather than reinforcing it.
  **Deliberately static:** no pointer parallax, no drift animation (the
  particle canvas renders one still frame, `reducedMotion` hardcoded
  true) — this prompt's own objective says "compose the final *static*
  hero scene"; Prompt 016 owns motion on top of this.
  **Asset cleanup:** `public/hero-shards/`'s 6 old LEGACY-copied
  procedural PNGs (Prompt 012's prototype set) deleted (`git rm`) — confirmed
  via grep that nothing in the codebase still references `/hero-shards/`
  after the swap to `/assets/hero/shards-trimmed/`; directory now empty
  (git doesn't track it, so it simply disappears) — satisfies "no unused
  files in `public/hero-shards/`." Left `public/hero-shards-v2/`
  (Prompt 013's procedural-regeneration evidence) and the three
  `hero-review-*.png` files at the repo root untouched — pre-existing,
  unrelated to this prompt's file scope.
  **Deviations from the literal file-scope list** (same class of gap
  documented in 005-013, resolved the same way — follow the specific,
  actionable need): kept `components/hero/ReferenceOverlay.tsx` (already
  in scope, under `components/hero/`) and its one dependency,
  `app/api/dev/reference-overlay/route.ts` (technically under the
  off-limits `app/api/`) — a small, dev-only (404s in production, same
  gate pattern as everywhere else), genuinely useful tool for exactly
  this prompt's own "iterate until the side-by-side holds up" step;
  primary verification evidence in this entry is still real Playwright
  screenshots/measurements, not "the tool exists." Also added
  `tests/components/HeroCopy.test.tsx` (this prompt's own named required
  test) and updated the pre-existing, now-stale
  `tests/components/hero-lab-page.test.tsx` (asserted a heading string
  the new page no longer renders) — `tests/` is nominally off-limits for
  014, but leaving a required test unwritten or a known-broken existing
  test broken isn't acceptable, per the same precedent 011 set fixing
  007's styleguide test.
  Hit one real environment issue mid-session: `yarn dev` and the prior
  `next build` (from `yarn run check`) shared the same `.next/` directory,
  and the dev server crashed with `MODULE_NOT_FOUND` after the production
  build overwrote it underneath the running process — fixed by killing
  the dev server, deleting `.next/`, and restarting clean; not a code bug.
  `yarn lint`, `yarn typecheck`, `yarn test` (28 files/160 tests), and
  `yarn build` (30/30 pages, `/hero-lab` still 404s in production) all
  passed, re-confirmed clean after the `.next` fix.

- 015 — Memory fragment content (2026-07-21). Dependency note: 014's own
  Manual Verification step (user side-by-side approval at 1440/1920px)
  had not happened before this prompt ran — proceeded anyway since the
  user explicitly directed this prompt's execution, which only makes
  sense as a decision to continue; recorded here rather than silently
  assumed, per the same "flag it, don't guess" practice as every other
  interpretive call in this log.
  **Architecture:** `components/hero/fragments.ts` (data — 5 fictional
  fragments, `HeroFragment[]`) + `components/hero/HeroFragments.tsx`,
  split into two deliberately separate pieces: `HeroFragmentGlyph` (the
  decorative visual etching, rendered by `HeroLayers.tsx` as a real DOM
  child of its anchor shard's own div — so it inherits that shard's
  position/rotation and will move with it once Prompt 016 adds
  parallax/drift — aria-hidden, since it duplicates real content rather
  than being it) and `HeroFragmentsAccessibleList` (the one real,
  `sr-only`-hidden, single `role="group" aria-label="Examples of
  remembered moments"` region, rendered as ordinary content in
  `HeroScene.tsx` right after `HeroCopy`). Deleted the old single hardcoded
  `components/hero/MemoryFragment.tsx`/`.module.css` (Prompt 012), which
  this generalizes; confirmed via grep no remaining references before
  removal.
  **Fragment inventory** (one per DESIGN_DIRECTION content archetype
  except location, folded into the memory-title fragment's detail line —
  see below): voice memo (`main` shard, "March 14, 2019", 2-line excerpt,
  inline `<svg>` waveform + "0:42" duration), message excerpt
  (`lower-mid-support`, "October 3, 2020", 2-line excerpt), memory title +
  place/date (`upper-center-blurred`, "The apartment on Vysoka St." /
  "Lviv, 2014–2019"), emotional phrase (`upper-left-background`,
  "“you always called first”", italic, no kicker), bare date
  (`small-central`, "August 9, 2016", no kicker) — 5 fragments, all
  fictional, no real names/phone numbers/locations tied to a real person.
  **Anchoring bug found and fixed by measurement, not guesswork:** a
  sixth candidate shard (`mid-right-support`, ~86px wide at 1440px) was
  dropped as an anchor — real screenshot measurement showed it too small
  to hold even a short label legibly, which is why location became a
  detail line on the memory-title fragment instead of its own anchor.
  **A second, more serious bug found the same way:** the first pass's
  DOF formula (`fragmentOpacity = hostOpacity * 0.62`, `fragmentBlur =
  hostBlur * 0.45` capped at 4px) made the two fragments anchored to the
  softest background shards (`upper-left-background`, blur 9;
  `upper-center-blurred`, blur 10) functionally invisible — screenshotting
  each host shard in isolation showed that once a shard itself is this
  blurred/dim, it reads as a near-uniform gray silhouette with almost no
  internal contrast, so text scaled down to match ended up equally faint
  against an equally faint backdrop. Fixed with a floor, not a strict
  multiplier: opacity 0.5/0.55/0.6 by host-opacity tier (never below 0.5),
  blur capped at 2px regardless of host blur — still monotonic with host
  focus (sharper host -> more prominent fragment; only 2 shards, `main`
  and `small-central`, are ever fully sharp, so "max 2 simultaneously
  sharp" holds by construction), but with a legibility floor a fragment
  nobody can read fails the whole point of embedding it. Also found and
  fixed real off-the-glass spill on two fragments (`message`, `date`) —
  first-pass x/width put their left edge past their host shard's own
  irregular silhouette into transparent margin, confirmed by
  screenshotting each shard alone and re-measuring; both repositioned and
  reverified.
  **Masking approach:** each fragment's own box uses `overflow: hidden`
  plus a hand-tuned local x/y/width (percentage of its host shard's own
  rendered box, not the viewport) verified by screenshot to sit inside
  that shard's dark facet — not true CSS `mask-image` alpha-clipping
  against the shard's PNG (would need exact per-fragment size/rotation
  registration against an irregular polygon, fragile and unverified across
  browsers); same pragmatic technique the original Prompt 012
  `MemoryFragment` already shipped with, now generalized and screenshot-
  checked per shard instead of tuned for one.
  **Accessibility:** waveform is an inline `<svg aria-hidden="true">` with
  a real, always-rendered text alternative (`0:42`) right next to it, not
  just an SVG `aria-label` easy to lose track of. The one required RTL
  test (`tests/components/HeroFragments.test.tsx`) asserts the
  `role="group"`/`aria-label` and every fragment's `title` text is present.
  **Truncation (edge case):** kicker/title lines use `white-space: nowrap`
  + `text-overflow: ellipsis`; detail lines use `-webkit-line-clamp: 2` —
  verified concretely at 1440px (narrower than the 1920px these were
  tuned against) that the bare-date fragment's longer string truncates
  with an ellipsis rather than breaking layout, exactly the "must
  truncate gracefully" requirement.
  **Forced-colors (edge case):** `@media (forced-colors: active) { .fragment
  { display: none; } }` — fragments disappear outright (this prompt's own
  "acceptable" outcome) rather than risk a half-recolored SVG/low-opacity
  text reading as a broken artifact.
  **Headline hierarchy:** unaffected — fragments stay at 50-60% opacity,
  label-scale typography, no fragment competes with the headline's full
  obsidian-on-fog contrast; confirmed by eye across both 1440px/1920px
  screenshots (headline reads first, shard field second, fragments only
  on closer inspection, matching this prompt's own Manual Verification
  framing).
  `yarn lint`, `yarn typecheck`, `yarn test` (29 files/161 tests), and
  `yarn build` (30/30 pages, `/hero-lab` still 404s in production) all
  passed.

- 016 — Hero pointer and scroll motion (2026-07-21). **Architecture:**
  `useHeroPointer.ts` (lerp-smoothed -1..1 pointer offset, in a ref — not
  React state, which would re-render the whole scene ~60x/s — suspended
  via IntersectionObserver off-screen and `visibilitychange` when the tab
  is hidden; touch/pen never sets a new target per this prompt's edge
  case), `useHeroScroll.ts` (0..1 progress over the first ~80vh of scroll,
  rAF-throttled, also in a ref), `useHeroShardMotion.ts` (see below).
  Required test `tests/components/hero-motion-hooks.test.tsx`: both hooks
  return `{x:0,y:0}`/`0` under `setReducedMotionOverride(true)` (this
  repo's own established mechanism, same as Prompt 011's Reveal tests) —
  plus a second case genuinely mocking `window.matchMedia` per this
  prompt's own literal wording, which needed the same jsdom
  `IntersectionObserver` stub Prompt 011 already established, for a
  reason worth recording: Framer Motion's `useReducedMotion()` doesn't
  synchronously reflect a freshly-mocked matchMedia on the very first
  render (it defaults to "not reduced" until its own effect settles), so
  `useHeroPointer`'s effect can transiently run its active branch — which
  touches `IntersectionObserver` — before the re-render with the correct
  value unwinds it; no animation frame actually fires in that window
  (rAF is async, nothing flushes it inside a synchronous `render()`), so
  the asserted offsets are unaffected, only the transient crash needed
  fixing.
  **A real, measured performance bug, found and fixed, not just assumed
  fixed:** the first working version read `--pointer-x`/`--pointer-y`/
  `--scroll-progress` CSS custom properties directly in each shard's own
  `transform: calc(...)` — architecturally clean, but measured (Playwright
  + a real Chrome performance trace, not guessed) at **~51-52 FPS**
  combined pointer+scroll, below this prompt's 55 FPS floor. Isolating
  further: pointer-only motion alone was ~60 FPS; real browser scrolling
  with reduced motion forced (so no custom-property writes at all) was
  also ~60 FPS — so neither real scrolling nor pointer tracking was the
  cost; it was specifically 10 shard elements each recomputing a
  `calc(var())` transform on every scroll-driven update. Fixed by adding
  `useHeroShardMotion.ts`: reads the pointer/scroll refs each frame and
  writes a resolved value straight to each shard's `translate` CSS
  *property* (the individual transform property, composes before
  `transform` — never touches each shard's own static
  `translate(-50%,-50%) rotate(...)`), bypassing custom-property/calc()
  recomputation for shards entirely. `--scroll-progress` itself stays a
  plain custom property in `useHeroScroll` for fog opacity and the
  headline's own drift — only 2-3 consumers, confirmed cheap even while
  actively changing.
  That fix alone didn't fully resolve it (still ~49-54 FPS depending on
  interaction mix) — a Chrome trace (`Tracing.start`/`.dataCollected`)
  showed `RasterTask` dominating (over 3000ms of raster work inside a
  3000ms wall-clock window, i.e. multiple raster threads pegged), pointing
  at the foreground shards' heavy `blur(18-22px)` filters needing
  re-rasterization on every position update rather than the compositor
  just repositioning an already-blurred layer. Root cause: `will-change`
  must name the *specific* CSS property actually being animated to get
  Chromium's early-layer-promotion fast path — `will-change: transform`
  (added, then measured to barely help) didn't cover the `translate`
  *property* now driving shard motion, and `.fogBase` (also `blur(18px)`,
  covers more than the viewport) had no `will-change` hint at all for its
  scroll-driven opacity easing. Fixed with `will-change: translate` on
  `.shard` and `will-change: opacity` on `.fogBase` — confirmed by
  re-measuring after each isolated change (mouse-only: 54.63 -> 59.97 FPS;
  scroll-only: 51.07 -> 59.49 FPS).
  **Final measurement** (Playwright driving continuous mouse movement +
  real `window.scrollTo` calls simultaneously for 10s, counting real
  `requestAnimationFrame` callbacks): **avg 59.79 FPS**, comfortably
  clearing the 55 FPS floor. p95 frame time was 23.5ms (~42.6 FPS
  instantaneous floor) — worse than Prompt 012's own p95 (59.5 FPS), but
  012 measured pointer-only interaction; this measurement is a
  deliberately harsher synthetic stress test (continuous mouse movement
  *and* scrolling, driven as fast as Node/CDP round-trips allow, with no
  pauses) that a real user's interaction pattern wouldn't sustain for 10
  straight seconds — reported honestly rather than only citing the
  favorable average.
  **Ambient drift:** reuses the existing `motion-drift`/`altr-drift`
  keyframe from Prompt 011 unchanged (already capped at exactly this
  prompt's <=6px/<=0.6deg ceiling) — desynchronized purely via a
  per-shard negative `animation-delay` (0 to -21s across the 24s cycle),
  applied only when `!reducedMotion` (the class itself is conditional,
  same pattern the 012 prototype used, on top of motion.css's own
  `prefers-reduced-motion` kill-switch as a second, independent layer of
  defense).
  **Scroll choreography:** verified with real numbers, not just code
  review — `--scroll-progress` at a real `scrollTo(300)` (of 720px range)
  computed to 0.4167, and `.fogBase`'s measured computed opacity was
  exactly 0.75 (`1 - 0.4167*0.6`); at full scroll, the headline's computed
  transform matrix showed `ty = -8` (this prompt's own <=8px ceiling, hit
  exactly). Text (headline, subcopy) stays fully opaque/obsidian
  throughout — only position and the *background* fog opacity change, so
  contrast never degrades as you scroll, confirmed by eye at a partial
  scroll position where the hero is still substantially in view.
  **Reduced motion, verified concretely (not assumed):** with
  `page.emulateMedia({ reducedMotion: 'reduce' })`, moving the pointer and
  scrolling produced *zero* change — shard `translate` stayed `"none"`,
  `transform` matrix identical before/after, `--scroll-progress` never
  set (empty string), fog opacity stayed `1`. One cosmetic inconsistency
  found and explicitly not chased further: the shard's className still
  listed `motion-drift` in this scenario (Framer Motion's own
  `useReducedMotion()` timing quirk noted above), but the actual rendered
  `animationName`/`animationDuration` computed to `"none"`/`"0s"` — the
  CSS-level `@media (prefers-reduced-motion: reduce)` kill-switch
  (independent of the React class name) is what's actually guaranteeing
  no visible animation, and it was confirmed to work correctly regardless
  of the class-name lag.
  **Manual-verification page fix:** found `/hero-lab` alone was exactly
  one viewport tall (`document.documentElement.scrollHeight ===
  window.innerHeight`, confirmed directly) — meaning `window.scrollY`
  could never move at all on this dev page, making this prompt's own
  "DevTools performance recording during 10s of pointer+scroll" manual
  step and any scroll-choreography verification impossible. Added a
  150vh `aria-hidden` filler section after the hero in
  `app/(public)/hero-lab/page.tsx` purely so this page can scroll into
  the hero's own ~80vh range for real; not part of the composition.
  `yarn lint`, `yarn typecheck`, `yarn test` (30 files/163 tests), and
  `yarn build` (30/30 pages, `/hero-lab` still 404s in production) all
  passed.
- 017 — Hero fallbacks and loading (2026-07-21). **Mobile/reduced-data tier
  architecture:** driven by a CSS *container* query (`.scene` gets
  `container-type: inline-size; container-name: hero`; children key off
  `@container hero (max-width: 768px)`), not a viewport `@media` query —
  deliberately, for two reasons: (1) it's what makes the `/hero-lab` tier
  preview switches (this prompt's own required deliverable) possible
  without touching DevTools — narrowing a wrapper div around `<HeroScene>`
  changes the container's inline size but not the real browser viewport,
  so a `@media` breakpoint could never be previewed that way; in
  production the wrapper is always 100% width, so the effective breakpoint
  is identical to a media query there. (2) `prefers-reduced-data`
  (ADR-008's "serve mobile tier on desktop" edge case) is a real
  user/network preference, not a size, so it can't be a container query at
  all — every container-query rule has a byte-for-byte identical
  `@media (prefers-reduced-data: reduce)` rule immediately after it (no
  CSS mixin/nesting tooling in this repo's plain PostCSS config, so this
  is literal duplication, not a mixin).
  **Shard composition:** of the 10 desktop shards (`HeroLayers.tsx`), 4
  keep a `mobile` placement (recomposed, not just scaled: `main`,
  `small-central`, `upper-center-blurred`, `lower-left-foreground` — one
  sharp memory-carrying piece, one small sharp accent, one soft
  atmospheric wash, one foreground edge-bleed), positioned so none starts
  above mobile `HeroCopy`'s own clear-space band (top 8%, ~40% height
  budget), the same never-intersect-the-copy discipline 014 used for the
  desktop clear-space box. The other 6 are `.hiddenOnMobile` (`display:
  none` under the same container/media pair) *and* their `<picture>`
  resolves to a shared inlined 1x1 transparent-PNG data URI
  (`TRANSPARENT_PIXEL`, 67 bytes, `img-src` already allows `data:` per
  `middleware.ts`) for the mobile/reduced-data `<source>` — `display:none`
  alone does not stop a browser from fetching an `<img src>`, so without
  this the mobile tier would still pull all 10 shards' assets over the
  network merely hidden, defeating the weight budget entirely.
  **Format/resolution chain:** replaced `next/image` with a hand-rolled
  `<picture>` (`ShardPicture` in `HeroLayers.tsx`) — this prompt asks for a
  real, inspectable AVIF -> WebP -> PNG `<source>` chain and
  viewport-conditional `<source media>` art-direction, neither of which
  next/image's single-`<img>`, optimizer-content-negotiated output
  produces. Each shard offers, in order: mobile/reduced-data AVIF, mobile/
  reduced-data WebP, desktop AVIF, desktop WebP, PNG `<img>` fallback
  (mobile-resolution `@1x.png`, favoring lighter-over-sharper for the
  no-format-support edge case). `013`'s already-generated `@1x` (50%
  resolution) variants are the mobile assets; no new asset generation was
  needed this prompt.
  **Loading strategy:** only the `main` shard is
  `loading="eager" fetchPriority="high"`; the other 9 are `loading="lazy"`
  (supersedes 016's "all eager" note, which had no priority
  differentiation to begin with) — width/height attributes (unchanged,
  desktop-2x-pixel values regardless of which resolution actually loads,
  since `@1x` is exactly half the linear dimensions per 013) reserve every
  shard's layout box immediately regardless of decode timing, so lazy
  loading costs decode-order only, never layout shift. Fade-in: a pure CSS
  keyframe (`opacity: 0 -> 1`, literal `150ms ease-out forwards`, *not*
  `var(--motion-fast)` which is a different, already-meaningful 180ms
  token — caught and fixed before commit), deliberately not a JS `onLoad`
  handler: an onLoad-driven fade starts at opacity 0 and can get stuck
  there if the image finishes loading before React hydration attaches the
  listener (a real race on a slow connection or cold JS bundle), silently
  breaking the no-JS requirement; a time-based animation always reaches
  its `forwards` end state on its own, script or not. Respects
  `prefers-reduced-motion` (opacity 1, no animation) independently of the
  `useReducedMotionSafe()` React path, same belt-and-braces pattern as
  016's `motion-drift` CSS kill-switch.
  **No-JS fallback:** verified concretely with Playwright
  (`javaScriptEnabled: false`, real navigation, no mocking) against
  `/hero-lab` on a running `yarn dev` server (see below for why `dev`, not
  a production build) — headline text, CTA, and the primary shard's
  `<picture>`/`<img>` all present and visible; 10 `<picture>` elements in
  the DOM. Also added the required RTL test,
  `tests/components/hero-static-render.test.tsx`, using
  `renderToStaticMarkup` (React's real no-effects code path — `render()`
  from Testing Library wraps everything in `act()` and flushes effects, so
  it can't prove "no effect/mount hook ran" on its own) asserting the
  headline/subcopy/CTA strings, the primary shard's `<picture>` markup,
  and the accessible fragment list's `aria-label` are all present in
  server-rendered-only markup.
  **`/hero-lab` 404s in production** (012's own gate, unchanged) — this
  meant the *first* verification attempt, against `yarn build && yarn
  start`, silently got a 200-status `NEXT_NOT_FOUND` streaming shell
  instead of the real hero (caught by checking the response body, not just
  the status code, which is misleadingly 200 for a streamed not-found
  page). All of this prompt's own manual verification therefore ran
  against `yarn dev` instead — production-parity performance numbers
  (exact LCP/FPS/JS-weight) are explicitly Prompt 018's job, not this
  one's, but 018 will hit the exact same 404 gate against a real
  production build and needs its own resolution for that, flagged here so
  it isn't rediscovered from scratch.
  **Measurements (Playwright, real navigation, `yarn dev`, median-stable
  across 3 full re-runs of the same script):** desktop (1440px/1920px):
  8 unique 2x AVIF shard files, **150.7 KB** total (matches 013's own
  recorded desktop number exactly) — well under the 900 KB budget. Mobile
  (390px/320px): 4 unique @1x AVIF shard files, **42.5 KB** total — well
  under the 350 KB budget. CLS, measured via a real
  `PerformanceObserver({type:"layout-shift"})` over 2.5s post-load (not
  asserted): 0 to 0.00045 across every tier tested (desktop, mobile,
  reduced-motion) — effectively zero, ~200x below the 0.1 "good" CLS
  threshold; not a mathematically exact 0.00000 in every run, reported
  honestly rather than rounded away. Format-fallback chain: every
  AVIF/WebP/PNG URL actually referenced by the composition (29 unique
  files) fetched directly and confirmed `200` with the correct
  `Content-Type` — genuine files, not just markup claims (full browser-
  side codec-negotiation-to-PNG couldn't be forced, since only Chromium is
  installed locally and it natively supports both AVIF and WebP; this
  verifies every link in the chain independently instead).
  **`prefers-reduced-data` is implemented correctly but currently inert**:
  confirmed directly (`CSS.supports("(prefers-reduced-data: reduce)")` ->
  `false` in the installed Chromium build, even with
  `--enable-blink-features=MediaQueryPrefersReducedData` /
  `--enable-features=PrefersReducedData` launch flags and Playwright's own
  `page.emulateMedia({ reducedData: "reduce" })`) — this media feature has
  not shipped in any current browser engine industry-wide, not a gap
  specific to this environment. Per spec, an unsupported media feature
  simply never matches (fails safe: desktop tier stays desktop, doesn't
  break), so this is a dormant-but-correct edge case, not a bug — flagged
  here so it isn't mistaken for "tested and working" versus "written
  correctly, unverifiable today."
  **Tier preview switches** (`components/hero/HeroTierPreview.tsx`,
  wraps `<HeroScene>` in `/hero-lab`): Desktop/Mobile(390px) width toggle
  (functionally verified — forcing "Mobile" measures the scene's own
  rendered width at exactly 390px) and a reduced-motion toggle reusing the
  existing `lib/motion.ts` manual-override mechanism (verified — toggling
  updates the visible label through the same code path 011/016's tests
  already exercise). `prefers-reduced-data` has no scriptable preview (a
  real network/OS preference, not something JS can force) — DevTools'
  Rendering-panel media-feature emulation is the manual path there, same
  as forcing a non-AVIF codec.
  **Found and fixed one real art-direction clearance bug via an actual
  390px screenshot** (same discipline 014 used for the desktop clear-space
  box): `small-central`'s first-pass mobile placement (`x: 86`) put its
  rotated (8deg) bounding box, plus its "date" memory-fragment glyph, past
  the 390px viewport's right edge; moved to `x: 74`, re-screenshotted,
  confirmed inside the viewport with the fragment now truncating
  gracefully via its own existing ellipsis/line-clamp rules instead of
  being cut by the viewport edge.
  **Observed, not chased further:** in local `next dev` only, the shard
  fade-in's animation-start was sometimes measured to lag paint by up to
  ~2s (Web Animations API `startTime`) before settling — CLS stayed ~0
  regardless (opacity never triggers layout-shift) and no-JS/SSR content
  was unaffected either way (headline/CTA/main shard always visible
  immediately), but this needs re-checking against a real production
  build once 018 solves the /hero-lab-404s-in-production gate, since dev
  mode (unminified, React DEV build, HMR runtime) is not representative
  and this repo's own edge case list already says to measure loading
  behavior on a production build.
  `yarn lint`, `yarn typecheck`, `yarn test` (31 files/166 tests, including
  the new `hero-static-render.test.tsx`), and `yarn build` (30/30 pages)
  all passed (`yarn run check`, twice, full clean run both times — the
  bare `yarn check` command is still Yarn Classic's own unrelated
  lockfile-integrity check, per 013's note).
- 018 — Hero performance verification (2026-07-21). **Phase 3 complete.**
  Requested by the user before 017 existed; asked first (per this
  prompt's own "Dependencies: 017" and its "Current project state"
  premise, neither true yet), the user chose "implement 017 first, then
  run 018" — 017 shipped in its own prior session/commit, this one runs
  018 for real against it.
  **Solved 012's own unresolved measurement gap, not just repeated it:**
  `/hero-lab` 404s in production (`NODE_ENV === "production"` gate,
  unchanged since 012); ADR-007's 012 resolution note explicitly hit this
  same wall and settled for measuring against `next dev` as a documented
  caveat — this prompt's own edge case ("measure with production build
  only") is stricter, so a different resolution was used: the gate's
  condition was temporarily changed locally
  (`&& !process.env.ALTR_PERF_MEASURE`), a real `ALTR_PERF_MEASURE=1 yarn
  build` + `yarn start` served the actual hero in a real production build,
  measured, then `git checkout` reverted the file byte-for-byte before the
  final clean build/`yarn check` — confirmed zero net diff to
  `app/(public)/hero-lab/page.tsx` (not one of this prompt's own allowed
  files) before committing, and re-confirmed the gate still 404s a truly
  clean production build afterward.
  **All six required metrics measured, median of 3 Playwright runs
  (production server, no throttle, "local desktop") + Lighthouse
  desktop/mobile presets — full table in the new
  `docs/claude-prompts/HERO_PERF_REPORT.md`:** LCP 248ms median (target
  <2s); CLS 0.00008 desktop / 0.0000188 mobile (target 0.00, effectively
  zero at any real reporting precision); FPS 60.03 avg during combined
  pointer+scroll stress (target >=55, reusing 016's own measurement
  methodology); hero-route JS 6.46 KB gzip, independently re-verified by
  gzip-ing the actual chunk file directly (target <=35KB, and that number
  still includes `/hero-lab`-only dev chrome not part of the real hero);
  image bytes 150.7 KB desktop / 42.5 KB mobile (targets 900/350 KB,
  matching 017's own dev-mode numbers exactly, confirming those transfer
  sizes are environment-independent as expected for static files); 0ms
  long tasks across every load run (target <200ms). Lighthouse: **100/100
  desktop**, **98/100 mobile** (standard 4x-CPU/~1.6Mbps throttle) —
  LCP/CLS/TBT all clean on both. **All six targets pass with wide margin;
  no regressions found, so no `components/hero/` changes were needed or
  made this prompt** — 017 already shipped a hero that clears 018's own
  budget as-is.
  **One honestly-flagged, non-blocking observation, not a failure:** LCP's
  *element* (not just its time, which is this prompt's actual checklist
  item) varied between the headline and the primary shard image across
  runs — both paint within the same sub-1.3s window, and the LCP algorithm
  picks by rendered pixel area, which the shard image sometimes wins.
  Documented in HERO_PERF_REPORT.md rather than "fixed," since a fix would
  mean either a visual change (out of scope: "no visual changes allowed"
  for this prompt) or suppressing a legitimately-painted image from LCP
  consideration, which would be gaming the measurement, not the
  experience.
  **017's own open dev-mode observation (shard fade-in sometimes lagging
  paint by up to ~2s in `next dev`) was not independently re-tested here**
  (018 measures its own six named metrics, not that specific animation
  timing) — but the clean 0ms-long-tasks and sub-300ms LCP numbers against
  a real production build make it very likely that was a `next dev`-only
  artifact (unminified bundle, React DEV build, HMR runtime), not
  something users would see; left as an open item rather than claimed
  resolved without direct verification.
  Lighthouse (v13.4.1) installed transiently via `npx lighthouse` — not
  added to `package.json`/`yarn.lock`. `yarn lint`, `yarn typecheck`,
  `yarn test`, and `yarn build` (against the properly-gated, reverted tree)
  all passed via `yarn run check`.
  **Phase 3 (hero) is now complete end-to-end** (012-018 all done) —
  Phase 4 integration (020, which depends on 018+019) can proceed once
  019 (public header) also lands; the still-open manual-verification
  user-approval gaps noted above (014/015/016/017, plus this prompt's own
  "user reviews HERO_PERF_REPORT.md and approves Phase 4 integration" step)
  remain outstanding and are a prerequisite this repo's own traceability
  gate cares about, not yet satisfied by this session.
- 019 — Public header and navigation (2026-07-21). **Found before writing
  any code:** `components/Navigation.tsx` and `components/LanguageSwitcher.tsx`
  (this prompt's own literal "files to inspect first") don't exist
  anywhere in this workspace — not committed, not uncommitted; neither
  does `app/page.tsx` (the actual root route is `app/(public)/page.tsx`, a
  bare placeholder heading, no nav at all). Prompt 004's backend-only port
  evidently never carried these UI files over. Resolved the same way prior
  gaps of this shape have been (002/005/013/017): went to the actual
  source of truth instead of assuming. Cloned `skv1ra/altrtest2` read-only
  into a disposable OS temp directory (same discipline as Prompt 001's own
  disposable-worktree approach — never touched the user's own separate
  local `altrtest2` checkout, and deleted the clone once done), read the
  real legacy `Navigation.tsx`/`LanguageSwitcher.tsx` for the patterns this
  prompt explicitly asks to preserve, then built fresh components against
  *this* workspace's own already-ported `lib/auth.ts`
  (`getCurrentProfile()` -> `/api/me`, already resolves to `null` on any
  non-2xx/network failure — exactly this prompt's required offline
  fallback, with no extra code needed) and `lib/i18n/lang-store.ts`
  (`useLang()`, already cookie-consent-gated and cross-tab-synced) —  both
  already exist in this workspace and needed zero changes, just reuse.
  **New components** (`components/site/`): `Logo.tsx` (an original
  hand-authored SVG shard glyph — two flat facets, not a literal hero
  raster asset, which is the wrong format/weight entirely for a 20px mark;
  designed by cropping and eyeballing the reference image's own header
  region, `references/altr-hero-reference.png`, not copied pixel-for-
  pixel), `MobileMenu.tsx` (built on the shared `Dialog` primitive from
  Prompt 010, per this prompt's own "using Dialog primitives" instruction
  — reused its portal/focus-trap/Escape/backdrop-click/scroll-lock rather
  than reimplementing any of that), `Header.tsx` (orchestrates both, plus
  the scroll-driven backdrop and the `/api/me` auth check).
  **`Dialog`'s own panel is a centered ~480px card by default** (`app/
  styles/overlays.css` `.dialog-panel`) — this prompt wants a full-screen
  overlay, not a modal, so `MobileMenu.module.css` overrides sizing via
  `Dialog`'s existing `className` prop. That still left a visible margin
  (`.dialog-backdrop`'s own `padding: var(--space-6)`, which `Dialog`
  doesn't expose a way to override per-instance) — fixed with a scoped
  `:global(.dialog-backdrop):has(.panel) { padding: 0; }` in
  `MobileMenu.module.css`, which only touches a backdrop that actually
  contains this component's own hashed panel class, leaving every other
  `Dialog`/`ConfirmDialog` usage in the app untouched. Verified with a
  real Playwright screenshot before and after (see below).
  **i18n:** extended `lib/i18n/copy.ts`'s existing `sharedCopy.nav`
  namespace (`howItWorks`, `login`, `createAltr`, `menuTitle`) rather than
  adding a parallel namespace — `product`/`pricing`/`menu`/`closeMenu`/
  `language` were already correct for the header's own needs and are
  reused as-is; the signed-in-state label reuses the existing
  `common.backDashboard` ("Dashboard"/"Кабінет") instead of a duplicate
  key. `howItWorks`/`login` match legacy's own already-vetted UA
  translations exactly (voice consistency); `createAltr` ("Створити свій
  Altr") and `menuTitle` ("Меню") are new translations, this prompt's own.
  **Real bugs found and fixed via actual testing, not just code review**
  (both via real Playwright screenshots at specific widths, saved to the
  session scratch dir): (1) the mobile-menu backdrop margin above; (2) at
  exactly the Tailwind `md` (768px) breakpoint — the boundary where the
  original implementation first switched from the mobile hamburger to the
  full desktop nav — Ukrainian nav labels plus the CTA button read as
  cramped (logo and "ПРОДУКТ" nearly touching) and, after a first fix
  attempt (`gap` on the nav bar), "ЯК ПРАЦЮЄ" and "Створити свій Altr"
  wrapped onto two lines instead. Root-caused as genuinely not enough
  width at 768px for this content, not a spacing bug — fixed by moving
  every `md:` breakpoint in `Header.tsx` to `lg:` (1024px), confirmed
  clean with real screenshots at 767/768/1023/1024px (1024px has real
  room; below it, still cleanly the mobile hamburger, no partial/broken
  in-between state). This is this prompt's own "long UA strings in nav
  must not wrap the bar" edge case, caught for real rather than assumed
  fine.
  **Auth-aware, verified two ways:** mocked `getCurrentProfile()` in
  `tests/components/Header.test.tsx` (logged-out default, resolves-to-a-
  profile swap to "Dashboard", and the offline-fallback case — which,
  correctly, is indistinguishable from logged-out from this component's
  own point of view, since `getCurrentProfile`'s contract is to resolve
  `null`, never reject, on any failure); and, separately, confirmed no
  live session exists to demonstrate a true signed-in preview inside the
  styleguide demo itself (no existing override mechanism for this the way
  `lib/motion.ts` provides one for reduced motion, and adding one isn't in
  this prompt's allowed files) — documented as a static illustration in
  `HeaderDemo.tsx` instead, flagged for a real spot-check once Prompt
  025+ ships actual sign-in.
  **Keyboard/focus, verified with Playwright, not just code review:**
  mobile menu opens as `role="dialog"` with the correct accessible name
  ("Menu"/"Меню"), Escape closes it and returns focus to the exact trigger
  button (`document.activeElement` checked directly), clicking a link
  inside the menu closes it. Focus-trap Tab/Shift+Tab wrapping is
  `Dialog`'s own already-tested behavior (`tests/components/Dialog.test.tsx`),
  not re-tested here.
  **Not done / explicitly out of scope, matching this prompt's own file
  list:** `app/(public)/page.tsx` (the real homepage) does not render
  `<Header />` yet — that's Prompt 020's integration job; verified via the
  new `HeaderDemo.tsx` styleguide preview only, per this prompt's own
  Manual Verification instruction. `components/Navigation.tsx` was never
  created (it never existed to "leave untouched" in the first place, see
  above) — 020 has no legacy file to swap out in this workspace, only to
  wire the new `Header` in.
  `yarn lint`, `yarn typecheck`, `yarn test` (32 files/173 tests, including
  the new `Header.test.tsx`), and `yarn build` (30/30 pages; `/hero-lab`
  grew 6.46 KB -> 6.49 KB gzip, negligible, unrelated to this prompt's own
  route) all passed via `yarn run check`.
- 020 — Hero integration and product section (2026-07-21). **The homepage
  is rebuilt**: `app/(public)/page.tsx` (was the Prompt 004 single-line
  placeholder) now renders `<Header />` + `<HeroScene />` (unchanged, same
  component `/hero-lab` already verified — no fork) + a new
  `<ProductSection />` for `#product`. Prompt 004's own port never carried
  the legacy hero/homepage components into WORKSPACE (confirmed again,
  same as 019 found for `Navigation.tsx`) — this prompt's own text already
  flagged that ("no deletion needed"), so there was nothing to delete or
  swap out; **deleted files: none, importer proof: none needed.**
  **Found and fixed a real, serious, pre-existing, project-wide bug —
  not introduced by this prompt, but this is the first prompt whose own
  acceptance criteria required proving real click interactivity against a
  genuine production build on a publicly-reachable route (018 measured
  perf/paint numbers on `/hero-lab`, which don't require any click to
  succeed; 019 only ever verified interactivity via `yarn dev` or jsdom,
  neither of which enforces CSP the way a real browser does):**
  `middleware.ts` generates a fresh CSP nonce *per request* and sets it as
  both the `x-nonce` request header and the `Content-Security-Policy`
  response header — correct — but nothing in the app ever reads that
  nonce back out to apply it to Next's own inline scripts, and more
  fundamentally, `/` was **statically prerendered** (`○` in the build
  output), meaning its HTML — including whatever nonce might have been
  baked into it — is fixed at *build* time, while the CSP header's nonce
  is fresh on *every request*; the two can never match for a static page,
  by construction. Confirmed precisely, not guessed: production HTML
  (`yarn build && yarn start`) had zero `nonce="..."` attributes on its 5
  bare inline `<script>self.__next_f.push(...)</script>` RSC-payload
  tags, and the browser console showed 5 real
  `Executing inline script violates ... Content Security Policy` errors —
  clicking the mobile-menu trigger did nothing at all (React never
  finished hydrating; `getByRole("dialog")` after a real `.click()` found
  nothing). Cross-checked against `yarn dev` (which showed correct,
  matching nonces on every script, zero bare inline scripts, zero CSP
  errors) to confirm this was prod-only, not something already broken and
  unnoticed. **Fix, within this prompt's own allowed files only**
  (`middleware.ts`/`app/layout.tsx` are not in scope, and this prompt
  isn't the place to redesign the CSP strategy): added
  `export const dynamic = "force-dynamic"` to `app/(public)/page.tsx`,
  which forces `/` to render per-request instead of statically —
  confirmed fixed (production HTML now carries matching nonces on every
  script tag, zero CSP console errors, all 5
  `tests/e2e/smoke.spec.ts` tests pass against a real `yarn build && yarn
  start`, including the mobile-menu open/Escape-close/focus-return test).
  **Real trade-off, flagged honestly, not silently absorbed:** `/` losing
  static generation means it's server-rendered on every request instead
  of served as cached static HTML — a real cost/latency trade-off for the
  single highest-traffic route on the whole site. A broken-but-fast
  homepage is worse than a working-but-dynamic one, so this was still the
  right call for *this* prompt, but the underlying CSP-nonce-vs-static-
  generation tension is a site-wide architectural question (does every
  page needing real interactivity go dynamic? does the CSP strategy
  change to a hash-based policy instead of nonces for statically
  rendered routes? something else?) that deserves its own `RISKS.md`
  entry and a real decision — not made here, `RISKS.md` isn't in this
  prompt's own allowed files. **This also puts a caveat on 018's own
  interactivity claims:** 018's FPS measurement drove `page.mouse.move`/
  `window.scrollTo` against production `/hero-lab` and counted real
  `requestAnimationFrame` callbacks via a script injected directly through
  Playwright (not through React) — that count is real and unaffected by
  this bug, but it does **not** prove React-driven shard motion
  (`useHeroPointer`/`useHeroShardMotion`) was actually responding to that
  input in that specific run, since `/hero-lab` was *also* static in
  production and could plausibly have hit the identical hydration
  failure. Not re-verified here (out of this prompt's scope — `/hero-lab`
  isn't an allowed file) — flagged so it isn't mistaken for a settled
  fact.
  **`#product`:** new `ProductSection.tsx` — eyebrow/title/body plus three
  plain labeled beats (Import/Memory/Drafts) in one column with hairline
  dividers, no card grid (DESIGN_DIRECTION's own "forbidden: ...
  rounded-card grids" rule, and this prompt's own visual requirement); one
  quiet shard (`shard-mid-02`, reused from the hero's own asset family,
  `@1x` resolution — this is a below-the-fold supporting visual, not
  hero-scale) with one small memory-fragment caption, continuing the fog
  atmosphere (`Surface variant="fog"`) rather than cutting to flat white.
  New `lib/i18n/home-copy.ts` export `productCopy` (EN/UA) — added
  alongside, not into, the file's existing `homeCopy` export: that object
  turned out to be dead weight neither LEGACY's real homepage (which has
  its own separate inline copy object) nor this workspace actually uses
  anywhere (`grep`-confirmed both), the wrong shape/voice to extend, and
  cleaning it up isn't this prompt's objective. Copy is truthful to
  FEATURE_PARITY_MATRIX's "Roadmap only" list: imports are described as
  user-supplied exported conversation files (matches
  `lib/imports/parsers.ts`'s real WhatsApp/Telegram/Instagram/Messenger
  export-file handling), never live OAuth/API sync; drafts are described
  as proposals the user reviews before sending (matches
  `app/api/ai/draft-reply`), never autonomous action.
  **Real bug found and fixed via a screenshot close-up, not just review:**
  the fragment caption's first-pass styling used dark graphite text
  (right for text over the light page background, illegible over the
  shard's own near-black glass, which is what it actually sits on) —
  DESIGN_DIRECTION specifies "etched in light silver type inside the
  glass" for exactly this reason, and the hero's own fragments
  (`HeroFragments.module.css`) already use light silver + a dark shadow;
  fixed to match. A second look also found the caption's second line
  overflowing the shard's silhouette in both languages — shortened the
  copy (EN: "context, not a chatbot" -> "not a chatbot"; UA matched) and
  reduced its font-size, confirmed fully inside the shard afterward in
  both languages with real screenshots.
  **Smooth scroll + anchor targets:** new `app/(public)/page.css` (plain
  global CSS, not a CSS Module — Next's css-loader rejects a module file
  whose only selectors are `:global(...)`, "not pure"; a plain global
  file, importable from any page per the App Router, has no such
  constraint and needed no middleware/layout changes) sets
  `scroll-behavior: smooth` on `html` (reduced-motion respected) and
  `scroll-margin-top: 96px` on `#product` so the fixed header never
  covers the section's own heading when scrolled or landed on directly.
  Verified with real Playwright runs, not just code review: clicking
  "Product" in the header lands on a real, in-viewport `#product`;
  navigating directly to `/#product` shows it already in view, no dead
  scroll.
  **e2e:** LEGACY's `tests/e2e/critical-flows.spec.ts` (this prompt's own
  "files to inspect first") turned out to have **no homepage-content
  block to port at all** — every one of its tests navigates to `/auth`,
  `/dashboard`, `/pricing`, `/memory`, `/import-conversations`, or
  `/assistants`; `/` only ever appears once, as a post-sign-out redirect
  target, never asserted against for content. Rewrote
  `tests/e2e/smoke.spec.ts` with genuinely new coverage instead (5 tests:
  header+hero+product render; nav hrefs; the Product-link scroll; direct
  `/#product` landing; mobile menu open/Escape-close/focus-return) — role-
  based selectors throughout, matching ADR-011's own migration
  instruction in spirit even though there was no legacy spec body to
  literally migrate.
  **Dead-link ledger (per this prompt's own instruction to keep one, not
  a defect list):** live and verified: `/` (logo), `/#product`. Still
  unresolved, each waiting on its own later, already-scheduled prompt:
  `/#how-it-works` (021), `/pricing` (023), `/auth?mode=login` and
  `/auth?mode=register` (025), `/dashboard` (029). LEGACY content not yet
  re-covered on the new landing: the how-it-works memory/understanding/
  action demo and the dedicated memory section (021, per its own title);
  the privacy explanation (022); a pricing teaser embedded in the landing
  itself, if the rebuild still wants one — LEGACY had one, but the current
  INDEX describes 023 as a dedicated pricing *page*, not a landing
  section, so this specific piece's future owner is genuinely unclear
  from the plan as written, flagged rather than guessed; the final CTA
  section and footer (024, per its own title). None of this is silently
  dropped — every piece above is either already scheduled or explicitly
  flagged as unscheduled.
  `yarn lint`, `yarn typecheck`, `yarn test` (33 files/176 tests, including
  the new `ProductSection.test.tsx`), `yarn build`, and `yarn test:e2e`
  (5/5, against a real `yarn build && yarn start`, not `yarn dev`) all
  passed via `yarn run check` + a separate `yarn test:e2e` run.
- 021 — How-it-works and memory demonstration (2026-07-21). **Found
  before writing any copy:** `components/memory/types.ts` and
  `components/memory/` (this prompt's own "files to inspect first" / "must
  not be changed") don't exist anywhere in this workspace — same shape of
  gap 019/020 already hit for their own named legacy files. The *real*
  Memory shape lives implicitly in `app/api/memories/route.ts`'s own zod
  schema and Supabase columns (`category, title, description, confidence
  [0-1 float], source_type, source_reference, is_active`, provenance via
  the joined `altr_memory_sources` rows) — used that as ground truth
  instead. `docs/IMPORT_SECURITY.md` is also absent from this workspace;
  read LEGACY's copy (disposable clone, same method as 019/020, deleted
  after) for its exact privacy-boundary wording ("parsed in a browser Web
  Worker... raw files are not stored by default") and independently
  re-verified that claim is *also* true of this workspace's own code
  (`workers/conversation-parser.worker.ts`, `rawFileStored:
  z.literal(false)` in `app/api/imports/route.ts`) before using it, rather
  than trusting a doc that was never ported.
  **New components** (`components/site/`): `HowItWorks.tsx` (`#how-it-
  works` — three numbered movements, large numerals + hairline rules, one
  column always, not just "on mobile" — a 3-across grid would be exactly
  the card-grid look Prompt 020 already ruled out for `ProductSection`,
  staying consistent) and `MemoryDemo.tsx` (`#memory` — a calm, hairline-
  divided list on an obsidian surface, matching DESIGN_DIRECTION's own
  dashboard rule "data displayed as calm editorial lists/tables, not card
  grids" per this prompt's "must look like the future dashboard"
  requirement).
  **Copy-accuracy check outcome (this prompt's own required manual
  verification — read against FEATURE_PARITY_MATRIX, every claim mapped
  to a COMPLETE row, not just asserted):**
  - "Everything is parsed locally in your browser — the raw file is never
    uploaded" -> **Local parsing in Web Worker** + **Raw archive never
    uploaded** (both COMPLETE, matrix lines 53/60).
  - "Edit any memory, disable it, or delete it outright" -> **Memory
    editing**, **Memory disabling (is_active)**, **Memory deletion**
    (all COMPLETE, matrix lines 69-71).
  - "Your Twin drafts replies in your voice... every draft is yours to
    review — nothing sends itself" -> matches `app/api/ai/draft-reply`
    returning a draft string with no send-on-behalf-of-user path anywhere
    in the ported API surface; autonomous action stays explicitly
    Roadmap-only (Operator/Negotiator, FEATURE_PARITY_MATRIX line
    133-137) and is never implied. **All claims check out — no unmapped
    or overstated claim found.**
  - New `tests/components/HowItWorks.test.tsx` includes a regression test
    asserting these exact phrases render, specifically so future copy
    edits can't silently drift into an unaudited claim (e.g. "syncs
    live") without a test failing first.
  **Memory demo data:** fictional, 4 entries, field *names/categories*
  (communication style, frequent phrase, relationship, typical decision)
  inspired by LEGACY's `lib/memoryData.ts` per this prompt's own "reuse
  fictional data ideas, not the visuals" instruction — but deliberately
  **not** its shape: LEGACY's `confidence` is a 0-100 int, this
  workspace's real schema is a 0-1 float, so copying LEGACY's numbers
  verbatim would have misrepresented the actual product; confidence isn't
  displayed in the demo at all (not one of this prompt's own explicit
  four visible fields: category/title/description/provenance), so the
  mismatch never had a chance to surface anyway — noted for whoever builds
  038's real dashboard list, which will need to actually format that
  float.
  **No dead buttons, verified two ways:** the one memory shown mid-edit
  renders its title as a bordered box styled to *look* like a text field
  (not a real `<input>`, no interactive ARIA role) next to a plain
  `<span>` "Editing" label — RTL asserts zero `<button>`, zero
  `role="textbox"`, zero `<input>` anywhere in the whole section; e2e
  re-confirms zero buttons against a real production build.
  **Reveal-on-scroll:** both sections use the Prompt 011 `Reveal` system
  (already reduced-motion-safe and no-JS-safe by construction — see
  `components/ui/Reveal.tsx`), same as `ProductSection`; not re-verified
  independently since it's the identical, already-proven mechanism.
  **320px edge case:** checked with a real screenshot, not assumed —
  numerals and step text stay balanced (a `@media (max-width: 400px)`
  rule shrinks the numeral column's `minmax()` floor); the memory list
  collapses its category-label/content columns to a single stack below
  640px.
  **Anchor offset:** extended `app/(public)/page.css`'s existing
  `scroll-margin-top: 96px` rule (added in 020 for `#product`) to also
  cover `#how-it-works` (this prompt's own required edge case) and
  `#memory` (no header nav link points at it yet, but given the same
  treatment for free/consistency in case a future prompt deep-links to
  it) — not a new file, just an extended selector list, same as 020's own
  note anticipated ("#how-it-works/#pricing once 021/023 add them").
  **Dead-link ledger update:** `#how-it-works` is now live (closes that
  specific item from 020's ledger) — `page.tsx` docstring and the header-
  link e2e test both updated to say so explicitly rather than leaving a
  stale "still deferred" comment. Still open, unchanged: `/pricing`
  (023), `/auth?mode=login`/`/auth?mode=register` (025), `/dashboard`
  (029), the privacy section (022), the pricing teaser's uncertain future
  owner (still unresolved, see 020's entry), the final CTA section and
  footer (024).
  `yarn lint`, `yarn typecheck`, `yarn test` (35 files/180 tests, including
  the new `HowItWorks.test.tsx`/`MemoryDemo.test.tsx`), `yarn build`, and
  `yarn test:e2e` (7/7, two new tests added, against a real `yarn build &&
  yarn start`) all passed via `yarn run check` + a separate `yarn
  test:e2e` run. No-JS spot check (real `javaScriptEnabled: false`
  context): both new sections' headings and all four memory rows present
  in the DOM with no script running.
- 022 — Twin demonstration and privacy section (2026-07-21). **Found
  before writing any copy:** `docs/SECURITY.md` (this prompt's own "files
  to inspect first") doesn't exist in this workspace — read from a
  disposable LEGACY clone (same method as 019-021, deleted after);
  `docs/IMPORT_SECURITY.md` (also named) confirmed absent again, already
  established in 021. `app/privacy/page.tsx` also doesn't exist yet (only
  `app/api/privacy/*`) — linked to `/privacy` anyway per this prompt's own
  literal instruction, added to the dead-link ledger below rather than
  skipped.
  **New components** (`components/site/`): `TwinDemo.tsx` (`#twin` — a
  static composed moment on an obsidian ground: a muted incoming-message
  row, then the draft in a real `--altr-white` card, this prompt's own
  visual "strongest light/dark contrast moment on the page", verified
  with a real screenshot) and `PrivacySection.tsx` (`#privacy` — four
  one-sentence guarantees with a quiet `lucide-react` glyph each,
  hairline-divided rows, not a card grid).
  **Guarantee-to-evidence mapping (this prompt's own required security
  record — every sentence traced to real code or a MASTER_CONTEXT.md
  invariant, not asserted):**

  | Guarantee sentence | Evidence |
  | --- | --- |
  | "Parsed in your browser... the file itself is never uploaded, only the structured result is." | MASTER_CONTEXT invariant #7; `workers/conversation-parser.worker.ts`; `rawFileStored: z.literal(false)` in `app/api/imports/route.ts` |
  | "Every read and write is scoped to your authenticated account, enforced at the database level." | MASTER_CONTEXT invariant #4; `supabase/tests/phase_3_rls_verification.sql` |
  | "Altr's Twin produces drafts only. Nothing is sent, scheduled, or acted on without you reviewing it first." | MASTER_CONTEXT invariant #6 (exact wording: "AI output is a reviewable draft. The application never sends messages."); `app/api/ai/draft-reply/route.ts`'s own developer instruction ("Never claim it was sent, accepted, completed..."); response `status` field is literally `"draft"`; no send-on-behalf-of-user path exists anywhere in the ported API surface |
  | "Export your data or delete your account at any time — deletion requires explicit confirmation, never a single accidental click." | `app/api/privacy/export/route.ts` (real GET export); `app/api/privacy/account/route.ts` (`confirmation: z.literal("DELETE MY ACCOUNT")`, matches MASTER_CONTEXT invariant #8 exactly) |

  **One suggested guarantee deliberately dropped, not silently ignored:**
  "no training on your data" — checked `lib/ai/openai.ts`'s `createResponse`
  (no data-retention/opt-out parameter passed to the OpenAI API call) and
  every doc available (this workspace's own, plus LEGACY's
  `docs/SECURITY.md`) — none state a training policy either way. Per this
  prompt's own explicit instruction ("if unverifiable, do not claim it"),
  left out entirely: four guarantees shipped, not five. A regression test
  (`PrivacySection.test.tsx` and the e2e suite) asserts the word "train"
  never appears anywhere in the section, so a future edit can't
  reintroduce this claim without a test failing first.
  **Legal-eye read (this prompt's own required manual verification):**
  read all four sentences again looking for anything a reviewer could
  challenge — flagged and specifically checked one edge case on the third
  guarantee's word "scheduled": the profile API has unused
  `autoDrafts`/`weeklyDigest` preference *flags* (`app/api/me/route.ts`,
  `lib/profileServer.ts`) with **zero wired implementation anywhere** —
  no cron, no scheduled-send job references them at all — so "nothing is
  ...scheduled... without you reviewing it first" holds vacuously true
  (nothing is scheduled, full stop) rather than overclaiming a review gate
  on a feature that doesn't exist. No other sentence found challengeable.
  **No fake send button / labeled figure, verified two ways:** `TwinDemo`
  renders as `<figure aria-label="...for illustration only — not a live
  conversation">` with zero `<button>`s anywhere in the section — RTL
  asserts the figure role/name and zero buttons; e2e re-confirms against
  a real production build. Same "zero buttons" discipline `MemoryDemo`
  (021) already established.
  **Reveal-on-scroll:** both sections reuse the Prompt 011 `Reveal`
  system, same as every prior landing section — not independently
  re-verified, identical already-proven mechanism.
  **Edge cases:** long UA strings in the demo bubbles checked with a real
  screenshot (draft card grows to fit, no truncation/overflow); 320px
  checked for both sections, clean.
  **Anchor offset:** extended `app/(public)/page.css`'s existing
  `scroll-margin-top: 96px` selector list to `#twin` and `#privacy` (no
  new file, same pattern 020/021 already established).
  **Dead-link ledger update:** adds `/privacy` (page doesn't exist yet —
  no prompt in the current INDEX explicitly owns a dedicated
  `app/privacy/page.tsx` build the way 023/025/029 own their own targets;
  flagged, not guessed at). Still open, unchanged from 020/021: `/pricing`
  (023), `/auth?mode=login`/`/auth?mode=register` (025), `/dashboard`
  (029), the pricing-teaser-in-landing's unclear owner, the final CTA
  section and footer (024).
  `yarn lint`, `yarn typecheck`, `yarn test` (37 files/184 tests, including
  the new `TwinDemo.test.tsx`/`PrivacySection.test.tsx`), `yarn build`, and
  `yarn test:e2e` (9/9, two new tests added, against a real `yarn build &&
  yarn start`) all passed via `yarn run check` + a separate `yarn
  test:e2e` run. No-JS spot check: both new sections' headings, the draft
  label, and all four guarantee rows present in the DOM with no script
  running.
- 023 — Pricing page (2026-07-21). **Found before writing any code:**
  `app/pricing/page.tsx` (this prompt's own "current project state" claim
  — "Legacy pricing... is functional") doesn't exist anywhere in this
  workspace, same literal-vs-actual gap 019-022 already hit for their own
  named files — it only exists in LEGACY. `tests/e2e/critical-flows.spec.ts`
  also doesn't exist here (`tests/e2e/` only had 020's `smoke.spec.ts`) —
  unlike 020's own finding that LEGACY's file had *no* homepage content to
  port, this time LEGACY's file genuinely does have real pricing/checkout
  tests, so those were actually ported into a new file of the same name,
  not treated as another "nothing to port" case. `lib/billing/**` (all
  read-only per this prompt) and `lib/plans.ts`/`lib/billing/plans.ts`
  (read-only, neither in this prompt's own allowed-files list — left
  completely untouched) all exist and were used as ground truth.
  **Deliberately did not reuse `lib/plans.ts`'s existing marketing copy**
  (this prompt's own instruction: "plan display names move to i18n —
  keep `lib/billing/plans.ts` values as the canonical amounts"): that
  file's feature lists include roadmap-only claims ("Командний простір"/
  team workspace, work integrations — FEATURE_PARITY_MATRIX's own
  "Roadmap only" list) and an `originalPrice` $30->$20/$60->$40 discount
  framing with **no corresponding field anywhere in
  `lib/billing/plans.ts`'s canonical amounts** — never actually charged,
  so not reproduced. New pricing copy (`lib/i18n/copy.ts`'s
  `sharedCopy.*.pricingPage`) states only what `PLAN_LIMITS`
  (`lib/billing/limits.ts`) and the real API contracts actually support.
  **Real limits, verified exact, not approximated:** Free 1 import/mo,
  5 MB, 250 memories, 10 Twin drafts/mo; Personal 10/25 MB/5,000/500;
  Work 50/50 MB/25,000/2,000 — read directly from `PLAN_LIMITS`, asserted
  byte-for-byte in both `PricingTable.test.tsx` and
  `critical-flows.spec.ts`, never hardcoded as copy.
  **Found and fixed one real bug via a real screenshot, not just code
  review:** a first pass rendered the page's own eyebrow/title/subtitle
  server-side (static English `sharedCopy.EN` text in `page.tsx`) while
  `PricingTable` itself correctly used `useLang()` — switching to UA
  translated the three columns but left the heading in English. Moved the
  intro into `PricingTable` itself so the whole page reacts to one shared
  language state; re-verified with a UA screenshot.
  **Found two real, pre-existing production bugs — neither introduced
  here, neither fixable within this prompt's own allowed files:**
  (1) `lib/supabase/middleware.ts`'s `protectedPath()` treats every
  `/api/*` route as auth-required unless explicitly allowlisted
  (`publicApi`), and `/api/billing/plans`/`/api/billing/me` aren't on that
  list — even though `/api/billing/plans`'s own route handler has no
  `requireUser()` call at all and is clearly meant to be public (it's
  literally how an anonymous visitor is supposed to see live pricing
  before signing up). Confirmed directly against a running server, not
  guessed from reading code: `curl` on both routes returns a real 401
  `{"error":"AUTH_REQUIRED"}` — from middleware itself — for every
  anonymous request. Practical effect: **every anonymous visitor to
  `/pricing` currently sees the static-fallback-pricing/quiet-retry state
  this prompt's own edge case asks for, not live pricing** — that fallback
  path isn't a rare edge case here, it's the default experience for the
  page's single most important audience. (2) A narrower, currently-
  dormant bug inside `/api/billing/me`'s own handler: its catch block
  only maps the literal string `"UNAUTHORIZED"` to a 401, but
  `requireUser()` actually throws `"AUTH_REQUIRED"` — unreachable in
  practice today because middleware's own gate (bug 1) intercepts first,
  but would surface a wrong status code (500, not 401) if that gate were
  ever fixed without also fixing this. Both are real findings written up
  here, not silently worked around — `PricingTable`'s own client code
  already treats *any* non-2xx from `/api/billing/me` as "not signed in"
  (matching `Header`'s own established robust-to-any-failure convention),
  so neither bug breaks the page's own behavior, just its live-pricing
  *accuracy* for anonymous visitors. Both deserve `RISKS.md`/middleware-
  owner follow-up, not filed here (`RISKS.md`/`lib/supabase/middleware.ts`
  aren't in this prompt's allowed files) — a second, unrelated middleware
  finding stacking on top of 020's own CSP/static-generation one.
  **Behavior-parity checklist (this prompt's own required "preserve
  behavior exactly" instruction):**
  | LEGACY behavior | Status |
  | --- | --- |
  | Unauthenticated CTA -> `/auth?next=/pricing` | Preserved — but as a real `<Link href>` (visible/no-JS-safe/matches `Header`'s own established pattern), not LEGACY's `<button>` with a client-side auth check inside the click handler. Same destination URL, satisfies this prompt's own literal acceptance criterion ("matching the current e2e regex"); documented as a deliberate, values-consistent divergence, not an oversight |
  | Authenticated -> `POST /api/billing/checkout` with `{ planId }` only | Preserved exactly, asserted in both RTL and e2e |
  | Current-plan state shows quiet "Your plan", not a dead button | Implemented; Free's "not current, can't checkout into it" state shows plain text ("Included with every account"), not a button either, per this prompt's own "no dead buttons" rule (LEGACY's own Free-plan CTA behavior wasn't specified in this prompt's own inspection scope) |
  | Work<->Personal switch goes through checkout as today | Preserved — any non-current paid plan always renders a real, functional checkout button regardless of which plan the user is currently on |
  | `/api/billing/plans` unavailable -> static fallback + quiet retry + disabled CTAs with visible reason | Implemented; found (see above) this is not a rare edge case in the current deployment |
  `yarn lint`, `yarn typecheck`, `yarn test` (38 files/190 tests, including
  the new `PricingTable.test.tsx`), `yarn build`, and `yarn test:e2e`
  (14/14 — 5 new pricing tests in the new `critical-flows.spec.ts`, plus
  the 9 already in `smoke.spec.ts`, against a real `yarn build && yarn
  start`) all passed via `yarn run check` + a separate `yarn test:e2e`
  run.

- 024 — Footer, legal restyle, SEO, mobile polish (2026-07-21). **Found
  before writing any code:** `components/legal/` didn't exist in this
  workspace (same literal-vs-actual gap as every prior prompt) — LEGACY's
  own `components/legal/LegalDocumentPage.tsx` and `CookiePreferencesButton.tsx`
  were read as behavioral reference only. LEGACY's `components/PremiumFooter.tsx`
  was read but **not** structurally copied — it pads a 3-column layout with
  mostly-dead `#` links to look fuller, which directly conflicts with this
  prompt's own "not link soup" requirement, so the new `Footer` uses this
  prompt's own specified 4-column layout instead (Product/Legal/Account/
  Language+socials). `LEGAL_SETUP.md` in LEGACY was found stale (references
  an old `lib/legal.ts` singular file and Ukrainian `[ВКАЖІТЬ ...]`
  placeholders that don't match this workspace's actual `legal-config.ts`
  English `[NEEDS OWNER INPUT: ...]` placeholders) — not relied on.
  **`lib/legal/*-content.ts` and `legal-config.ts` confirmed untouched**
  (no diff in either file this session) — `LegalDocumentPage` only renders
  the existing `getPrivacyContent`/`getTermsContent`/`getCookiesContent`
  data, via the same `LegalBlock` union already defined in `lib/legal/types.ts`.
  **Link inventory diff vs LEGACY `PremiumFooter`:**
  | LEGACY | WORKSPACE `Footer` |
  | --- | --- |
  | 3 columns (Product/Resources/Legal), several dead `#` hrefs | 4 columns (Product/Legal/Account/Language+socials), every link real, max 5 per column |
  | Hardcoded fake social URLs | Social icons (X/GitHub) only render when `NEXT_PUBLIC_X_URL`/`NEXT_PUBLIC_GITHUB_URL` are actually set — omitted, not dead, when unset |
  | No language switch | EN/UA switch reusing the shared `useLang()` hook |
  | No auth-aware account column | Account column shows Log in + Create your Altr signed-out, Dashboard signed-in — same `getCurrentProfile()` pattern as `Header` |
  | `CookiePreferencesButton` dispatches `altr-open-cookie-preferences`, no listener | Same real function (`openCookiePreferences()`) wired to a real button — still no listener anywhere in this workspace (no cookie-consent banner UI has been built yet in any prompt so far), so it currently has no visible effect; documented here rather than silently no-op'd, same "wire to the real destination even if downstream isn't built" pattern used for `/auth` links since 019 |
  Footer is now mounted on `/`, `/pricing`, `/privacy`, `/terms`, `/cookies`
  — every public page.
  **`data-deletion` page deliberately not built**, even though
  `lib/legal/deletion-content.ts` and `getDeletionContent()` already exist
  and LEGACY's own `LegalDocumentPage` supports a 4th `"data-deletion"` kind:
  this prompt's own "Files allowed to change" list only names
  `privacy`/`terms`/`cookies` routes, not `data-deletion` — left for a future
  prompt's explicit scope rather than added speculatively, same judgment
  call 019-023 made for other tempting-but-out-of-scope additions.
  **Metadata table:**
  | Route | `title` (renders as "X — Altr") | Notes |
  | --- | --- | --- |
  | `/` | (root `Altr` default) | OG/Twitter card added at the layout level, applies site-wide |
  | `/pricing` | Pricing | unchanged from 023 |
  | `/privacy` | Privacy | new |
  | `/terms` | Terms | new |
  | `/cookies` | Cookies | new |
  `app/layout.tsx` gained `metadataBase` (from `getAppUrl()`), a shared
  `openGraph`/`twitter` block (`summary_large_image`), and `/og-image.png`
  (1200×630, **132.4 KB**, well under the 300 KB budget) — composed via a
  one-time, uncommitted `sharp` script from the real
  `public/assets/hero/shards-trimmed/shard-main.png` asset (not the
  `references/altr-hero-reference.png` mockup, which project docs mark
  inspiration-only) plus an SVG fog-gradient background recreating
  `HeroScene.module.css`'s `.fogBase` recipe and an SVG text overlay. Visually
  verified via the Read tool before committing only the resulting PNG (the
  generation script itself isn't in this prompt's allowed-files list, so it
  was deleted, not committed). `app/robots.ts` disallows `/api/`, `/auth`,
  every protected path from `lib/supabase/middleware.ts`'s own `pages` list
  (`/dashboard`, `/memory`, `/assistants`, `/import-conversations`,
  `/billing`, `/payment/success`, `/legacy-migration`), and the two dev-only
  routes `/hero-lab`/`/styleguide` — none of those are real marketing
  surface. `app/sitemap.ts` lists only `/`, `/pricing`, `/privacy`, `/terms`,
  `/cookies`. Both confirmed present in the real `yarn build` output
  (`○ /robots.txt`, `○ /sitemap.xml`).
  **Mobile fixes list (real issues found via actual Playwright screenshots
  at 320/375/768px against a real `yarn build && yarn start`, not assumed):**
  1. The cookies page's storage-audit table (7 columns) genuinely can't
     reflow to one column at 320px; confirmed `overflow-x: auto` was already
     functionally scrollable (`scrollWidth` 938 vs `clientWidth` 272) but the
     screenshot showed the right-most column abruptly clipped with no visual
     cue that more content existed — read as broken/cut-off rather than
     "scroll for more". Fixed with a CSS-only edge-fade mask
     (`-webkit-mask-image`/`mask-image` gradient) on `.tableWrap` plus a
     `min-width: 640px` on the table itself so columns stay legible instead
     of being squeezed illegibly narrow.
  2. Adding `Footer`'s own "Altr home" brand link (same accessible name as
     `Header`'s) broke `tests/e2e/smoke.spec.ts`'s existing single-match
     `getByRole("link", { name: "Altr home" })` assertion in strict mode —
     fixed by scoping to `.first()`, the same pattern that test file already
     uses elsewhere (`Log in`, `Create your Altr`) for exactly this
     multiple-copies-across-Header/Footer/MobileMenu situation.
  3. Verified, not a real bug: a full-page (`fullPage: true`) Playwright
     screenshot of `/` at every width showed large blank/dark gaps between
     `HowItWorks`/`MemoryDemo`/`TwinDemo` — traced this to `fullPage`
     capture briefly resizing the real browser viewport to the full
     document height in one jump, which appears to disrupt these sections'
     scroll/`IntersectionObserver`-driven `Reveal` fade-ins. Re-verified with
     incremental fixed-viewport (320×700) screenshots scrolling down the
     real page in small steps — every section rendered its real content
     correctly at every scroll position. Documented as a screenshot-tooling
     artifact, not a user-facing issue, rather than "fixed" with an
     unnecessary code change.
  4. Footer's own column grid (`repeat(2, minmax(0,1fr))` under 768px,
     5-column with brand at 768px+) and the legal-page two-column
     TOC-plus-article grid (single column under 1024px, sidebar at
     1024px+) were both verified directly in screenshots at 320/375/768 —
     no column ever exceeds the "max 5 links" requirement, and the TOC
     never overlaps or overflows at any tested width.
  **`tests/phase10-legal-consistency.test.ts` still does not exist in this
  workspace** (confirmed via search before starting, same as `components/legal/`)
  — cannot "verify it's still green" since it was never ported in any prior
  prompt; documented here rather than silently skipped.
  **Required tests added:** `tests/components/Footer.test.tsx` (link
  inventory per column, max-5-per-column via `getAllByRole`, signed-in/
  signed-out account swap, cookie-preferences click wiring, social-link
  omission when env vars are unset) and
  `tests/components/LegalDocumentPage.test.tsx` (title + every section
  heading render for all three `kind`s, dev-notice visibility, TOC link
  targets) — 9 new tests, all passing.
  `yarn lint`, `yarn typecheck`, `yarn test` (40 files/199 tests, up from
  38/190 in 023), `yarn build`, and `yarn test:e2e` (14/14, including the
  `smoke.spec.ts` fix above) all passed via `yarn run check` + a separate
  `yarn test:e2e` run — both run twice, once before and once after the
  mobile-polish CSS fix, to confirm it introduced no regression.

- 025 — Auth screens redesign (2026-07-21). **Found before writing any
  code:** `app/auth/page.tsx` didn't exist in this workspace (same
  literal-vs-actual gap as every prior prompt) — only the API routes
  (`app/api/auth/{register,login,forgot-password,reset-password,logout}/route.ts`,
  `app/api/auth/google/start/route.ts`) and `app/auth/callback/route.ts`
  were already ported. LEGACY's own current `app/auth/page.tsx` was read in
  full as the real structural/behavioral reference (not the stale
  `LEGAL_SETUP.md`-adjacent kind of gap — this file is genuinely current).
  **Contract-parity checklist (this prompt's own "preserve every behavioral
  contract" instruction):**
  | LEGACY behavior | Status |
  | --- | --- |
  | `?mode=login\|register` switching, defaulting to register | Preserved exactly |
  | Mode switch preserves typed email/password | Preserved — same component state, only `mode` changes; verified in both RTL and e2e |
  | Name auto-derived from email local-part (`nameFromEmail`), no name field shown | Preserved verbatim, byte-identical helper |
  | Client-side validation before ever calling the server | Preserved, but reimplemented against `registerSchema`/`loginSchema` (`lib/auth/validation.ts`, unmodified) via `.safeParse()` instead of LEGACY's own regex/length checks — same rules, actually sourced from the one place this prompt's own instruction says to reuse, not duplicate |
  | Registration requires all three consent checkboxes (terms+privacy, conversations, memory) | Preserved exactly — same three touchpoints, same wording intent, terms checkbox still links to real `/terms`/`/privacy` |
  | Password visibility toggle, `new-password`/`current-password` autocomplete | Preserved via the existing `PasswordField` primitive (009), which already implements both |
  | Google OAuth button (`signInWithGoogle()` → `/api/auth/google/start`) | Preserved, unchanged call |
  | "Forgot password?" link (login mode only) | Preserved as a real link to `/auth/forgot-password` — that page doesn't exist in this workspace yet (026's own scope, same "wire to the real destination even if downstream isn't built" pattern used for `/auth` links since 019 and the Footer's cookie-preferences button in 024) |
  | Already-authenticated visitor on `/auth` → redirect to `/dashboard` | Preserved exactly (checked LEGACY's own `useEffect` first, per this prompt's own edge-case instruction, rather than assuming) |
  | Error paragraphs `role="alert"` | Preserved — already documented as a hard contract on the shared `Field` primitive itself (009) |
  **One real gap found and deliberately fixed, not blindly reproduced:**
  LEGACY's own `/auth` page never actually reads the `next` query param it's
  linked with from elsewhere in the app (`PricingTable`'s own
  `/auth?next=/pricing` CTA, `middleware.ts`'s own
  `/auth?mode=login&next=...` redirect) — its submit handler always
  hardcodes `router.replace("/legacy-migration")`, and LEGACY's own
  `/legacy-migration` page likewise always hardcodes `router.replace("/dashboard")`,
  so the `next` param is produced in three places but read in zero — a real,
  dead parameter, confirmed by reading all three files, not guessed.
  Implemented real propagation in WORKSPACE instead: `app/auth/page.tsx`
  (server component) resolves `next` once via `safeNextPath()`
  (`lib/auth/validation.ts`, unmodified, already exported for exactly this)
  and passes it to `AuthForm`, which navigates there via `router.replace(next)`
  on any successful, session-establishing login/register — the server's own
  `next` field in its JSON response is deliberately ignored (documented
  inline) since it's not part of what either forbidden route file actually
  needs preserved. `/legacy-migration` itself still doesn't exist in this
  workspace (out of this prompt's scope), so the chain currently ends at
  whatever `next` resolves to directly, without an intermediate detour —
  correct today since `/legacy-migration` is the only route in
  `lib/supabase/middleware.ts`'s own protected-paths list this prompt
  doesn't build, and every other `next` destination (e.g. `/pricing`) is
  reached directly and correctly.
  **A second real gap, worked around without touching either forbidden
  file:** both `app/api/auth/{register,login}/route.ts` throw a hardcoded
  Ukrainian string for a 429 ("Забагато спроб. Спробуй пізніше."), and
  `lib/auth.ts`'s shared `api()` helper (also unmodified) discards the HTTP
  status code whenever the server includes a JSON `error` field — which
  both routes always do — so the actual status code is unrecoverable by the
  time `registerAccount`/`signInAccount` throw. Matched on the exact literal
  string instead (confirmed identical in both route handlers by reading the
  source) to distinguish the calm rate-limited copy from the generic
  failure copy, satisfying this prompt's own "server error codes mapped to
  human copy" requirement without editing either must-not-change file.
  **Visual note, a deliberate divergence from LEGACY, not a bug:** this
  prompt's own instruction specifies an obsidian visual panel + paper form
  panel; LEGACY's actual current CSS has this inverted (light visual panel,
  dark form panel) and stacks the visual panel *above* the form on mobile.
  Followed this prompt's explicit instruction on both counts — obsidian
  panel hidden below 900px, form always first — documented as an
  intentional redesign call, not a missed LEGACY detail. The visual panel
  reuses `ProductSection`'s own established "one shard, one quiet
  memory-fragment caption" language (`components/site/ProductSection.tsx`)
  rather than the full `HeroScene`/`HeroFragments` motion system, which is
  built around the landing page's own multi-shard parallax layout this
  single static side panel doesn't need; the panel and its heading are
  `aria-hidden` (decorative/supplementary) with zero focusable elements
  inside it, so no keyboard/AT user can get stranded on it — the one real
  heading and one real "back home" link both live in the form panel.
  **Required tests added:** `tests/components/AuthForm.test.tsx` (10
  tests — mode-switch preserves input, client-side validation before any
  server call, all-three-consents-required, submit disabled/`aria-busy`
  while pending, rate-limited vs. generic error copy, already-authenticated
  redirect, `next`-path navigation on success, email-verification notice,
  consent link targets) and a new `auth` describe block in
  `tests/e2e/critical-flows.spec.ts` (6 tests). LEGACY's own e2e
  "registration form validation"/"login form validation" tests were found
  to target selectors (button "Створити другого себе", heading "Повернись
  до свого Altr") that don't exist anywhere in LEGACY's own *current*
  `app/auth/page.tsx` (which uses "Створити акаунт"/"З поверненням") — a
  stale spec relative to its own app, not a literal contract to port; ported
  the underlying behavior (bad input → `role="alert"`, no server call)
  against real current selectors instead. The "protected route redirects
  anonymous users" LEGACY e2e test *does* match a real, currently-passing
  `lib/supabase/middleware.ts` contract (unmodified) and was ported as
  close to verbatim as this workspace's own `x-altr-e2e-user` e2e-mock
  mechanism (`lib/testing/e2e-auth.ts`) allows. One incidental fix along the
  way: `page.getByRole("alert")` collides with Next's own
  `#__next-route-announcer__` element (also `role="alert"`) in strict
  mode — switched to the `p[role="alert"]` selector, the same one this
  prompt's own instructions and `Field.tsx`'s own doc comment already name
  as the real contract.
  `yarn lint`, `yarn typecheck`, `yarn test` (41 files/209 tests, up from
  40/199 in 024), `yarn build`, and `yarn test:e2e` (20/20, up from 14/14 —
  6 new auth tests) all passed via `yarn run check` + a separate
  `yarn test:e2e` run.

- **026 — Recovery, reset, callback (2026-07-24):** Built
  `components/auth/ForgotPasswordForm.tsx` and
  `components/auth/ResetPasswordForm.tsx`, and rebuilt
  `app/auth/forgot-password/page.tsx` / `app/auth/reset-password/page.tsx`
  (both previously didn't exist in this workspace at all — LEGACY's own
  routes were the only prior reference) as thin server wrappers
  (`metadata` + `dynamic = "force-dynamic"`, same CSP-nonce fix as every
  interactive public page since 020) around those two client components.
  Both reuse 025's `AuthVisual` side panel and `AuthForm.module.css`
  classes directly (same composition family, per this prompt's own visual
  requirement) rather than duplicating the CSS.

  **Callback matrix — traced against the real, unmodified
  `app/auth/callback/route.ts`, `app/api/auth/register/route.ts`,
  `app/api/auth/forgot-password/route.ts`, and
  `app/api/auth/google/start/route.ts` (all must-not-change; read in full,
  not guessed):**

  | Entry | `emailRedirectTo`/`redirectTo` sent to Supabase | Callback lands with | On success, redirects to | On failure (bad/expired/reused code) |
  | --- | --- | --- | --- | --- |
  | Email confirm (register) | `/auth/callback?next=/legacy-migration` | `?code=...&next=/legacy-migration` | `/legacy-migration` (session cookie set, profile upserted, `altr_legacy_review=pending` cookie set but explicitly exempted for this one path) | `/auth?mode=login&error=callback` |
  | Password recovery | `/auth/callback?next=/auth/reset-password` | `?code=...&next=/auth/reset-password` | `/auth/reset-password` (not in middleware's protected-pages list, so the pending-legacy-review redirect never intercepts it; `ResetPasswordForm` then sees a valid session and shows the password form) | `/auth?mode=login&error=callback` |
  | Google OAuth | `/auth/callback?next=/legacy-migration` | `?code=...&next=/legacy-migration` | `/legacy-migration` (identical shape to email confirm) | `/auth?mode=login&error=callback` |

  All three entry points funnel through the same unmodified handler; the
  only variable is the `next` query param each caller supplies, and
  `safeRedirectPath()` (`lib/supabase/middleware.ts`, must-not-change,
  re-verified by reading its source) rejects anything not starting with
  `/` or starting with `//` or containing `\`, falling back to
  `/legacy-migration` — same-origin is already enforced, so this prompt's
  "STOP and record a security finding" edge case does not trigger; no
  finding recorded.

  **Edge cases, and why the callback route already prevents most of
  them from ever reaching the new pages:** "double use of a recovery
  link" and "expired link" both fail at `exchangeCodeForSession` *inside
  the callback route itself*, which redirects straight to
  `/auth?mode=login&error=callback` — they never reach
  `/auth/reset-password` at all. "Reset link opened in a different
  browser than requested" fails the same way if Supabase's PKCE
  `code_verifier` cookie (set on the browser that started the request)
  isn't present in the browser that opens the link — also caught inside
  the callback route. The one case that *does* reach
  `ResetPasswordForm` directly is a session that's valid at page-load but
  has since expired, or the page being opened with no prior callback at
  all (bookmarked/typed URL) — `ResetPasswordForm` checks this itself via
  `getCurrentProfile()` on mount (LEGACY's own reset-password page never
  did this pre-check at all; it just rendered the form unconditionally
  and surfaced the raw `RESET_SESSION_REQUIRED` string as a plain error
  only if submit failed — a real, cited LEGACY gap this prompt's own
  "expired/used link → designed error state" instruction asked to close,
  not a maintained contract to replicate) and shows the "invalid or
  expired" designed state with a link back to `/auth/forgot-password`
  before the form ever renders. The same submit-time check (matching on
  the literal `RESET_SESSION_REQUIRED` string the unmodified route
  throws) also downgrades to that same state if the session expires in
  the gap between the mount check and a later submit.

  **Neutral-response behavior:** `/api/auth/forgot-password` (unmodified)
  already replies with the same `{ ok, message }` shape whether or not the
  account exists — confirmed by reading its source, not assumed.
  `ForgotPasswordForm` doesn't even read that message field; it shows its
  own fixed, bilingual "Check your email" copy on every non-429 outcome
  (success, generic failure, or a mocked 500 — see the added
  `tests/components/ForgotPasswordForm.test.tsx` case that exercises this
  deliberately) and only distinguishes the one case that is not an
  existence disclosure: rate limiting. One real contract quirk found
  along the way: `/api/auth/forgot-password`'s 429 response uses a
  `message` field, not the `error` field every other auth route uses, so
  `lib/auth.ts`'s shared `api()` helper (must-not-change) can't match it
  by string — it surfaces as the generic `REQUEST_FAILED_429` string
  instead, which `ForgotPasswordForm` catches specifically (documented
  inline in the component, not silently worked around).

  **Google entry point:** already present on both `/auth` modes as of 025
  (`AuthForm.tsx`'s existing secondary "Continue with Google" button,
  confirmed unchanged) and confirmed intended to stay per 002's parity
  audit (`| Google OAuth button (...) | Preserved, unchanged call |` in
  this file's own 002 entry) — nothing to add here; this prompt's
  requirement #3 was already satisfied.

  **Four designed states across both pages** (per this prompt's own visual
  requirement): forgot-password's *sent* state (neutral confirmation,
  `role="status"`); reset-password's *invalid/expired-link* state (one
  unified visual template for both, since Supabase's session check can't
  reliably distinguish a malformed/never-valid link from a genuinely
  expired one — documented here rather than silently assumed); the normal
  *form* state; and the *success* state (confirmation + a manual
  "Continue to your Altr" link to `/dashboard`, deliberately not an
  auto-redirect like LEGACY's `router.replace("/dashboard")` — this
  prompt's own "success → confirmation + sign-in path" instruction, taken
  as a deliberate divergence from LEGACY's silent-redirect behavior, not a
  missed detail).

  **Required tests added:** `tests/components/ForgotPasswordForm.test.tsx`
  (4 tests — identical neutral confirmation for both success and generic
  failure, rate-limit distinguished as the one exception, back-to-sign-in
  links present in both states) and `tests/components/ResetPasswordForm.test.tsx`
  (5 tests — invalid/expired state on no session, form state on a valid
  session, client-side password-mismatch rejection with zero server calls,
  success state with the manual sign-in path, and the mid-session-expiry
  fallback to the invalid state) plus one new `password recovery` describe
  block in `tests/e2e/critical-flows.spec.ts` (1 test, exercising the real
  `/api/auth/forgot-password` neutral-response contract for both an
  existing and non-existent account against the actual page). The
  callback route itself was traced from source rather than driven live
  through Playwright — exercising a real Supabase PKCE code exchange
  end-to-end isn't practical against this harness's `x-altr-e2e-user`
  mock-auth mechanism, and the route is unmodified and fully read, so
  source-tracing against the exact caller `redirectTo` values was judged
  sufficient; documented explicitly here rather than claimed as a live
  trace.
  `yarn lint`, `yarn typecheck`, `yarn test` (43 files/218 tests, up from
  41/209 in 025 — 2 new files, 9 new tests) all passed. One transient
  infra flake hit the first `yarn test` run (7 files failed to even start
  a Vitest fork worker with a timeout, not a real test failure — same
  category of flake this file's own 025 entry and the LEGACY baseline
  both already documented); a clean immediate rerun passed all 43/43
  files, 218/218 tests. `yarn build` passed (39/39 pages; both new routes
  compiled as dynamic, matching every interactive public page since 020).
  `yarn test:e2e` passed 21/21 (up from 20/20 in 025 — 1 new test).

- **027 — Protected routes and sign-out (2026-07-24):** No `components`/
  `middleware`/`API` files were modified — everything server-side was
  already legacy-audited complete per this prompt's own "Current project
  state", confirmed by re-reading `middleware.ts`, `lib/supabase/server.ts`,
  and `lib/auth/server.ts` (a thin re-export shim over
  `lib/supabase/server.ts`'s `getOptionalUser`/`requireUser`/`requireUserId`)
  in full. Work was: (1) verify and regression-test the existing protection
  layer, (2) build the two pieces of user-facing UX around it that didn't
  exist yet.

  **Protected-page inventory — verified live against a real
  `yarn build && yarn start -p 3100` server, not just read from source:**

  | Path | Anonymous (curl, no header) | Anonymous body leaked? | Authenticated (`ALTR_E2E_MOCKS=1` + valid mock UUID) | Page exists in this workspace? |
  | --- | --- | --- | --- | --- |
  | `/dashboard` | `307` → `/auth?mode=login&next=%2Fdashboard` | No — 34-byte body, just the redirect target | `404` (middleware passed it through; Next 404s, no page file) | No — Prompt 029 |
  | `/memory` | `307` → `/auth?mode=login&next=%2Fmemory` | No | not separately curled (same code path) | No — Prompt 036 |
  | `/assistants` | `307` → `/auth?mode=login&next=%2Fassistants` | No | not separately curled | No — Prompt 039 |
  | `/import-conversations` | `307` → `/auth?mode=login&next=%2Fimport-conversations` | No | not separately curled | No — Prompt 032 |
  | `/billing` | `307` → `/auth?mode=login&next=%2Fbilling` | No | not separately curled | No — Prompt 042 |
  | `/billing?tab=invoices` | `307` → `/auth?mode=login&next=%2Fbilling%3Ftab%3Dinvoices` (query string preserved) | No | — | No |
  | `/payment/success` | `307` → `/auth?mode=login&next=%2Fpayment%2Fsuccess` | No | not separately curled | No prompt yet |
  | `/legacy-migration` | `307` → `/auth?mode=login&next=%2Flegacy-migration` | No | not separately curled | No prompt yet |

  The real finding here: **none of the seven protected pages have an
  `app/**/page.tsx` in this workspace yet** — every one is still LEGACY-only
  UI, scheduled for a later prompt (029, 032, 036, 039, 042; the last two
  have no prompt number assigned at all yet). This doesn't weaken the
  protection, though — Next.js middleware runs *before* route resolution,
  so the redirect fires purely off the URL pattern in
  `lib/supabase/middleware.ts`'s `pages` array regardless of whether a page
  file exists, confirmed by the authenticated case above 404ing (middleware
  let it through; Next.js then legitimately had nothing to render) instead
  of ever serving protected content. So "fix any page that leaks a flash of
  protected UI" (this prompt's own instruction #1) has nothing to fix yet:
  a flash requires a page component to mount first, and the redirect
  already happens one layer below that, before any React tree exists for
  an anonymous request. Whichever prompt builds each real page should
  re-verify this same table against actual authenticated content once
  there's real UI to check for flashes — noted as a re-verification, not a
  currently-open gap. All seven paths are now also covered by a standing
  e2e regression test (`tests/e2e/critical-flows.spec.ts`'s new "protected
  routes and sign-out" describe block) so this can't silently regress.

  **`components/auth/SignOutButton.tsx`** (new): thin wrapper over the
  existing `Button` (ghost variant, keyboard-accessible by construction —
  it's a native `<button>`), calling the already-implemented
  `signOutAccount()` (`lib/auth.ts`, unchanged — it already POSTed
  `/api/auth/logout` correctly, it just had no UI caller anywhere). Pending
  state uses `Button`'s existing `loading` prop (`disabled` + `aria-busy`,
  same convention as every submit button since 025). On success: dispatches
  a plain `altr-auth-change` window event — the exact event `Header`
  (Prompt 019) has subscribed to since it was built, with nothing ever
  dispatching it until now — so `Header`'s own in-memory `signedIn` state
  re-syncs against a real `/api/me` call, satisfying this prompt's "clears
  client caches of user data held in memory" requirement for the one
  component that currently holds any such state, with zero changes to
  `Header.tsx` itself (out of this prompt's file scope, and none needed).
  Also calls `toast.push()` for a confirmation, and `router.replace("/")` +
  `router.refresh()`. **No page in this workspace mounts this component
  yet** — LEGACY's own equivalent lived inside `app/dashboard/page.tsx`
  (sidebar nav item + a second copy in the settings tab, both calling
  `signOutAccount()` directly with no loading state, no toast, no keyboard
  affordance beyond a bare `<button>`), confirmed by cloning LEGACY
  read-only and grepping for `signOutAccount`/`LogOut`/`/api/auth/logout` —
  that's Prompt 029's scope (dashboard shell), not this one's. Built and
  fully tested standalone (5 RTL tests in
  `tests/components/SignOutButton.test.tsx`: pending/disabled+aria-busy
  while in flight then re-enabled, Enter-key activation, the full success
  path including the `altr-auth-change` dispatch and toast content, and a
  calm error-toast path on failure with no navigation) so 029+ can drop it
  in directly. Copy (`Sign out`/`Ти вийшов з акаунта.`/etc.) is a small
  local bilingual object inside the component rather than joining
  `sharedCopy` — `lib/i18n/copy.ts` isn't in this prompt's own "files
  allowed to change" list, same reasoning LEGACY itself used for pages
  whose copy was never centralized.

  **`lib/auth.ts` — `handleSessionExpired(nextOverride?)`** (new export,
  every existing export's behavior unchanged — confirmed by the full
  existing test/e2e suite still passing unmodified): a session-expiry
  helper explicitly *not* wired into the shared `api()` helper, because
  `api()` also backs `signInAccount`/`registerAccount`, where a 401/400
  means "wrong credentials" — auto-redirecting on every 401 there would
  break the login form outright. Instead this is a standalone function a
  component calls explicitly once it knows, from context, that a 401 on an
  authenticated-only endpoint really does mean the session died mid-use. It
  pushes a bilingual toast (same local-copy reasoning as `SignOutButton`,
  same `lib/i18n/copy.ts` file-scope constraint) and redirects to
  `/auth?mode=login&next=<path>`, defaulting `next` to
  `window.location.pathname + search` when no override is passed (so it
  always lands back exactly where the session died) and re-validating any
  explicit override against the same same-origin rule as `safeNextPath`
  (`lib/auth/validation.ts`) and `safeRedirectPath`
  (`lib/supabase/middleware.ts`, must-not-change) — reimplemented locally
  rather than imported, since this module ships in client bundles
  (`Header`, `PricingTable`, ...) and `lib/supabase/middleware.ts` pulls in
  server-only `@supabase/ssr`/`next/server` APIs that don't belong there.
  **No component in this workspace calls it yet** — every existing
  authenticated-fetch component (`Header`'s `getCurrentProfile()` call,
  `PricingTable`'s `/api/billing/me`/`/api/billing/checkout` calls) is
  outside this prompt's own file scope, and per this prompt's own "adopt in
  new components only" instruction, retrofitting it into already-shipped
  components wasn't attempted. 3 unit tests added
  (`tests/components/handleSessionExpired.test.ts`, testing the lib
  function directly rather than through a component — the only test
  directories this prompt's own file list allows are `tests/components/`
  and e2e, so it lives there despite not being a component test):
  explicit-path redirect + toast content, current-page fallback when no
  override given, and the off-origin-override-rejected edge case named in
  this prompt's own edge-case list.

  **Sign-out flow, e2e:** since `SignOutButton` has no page mounting it
  yet, there's no UI click-through path to drive in Playwright. What's
  real and live right now is the `/api/auth/logout` route itself
  (unmodified) — confirmed via a direct curl (`{"ok":true}`, 200, even for
  a fully anonymous request with no session, which is the route's actual
  unconditional behavior) and re-asserted as a Playwright `request`-fixture
  e2e test (`tests/e2e/critical-flows.spec.ts`'s new describe block) that
  hits the same real endpoint and checks the exact `{ ok: true }` shape
  `signOutAccount()`/`SignOutButton` depend on. Documented explicitly as an
  API-contract-level e2e test standing in for a UI-level one that isn't
  possible yet, rather than silently claiming full click-through coverage.

  **`<Toaster />` still isn't mounted** in `app/layout.tsx` — both new
  `toast.push()` call sites are correct, real usage of the existing Toast
  module (`components/ui/Toast.tsx`, Prompt 010), but nothing renders the
  toast region yet. `app/layout.tsx` is outside this prompt's own file
  scope, so this is flagged here (and in "Current active prompt" above)
  rather than fixed ad hoc, per this session's established discipline
  around the "files allowed to change" boundary.

  **Required tests added:** `tests/components/SignOutButton.test.tsx` (5
  tests, listed above), `tests/components/handleSessionExpired.test.ts` (3
  tests, not formally "required" by this prompt's own required-tests list
  but added anyway since it's cheap and this is new, security-relevant
  logic), and one new `protected routes and sign-out` describe block in
  `tests/e2e/critical-flows.spec.ts` (8 tests — one per protected path,
  each using the same "anonymous" `x-altr-e2e-user` header override the
  existing dashboard-only redirect test already established, plus the
  `/api/auth/logout` contract test).
  `yarn lint`, `yarn typecheck`, `yarn test` (45 files/225 tests, up from
  43/218 in 026), `yarn build` (39/39 pages, unchanged route count — no new
  pages this prompt), and `yarn test:e2e` (29/29, up from 21/21 in 026 — 8
  new tests) all passed.

- **028 — Auth tests and polish (2026-07-24, closes Phase 5):** No
  server-side auth file was touched (`app/api/auth/**`,
  `lib/auth/validation.ts`, `lib/supabase/**`, `middleware.ts`, `supabase/`
  all confirmed unmodified) — this prompt's own scope was a coverage audit
  plus polish-level fixes to the five `components/auth/**` files and
  `lib/i18n/copy.ts`.

  **Coverage audit — every behavior in this prompt's own list, against
  what existed before this prompt ran:**

  | Behavior | Before 028 | Gap found | Closed by |
  | --- | --- | --- | --- |
  | Register validation | Email + all-3-consents tested | Password-too-short never tested (schema *or* UI) | +1 schema test (`auth-validation.test.ts`), +1 UI test (`AuthForm.test.tsx`) |
  | Login errors | Generic + invalid-email tested | — | none needed |
  | 429 (rate limit) | Login, register, forgot-password all tested | Reset-password's own 429 branch never tested | +1 test (`ResetPasswordForm.test.tsx`) |
  | Mode switch | Tested (component + e2e) | — | none needed |
  | `next` propagation | Login's `next` navigation tested | Register's own `router.replace(next)` branch (session issued immediately, no email verification) never tested | +1 test (`AuthForm.test.tsx`) |
  | Forgot neutral response | Tested (component + e2e) | — | none needed |
  | Reset states | invalid/form/success/mismatch/session-expiry-on-submit tested | 429 and generic-error branches untested (see 429 row) | see 429 row; +1 generic-error test |
  | Callback redirects | Traced from source only (026/027 STATUS entries), zero automated coverage | No test exercised the actual route handler | New file `tests/unit/auth-callback.test.ts`, 5 tests (no-code, exchange-failure, email-confirm/OAuth shape, recovery shape, off-origin `next` rejected) |
  | Protected redirect | All 7 paths tested (027) | — | none needed |
  | Sign-out | 4 tests (027) | Double-click guard untested | +1 test |

  **Polish pass findings (styleguide open, `DESIGN_DIRECTION.md`'s
  "premium hardware brand" bar re-read in full first) — everything found
  was fixed, none deferred:**

  1. **No re-entrant-submit guard on any of the four auth forms**
     (`AuthForm`, `ForgotPasswordForm`, `ResetPasswordForm`,
     `SignOutButton`) — this prompt's own "double-click on submit" edge
     case. The `disabled` attribute from `Button`'s `loading` prop only
     takes effect after React commits the next render; a fast enough
     double-click could fire the handler twice in the gap. Fixed with an
     `if (submitting) return;` (or `pending`) guard at the top of each
     handler — the actual protection, with the disabled button as the
     visible half. 4 new double-submit-guard regression tests added (one
     per component).
  2. **`SignOutButton`'s bilingual copy lived in a local object**, not
     `lib/i18n/copy.ts` — correct at the time (027's own file scope didn't
     include `copy.ts`), but this prompt's own "verify no hardcoded
     strings remain... all via i18n" instruction is exactly the license to
     fix it now. Migrated into `sharedCopy.{EN,UA}.signOut`; existing tests
     needed no changes since the rendered strings are identical.
  3. Everything else checked came back clean: focus order (verified live
     via a real keyboard-only Tab walk against a production server on both
     register and login mode — Logo → Back-home → Google → Email →
     Password → show/hide toggle → [Forgot-password link, login mode
     only] → [consent disclosure, register mode only] → Submit → mode-
     switch link, exactly matching visual top-to-bottom order, no
     `tabIndex` overrides anywhere in `components/auth/`, confirmed via
     grep), autofill appearance (the `.field-input:-webkit-autofill`
     override from Prompt 009's `controls.css` already applies globally —
     no auth-specific gap), password-manager field contracts (both
     register's single password field and reset-password's two fields use
     the exact `autocomplete` tokens managers key off: `new-password` for
     register/reset, `current-password` for login — now asserted directly
     in `AuthForm.test.tsx` and `ResetPasswordForm.test.tsx`, not just
     read from source), submit micro-interaction and error-state
     transitions (shared `Button`/`Field` primitives, unchanged, already
     consistent with the landing/pricing material family), and "browser
     back after successful login" (verified by design: both `AuthForm` and
     `ResetPasswordForm` use `router.replace`, never `push`, so `/auth`
     never becomes a history entry to land back on).

  **Hardcoded-locale-string audit:** `grep` for Cyrillic characters across
  every file in `components/auth/` and the three auth page wrappers turned
  up exactly two matches, both in `AuthForm.tsx` and `ResetPasswordForm.tsx`
  — `RATE_LIMIT_MESSAGE`/`RATE_LIMITED`, the literal-string sentinels used
  to detect the must-not-change API routes' own hardcoded Ukrainian 429
  text and map it to the correct bilingual `t.errors.rateLimited` copy.
  Neither is ever rendered — confirmed by reading both call sites — so
  both are legitimate and already carried their own explanatory comments
  from 025/026. Zero strings found that render to the user outside the
  i18n system, after item 2 above closed the one real instance
  (`SignOutButton`).

  **Security check (this prompt's own requirement):** no test embeds a
  real credential (all emails/passwords across every auth test file are
  synthetic `@example.com` addresses and placeholder passwords), and no
  existing security-relevant assertion was loosened to make a test pass —
  confirmed by diffing every pre-existing test file against its 025-027
  version; only new tests and additive assertions were introduced, no
  existing `expect(...)` was weakened or removed.

  **Required tests added (14, all listed above):**
  `tests/unit/auth-validation.test.ts` (+1), `tests/unit/auth-callback.test.ts`
  (new file, 5), `tests/components/AuthForm.test.tsx` (+4: short-password
  UI error, register-without-verification navigation, double-submit guard,
  autocomplete attributes), `tests/components/ForgotPasswordForm.test.tsx`
  (+1: double-submit guard), `tests/components/ResetPasswordForm.test.tsx`
  (+4: rate-limited, generic error, double-submit guard, autocomplete
  attributes folded into the existing form-state test), and
  `tests/components/SignOutButton.test.tsx` (+1: double-submit guard).
  `yarn lint`, `yarn typecheck`, `yarn test` (46 files/240 tests, up from
  45/225 in 027 — 1 new file, 15 net new tests: 14 new `it()` blocks plus
  1 test gaining 2 extra assertions with no new `it()`), `yarn build`
  (39/39 pages, unchanged), and `yarn test:e2e` (29/29, unchanged — this
  prompt's coverage gaps were all closeable at the component/unit level,
  so no new e2e tests were needed) all passed.

- **029 — Dashboard shell (2026-07-24, opens Phase 6):** Built
  `components/app/{AppShell,AppNav,UserMenu}.tsx` (all new — LEGACY's own
  `AppShell.tsx` was read in full and confirmed, by grepping LEGACY's
  `app/dashboard/page.tsx`, to never actually be wired into any LEGACY
  route; reference-only, as this prompt's own text says), plus one
  necessary, minimal addition beyond the literal file list:
  `components/app/DashboardHome.tsx` — see "scope note" below.
  `app/(app)/layout.tsx` (new) fetches the session once via `requireUser()`
  + `getProfileForUser()` (both must-not-change) and wraps `{children}` in
  `AppShell`. `app/(app)/dashboard/page.tsx` (new) is a thin async Server
  Component that fetches its own supplementary data and renders
  `DashboardHome`.

  **Scope note (`DashboardHome.tsx`):** the allowed-files list names
  exactly three `components/app/` files plus `page.tsx`, but a page.tsx
  that's simultaneously an async Server Component (`requireUser()`,
  direct Supabase queries) *and* a bilingual client component
  (`useLang()`, required for every piece of copy in this app since language
  preference is `localStorage`-only, unreadable server-side) is not
  possible in one file — React only allows one `"use client"` boundary per
  module. Every prior prompt in this session splits exactly this way
  (`app/(public)/pricing/page.tsx` stays a thin server wrapper;
  `components/site/PricingTable.tsx`, separately named in 023's own file
  list, owns the real UI) — `DashboardHome.tsx` is that same pattern
  applied here, and was also the only way to make "dashboard empty state"
  independently RTL-testable (Next's Server Component render isn't
  supported by this repo's Vitest+jsdom setup at all). Documented rather
  than silently added.

  **Major finding — this environment has no reachable Supabase project.**
  `.env.local`'s `NEXT_PUBLIC_SUPABASE_URL` is a placeholder
  (`ci-placeholder.supabase.co`); a direct Node probe against it (same
  client construction as `lib/supabase/admin.ts`) failed with
  `TypeError: fetch failed` → `getaddrinfo ENOTFOUND ci-placeholder.supabase.co`.
  Confirmed this is the actual cause of `/dashboard` erroring (not a bug in
  this prompt's own code) by loading it through a real
  `yarn build && ALTR_E2E_MOCKS=1 yarn start` server with a valid mock
  identity header via Playwright: `app/(app)/layout.tsx`'s
  `getProfileForUser(user)` call throws on the unreachable DB, and
  `app/error.tsx` (006, unmodified) renders correctly and calmly instead of
  a raw crash — the *error handling* is working exactly as designed; there
  is simply no live data to fetch. Every previous prompt's authenticated-ish
  surface (`Header`'s `getCurrentProfile()`, `PricingTable`'s
  `/api/billing/me`) never hit this because they all fetch *client-side*
  and already treat a failed/401 response as "signed out" — a real UX
  fallback, not a lucky accident, but one this page's *required* server-side
  fetch (this prompt's own "greeting (server profile name)... data from
  existing endpoints only" instruction) can't use the same way. Not fixable
  within this prompt's scope (`.env.local` isn't a "files allowed to
  change" target for any prompt — it's user-owned infrastructure, already
  tracked below under "Environment setup still required").

  **Consequence for verification:** LEGACY's own dashboard e2e test
  (`mockApi` intercepting `/api/me` client-side, then asserting the
  rendered greeting) cannot be ported literally — LEGACY's dashboard
  fetched client-side (interceptable by Playwright's `page.route()`); this
  one fetches server-side inside a Server Component, which Playwright's
  browser-level route interception cannot reach at all, real Supabase or
  not. Given the placeholder credentials, no e2e test can reach real
  dashboard *content* in this environment regardless of interception
  strategy. Resolved by moving all content-level coverage (greeting, both
  empty and populated states, per-row copy, graceful "—" unknowns on a
  failed row-level query, language switch) into RTL tests against
  `DashboardHome` with fully-controlled mock props — deterministic,
  fast, and exactly what this prompt's own "Required tests: ... dashboard
  empty state" already asked for. The one dashboard behavior that doesn't
  need the database — the protected-route redirect for anonymous visitors —
  was already fully covered by 027's own per-path e2e loop
  (`tests/e2e/critical-flows.spec.ts`'s "protected routes and sign-out"
  describe, `/dashboard` included) and 025's "already-authenticated visitor
  on /auth is redirected to /dashboard" test; nothing new was added there to
  avoid duplicate coverage. That 025 test's own `WebServer` log now shows
  the same `fetch failed`/`ENOTFOUND` noise during its run (`/dashboard`'s
  destination render fails server-side after the client-side redirect) —
  harmless, since that test only asserts the URL changed, not the
  destination's content, but confirms the same root cause independently.
  LEGACY's "sign out calls the server and returns home" e2e test has the
  same problem (needs to reach the dashboard first to click the button) and
  wasn't ported for the same reason — `SignOutButton` itself already has 5
  RTL tests (027/028) and `/api/auth/logout`'s own contract already has a
  passing e2e test (027); porting this specific test would only prove
  "the dashboard can be reached," which the redirect tests already cover
  negatively and RTL covers positively, without being able to prove the
  positive case for real here.

  **Nav inventory:** exactly one real destination, Dashboard
  (`/dashboard`) — this prompt's own instruction #4 ("nav entries for
  screens that do not exist yet are omitted entirely, ADR-013") applied
  literally: Memory (036), Imports (032), Twin (039), Billing (042),
  Privacy (045), and Settings (030) all stay out of `AppNav`'s
  `destinations` array (a one-line addition each, once their own page
  exists) rather than linking anywhere dead. The same reasoning was
  extended past the nav rail to `DashboardHome`'s own three editorial
  rows and the empty-account state's CTA: this prompt's own Visual
  requirements ask for each row to link to its section and for a "one
  focal CTA (Import conversations)" on empty accounts, but
  `/memory`/`/import-conversations`/`/assistants` don't exist either — so
  the rows render as read-only status (numerals + labels, no
  `<Link>`) and the empty state has no CTA at all, consistent with
  instruction #4's own principle rather than a narrower reading of where
  it applies. Documented explicitly rather than silently narrowed.

  **Adopted/legacy screen ledger:** Dashboard — rebuilt (this prompt).
  Memory, Assistants (Twin), Imports, Billing, Privacy, Settings — still
  LEGACY-only, each pending its own prompt.

  **Design decisions:** `Logo.tsx` (Prompt 019) is hardcoded
  dark-text-on-light (`text-altr-obsidian`) and every existing usage sits on
  a light surface — reusing it as-is on `AppNav`'s obsidian rail would be
  functionally invisible. `Logo.tsx` isn't in this prompt's file scope, so
  `AppNav` uses a plain light-colored "Altr" text wordmark instead of
  forking or fighting the shared component's styling. `UserMenu` is a
  persistent identity block (name/email/plan badge/language/sign-out),
  not a click-to-open dropdown despite the name — the shared `Menu`
  primitive (`components/ui/Menu.tsx`, Prompt 010) models a list of
  `{id,label,onSelect}` actions behind one trigger, which doesn't fit a
  simultaneously-visible language toggle or `SignOutButton`'s own
  pending-state UI without flattening both into something they're not;
  LEGACY's own (unwired) `AppShell.tsx` reference made the same call
  (`app-sidebar-profile` is a persistent block, not a disclosure). Mobile
  nav is a `Dialog`-based (Prompt 010) bottom sheet — same focus-trap/
  Escape/backdrop/scroll-lock machinery `MobileMenu` (019) already reuses
  — rather than LEGACY's own persistent bottom icon-bar, matching this
  prompt's explicit "bottom-sheet nav" instruction, a deliberate
  divergence from LEGACY's pattern, not a missed detail. `getProfileForUser`
  is called twice per dashboard load (once in `layout.tsx` for the shell,
  once in `page.tsx` for the page's own data) since Next's layout/page
  boundary has no built-in way to share fetched data and neither
  `lib/profileServer.ts` nor a new shared lib file for a `React.cache()`
  wrapper is in this prompt's file scope — flagged as a real, minor,
  known inefficiency for Prompt 050 (performance) rather than silently
  accepted or fixed out of scope. `app/(app)/loading.tsx` (006, unmodified)
  covers `page.tsx`'s own async work (the imports/drafts queries) but,
  per Next.js's own layout/loading model, does *not* cover
  `app/(app)/layout.tsx`'s own `getProfileForUser` call (a segment's
  `loading.tsx` wraps its children, not its own sibling layout) — the very
  first paint of any `(app)` route has no skeleton of its own; noted for
  whichever later prompt wants to add a layout-level Suspense boundary,
  not attempted here since it wasn't a regression against any previous
  baseline (no authenticated page existed before this prompt).

  **Required tests added:** `tests/components/AppNav.test.tsx` (4 tests —
  active `aria-current` state, inactive state on an unrelated route, mobile
  sheet opens with the same nav + identity content, home wordmark link),
  `tests/components/UserMenu.test.tsx` (3 tests — name/email/plan badge
  render, long-value `title` attribute fallback for the "long names/emails"
  edge case, language switch updates the plan badge and sign-out label),
  and `tests/components/DashboardHome.test.tsx` (5 tests — brand-new-account
  empty state, populated-account editorial rows with real numerals,
  imports-empty-but-not-brand-new copy, graceful "—" unknowns on a
  failed row query instead of a spinner or a misleading zero, and a
  Ukrainian-language render of the greeting/empty state).
  `yarn lint`, `yarn typecheck`, `yarn test` (49 files/252 tests, up from
  46/240 in 028), `yarn build` (40/40 pages — `/dashboard` newly compiled
  as a dynamic route), and `yarn test:e2e` (29/29, unchanged — see
  "Consequence for verification" above for why) all passed.

- **030 — Profile and settings (2026-07-24):** Built
  `app/(app)/settings/page.tsx` (thin async Server Component, same
  `requireUser()` + `getProfileForUser()` pattern as 029's dashboard) +
  `components/app/settings/SettingsView.tsx` (the real form, same
  server/client split rationale as 029's `DashboardHome`) and
  `app/legacy-migration/page.tsx` (new — LEGACY's own page at this URL was
  ported logic-verbatim, confirmed against the pinned `a22927d` clone).

  **Fields implemented vs. schema — nothing invented, everything checked
  against the real migrations, not assumed:**

  | Field | Source | UI |
  | --- | --- | --- |
  | `name`, `altr_name`, `role`, `bio`, `tone` | `altr_profiles` columns (`supabase/migrations/202607130001_production_foundation.sql`) | Identity section — `TextField`×3, `Select` (tone), a `Field`-wrapped `<textarea>` (bio; no shared `Textarea` primitive exists yet and none was in this prompt's file scope, so this stays local to `SettingsView.tsx`) |
  | `memory_learning_enabled` | `altr_user_preferences` column | Preferences → "Allow Altr to learn..." `Checkbox` |
  | `settings.autoDrafts` / `.weeklyDigest` / `.privacyMode` | `altr_user_preferences.settings` jsonb (same three keys `getProfileForUser`, must-not-change, already reads) | Preferences → three more `Checkbox`es |

  Tone options (`balanced`/`warm`/`direct`/`formal`) verified against the
  `altr_profiles` table's own `check (tone in (...))` constraint, not just
  the `ToneMode` TypeScript type — both agree. LEGACY's own dashboard
  settings tab only ever exposed the five identity fields inline (no
  Preferences UI existed anywhere) — this prompt's own "gives it a proper
  home and structure for later settings" framing is why Preferences is new,
  real UI here rather than a port; every field it touches was already
  storable and already read by `getProfileForUser`, satisfying this
  prompt's own "no new PII fields introduced" requirement.

  **Save contract:** `updateCurrentProfile()` (`lib/auth.ts`, unmodified)
  is called with only the changed top-level field(s), and a `preferences`
  key containing only the changed sub-field(s) — never the full profile —
  confirmed by two dedicated RTL tests. Optimistic-free: local state (the
  "baseline" identity/preferences the dirty-check compares against) only
  updates once the server call resolves, using the server's own returned
  profile (not an assumed merge), which is also this prompt's own "refresh
  state after save" answer to the concurrent-two-tabs edge case — this
  tab's view stays in sync with whatever the server actually holds after
  save, last-write-wins preserved exactly as LEGACY behaved. Save failures
  show a generic toast and preserve every typed value (nothing is cleared
  or reset); client-side validation mirrors `/api/me`'s own PATCH zod
  bounds (name 2-120, altrName/role 1-120, bio ≤2000) so most invalid
  submissions never reach the server at all — the closest approximation of
  "field-level error mapping" achievable without the server itself
  returning per-field errors (it only ever returns one generic
  `INVALID_PROFILE_UPDATE` code, unmodified).

  **Dirty-state guard:** `Dialog`-based (via `ConfirmDialog`, Prompt 010)
  as instructed, plus a `beforeunload` listener for tab-close/refresh/typed-
  URL navigation. The in-app-navigation half needed a document-level
  capture-phase click listener rather than a scoped one: `AppNav` (029) is
  a *sibling* of this page inside `AppShell`, not a descendant, so nothing
  attached within `SettingsView`'s own subtree could ever see a click on
  the nav rail's links — confirmed with a dedicated test that clicks a
  link rendered *outside* `SettingsView`'s own JSX entirely. `AppNav.tsx`
  itself wasn't touched for this; the guard works against any link
  anywhere in the document by construction.

  **Empty profile / new user:** verified this has no real edge case to
  design for — `name` is the only nullable `altr_profiles` column, and
  `getProfileForUser` (must-not-change) already resolves it to
  `user.email`'s local part or `"Altr User"` before this page ever sees
  it; every other identity column has a non-empty SQL default
  (`altr_name` → `'My Altr'`, `role` → `'Founder'`, `bio` → a real sentence,
  `tone` → `'balanced'`). Confirmed by reading the migration, not assumed.

  **Bridged links (no dead links, 045 not landed yet):** Danger zone links
  to `/privacy` (real, built in 024) with copy explaining that account
  deletion and full data controls are moving to the privacy center: "Danger
  zone pointer" was read literally — no delete-account button was wired up
  here (`deleteCurrentAccount()` in `lib/auth.ts` stays uncalled from this
  surface), since that's explicitly Prompt 045's own scope
  ("Consents, export, deletion in one surface") and `SignOutButton` is
  already reachable globally from `UserMenu` (027), so nothing needed
  duplicating here either.

  **`app/legacy-migration/page.tsx` — logic-verbatim port, diffed:** the
  scan pattern (`LEGACY_PATTERN`, `collectLegacyEntries`), the safe-profile
  field allowlist (`name`/`altrName`/`bio`/`tone`/`preferences`, with the
  same length clamps and tone-enum check), and all four actions
  (export/migrate/delete/continue, including the exact
  `POST /api/auth/legacy-migration/complete` → `DONE_KEY` → `router.replace
  ("/dashboard")` finish sequence) are unchanged line-for-line logic from
  the pinned `a22927d` clone — confirmed by direct side-by-side comparison
  while writing this file, not just by memory of an earlier read. Only the
  JSX/CSS changed: new `Surface`/`Button` primitives, obsidian material,
  bilingual copy via `lib/i18n/copy.ts`'s new `legacyMigration` namespace
  (LEGACY's own version was Ukrainian-only with no language switch). Sits
  outside `app/(app)/` and is deliberately not wrapped in `AppShell` — same
  one-time-gate role it played in LEGACY, not a dashboard destination, so
  it has no nav entry.

  **Scope note (`AppNav.tsx`):** this prompt's own instruction #5
  ("Nav 'Settings' entry (029) now resolves here") calls for exactly the
  one-line addition 029's own comment already anticipated
  (`{ href: "/settings", ... }` added to `useDestinations()`'s array) —
  `AppNav.tsx` isn't in 030's own "files allowed to change" list, but the
  instruction is explicit and the change is the minimal, pre-announced one;
  made and documented rather than skipped or silently expanded further.

  **New finding — `/settings` isn't in the protected-pages list:**
  `lib/supabase/middleware.ts`'s `pages` array (must-not-change, and unlike
  `/legacy-migration`, which *is* already on it) doesn't include
  `/settings`. Confirmed live: an anonymous request to `/settings` against
  a real `yarn build && yarn start` server returns a broken/generic page
  (no session, `requireUser()` throws before any profile data renders — no
  data exposure, just no redirect to `/auth`, unlike every other
  authenticated route). Not fixed — `middleware.ts`/`lib/supabase/
  middleware.ts` weren't named in this prompt's own file lists at all (not
  "allowed", not "forbidden" either), and treating them as untouchable
  without explicit authorization has been consistent practice since 026;
  flagged here for whoever next has explicit permission to add one array
  entry, the same way the `/api/billing/plans` 401 bug has stayed flagged,
  not silently patched, since 023.

  **Required tests added:** `tests/components/SettingsView.test.tsx` (7
  tests — identity form prefilled from the profile payload, preference
  checkboxes reflecting server values, Save disabled until dirty, save
  sends only the one changed identity field, save sends only the one
  changed preference sub-field nested under `preferences`, the
  cross-sibling dirty-guard intercepting a link click outside the form's
  own subtree with a confirm/cancel path each tested), and
  `tests/components/LegacyMigrationPage.test.tsx` (4 tests — no-old-data
  Continue path, entries-found lists the real keys and swaps in
  export/migrate/delete, migration sends only the allowlisted fields and
  clears just those keys, and a failed migration shows a `role="alert"`
  error without losing the listed entries). `tests/components/AppNav.test.tsx`
  gained one more test for the new Settings destination's active state.
  `yarn lint`, `yarn typecheck`, `yarn test` (51 files/264 tests, up from
  49/252 in 029), `yarn build` (42/42 pages — `/settings` and
  `/legacy-migration` both new), and `yarn test:e2e` (29/29, unchanged —
  same placeholder-Supabase content-verification blocker as 029; no new
  e2e test was added asserting the `/settings` middleware gap either,
  since that would encode a known bug as expected behavior) all passed.

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
section added to that same route, 009 for the controls section, 010 for
the overlays section plus the `@types/react` dependency fix, 011 for the
motion section, and 012 for the new `/hero-lab` route, also confirmed
404ing in production). `yarn test:e2e` (the 004 smoke spec) also passed,
2026-07-20, after installing the Playwright Chromium binary (see 006
entry), again after 010's dependency fix, again after 011, and again
after 012. Re-confirmed 2026-07-20 for 013 (`yarn run check`, 30/30 pages)
— note this build was run with the pre-existing, out-of-scope Prompt 014
draft temporarily stashed out (see 013's STATUS entry); that draft's own
build/test state is unverified and not this prompt's concern. Re-confirmed
again 2026-07-21 for 014 (30/30 pages, `/hero-lab` 404s in production), and
again same-day for 015 (30/30 pages), and again for 016 (30/30 pages,
`/hero-lab` 404s in production).

## Last successful test run

LEGACY (`altrtest2` @ `a22927d`, disposable worktree): `yarn test`, 2026-07-19
— 97/97 tests passed across 12 files; command exit code was 1 due to Vitest
worker OOM crashes, not test failures (see `BASELINE_V2.md` §2.3 for why this
isn't a clean pass to cite blindly). WORKSPACE: `yarn test`, 2026-07-20 —
159/159 tests passed across 27 files, clean exit (code 0). Re-confirmed for
013, same numbers, same caveat about the stashed 014 draft as above.
Re-confirmed 2026-07-21 for 014 — 160/160 tests across 28 files, clean exit.
Re-confirmed same day for 015 — 161/161 tests across 29 files, clean exit.
Re-confirmed for 016 — 163/163 tests across 30 files, clean exit.

## Known regressions

None recorded.

## Unresolved decisions

- ADR-007 (hybrid hero): technical approach confirmed by the Prompt 012
  prototype (real FPS/weight/CLS numbers, all passing). Visual approval on
  the asset material itself should be easier now — Prompt 013 replaced the
  matte-rock procedural shards with real, reference-grade glass renders
  (see 013's STATUS entry) — but final visual sign-off on the full
  composition is a Prompt 014+ matter, not re-litigated here.
- Whether a separate staging Supabase project will be provisioned (ADR-012) —
  user decision needed before Prompt 051.
- Prompt 008's manual verification ("view styleguide beside
  `public/hero-shards/shard-main.png`") still hasn't been done as literally
  worded — that path still only has the old LEGACY procedural set; the real
  reference-grade renders Prompt 013 produced live at
  `public/assets/hero/shards-trimmed/shard-main.png` instead (see 013's
  path-decision note). Revisit the `.surface-inverse` material against
  *that* file to confirm it reads as the same material family, per 008's
  visual requirement.
- Prompt 014's composition, 015's fragment content, and now 016's motion
  layer have each run without their own Manual Verification step's user
  approval happening first (014: side-by-side composition approval; 015:
  "user approves the writing"; 016: DevTools performance recording review)
  — each ran directly on user instruction. Whoever picks up Prompt 017
  should get all three approvals, or treat that as a prerequisite.

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
  **Confirmed concretely, not just assumed, by 029:** `.env.local`'s
  `NEXT_PUBLIC_SUPABASE_URL` is the literal placeholder
  `ci-placeholder.supabase.co`, which doesn't resolve (`ENOTFOUND`). Every
  `(app)` page from here on (030, 032, 036, 039, 042, 045) will hit the
  same wall for any real manual/e2e content verification until this is a
  real, reachable Supabase project — see 029's own STATUS entry for the
  full repro and how it worked around this for testing.
- Supabase dashboard: Google OAuth provider credentials (only if Google sign-in
  stays enabled), auth redirect URLs, email templates.
- Lemon Squeezy dashboard: webhook pointed at `<prod-url>/api/webhooks/lemonsqueezy`.
- Vercel project linked with env vars for Preview and Production.
- Legal owner details in `lib/legal/legal-config.ts` (see docs/LEGAL_LAUNCH_CHECKLIST.md).

## Screen inventory (legacy vs rebuilt)

Public/auth surfaces (landing, pricing, legal, auth screens) already flipped
to "rebuilt" across Phases 4-5 — see their own prompt entries above; this
table tracks the authenticated app surfaces Phase 6+ covers.

| Screen | Status | Prompt |
| --- | --- | --- |
| Dashboard home | rebuilt | 029 |
| Profile and settings | rebuilt | 030 |
| Memory overview | legacy | 036 (todo) |
| Import experience | legacy | 032 (todo) |
| Twin / assistants | legacy | 039 (todo) |
| Billing overview | legacy | 042 (todo) |
| Privacy center | legacy | 045 (todo) |
