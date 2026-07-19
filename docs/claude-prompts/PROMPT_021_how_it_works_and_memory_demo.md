# PROMPT 021 — How-it-works and memory demonstration

## Current project state

New homepage fold + product section live (020).

## Objective

Build the `#how-it-works` section (three-step editorial narrative) and the
memory demonstration section (a quiet, real-feeling preview of memory as a
product surface).

## Why this task exists

Visitors must understand the import → memory → continuation mechanic before
pricing; the demo bridges marketing and the real product UI.

## Dependencies

020.

## Files to inspect first

- Legacy `components/InteractiveDemo.tsx` and `lib/memoryData.ts` (existing demo
  data patterns — reuse fictional data ideas, not the visuals)
- `components/memory/types.ts` (real memory shape — demo should mirror it)
- Landing structure from 020

## Files allowed to change

- `components/site/{HowItWorks,MemoryDemo}.tsx` (create)
- `app/page.tsx` (append sections)
- `lib/i18n/home-copy.ts`
- `tests/components/`, homepage e2e additions
- `docs/claude-prompts/STATUS.md`, `INDEX.md`

## Files that must not be changed

`app/api/`, `lib/` (other than i18n), `supabase/`, `components/memory/` (real
product components).

## Implementation instructions

1. How-it-works: three numbered movements ("Bring your conversations" — local
   parsing/privacy note; "Shape your memory" — editable, disable/delete;
   "Meet your continuation" — reviewable drafts only). Editorial layout:
   large numerals, hairline rules, one column on mobile. Copy must reflect
   real behavior only (local parsing IS true — say it plainly).
2. MemoryDemo: static but real-feeling memory list fragment (3–4 fictional
   memories mirroring the real `Memory` shape: category, title, description,
   provenance line) rendered in the new visual system on an obsidian surface;
   one memory shown mid-edit to communicate editability. Non-interactive
   elements must not pretend to be buttons (no dead buttons — decorative
   controls are plainly decorative or genuinely functional).
3. Reveal-on-scroll via the 011 system; reduced-motion safe.
4. `yarn check` + homepage e2e still green.

## Visual requirements

Both sections stay in the fog/obsidian family; the demo must look like the
future dashboard (038 will make the real one match), establishing continuity.

## Security and privacy requirements

- Fictional demo data only; the privacy claim wording must match
  `docs/IMPORT_SECURITY.md` reality (raw archives stay in the browser).

## Edge cases

- Anchor `#how-it-works` lands correctly under sticky header offset.
- Very narrow screens (320px) keep numerals/type balanced.

## Acceptance criteria

- [ ] Both sections shipped, EN + UA, reduced-motion safe.
- [ ] Copy factually accurate to audited behavior.
- [ ] No dead interactive-looking elements.
- [ ] `yarn check` and `yarn test:e2e` pass.

## Verification commands

- `yarn check`
- `yarn test:e2e`

## Manual verification

Read the sections aloud against FEATURE_PARITY_MATRIX — every claim must map to
a COMPLETE row. Mobile walkthrough.

## Required tests

RTL: sections render headings and all three steps; demo renders fictional
memories.

## Completion report

Report: sections, copy-accuracy check outcome, tests, command results.

## Git checkpoint

`feat(site): how-it-works and memory demo`

## Status update

Update `STATUS.md` and the 021 row in `INDEX.md`.
