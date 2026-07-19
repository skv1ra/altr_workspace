# PROMPT 040 — Draft reply interface

## Current project state

Twin configuration rebuilt (039). Legacy drafting lives on the assistants page:
incoming message → POST `/api/ai/draft-reply` → draft + used context; feedback
via `/api/ai/drafts/[id]/feedback`; runs persisted in `altr_assistant_runs`
(no history UI — PARTIAL in the parity matrix).

## Objective

Build the draft workspace: compose request (message, contact, tone, length,
language), review the draft with its provenance, act on it (copy / edit /
regenerate / feedback), and browse draft history.

## Why this task exists

This is the product's payoff moment; it must embody "reviewable draft, you
decide what sends" — and close the draft-history parity gap.

## Dependencies

039.

## Files to inspect first

- `app/api/ai/draft-reply/route.ts` (request schema: incomingMessage ≤6000,
  optional conversationId/contact, tone enum, length, language; response:
  draft, used ids, quota) — the UI mirrors this exactly
- `/api/ai/drafts/[id]/feedback` contract; `/api/ai/provider-status`
- Draft-history source: `altr_assistant_runs` — check for an existing list
  endpoint; if none exists, an additive read-only endpoint is required (see
  allowed files) mirroring existing route conventions (requireUser, user-scoped)
- Draft e2e test (request-body assertion to preserve)

## Files allowed to change

- `components/app/twin/` (draft workspace components)
- `app/assistants/page.tsx` (integrate workspace)
- IF no runs-list endpoint exists: `app/api/ai/drafts/route.ts` (create GET —
  user-scoped, paginated, selecting only safe fields; follow the conventions of
  sibling routes exactly, including rate limiting)
- (No legacy component deletion — LEGACY `components/assistants/*` was never
  ported; it remains reference-only)
- `lib/i18n/copy.ts`, `tests/`, `docs/claude-prompts/STATUS.md`, `INDEX.md`

## Files that must not be changed

`app/api/ai/draft-reply/route.ts`, feedback route, `lib/ai/**`,
`lib/billing/**`, `supabase/`.

## Implementation instructions

1. Compose: incoming-message field (limit-aware), optional contact, tone
   (default from Twin config), length, language auto; generate action with
   pending state showing honest phase copy ("Consulting your memory…").
2. Draft view: the draft in paper-white on obsidian (022 continuity), marked
   "Draft — nothing is sent"; provenance: N memories + M messages used
   (ids → titles resolved where cheap); quota line from response
   (`used/limit`).
3. Actions: Copy (clipboard + toast), Edit-in-place (local editing of the text
   for copying — clearly not saved back), Regenerate (same request re-POST),
   Feedback (thumbs + optional note → real endpoint).
4. History: list of past runs (input excerpt, draft excerpt, date, model)
   from the runs endpoint; selecting shows the full run read-only.
5. Error states: 429 quota (QuotaMeter reached + upgrade), 503 provider not
   configured (calm admin-ish state), 409 `ACTIVE_TWIN_REQUIRED` (link to
   config), generic failure with retry.
6. Preserve the e2e draft request-body assertion; migrate selectors.
   `yarn check` + `yarn test:e2e`.

## Visual requirements

The generated draft is typographically enshrined — larger leading, quotation
setting — while controls recede. History is an archival list, not a chat log.

## Security and privacy requirements

- Never render the draft as HTML (text only) — AI output is untrusted display
  content.
- No auto-send anywhere; copy action is the only egress.
- New runs endpoint (if created): user-scoped, no raw usage/token internals
  leaked, rate-limited like siblings.

## Edge cases

- Draft while Twin inactive; empty draft response (`EMPTY_DRAFT` path);
  6000-char input boundary; regeneration racing (disable during pending);
  clipboard permission denied (fallback select-text UI).

## Acceptance criteria

- [ ] Full compose→review→act→history loop live against real contracts.
- [ ] All four error states designed and tested.
- [ ] History parity gap closed (endpoint decision documented).
- [ ] Draft-only framing visibly present.
- [ ] `yarn check` and `yarn test:e2e` pass.

## Verification commands

- `yarn check`
- `yarn test:e2e`

## Manual verification

Mocked full loop including each error state; clipboard test; 375px.

## Required tests

RTL: request-body construction, error-state rendering, draft-only label.
e2e: draft flow (updated) + history view. Unit: runs endpoint (if created)
ownership scoping.

## Completion report

Report: endpoint decision, provenance resolution approach, error-state
screenshots list, command results.

## Git checkpoint

`feat(twin): draft reply interface`

## Status update

Update `STATUS.md` and the 040 row in `INDEX.md`.
