# PROMPT 039 — Twin configuration redesign

## Current project state

Memory phase complete (038). Legacy `/assistants` page with
`components/assistants/*` handles Twin config (name, tone, instructions,
active toggle) plus "coming later" previews (Operator, Negotiator).

## Objective

Rebuild the Altr Twin configuration surface: identity, tone/personality,
custom instructions, activation — presenting the Twin as a considered entity,
not a settings form.

## Why this task exists

The Twin is the emotional product core; configuration is where users shape
their continuation.

## Dependencies

029 (shell); 038 recommended.

## Files to inspect first

- LEGACY (reference): `app/assistants/page.tsx`, `components/assistants/*`
  (current capabilities, `ControlLayer`, preview handling)
- `/api/assistants` GET/PATCH contracts (tone enum, config JSON, is_active,
  `previews` with `coming_later` status)
- `ensureApplicationState` (`lib/application-state.ts`) — what guarantees the
  Twin config row exists

## Files allowed to change

- `app/(app)/assistants/page.tsx` (create at URL `/assistants`),
  `components/app/twin/` (create — LEGACY `components/assistants/*` was never
  ported and stays reference-only)
- `lib/i18n/copy.ts`, `tests/`, `docs/claude-prompts/STATUS.md`, `INDEX.md`

## Files that must not be changed

`app/api/assistants/**`, `app/api/ai/**`, `lib/`, `supabase/`.

## Implementation instructions

1. Layout: the Twin as a presence — obsidian panel with a slow-drifting shard
   and the Twin's name in display type; configuration as quiet sections beside
   it (Identity: name; Voice: tone from the real enum + style instructions
   textarea with the API's length limit; Status: active toggle with plain
   consequences copy).
2. Wire GET/PATCH exactly; saving states per 030 conventions; instructions
   field communicates it shapes drafts only ("guides how drafts sound").
3. Roadmap previews: Operator/Negotiator rendered as clearly-labeled future
   modules (non-interactive, "In development" label) — no dead buttons, no
   fake toggles (RISKS R9).
4. Memory linkage summary: "Drawing on N active memories" (count from the
   memories endpoint) linking to `/memory`.
5. Migrate the assistants e2e selectors for config (draft flow stays until
   040). `yarn check` + `yarn test:e2e`.

## Visual requirements

This page should feel like meeting the Twin: cinematic negative space, the
config almost secondary. Future modules visually receded (low-opacity,
explicitly labeled), never card-teasers.

## Security and privacy requirements

- Instructions are user-authored config; server treats them as
  `safeUserInstructions` inside the guarded prompt — do not present them as
  system-level control ("instructions influence tone, not truth").

## Edge cases

- Missing Twin row (ensureApplicationState should prevent it — handle 409
  `ACTIVE_TWIN_REQUIRED` downstream anyway).
- Instructions at max length; emoji in Twin name.
- Deactivated Twin: drafting entry points (040) must reflect state.

## Acceptance criteria

- [ ] Config surface rebuilt against real contracts; save round-trips.
- [ ] Roadmap modules honest and inert.
- [ ] Active-memory count real and linked.
- [ ] `yarn check` and `yarn test:e2e` pass.

## Verification commands

- `yarn check`
- `yarn test:e2e`

## Manual verification

Mocked config edit round-trip; toggle active; 375px composition.

## Required tests

RTL: config form contract (PATCH body), previews non-interactive, active
toggle consequences copy.

## Completion report

Report: contract table, preview treatment, command results.

## Git checkpoint

`feat(twin): redesigned twin configuration`

## Status update

Update `STATUS.md` and the 039 row in `INDEX.md`.
