# PROMPT 026 — Recovery, reset, callback

## Current project state

Login/register rebuilt (025). Legacy pages: `app/auth/forgot-password/page.tsx`,
`app/auth/reset-password/page.tsx`; routes `/api/auth/forgot-password`,
`/api/auth/reset-password`, `app/auth/callback/route.ts` (email confirmation +
OAuth landing), `app/api/auth/google/start/route.ts`.

## Objective

Rebuild the recovery/reset pages in the new system and verify the full
confirmation/callback path (email confirm, recovery link, Google OAuth entry)
end to end.

## Why this task exists

These are trust-critical flows that are easy to break invisibly — the callback
route is shared by three entry types.

## Dependencies

025.

## Files to inspect first

- Both legacy pages + both API routes (contracts, token/`code` handling)
- `app/auth/callback/route.ts` (query params: `code`, `next` — what it verifies
  and where it redirects, including `/legacy-migration` for Google)
- Supabase email template requirements in `docs/SUPABASE_SETUP.md` / `docs/AUTHENTICATION.md`

## Files allowed to change

- `app/auth/forgot-password/page.tsx`, `app/auth/reset-password/page.tsx` (rebuild)
- `components/auth/` additions
- `lib/i18n/copy.ts`
- `tests/components/`, e2e additions
- `docs/claude-prompts/STATUS.md`, `INDEX.md`

## Files that must not be changed

`app/auth/callback/route.ts`, `app/api/auth/**`, `lib/supabase/**`, `supabase/`.

## Implementation instructions

1. Forgot-password: single-field page; on submit ALWAYS show the same neutral
   confirmation ("If that address exists, a link is on its way") regardless of
   account existence — verify the API already behaves this way and mirror it.
2. Reset-password: validate recovery session/token state on load; expired/used
   link → designed error state with a path back to forgot-password; success →
   confirmation + sign-in path. Same validation rules module as 025.
3. Google entry point: quiet secondary button on `/auth` (both modes) hitting
   `/api/auth/google/start` — present ONLY if Prompt 002 confirmed the provider
   is intended to stay; label honestly ("Continue with Google").
4. Trace the callback matrix manually with mocks: email-confirm, recovery,
   OAuth — document each path's redirect in the report.
5. `yarn check` + `yarn test:e2e`.

## Visual requirements

Same auth composition family as 025; these pages are calmer (single action,
more whitespace). Designed states for: sent, invalid link, expired link,
success.

## Security and privacy requirements

- No account-existence disclosure anywhere in copy or timing-visible behavior.
- Reset tokens never logged or placed into client analytics/URLs beyond what
  Supabase requires.

## Edge cases

- Reset link opened in a different browser than requested.
- Double use of a recovery link.
- `next` param abuse: callback redirect must stay same-origin (verify the
  route already enforces this; if it does not, STOP and record a security
  finding in RISKS.md instead of patching ad hoc).

## Acceptance criteria

- [ ] Both pages rebuilt with all four designed states, EN + UA.
- [ ] Callback matrix documented with verified redirects.
- [ ] Neutral-response behavior confirmed.
- [ ] `yarn check` and `yarn test:e2e` pass.

## Verification commands

- `yarn check`
- `yarn test:e2e`

## Manual verification

Mocked run of each callback path; screenshot the four reset states.

## Required tests

RTL: neutral confirmation rendering; expired-link state. e2e: forgot-password
neutral flow.

## Completion report

Report: callback matrix, state screenshots list, any security findings.

## Git checkpoint

`feat(auth): recovery and callback flows`

## Status update

Update `STATUS.md` and the 026 row in `INDEX.md`.
