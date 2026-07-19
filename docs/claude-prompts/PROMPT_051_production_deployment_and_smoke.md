# PROMPT 051 — Production deployment and smoke test

## Current project state

Application complete, tested, visually approved, budget-verified (050) on
`main` of `skv1ra/altr_workspace`.

## Objective

Verify the production environment, deploy via Vercel, run the production smoke
test, and rehearse rollback — then hand over.

## Why this task exists

The final gate. Nothing is promoted to production or serves users until
behavior is verified on a preview with the real environment.

## Dependencies

050. User-owned prerequisites from STATUS.md "Environment setup still
required" must be resolved (this prompt starts by checking them).

## Files to inspect first

- `scripts/verify-production.mjs`, `scripts/verify-ai-env.mjs` (what they check)
- `docs/DEPLOYMENT.md`, `docs/production-setup.md`, `vercel.json`
- STATUS.md environment checklist; `.env.example` vs Vercel env vars (names only)

## Files allowed to change

- `docs/DEPLOYMENT.md` (update for the rebuilt app), `docs/claude-prompts/SMOKE_REPORT.md` (create)
- `docs/claude-prompts/STATUS.md`, `INDEX.md`
- Git: the release tag `v2.0.0` on `main` of altr_workspace ONLY after every
  step below passes and the user explicitly approves promotion

## Files that must not be changed

Application code (a smoke failure reopens the relevant prompt instead).

## Implementation instructions

1. Environment verification: every required var present in Vercel (Preview +
   Production) by NAME (never print values); `yarn verify:production` and
   `yarn verify:ai-env` against the deployed preview.
2. Verify the Vercel project's linked repository is `skv1ra/altr_workspace`
   (ADR-012), then deploy the current `main` as a Vercel preview; run the
   production-mode smoke on the preview URL:
   - `/api/version` metadata correct; security headers present (CSP, HSTS,
     nosniff, frame deny) — curl and record;
   - landing renders (hero, fonts, no CSP violations in console);
   - registration → email confirmation round-trip with a real test inbox;
   - login, protected redirect, sign-out;
   - import a small real fixture end-to-end (real Supabase persistence);
   - memory CRUD real round-trip;
   - draft generation IF OpenAI key configured (else record N/A);
   - Lemon Squeezy TEST-MODE checkout end-to-end: purchase, webhook receipt,
     entitlement flip, success-page behavior, portal open, cancellation;
   - export download; consent grant/withdraw; deletion ceremony on the test
     account (full deletion verified).
3. Record every step with evidence in `SMOKE_REPORT.md`. Any failure: stop,
   report, reopen the owning prompt in STATUS.md.
4. Rollback rehearsal: document and execute a Vercel instant-rollback of the
   preview (or dry-run with exact steps if the plan tier blocks it — record
   which).
5. On full pass + explicit user approval: promote the verified deployment to
   production, re-run the header/version/landing subset against production,
   tag `v2.0.0` on `main` and push the tag to altr_workspace.

## Visual requirements

Production render must match 049-approved visuals (spot-check screenshots on
the production URL).

## Security and privacy requirements

- Test accounts only; delete them after smoke (the deletion step doubles as the
  test). Never print secret values. Live-mode payments are out of scope —
  test mode only unless the user explicitly directs otherwise.

## Edge cases

- Webhook delivery delays on preview URLs (Lemon Squeezy must point at the
  tested URL — coordinate with the user for the dashboard setting).
- Supabase auth redirect allow-list missing the preview URL.

## Acceptance criteria

- [ ] Environment verified by name; verify scripts pass.
- [ ] Every smoke step evidenced in `SMOKE_REPORT.md` (or N/A with reason).
- [ ] Rollback rehearsed/documented with exact steps.
- [ ] User approved; production promoted; spot-check green; `v2.0.0` tagged
      and pushed to altr_workspace.

## Verification commands

- `yarn verify:production`
- `yarn verify:ai-env`
- `yarn check`

## Manual verification

The user performs one independent full journey on production (register through
deletion) and confirms.

## Required tests

None new; the smoke itself is the artifact.

## Completion report

Report: smoke evidence table, rollback procedure, environment items resolved,
tag SHA, remaining user actions (legal placeholders, live-mode switch).

## Git checkpoint

`chore(release): production deployment verification`

## Status update

Update `STATUS.md` (rebuild complete; production state; open items) and the
051 row in `INDEX.md`.
