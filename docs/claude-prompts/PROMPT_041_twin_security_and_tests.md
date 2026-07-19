# PROMPT 041 — Twin security and tests

## Current project state

Twin surfaces rebuilt (039–040).

## Objective

Close Phase 9: verify the AI boundary's security properties survived the UI
rebuild and complete Twin test coverage.

## Why this task exists

The AI route is the most sensitive surface (untrusted content × model ×
quotas); the phase closes only with the injection/quota/draft-only properties
re-proven.

## Dependencies

040.

## Files to inspect first

- `tests/unit/phase12-ai-privacy.test.ts` (existing assertions)
- `app/api/ai/draft-reply/route.ts` developer instruction (must be unchanged —
  diff against LEGACY at `a22927d`)
- New twin components; e2e draft block

## Files allowed to change

- `tests/**` (twin/AI-related)
- `components/app/twin/` (fix-level only)
- `docs/claude-prompts/STATUS.md`, `INDEX.md`, `RISKS.md`

## Files that must not be changed

`app/api/ai/**` (except a runs endpoint created in 040), `lib/ai/**`,
`supabase/`.

## Implementation instructions

1. Boundary-untouched proof: diff WORKSPACE `app/api/ai/draft-reply/route.ts`
   and `lib/ai/` against LEGACY at `a22927d` (read-only checkout); the
   developer instruction and context JSON-wrapping must be byte-identical.
   Record.
2. Injection posture test (component level): render a draft whose text contains
   HTML/script-looking content and markdown-like payloads — assert text-only
   rendering (no dangerouslySetInnerHTML anywhere in twin components; grep
   and assert in a source-level test like the existing security-regression
   pattern).
3. Quota tests: 429 path rendering; quota display uses response values, not
   client math.
4. Draft-only: source-level test asserting no code path in `components/app/`
   references sending APIs (none exist — assert the absence of send-like
   fetches in twin components).
5. Runs endpoint (if created in 040): ownership test — user A cannot list
   user B's runs (unit with mocked clients following existing patterns).
6. Full gate: `yarn check` + `yarn test:e2e`.

## Visual requirements

None; fixes stay within established design.

## Security and privacy requirements

This prompt IS the security gate — every assertion must be real and non-tautological.

## Edge cases

- Drafts containing RTL text, zero-width characters, 700-token maximum-length
  outputs — render integrity.

## Acceptance criteria

- [ ] Boundary diff proof recorded (byte-identical instruction).
- [ ] Text-only rendering + no-send-path assertions added and green.
- [ ] Ownership test for any new endpoint.
- [ ] `yarn check` and `yarn test:e2e` pass.

## Verification commands

- `yarn check`
- `yarn test:e2e`

## Manual verification

Paste an "ignore previous instructions" style message as the incoming message
in the mocked flow — confirm the UI treats it as content (server behavior is
already tested; this checks the UI adds no interpretation).

## Required tests

As enumerated in steps 2–5.

## Completion report

Report: diff proof, new assertions list, findings (if any) into RISKS.md,
command results.

## Git checkpoint

`test(twin): security and draft coverage`

## Status update

Update `STATUS.md` (Phase 9 complete) and the 041 row in `INDEX.md`.
