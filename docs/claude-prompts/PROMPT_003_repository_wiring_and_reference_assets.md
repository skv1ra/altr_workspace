# PROMPT 003 — Repository wiring and reference assets

## Current project state

Baselines recorded (001) and audit verified (002). WORKSPACE `main` holds the
prompt pack and `references/altr-hero-reference.png` (verified full-resolution,
1318×716). The raw upload folder `altr-hero-reference.png/` still sits at the
workspace root.

## Objective

Finalize repository wiring for the build: commit the prompt pack and reference
assets to altr_workspace, pin the legacy audit SHA in writing, and tidy the
reference upload — creating the recoverable starting point.

## Why this task exists

ADR-001 requires a clean, pushed starting commit in altr_workspace and a pinned
LEGACY SHA that all later diff-proofs reference. Phase 3 needs the reference
image canonically committed.

## Dependencies

002.

## Files to inspect first

- `git status`, `git remote -v`, `git log --oneline` (WORKSPACE)
- `references/altr-hero-reference.png` (must be a regular file, ~1.1 MB PNG)
- `docs/claude-prompts/` (complete pack: 9 planning docs + 51 prompts)
- `.gitignore` (what the initial commit ignores)

## Files allowed to change

- Git: staging and committing the pack, `references/`, and removing the raw
  upload folder `altr-hero-reference.png/` from the working tree AFTER the
  canonical copy is verified committed (this deletion was user-sanctioned once
  the canonical copy exists; confirm the copy's checksum first)
- `references/README.md` (create — provenance note)
- `.gitignore` (sensible additions for the coming app: `node_modules/`,
  `.next/`, `.env*.local`, `tsconfig.tsbuildinfo`)
- `docs/claude-prompts/STATUS.md`, `INDEX.md`

## Files that must not be changed

The LEGACY checkout (no tags, no branches, no writes there — the audit pin is
recorded in WORKSPACE documents only).

## Implementation instructions

1. Verify origin is exactly `https://github.com/skv1ra/altr_workspace.git` and
   branch is `main`.
2. Create `references/README.md`: what the reference is, that it is inspiration
   only and never a production asset, its provenance (user-supplied screenshot,
   2026-07-19), and the LEGACY pin note (`skv1ra/altrtest2` @ `a22927d` is the
   audited reference implementation; read-only).
3. Verify `references/altr-hero-reference.png` is a regular PNG file; record
   its SHA-256. Confirm it contains no private personal data.
4. Remove the raw upload folder `altr-hero-reference.png/` from the working
   tree only after the canonical file's checksum is recorded.
5. Update `.gitignore` for the future app scaffold.
6. Commit the prompt pack + references + .gitignore to `main`; push to origin
   (`skv1ra/altr_workspace`). This is the pack's first durable commit — verify
   the push landed with `git log origin/main -1`.

## Visual requirements

None beyond confirming the committed reference renders correctly when opened.

## Security and privacy requirements

- Push targets altr_workspace only; never the legacy remote.
- No secrets in any committed file (the pack references env var NAMES only).

## Edge cases

- Push rejected (diverged remote): fetch, review what exists on origin/main,
  reconcile without force-push, report.
- OneDrive file locking during git operations: retry once, report if persistent.

## Acceptance criteria

- [ ] Origin verified; pack + references committed and pushed to
      skv1ra/altr_workspace `main`.
- [ ] `references/README.md` committed with provenance and the LEGACY pin.
- [ ] Reference PNG checksum recorded; raw upload folder removed.
- [ ] Working tree clean after commit.

## Verification commands

- `git remote -v`
- `git log origin/main --oneline -3`
- `git status`

## Manual verification

User confirms the pushed commit is visible on GitHub in skv1ra/altr_workspace.

## Required tests

None.

## Completion report

Report: commit SHA(s) pushed, reference checksum, deletions performed, any
push issues.

## Git checkpoint

`chore: pin legacy reference and commit hero assets`

## Status update

Update `STATUS.md` (starting commit recorded) and the 003 row in `INDEX.md`.
