# PROMPT 004 — Workspace scaffold and backend port

## Current project state

WORKSPACE `main` holds the committed prompt pack and reference assets (003);
no application code exists. LEGACY (`C:\Users\golyb\altrtest2` @ `a22927d`,
read-only) holds the complete working implementation.

## Objective

Scaffold the Next.js application in altr_workspace and port the entire proven
backend from LEGACY — configs, migrations, API routes, domain libraries,
worker, scripts, CI, and every non-UI test — verified green.

## Why this task exists

ADR-001/002/003: the new frontend is built from scratch, but the audited
backend (RLS, webhooks, entitlements, import safety, AI boundary) is ported,
not re-invented. After this prompt, every later prompt can treat the backend
as present in WORKSPACE exactly as the pack's prompts assume.

## Dependencies

003 (and 002's canonical-module findings, e.g. which rate-limit module to port).

## Files to inspect first (all in LEGACY, read-only)

- `package.json`, `yarn.lock`, `tsconfig.json`, `.eslintrc.json`,
  `.prettierrc.json`, `.prettierignore`, `next.config.js`,
  `postcss.config.mjs`, `tailwind.config.ts`, `vercel.json`, `.nvmrc`,
  `.env.example`, `vitest.config.ts`, `playwright.config.ts`
- `middleware.ts`, `lib/**`, `app/api/**`, `app/auth/callback/route.ts`,
  `workers/**`, `supabase/**`, `scripts/**`, `.github/workflows/ci.yml`,
  `.github/dependabot.yml`
- `tests/**` (identify non-UI suites vs UI-coupled suites)

## Files allowed to change (all in WORKSPACE)

Everything — this prompt creates the application skeleton: configs, `app/`
(minimal layout + ported API routes), `lib/`, `workers/`, `supabase/`,
`scripts/`, `tests/`, `.github/`, `public/` (empty for now).

## Files that must not be changed

The entire LEGACY checkout. Within WORKSPACE: `docs/claude-prompts/` content
other than STATUS/INDEX; `references/`.

## Implementation instructions

1. Scaffold: port `package.json` (same dependency versions; scripts identical:
   lint/typecheck/test/build/test:e2e/check/verify:*), `yarn.lock`, and all
   config files listed above. `yarn install --frozen-lockfile` must succeed.
2. Port the backend byte-conscious (copy, then review each file):
   - `middleware.ts`, `lib/env.ts`, `lib/supabase/*`, `lib/security/*`,
     `lib/auth/*` (canonical rate-limit module only, per 002),
     `lib/billing/**`, `lib/imports/**`, `lib/ai/**`, `lib/privacy/**`,
     `lib/legal/**`, `lib/i18n/**`, `lib/application-state.ts`,
     `lib/profileServer.ts`, `lib/auth.ts`, `lib/utils.ts`, `lib/version.ts`,
     `lib/testing/e2e-auth.ts`, `lib/conversationImports.ts` and any remaining
     `lib/` modules the routes import (follow the import graph, do not guess);
   - all of `app/api/**` and `app/auth/callback/route.ts`;
   - `workers/conversation-parser.worker.ts`;
   - `supabase/migrations/**` + `supabase/schema.sql` +
     `supabase/tests/**` — byte-identical (record checksums);
   - `scripts/*.mjs`; `.github/` CI + dependabot;
   - `.env.example`.
   Do NOT port: legacy pages/components/styles, `public/` assets (Phase 3
   copies hero material deliberately), repo noise (`tsconfig.tsbuildinfo`),
   the superseded duplicate modules identified in 002.
3. Minimal `app/` shell so the build passes: bare `app/layout.tsx` and a
   placeholder-free minimal `app/page.tsx` (a single line of real product
   copy — the headline — no fake UI; Phase 1–4 replace it).
4. Port test infrastructure (`vitest.config.ts`, `playwright.config.ts`,
   `tests/setup.ts`, `tests/fixtures/**`) and all non-UI suites: unit
   (parsers, webhook, entitlements, plans, auth-validation, version),
   integration (lemonSqueezy, phase12-boundaries), security/privacy/legal
   source-level suites (`security-regression`, `phase8-privacy`,
   `phase9-security`, `phase10-legal-consistency`, `phase12-*`). UI-coupled
   suites (`tests/components/*`, `phase11-ux-a11y`, `tests/e2e/*`) are NOT
   ported now — list each with the prompt that will port/adapt it (their
   screens' prompts). If a ported non-UI suite asserts against a legacy page
   file, record it and defer that single suite with justification.
5. Green gate: `yarn lint`, `yarn typecheck`, `yarn test`, `yarn build` (with
   CI placeholder env in `.env.local`, uncommitted). CI workflow must pass the
   same steps; e2e step may be temporarily scoped to a minimal smoke spec
   (homepage renders) until Phase 4/12 restore full journeys.
6. Record the port manifest (every file ported, source path → dest path,
   verbatim vs adapted, checksum for migrations) in
   `docs/claude-prompts/PORT_MANIFEST.md`.

## Visual requirements

None — the minimal page is unstyled-but-real text; no placeholder UI elements.

## Security and privacy requirements

- Migrations and RLS byte-identical (checksums recorded).
- No secrets committed; `.env.local` stays untracked.
- The ported security suites must pass unmodified — do not adjust a security
  test to fit the port; fix the port.

## Edge cases

- An `app/api` route imports a legacy component/page (unlikely — verify):
  record and resolve minimally without porting UI.
- Path-casing or import-alias differences on Windows vs CI.
- `yarn.lock` drift if versions resolve differently: use the LEGACY lockfile
  verbatim.

## Acceptance criteria

- [ ] `yarn install --frozen-lockfile`, `yarn check` green in WORKSPACE.
- [ ] All migrations byte-identical to LEGACY (checksums in PORT_MANIFEST).
- [ ] All ported non-UI suites pass unmodified; deferred suites listed with
      owning prompts.
- [ ] PORT_MANIFEST.md complete (source → dest for every ported file).
- [ ] No LEGACY file modified; nothing pushed anywhere but altr_workspace.
- [ ] CI workflow present and passing on push.

## Verification commands

- `yarn check`
- `yarn test`
- `yarn build`

## Manual verification

Spot-diff five ported files (webhook handler, draft-reply route, zip safety,
middleware, one migration) against LEGACY `a22927d` — expect zero semantic
difference.

## Required tests

The ported non-UI suites themselves, passing unmodified.

## Completion report

Report: port manifest summary (counts per area), deferred suites list,
command results, CI run link/status, any adaptations made and why.

## Git checkpoint

`feat: scaffold workspace and port proven backend`

## Status update

Update `STATUS.md` (backend present in WORKSPACE; deferred-suite ledger) and
the 004 row in `INDEX.md`.
