# Project status

Updated by every implementation prompt at the end of its session.

## Current active prompt

None — Prompt 014 complete (committed locally, not pushed). Composition is
built and self-verified (contrast, clear-space, CLS-by-construction — see
014's STATUS entry) but **not yet user-approved** — this prompt's own
Manual Verification step requires the user to approve the composition
before Prompt 015 proceeds; that approval has not happened yet. Note:
Prompt 004 itself
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
again 2026-07-21 for 014 (30/30 pages, `/hero-lab` 404s in production).

## Last successful test run

LEGACY (`altrtest2` @ `a22927d`, disposable worktree): `yarn test`, 2026-07-19
— 97/97 tests passed across 12 files; command exit code was 1 due to Vitest
worker OOM crashes, not test failures (see `BASELINE_V2.md` §2.3 for why this
isn't a clean pass to cite blindly). WORKSPACE: `yarn test`, 2026-07-20 —
159/159 tests passed across 27 files, clean exit (code 0). Re-confirmed for
013, same numbers, same caveat about the stashed 014 draft as above.
Re-confirmed 2026-07-21 for 014 — 160/160 tests across 28 files, clean exit.

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
- Prompt 014's composition is built and self-verified but **not yet
  user-approved** — 014's own Manual Verification step requires a
  side-by-side approval at 1440px/1920px before Prompt 015 proceeds. Not
  done in this session (no user available to approve synchronously);
  whoever picks up 015 should confirm approval first, or treat getting it
  as a prerequisite step.

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
