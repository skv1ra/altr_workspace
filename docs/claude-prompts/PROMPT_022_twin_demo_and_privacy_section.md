# PROMPT 022 — Twin demonstration and privacy section

## Current project state

Landing has hero, product, how-it-works, memory demo (021).

## Objective

Build the Altr Twin demonstration (a draft-reply moment, clearly a reviewable
draft) and the security/privacy section (truthful, specific guarantees).

## Why this task exists

The Twin is the product's emotional core; privacy is its trust core. Both must
be shown honestly — draft-only, review-first.

## Dependencies

021.

## Files to inspect first

- `app/api/ai/draft-reply/route.ts` (what generation actually returns — the
  demo must mirror reality: draft + used memories)
- `docs/SECURITY.md`, `docs/IMPORT_SECURITY.md`, MASTER_CONTEXT invariants
- Landing structure

## Files allowed to change

- `components/site/{TwinDemo,PrivacySection}.tsx` (create)
- `app/page.tsx` (append)
- `lib/i18n/home-copy.ts`
- `tests/components/`, homepage e2e
- `docs/claude-prompts/STATUS.md`, `INDEX.md`

## Files that must not be changed

`app/api/`, `lib/` (other than i18n), `supabase/`.

## Implementation instructions

1. TwinDemo: a static composed moment — incoming message, the Twin's draft
   beneath it marked explicitly "Draft — you decide what sends", and a faint
   provenance line ("drawing on 3 memories"). If any element animates (typing
   reveal), it must be reduced-motion safe and loop slowly. No fake send button.
2. PrivacySection: enumerate only verified guarantees, each one sentence with a
   quiet glyph: files parsed in your browser; your data scoped to you (RLS);
   AI never auto-sends; export and delete any time; no training on your data
   (verify this claim against code/docs before writing it — if unverifiable,
   do not claim it).
3. Section links: privacy → `/privacy`, security detail → keep on-page.
4. `yarn check` + e2e.

## Visual requirements

TwinDemo sits on obsidian with the draft in paper-white — the strongest
light/dark contrast moment on the page. PrivacySection is calm, mostly type.

## Security and privacy requirements

- Every guarantee sentence must be traceable to audited code/docs; record the
  mapping in the completion report.
- The demo must never imply autonomous sending.

## Edge cases

- Long translated strings (UA) in the demo bubbles.
- Screen readers: demo is a labeled figure, not a fake chat log of live content.

## Acceptance criteria

- [ ] Both sections shipped, truthful, EN + UA.
- [ ] Guarantee-to-evidence mapping recorded.
- [ ] "Draft — you decide what sends" (or equivalent) visibly present.
- [ ] `yarn check` and `yarn test:e2e` pass.

## Verification commands

- `yarn check`
- `yarn test:e2e`

## Manual verification

Legal-eye read of the privacy section: could any sentence be challenged? Mobile
walkthrough.

## Required tests

RTL: TwinDemo renders the draft-only label; PrivacySection renders all
guarantees.

## Completion report

Report: sections, guarantee mapping table, tests, command results.

## Git checkpoint

`feat(site): twin demo and privacy section`

## Status update

Update `STATUS.md` and the 022 row in `INDEX.md`.
