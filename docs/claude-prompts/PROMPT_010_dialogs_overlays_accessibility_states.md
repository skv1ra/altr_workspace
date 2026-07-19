# PROMPT 010 — Dialogs, overlays, accessibility states

## Current project state

Form primitives exist (009). Legacy modals are bespoke
(`components/memory/MemoryEditModal.tsx`, `MemoryDeleteModal.tsx`,
`components/legal/CookieConsent.tsx`).

## Objective

Build the overlay system: Dialog (incl. destructive-confirmation variant),
Toast, Menu/Popover — with focus trapping, scroll locking, and reduced-motion
compliance.

## Why this task exists

Destructive actions (memory delete, account deletion) require confirmation
dialogs by security invariant #8; toasts/menus recur across the dashboard.

## Dependencies

009.

## Files to inspect first

- Legacy modals listed above (behavior to preserve: confirm-before-delete)
- `app/accessibility.css`
- `DESIGN_DIRECTION.md` § Motion (entrances 500–700ms — dialogs use the fast end)

## Files allowed to change

- `components/ui/{Dialog,ConfirmDialog,Toast,Toaster,Menu}.tsx` (create)
- `app/(public)/styleguide/page.tsx`
- `tests/components/`
- `docs/claude-prompts/STATUS.md`, `INDEX.md`

## Files that must not be changed

Existing pages/modals (replaced later per screen), `app/api/`, `lib/`, `supabase/`.

## Implementation instructions

1. Dialog on native `<dialog>` or a fully-managed portal: focus trap, initial
   focus, Escape close, backdrop click policy (close for info, NOT for
   destructive confirm), scroll lock, `aria-labelledby`/`aria-describedby`.
2. ConfirmDialog: destructive variant demands explicit typed confirmation prop
   support (used later by account deletion's `DELETE MY ACCOUNT` contract) and a
   danger Button; cancel is the initial focus.
3. Toast: `role="status"` polite announcements, queue, auto-dismiss with pause
   on hover/focus; positioned to never cover the primary CTA.
4. Menu/Popover: keyboard arrows, typeahead optional, dismiss on outside
   click/Escape; used later by dashboard nav.
5. Entrances: fog-soft fade+rise 200–250ms; `prefers-reduced-motion` → opacity
   only. Add all to styleguide; RTL tests; `yarn check`.

## Visual requirements

Backdrop is fog (silver-white at low opacity + slight blur on light; deep
obsidian veil on dark), never plain black 50%. Dialog surface uses the Surface
elevation from 008.

## Security and privacy requirements

- ConfirmDialog must make destruction unmistakable (explicit noun: "Delete this
  memory permanently") — no generic "Are you sure?".

## Edge cases

- Stacked dialogs forbidden — assert and document.
- Toast during route change survives navigation.
- Focus restoration to trigger element on close.

## Acceptance criteria

- [ ] Dialog/ConfirmDialog/Toast/Menu implemented, accessible, tested.
- [ ] Typed-confirmation support proven in a test.
- [ ] Reduced-motion verified.
- [ ] `yarn check` passes.

## Verification commands

- `yarn check`

## Manual verification

Keyboard-only: open dialog from styleguide, tab-cycle stays inside, Escape
closes, focus returns to trigger.

## Required tests

RTL: focus trap, escape, typed confirmation gate, toast announcement role.

## Completion report

Report: components, a11y verification notes, tests, command results.

## Git checkpoint

`feat(design): overlay components and a11y states`

## Status update

Update `STATUS.md` and the 010 row in `INDEX.md`.
