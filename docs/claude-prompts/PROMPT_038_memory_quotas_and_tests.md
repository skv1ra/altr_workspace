# PROMPT 038 — Memory quotas and tests

## Current project state

Memory surfaces rebuilt (036–037).

## Objective

Close Phase 8: quota behavior surfaced end-to-end and full memory test
coverage.

## Why this task exists

`maxActiveMemories` enforcement exists server-side (extraction path); the UI
must reflect it honestly, and the phase closes only verified.

## Dependencies

037.

## Files to inspect first

- `lib/billing/limits.ts` (`maxActiveMemories`), extraction quota errors
  (`MEMORY_LIMIT_REACHED`) from `lib/ai/memory-extraction.ts`
- Whether manual memory creation enforces the quota server-side (inspect POST
  `/api/memories` — if it does NOT, record this honestly as a legacy gap in
  RISKS.md; do not silently add server enforcement in this prompt)
- QuotaMeter (031); memory tests inventory

## Files allowed to change

- `components/app/memory/` (quota surfaces), `app/memory/page.tsx`
- `tests/**` (memory-related)
- `docs/claude-prompts/RISKS.md` (findings), `STATUS.md`, `INDEX.md`

## Files that must not be changed

`app/api/**`, `lib/**`, `supabase/`.

## Implementation instructions

1. Quota surfaces: overview header meter (036) shows active/limit with
   near-limit and reached states; creation entry point communicates reached
   state before the user writes content (but never blocks viewing/editing).
2. Extraction-quota outcomes (from 033's partial-success state) link here with
   consistent copy.
3. Coverage audit and fill: RTL for quota states and creation gating; unit test
   the quota-display logic against `PLAN_LIMITS` values (import the real
   constants — no copied numbers); e2e memory CRUD extended with a
   quota-reached mock.
4. Full gate: `yarn check` + `yarn test:e2e`.

## Visual requirements

Quota states stay calm (silver → denser type at reached; no red bars); upgrade
path present but not nagging.

## Security and privacy requirements

- UI gating is UX only; report must state where server enforcement exists and
  where it does not (finding from inspection).

## Edge cases

- Plan downgrade putting user over quota → display over-limit truthfully
  (n of m, exceeded) without hiding memories.
- Free plan 250 vs Work 25 000 formatting.

## Acceptance criteria

- [ ] Quota states live across memory surfaces with real constants.
- [ ] Server-enforcement findings recorded honestly.
- [ ] Coverage additions listed and green.
- [ ] `yarn check` and `yarn test:e2e` pass.

## Verification commands

- `yarn check`
- `yarn test:e2e`

## Manual verification

Mock at 79%, 85%, 100%, and 110% of quota; verify each rendering.

## Required tests

As in step 3; enumerate in report.

## Completion report

Report: enforcement findings, coverage delta, command results.

## Git checkpoint

`test(memory): quotas and coverage`

## Status update

Update `STATUS.md` (Phase 8 complete) and the 038 row in `INDEX.md`.
