# Project status

Updated by every implementation prompt at the end of its session.

## Current active prompt

None — Prompt 005 complete (committed locally, not pushed); awaiting
`RUN PROMPT 006`. Note: Prompt 004 itself (the backend scaffold/port) was
never given its own commit or `PORT_MANIFEST.md` — its file changes exist
uncommitted in the working tree from an earlier, undocumented session. This
005 session did not redo or finalize 004 (explicitly out of scope) but
incidentally ran `yarn check` against that ported backend for the first
time as part of verifying 005's own changes — see the 005 entry below. That
gap (004 uncommitted, no manifest) is still open.

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

## Failed prompts

None.

## Blocked prompts

None (001's findings are recorded as blockers for future prompts, not a
blocked status for 001 itself — every 001 acceptance criterion was met).

## Last successful build

LEGACY (`altrtest2` @ `a22927d`, disposable worktree): `yarn build` passed,
2026-07-19 (see `BASELINE_V2.md` §2.3). WORKSPACE: `yarn build` passed,
2026-07-19 — 27/27 static pages generated, clean exit (see 005 entry above
for the `node_modules` cross-drive fix that unblocked this).

## Last successful test run

LEGACY (`altrtest2` @ `a22927d`, disposable worktree): `yarn test`, 2026-07-19
— 97/97 tests passed across 12 files; command exit code was 1 due to Vitest
worker OOM crashes, not test failures (see `BASELINE_V2.md` §2.3 for why this
isn't a clean pass to cite blindly). WORKSPACE: `yarn test`, 2026-07-19 —
86/86 tests passed across 12 files, clean exit (code 0).

## Known regressions

None recorded.

## Unresolved decisions

- ADR-007 (hybrid hero) must be confirmed or amended by the Prompt 012 prototype.
- Whether a separate staging Supabase project will be provisioned (ADR-012) —
  user decision needed before Prompt 051.

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
