# PROMPT 001 — Workspace and legacy baseline

## Current project state

WORKSPACE (`skv1ra/altr_workspace`, local root
`C:\Users\golyb\OneDrive\Робочий стіл\altr_web`, branch `main`) contains only
Claude config, `docs/claude-prompts/`, `references/`, and the raw reference
upload folder. LEGACY (`skv1ra/altrtest2`, read-only checkout at
`C:\Users\golyb\altrtest2`, pinned `a22927d`) contains the previous working
Altr implementation. Nothing from the build sequence has run.

## Objective

Produce a verified, command-backed baseline of both repositories before any
build work: workspace wiring, and the legacy reference's real state.

## Why this task exists

Every later prompt assumes the workspace targets the right remote and that the
legacy audit numbers are reproducible. Recovery from a failed prompt requires
knowing the exact prior state.

## Dependencies

None (first prompt).

## Files to inspect first

- `docs/claude-prompts/MASTER_CONTEXT.md` (read fully — especially
  § Repository model)
- WORKSPACE: `git remote -v`, `git log --oneline`, `git status`
- LEGACY (read-only): `package.json`, `.github/workflows/ci.yml`,
  `.env.example`, `git log --oneline -5`

## Files allowed to change

- `docs/claude-prompts/BASELINE_V2.md` (create, in WORKSPACE)
- `docs/claude-prompts/STATUS.md`, `docs/claude-prompts/INDEX.md` (status columns)

## Files that must not be changed

Everything else in WORKSPACE. The entire LEGACY checkout (no writes of any
kind; running read-only commands there is fine, but nothing may be committed,
and generated artifacts like `node_modules/` must be left as found or noted).

## Implementation instructions

1. WORKSPACE verification: record cwd, `git rev-parse --show-toplevel`,
   `git remote -v` (origin MUST be exactly
   `https://github.com/skv1ra/altr_workspace.git` — stop and report if not),
   current branch, HEAD SHA, and untracked inventory.
2. LEGACY verification (read-only): confirm the checkout exists at
   `C:\Users\golyb\altrtest2`, origin points to `skv1ra/altrtest2.git`, HEAD is
   `a22927d` (record actual if it moved), and the tree matches the audit
   (count pages under `app/`, API route handlers, migrations, test files;
   cross-check against `FEATURE_PARITY_MATRIX.md`; note mismatches).
3. LEGACY test reproduction (read-only intent): in the LEGACY checkout run
   `yarn install --frozen-lockfile`, `yarn lint`, `yarn typecheck`, `yarn test`
   with CI placeholder env values from its `.github/workflows/ci.yml` in an
   uncommitted `.env.local`; record real results and exit codes. Do NOT commit
   anything there; note any files these commands generate.
4. Write everything to `docs/claude-prompts/BASELINE_V2.md` (in WORKSPACE) with
   date, command outputs (trimmed), and discrepancies.

## Visual requirements

None (documentation task).

## Security and privacy requirements

- No real credentials anywhere; no secret values in BASELINE_V2.md.
- No pushes from the LEGACY checkout under any circumstances.

## Edge cases

- A legacy baseline command fails: record the failure verbatim; it constrains
  which behavior can be trusted for porting — flag it for Prompt 004.
- LEGACY HEAD differs from `a22927d`: record both SHAs; the pinned audit SHA
  remains `a22927d` for all diff-proofs unless the user redirects.

## Acceptance criteria

- [ ] Workspace origin verified as skv1ra/altr_workspace.git.
- [ ] Legacy checkout verified read-only with recorded SHA and remote.
- [ ] Legacy lint/typecheck/test results recorded with real output.
- [ ] Inventory counts cross-checked against the parity matrix.
- [ ] No file outside `docs/claude-prompts/` modified in WORKSPACE; nothing
      committed in LEGACY.

## Verification commands

- `git remote -v` (in both repos)
- `yarn lint && yarn typecheck && yarn test` (in LEGACY, read-only intent)

## Manual verification

Read `BASELINE_V2.md`; confirm every claim has command output backing it.

## Required tests

None new; the legacy suite is executed and its result recorded.

## Completion report

Report: both repos' wiring, legacy command results, inventory cross-check,
blockers. Never report success for a failed command.

## Git checkpoint

Commit in WORKSPACE only: `docs: record workspace and legacy baseline`

## Status update

Update `docs/claude-prompts/STATUS.md` and the 001 row in `INDEX.md`. Do not
mark complete if any step was skipped silently.
