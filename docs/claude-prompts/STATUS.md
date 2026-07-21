# Project status

Updated by every implementation prompt at the end of its session.

## Current active prompt

None — Prompt 021 complete (committed locally, not pushed), run directly on
the user's explicit instruction. The homepage now has five live sections
(Header, Hero, Product, How it works, Memory demo); `#how-it-works` closes
the one dead-anchor item 020's own ledger flagged. Copy-accuracy check (this
prompt's own required manual-verification step) passed clean — every claim
in the new sections maps to a FEATURE_PARITY_MATRIX COMPLETE row, no
unmapped or overstated claim found (full mapping in the 021 entry below).
**Carried forward, unchanged by this prompt:** 020's own most significant
open item — `/` runs `export const dynamic = "force-dynamic"` to work
around a real, previously-undiscovered CSP-nonce-vs-static-generation bug,
which still deserves a `RISKS.md` entry and a broader architectural
decision neither 020 nor 021 were scoped to make; 018's hero-lab
interactivity claims still carry the same unverified caveat 020 raised.
Also still open: the pricing-teaser-in-landing content's unclear future
owner (020's finding); Phase 3's manual-verification gaps (014-018); 019's
signed-in-nav-state-not-checked-against-a-real-session item. Note: Prompt
004 itself
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
- Supabase dashboard: Google OAuth provider credentials (only if Google sign-in
  stays enabled), auth redirect URLs, email templates.
- Lemon Squeezy dashboard: webhook pointed at `<prod-url>/api/webhooks/lemonsqueezy`.
- Vercel project linked with env vars for Preview and Production.
- Legal owner details in `lib/legal/legal-config.ts` (see docs/LEGAL_LAUNCH_CHECKLIST.md).

## Screen inventory (legacy vs rebuilt)

All screens currently legacy. Prompts flip entries to "rebuilt" as they land.
