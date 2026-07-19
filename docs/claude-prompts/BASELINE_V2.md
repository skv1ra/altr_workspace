# Baseline V2 — workspace and legacy baseline (Prompt 001)

Date: 2026-07-19

## 0. Repository model

- WORKSPACE: `skv1ra/altr_workspace`, local root
  `C:\Users\golyb\OneDrive\Робочий стіл\altr_web`, branch `main`.
- LEGACY: `skv1ra/altrtest2`, read-only checkout at `C:\Users\golyb\altrtest2`,
  pinned audit SHA `a22927d`.
- Per explicit user instruction, the original LEGACY checkout was never
  written to directly. All LEGACY command reproduction below ran inside a
  **disposable git worktree** checked out from `altrtest2` at the exact pinned
  SHA, located on the `D:` drive (`/d/claude-scratch/altrtest2-baseline`,
  outside both repositories), and deleted after results were captured. The
  worktree was created with `git worktree add --detach <path> a22927dfe98...`
  from the LEGACY checkout — this registers/deregisters the worktree in
  `altrtest2/.git` metadata only; no tracked or untracked file in the LEGACY
  working tree itself was ever edited. Verified before and after (§2.4): `git
  status` and `git rev-parse HEAD` in the original `altrtest2` checkout are
  byte-identical pre/post.

## 1. WORKSPACE verification

- cwd / toplevel: `C:\Users\golyb\OneDrive\Робочий стіл\altr_web`
- `git remote -v`: `origin https://github.com/skv1ra/altr_workspace.git`
  (fetch+push) — **matches required origin, confirmed.**
- Branch: `main`, up to date with `origin/main`.
- HEAD: `e2866a1360c87f5a7def1bc0921475e171fb9a18`
  (`e2866a1 Initial commit: import Claude Code skills and config`)
- `git branch -a`: only `main` / `remotes/origin/main`.
- Untracked inventory: `altr-hero-reference.png/` (original upload folder,
  superseded by `references/altr-hero-reference.png`), `docs/`
  (this prompt pack), `references/` (canonical hero reference image). No
  tracked-file diffs (`git diff --stat HEAD` empty).
- Repo contents: only `.claude/` (tracked), `.gitignore`, and the three
  untracked paths above. No `package.json`, no `app/`, `lib/`, `components/`,
  `supabase/`, `tests/`, `workers/`, `middleware.ts`, `.github/workflows/`, or
  `.env.example` exist yet in WORKSPACE — nothing from the build sequence has
  run here, as expected for Prompt 001.

## 2. LEGACY verification (read-only)

### 2.1 Identity

- Checkout path: `C:\Users\golyb\altrtest2` — exists.
- `git remote -v`: `origin https://github.com/skv1ra/altrtest2.git`
  (fetch+push) — matches.
- Branch: `agent/altr-light-redesign`.
- HEAD: `a22927dfe98a22ac4a889288dea29832eba68417` — matches the pinned audit
  SHA `a22927d` exactly (no drift).
- `git log --oneline -5`:
  ```
  a22927d Replace vector hero shards with photorealistic raster glass
  75d001b Refine glass fragment material and motion
  3d674a7 Redesign hero as light-space dark glass fragment scene
  648d476 Align hero interaction hotspots to reference
  e8bb23f Make exact hero reference interactive
  ```
- `git status --porcelain`: untracked-only —
  `.claude/`, `docs/claude-prompts/`, `"how 3d674a7"` (matches the noise
  MASTER_CONTEXT already documents; no tracked-file changes).

### 2.2 Inventory counts (in the pinned-SHA worktree)

| Item | Count |
| --- | --- |
| Pages under `app/` (`page.tsx`) | 21 |
| API route handlers (`app/api/**/route.ts`) | 30 |
| Migrations (`supabase/migrations/`) | 14 |
| Test files (`tests/`) | 30 |
| `package.json`, `.github/workflows/ci.yml`, `.env.example` | all present |

Cross-check against `FEATURE_PARITY_MATRIX.md`: the matrix lists file-level
evidence per feature rather than raw counts, so this is a sanity check, not
an exact-count reconciliation. Spot-checked representative evidence paths
named in the matrix — `app/api/auth/register/route.ts`,
`app/api/billing/checkout/route.ts`, `app/api/imports/route.ts`,
`app/api/memories/route.ts`, `app/api/assistants/route.ts`,
`middleware.ts`, `workers/conversation-parser.worker.ts` — all present in the
worktree at the pinned SHA. No mismatch found. 14 migrations is consistent
with the matrix's "phase N migration" references (phases 3, 5, 9, etc. are
named individually, not counted as a total elsewhere).

### 2.3 Command reproduction (in the disposable D: worktree, `.env.local` populated with the CI placeholder values from `.github/workflows/ci.yml`)

| Command | Exit code | Result summary |
| --- | --- | --- |
| `yarn install --frozen-lockfile` | 0 | Completed in 113.02s, no warnings surfaced beyond normal yarn output. |
| `yarn lint` (`next lint`) | 0 | One pre-existing warning: `components/CookieBanner.tsx:38:6` — `react-hooks/exhaustive-deps` (missing `save` dependency). No errors. |
| `yarn typecheck` (`tsc --noEmit --pretty false`) | 0 | Clean, no output beyond the run banner. |
| `yarn test` (`vitest run`) | **1** | **97/97 tests passed across all 12 test files** (see detail below), but the overall command still exited 1. |
| `yarn build` (`next build`) | 0 | Production build succeeded: 46/46 static pages generated, 49 routes listed (21 pages/app routes + ~29 non-page API routes shown as 0 B First Load JS, one shared-chunk summary), middleware bundle 58 kB. Same lint warning as above surfaced during build lint pass, non-blocking. |

`yarn test:e2e` was **not** run: it is out of scope for the current
PROMPT_001 (verification commands list only `yarn lint && yarn typecheck &&
yarn test` for LEGACY), and Playwright browser installation was not
attempted.

#### `yarn test` detail — real, not a false pass

The suite content passed completely (12 test files, 97 tests, 0 failing
assertions). The non-zero exit code came from **6 Vitest fork-pool worker
crashes** logged as `Unhandled Error: [vitest-pool]: Worker forks emitted
error` / `Worker exited unexpectedly`, each traced to a **V8 out-of-memory
allocation failure** inside the forked worker process (`FATAL ERROR: Zone
Allocation failed - process out of memory`), not to any test assertion. This
is consistent with running in a memory-constrained environment (this machine
was also found to be at ~100% disk usage on `C:` during this session — see
§2.4) rather than a defect in the legacy code or tests themselves. Recording
per the edge-case rule: **the command's real exit code is 1**, even though
every individual test passed — this must not be reported as a clean pass.

### 2.4 Environment note: `C:` drive had ~0 bytes free

Before command reproduction began, `C:` was measured at 119G/119G used (0
bytes free). A first attempt to build the disposable worktree/node_modules on
`C:` (under the session scratchpad) failed mid-`yarn install` with "No space
left on device" after writing ~187 MB; that partial `node_modules` was
deleted immediately. The worktree was then recreated on `D:` (357G, 124G
free at the time), where all commands in §2.3 ran to completion. This is a
pre-existing condition of the machine, unrelated to Prompt 001 or either
repository, and is flagged here only because it's the most likely cause of
the §2.3 `yarn test` worker OOM crashes. `C:` free space after cleanup:
~197 MB.

### 2.5 Post-run verification

- Disposable worktree removed (`git worktree remove --force`) and its `D:`
  scratch directory deleted after results were captured.
- Original LEGACY checkout re-checked: `git status --porcelain` and
  `git rev-parse HEAD` identical to §2.1 (untracked noise unchanged, HEAD
  still `a22927d`). No writes, commits, or pushes occurred against
  `altrtest2` at any point.

## 3. Blockers / flags for later prompts

1. `yarn test` in LEGACY has a **real, reproducible non-zero exit** driven by
   Vitest worker OOM crashes rather than test failures. Prompt 004 (bulk
   backend port) and Prompt 047 (test expansion) should note this: CI (GitHub
   Actions `ubuntu-latest`) may not hit the same memory ceiling, but anyone
   reproducing locally on a constrained machine should expect this and should
   not conclude the suite is broken from the exit code alone — check the
   summary line (`Test Files N passed`, `Tests N passed`) for the real result.
2. `C:` drive on this machine has effectively no free space (~197 MB as of
   this session). Any future prompt that needs to install/build in
   WORKSPACE (once app code exists there) will need to either free up `C:` or
   redirect its yarn cache/`node_modules`/build output to a drive with space
   (as done here for the LEGACY reproduction), the same way this baseline did.
3. WORKSPACE itself still contains no application code — nothing from the
   build sequence has run there. This is expected for Prompt 001 and is not a
   blocker by itself, only a reminder for whichever prompt does the initial
   port/scaffold.

## 4. Acceptance criteria check

- [x] Workspace origin verified as `skv1ra/altr_workspace.git`.
- [x] Legacy checkout verified read-only, with recorded SHA (`a22927d`, no
      drift) and remote (`skv1ra/altrtest2.git`).
- [x] Legacy lint/typecheck/test results recorded with real output (including
      the real `test` exit code and its actual cause, not smoothed over).
- [x] Inventory counts recorded and cross-checked against the parity matrix
      (spot-checked evidence paths, no mismatch).
- [x] No file outside `docs/claude-prompts/` modified in WORKSPACE; nothing
      committed, and no lasting change of any kind, in LEGACY.
