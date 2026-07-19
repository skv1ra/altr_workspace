# PROMPT 009 — Buttons, inputs, forms

## Current project state

Typography (007) and surfaces (008) exist with a styleguide.

## Objective

Build the interactive primitives: Button (primary/secondary/ghost/danger),
TextField, PasswordField, Checkbox, Select, and form field scaffolding
(label, help, error) with full keyboard and state coverage.

## Why this task exists

Auth, import, memory, billing — every flow uses these. "Precise, expensive
micro-interactions" happen here or nowhere.

## Dependencies

008.

## Files to inspect first

- Legacy form patterns: `app/auth/page.tsx`, `components/memory/MemoryEditModal.tsx`
- `app/accessibility.css` (existing focus conventions)
- `DESIGN_DIRECTION.md` § Motion (150–250ms micro-interactions)

## Files allowed to change

- `components/ui/{Button,TextField,PasswordField,Checkbox,Select,Field}.tsx` (create)
- `app/styles/controls.css` (create, if not fully Tailwind)
- `app/(public)/styleguide/page.tsx` (controls section)
- `tests/components/`
- `docs/claude-prompts/STATUS.md`, `INDEX.md`

## Files that must not be changed

Existing pages/forms (adopted per-screen later), `app/api/`, `lib/`, `supabase/`.

## Implementation instructions

1. Button: obsidian primary on light, paper primary on dark; hover = subtle lift
   (translateY(-1px) + shadow deepen, 180ms `--ease-altr`); active = settle;
   loading state with inline progress (no layout shift); disabled ≠ invisible.
2. Fields: hairline underline or thin-border style per DESIGN_DIRECTION (no
   heavy rounded boxes); floating or top-aligned labels — pick one and document;
   error state uses `role="alert"` paragraph pattern (legacy e2e relies on
   `p[role="alert"]` — keep that contract).
3. All controls: visible `:focus-visible` ring tokens, 44px minimum touch
   target, `aria-describedby` wiring for help/error text.
4. Checkbox custom-drawn (consent flows use it) with indeterminate support.
5. Add every control + state matrix (default/hover/focus/error/disabled/loading)
   to the styleguide. RTL tests for behavior (not pixels). `yarn check`.

## Visual requirements

Controls must feel machined: exact alignment, consistent optical padding,
restrained motion. No default browser styling visible anywhere.

## Security and privacy requirements

- PasswordField: `autocomplete` attributes correct (`current-password` /
  `new-password`); no password value ever logged or echoed.

## Edge cases

- Autofill styling (webkit yellow) neutralized.
- Long error messages wrap without breaking layout.
- Select keyboard navigation on Windows browsers.

## Acceptance criteria

- [ ] All primitives typed, accessible, state-complete, in styleguide.
- [ ] `p[role="alert"]` error contract preserved.
- [ ] Keyboard-only operation verified for every control.
- [ ] `yarn check` passes.

## Verification commands

- `yarn check`

## Manual verification

Tab through the styleguide controls section with keyboard only; verify focus
ring visibility on both light and dark surfaces.

## Required tests

RTL: click/keyboard activation, error announcement, disabled behavior, loading
state for Button; field label association.

## Completion report

Report: components created, a11y decisions, tests added, command results.

## Git checkpoint

`feat(design): core form and button primitives`

## Status update

Update `STATUS.md` and the 009 row in `INDEX.md`.
