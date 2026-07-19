# PROMPT 045 — Privacy center redesign

## Current project state

Billing complete (044). Legacy privacy surfaces are scattered: cookie banner +
preferences (`components/legal/*`), consents grant/withdraw APIs, data export
(JSON/CSV ZIP), immediate account deletion (typed confirmation), async deletion
requests (`/data-deletion`, `/delete-data`), `PrivacySettingsPanel`.

## Objective

Unify data controls into one privacy center in the app shell: consents, export,
deletion — plus restyled cookie preferences — preserving every existing
behavior.

## Why this task exists

Parity across many COMPLETE features plus coherence: users should find every
data right in one place, presented with the product's calm seriousness.

## Dependencies

029 (030's settings links point here).

## Files to inspect first

- `components/legal/{CookieConsent,CookiePreferencesButton,PrivacySettingsPanel}.tsx`,
  `lib/legal/{consent-store,cookie-store}.ts` (client consent mechanics)
- `/api/consents/{grant,withdraw}` schemas (conversationProcessing, aiMemory,
  locale), `LEGAL_VERSION`
- `/api/privacy/export` (json + `?format=csv`), `/api/privacy/account`
  (email + literal `DELETE MY ACCOUNT` + reason), `/api/privacy/deletion-requests`
- Legacy pages: `app/delete-data/page.tsx`, `app/data-deletion/*`

## Files allowed to change

- `app/(app)/privacy/page.tsx` (create the center),
  `components/app/privacy/` (create)
- `app/delete-data/page.tsx`, `app/data-deletion/**` (restyle shells; logic
  preserved — these public pages remain for logged-out deletion requests)
- Cookie banner/preferences components (create in WORKSPACE: port the LEGACY
  components' consent logic verbatim, rebuild only their presentation in the
  design system; the `lib/legal` stores they use were ported in 004)
- Settings (030) links updated to the center
- `lib/i18n/copy.ts`, `tests/`, `docs/claude-prompts/STATUS.md`, `INDEX.md`

## Files that must not be changed

`app/api/**`, `lib/legal/**` logic and content, `lib/privacy/**`, `supabase/`.

## Implementation instructions

1. Center structure: Consents (current state per consent type with granted
   dates + withdraw/grant via real endpoints, legal version shown), Your data
   (export JSON / export CSV ZIP with generation pending states), Danger zone
   (account deletion).
2. Account deletion ceremony: multi-step ConfirmDialog — consequences list
   (what is deleted vs anonymized, truthfully from the audited route), email
   entry, literal `DELETE MY ACCOUNT` typed phrase (exact contract), optional
   reason; final state signs the user out per current behavior (verify).
3. Async deletion-request flow (public pages) restyled; the center links to it
   for the email-verification path where applicable.
4. Cookie preferences: build banner + dialog in the design system (010) around
   the ported LEGACY consent logic — equal visual weight for accept/decline,
   logic and storage semantics identical to LEGACY.
5. Consent withdrawal consequences stated plainly (what stops working).
   `yarn check` + `yarn test:e2e`.

## Visual requirements

The privacy center is the trust flagship: paper-calm, archival typography,
zero dark patterns (decline = same size as accept; deletion reachable in two
clicks; no guilt copy).

## Security and privacy requirements

- Exact deletion contract preserved (schema literal); export downloads carry
  existing no-store headers (server-side already).
- Consent records keep version/locale semantics.
- Restyled banner must not change consent defaults (decline-by-default for
  non-essential stays).

## Edge cases

- Export while a deletion is pending; double-click export (single in-flight);
  deletion with wrong email (schema mismatch → precise error); withdraw of a
  consent that gates imports while an import runs.

## Acceptance criteria

- [ ] Center live: consents, export (both formats), deletion ceremony working
      against real endpoints.
- [ ] Cookie surfaces live with consent logic diff-proven identical to LEGACY
      at `a22927d`.
- [ ] Public deletion pages restyled and linked.
- [ ] `yarn check` and `yarn test:e2e` pass.

## Verification commands

- `yarn check`
- `yarn test:e2e`

## Manual verification

Mocked deletion ceremony end-to-end incl. the sign-out; export both formats;
withdraw/regrant a consent; banner on a fresh profile.

## Required tests

RTL: deletion gate (typed phrase exact), consent toggle contracts, export
pending state. e2e: privacy center smoke with mocks.

## Completion report

Report: behavior parity checklist per feature, cookie logic diff proof,
command results.

## Git checkpoint

`feat(privacy): unified privacy center`

## Status update

Update `STATUS.md` and the 045 row in `INDEX.md`.
