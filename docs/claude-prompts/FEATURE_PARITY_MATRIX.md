# Feature parity matrix

Audit date: 2026-07-19, LEGACY repo `skv1ra/altrtest2` at commit `a22927d`
(branch `agent/altr-light-redesign`; backend identical to its `main`).
Classification: COMPLETE / PARTIAL / MOCKED / LEGACY-UNUSED / ROADMAP / NOT FOUND.

**Repository model note:** all evidence paths in this matrix refer to the
read-only LEGACY checkout at `C:\Users\golyb\altrtest2`. The "Rebuild prompt"
column names the prompt that ports and/or rebuilds the feature inside the new
`altr_workspace` repository. Cells reading "preserved" mean: the file is ported
verbatim into altr_workspace (bulk backend port, Prompt 004) and kept
contract-identical; it is never edited in the legacy repo.

Every COMPLETE feature must survive the rebuild. The "Rebuild prompt" column is the
traceability gate: no COMPLETE row may lack a prompt.

## Authentication

| Feature | Status | Evidence (routes / files / tables) | Tests | Rebuild prompt | Test prompt | Manual check |
| --- | --- | --- | --- | --- | --- | --- |
| Email/password registration | COMPLETE | `app/api/auth/register/route.ts`, `app/auth/page.tsx`, `lib/auth/validation.ts`, `altr_profiles` | `tests/unit/auth-validation.test.ts`, e2e | 025 | 028 | 051 |
| Email confirmation callback | COMPLETE | `app/auth/callback/route.ts` | e2e (routing) | 026 | 028 | 051 |
| Login / logout | COMPLETE | `app/api/auth/login/route.ts`, `app/api/auth/logout/route.ts` | e2e sign-out flow | 025, 027 | 028 | 051 |
| Password recovery + reset | COMPLETE | `app/api/auth/forgot-password/route.ts`, `app/api/auth/reset-password/route.ts`, `app/auth/forgot-password/page.tsx`, `app/auth/reset-password/page.tsx` | unit validation | 026 | 028 | 051 |
| Session handling (SSR refresh) | COMPLETE | `middleware.ts`, `lib/supabase/middleware.ts`, `lib/supabase/{client,server,admin}.ts` | integration boundaries | 027 | 028 | 051 |
| Protected routes | COMPLETE | middleware + `requireUser` in `lib/supabase/server.ts` / `lib/auth/server.ts` | e2e redirect test | 027 | 028 | 051 |
| Account ownership validation | COMPLETE | every API scopes by `user.id`; RLS policies | `tests/integration/phase12-boundaries.test.ts`, RLS SQL | 027 | 047 | 051 |
| Google OAuth sign-in | COMPLETE (needs Supabase provider config) | `app/api/auth/google/start/route.ts` → `/auth/callback` → `/legacy-migration` | none automated | 026 | 028 | 051 |
| Auth rate limiting | COMPLETE | `lib/auth/rate-limit.ts`, `private.altr_rate_limit_buckets`, phase 9 migration | `tests/phase9-security.test.ts` | preserved (no rewrite) | 047 | — |

## User account

| Feature | Status | Evidence | Tests | Rebuild prompt | Test prompt | Manual check |
| --- | --- | --- | --- | --- | --- | --- |
| Server-backed profile | COMPLETE | `app/api/me/route.ts`, `lib/profileServer.ts`, `altr_profiles`, `altr_user_preferences` | e2e dashboard test | 030 | 047 | 051 |
| Onboarding | NOT FOUND | only referenced in auth copy ("short onboarding") — no route or component exists | — | 031 (new build, not parity) | 047 | 051 |
| Profile settings | PARTIAL | `updateCurrentProfile` in `lib/auth.ts`; edited inline on dashboard; no dedicated settings page | — | 030 | 047 | 051 |
| Subscription status display | COMPLETE | `app/api/billing/me/route.ts`, `app/billing/page.tsx` | `tests/unit/phase12-billing.test.ts` | 042 | 044 | 051 |
| Account export (JSON + CSV ZIP) | COMPLETE | `app/api/privacy/export/route.ts`, `lib/privacy/export.ts` | `tests/phase8-privacy.test.ts` | 045 | 047 | 051 |
| Account deletion (immediate, confirmed) | COMPLETE | `app/api/privacy/account/route.ts` (requires `DELETE MY ACCOUNT` + email; anonymizes billing, purges storage, ordered table deletion) | phase8 tests | 045 | 047 | 051 |
| Deletion request flow (async) | COMPLETE | `app/api/privacy/deletion-requests/route.ts`, `app/data-deletion/*`, `app/delete-data/page.tsx`, `altr_deletion_requests` (+history), `lib/privacy/deletion-validation.ts` | phase8 tests | 045 | 047 | 051 |
| Cookie banner + preferences | COMPLETE | `components/CookieBanner.tsx`, `components/legal/CookieConsent.tsx`, `components/legal/CookiePreferencesButton.tsx`, `lib/legal/cookie-store.ts`, `app/cookies/page.tsx` | `tests/phase10-legal-consistency.test.ts` | 045 | 047 | 051 |
| Consent records (versioned) | COMPLETE | `app/api/consents/{grant,withdraw}/route.ts`, `LEGAL_VERSION` in `lib/legal.ts`, `altr_consents/_history/_events` | phase10 tests | 045 | 047 | 051 |
| Legacy localStorage migration | COMPLETE (niche) | `app/legacy-migration/page.tsx`, `app/api/auth/legacy-migration/complete/route.ts` | — | preserved as-is (re-styled in 030) | — | 051 |

## Conversation import

| Feature | Status | Evidence | Tests | Rebuild prompt | Test prompt | Manual check |
| --- | --- | --- | --- | --- | --- | --- |
| Providers: Telegram, WhatsApp, Gmail (mbox), Instagram, Messenger, Slack, Discord, manual | COMPLETE | `lib/imports/parsers.ts`, `lib/imports/types.ts`; fixtures for each in `tests/fixtures/imports/` | `tests/unit/import-parsers.test.ts`, `tests/unit/phase12-import-formats.test.ts` | 032 | 035 | 051 |
| Formats: JSON, TXT, HTML, CSV, ZIP, MBOX | COMPLETE | mime/extension allow-list in `app/api/imports/route.ts` | unit tests | 032 | 035 | 051 |
| ZIP archive safety (zip-bomb, traversal) | COMPLETE | `lib/imports/zip.ts` (`extractSafeZipEntries`), `lib/imports/limits.ts` | import security tests, `docs/IMPORT_SECURITY.md` | preserved | 035 | — |
| Local parsing in Web Worker | COMPLETE | `workers/conversation-parser.worker.ts` | e2e import flow | 032 | 035 | 051 |
| Malformed input handling (encoding fallback, JSON depth/nodes/cycles) | COMPLETE | `decodeImportedText`, `scanJsonDepth`, `assertSafeObjectGraph` in parsers | unit tests | preserved | 035 | — |
| Duplicate import handling | COMPLETE | `source_hash` (sha-256) 409 conflict in `app/api/imports/route.ts` | unit tests | 033 | 035 | 051 |
| Import cancellation | COMPLETE | `AbortSignal` checkpoints in parser; UI cancel | — | 033 | 035 | 051 |
| Import retry / stale takeover | COMPLETE | stale `processing` > 30 min takeover in imports API | — | 033 | 035 | 051 |
| Chunked persistence | COMPLETE | `app/api/imports/[id]/chunks/route.ts`, `altr_conversations`, `altr_messages` | e2e mocked | 033 | 035 | 051 |
| Import history + provenance | COMPLETE | GET `/api/imports`, `altr_conversation_imports` (parser_version, mime, hash) | — | 034 | 035 | 051 |
| Raw archive never uploaded | COMPLETE | `rawFileStored: z.literal(false)` in create schema | security regression tests | preserved | 035 | — |
| Post-import memory extraction | COMPLETE | `app/api/imports/[id]/extract/route.ts`, `lib/ai/memory-extraction.ts` | phase12 AI privacy tests | 033 | 035 | 051 |

## Memory

| Feature | Status | Evidence | Tests | Rebuild prompt | Test prompt | Manual check |
| --- | --- | --- | --- | --- | --- | --- |
| Memory list, search, category filter, pagination | COMPLETE | GET `/api/memories` (q, category, page, pageSize) | e2e memory CRUD | 036 | 038 | 051 |
| Memory creation (manual) | COMPLETE | POST `/api/memories` + `altr_memory_sources` provenance row | e2e | 037 | 038 | 051 |
| Memory editing | COMPLETE | PATCH `/api/memories/[id]` | e2e | 037 | 038 | 051 |
| Memory disabling (is_active) | COMPLETE | PATCH toggle; embedding index filters `is_active = true` | — | 037 | 038 | 051 |
| Memory deletion (single + clear-all) | COMPLETE | DELETE `/api/memories/[id]`, DELETE `/api/memories` | e2e | 037 | 038 | 051 |
| Provenance display | COMPLETE | `altr_memory_sources` joined in list response; `components/memory/*` | — | 037 | 038 | 051 |
| Ownership isolation | COMPLETE | user-scoped queries + RLS | boundaries + RLS tests | preserved | 047 | — |
| Vector embeddings + retrieval | COMPLETE | pgvector 1536, HNSW partial index, `altr_match_active_memories` RPC | phase12 AI tests | preserved | 041 | — |
| Memory quotas per plan | COMPLETE | `maxActiveMemories` in `lib/billing/limits.ts`, enforced in extraction | `tests/unit/plans.test.ts` | 038 | 038 | 051 |

## Altr Twin

| Feature | Status | Evidence | Tests | Rebuild prompt | Test prompt | Manual check |
| --- | --- | --- | --- | --- | --- | --- |
| Twin configuration (name, tone, instructions, active) | COMPLETE | `app/api/assistants/route.ts`, `[id]/route.ts`, `altr_assistant_configs`, `components/assistants/*` | e2e draft flow | 039 | 041 | 051 |
| Style/personality settings | COMPLETE | tone enum + system_instructions + config JSON | — | 039 | 041 | 051 |
| Context retrieval (memories + recent messages) | COMPLETE | embedding query + RPC + last-12 messages in `app/api/ai/draft-reply/route.ts` | phase12 AI privacy | preserved | 041 | — |
| Draft reply generation | COMPLETE | POST `/api/ai/draft-reply` (server-only OpenAI) | e2e mocked | 040 | 041 | 051 |
| Draft history | PARTIAL | `altr_assistant_runs` persists all runs; no dedicated history UI | — | 040 (adds history view) | 041 | 051 |
| Draft feedback | COMPLETE | `app/api/ai/drafts/[id]/feedback/route.ts`, `altr_draft_feedback` | — | 040 | 041 | 051 |
| Usage quotas (drafts/month) | COMPLETE | `aiDraftsPerMonth` enforced with 429 | phase12 billing tests | 040 | 041 | 051 |
| Provider status / structured errors | COMPLETE | `/api/ai/provider-status`, 503 `AI_PROVIDER_NOT_CONFIGURED`, `safeErrorResponse` | — | 040 | 041 | 051 |
| Prompt-injection defense | COMPLETE | developer instruction treats imported content as untrusted; JSON-wrapped context | `tests/unit/phase12-ai-privacy.test.ts` | preserved | 041 | — |
| Draft-only safeguard (no sending) | COMPLETE | instruction + no send pathway exists anywhere | security regression | preserved | 041 | 051 |

## Billing

| Feature | Status | Evidence | Tests | Rebuild prompt | Test prompt | Manual check |
| --- | --- | --- | --- | --- | --- | --- |
| Lemon Squeezy checkout | COMPLETE | `app/api/billing/checkout/route.ts`, `lib/billing/lemonsqueezy.ts`, `checkout-validation.ts` | `tests/integration/lemonSqueezy.test.ts`, e2e mocked | 043 | 044 | 051 |
| Personal ($20/mo) and Work ($40/mo) plans | COMPLETE | `lib/billing/plans.ts`, variant env vars, `/api/billing/plans` | `tests/unit/plans.test.ts` | 023, 042 | 044 | 051 |
| Verified webhook processing | COMPLETE | `app/api/webhooks/lemonsqueezy/route.ts`, HMAC timing-safe verify in `lib/billing/webhook.ts` | `tests/unit/lemon-webhook.test.ts` | preserved | 044 | — |
| Webhook idempotency | COMPLETE | `altr_billing_webhook_events` unique provider_event_id | webhook tests | preserved | 044 | — |
| Entitlements (server-authoritative) | COMPLETE | `lib/billing/entitlements.ts`, `entitlement-policy.ts`, phase 5 migration | `tests/unit/entitlements.test.ts` | preserved | 044 | — |
| Invoices / orders | COMPLETE | `altr_invoices`, `altr_billing_orders`, `altr_billing_invoices`; `/api/billing/me`; receipt page `app/payment/receipt/[orderId]/page.tsx` | — | 042 | 044 | 051 |
| Customer portal | COMPLETE | `app/api/billing/portal/route.ts` (fresh portal URL) | — | 042 | 044 | 051 |
| Cancellation / renewal / failed payment | COMPLETE | subscription webhook events update status via entitlement policy | entitlements tests | preserved | 044 | 051 |
| Refunds | COMPLETE | `order_refunded` handled in `lib/billing/webhook-handler.ts` | webhook tests | preserved | 044 | — |
| Success/cancel pages never grant access | COMPLETE | `app/payment/success/*`, `app/payment/cancel/page.tsx`, `app/billing/return/page.tsx` | e2e "never upgrades plan" test | 043 | 044 | 051 |
| Plan quota enforcement | COMPLETE | `lib/billing/limits.ts` used by imports, memory, AI routes | plans + billing tests | preserved | 044 | — |

## Legal and privacy

| Feature | Status | Evidence | Tests | Rebuild prompt | Test prompt | Manual check |
| --- | --- | --- | --- | --- | --- | --- |
| Privacy policy / terms / cookies pages | COMPLETE | `app/{privacy,terms,cookies}/page.tsx`, content in `lib/legal/*` | phase10 consistency tests | 024 | 046 | 051 |
| Consent version tracking | COMPLETE | `LEGAL_VERSION`, consent timestamps per document | phase10 tests | 045 | 046 | 051 |
| Legal owner placeholders | COMPLETE | `lib/legal/legal-config.ts`, `docs/LEGAL_LAUNCH_CHECKLIST.md` | — | 046 | 046 | 051 |
| Accessibility considerations | PARTIAL | `app/accessibility.css`, `tests/phase11-ux-a11y.test.ts`; no full audit | phase11 tests | 010, 046 | 046 | 051 |
| EN/UA language switch | COMPLETE (inconsistent coverage) | `components/LanguageSwitcher.tsx`, `lib/i18n/*`, `components/legal/LanguageSwitch.tsx` | — | 024 (standardized per ADR-006) | 046 | 051 |

## Quality and operations

| Feature | Status | Evidence |
| --- | --- | --- |
| Unit + integration tests (17 files) | COMPLETE | `tests/unit/*`, `tests/integration/*`, security/privacy/legal/a11y suites |
| Playwright E2E (11 mocked critical flows) | COMPLETE | `tests/e2e/critical-flows.spec.ts`, `lib/testing/e2e-auth.ts`, `ALTR_E2E_MOCKS` |
| Lint / typecheck / build gates | COMPLETE | `yarn check`; CI runs lint, typecheck, test, build, e2e |
| CI | COMPLETE | `.github/workflows/ci.yml` with placeholder env, artifact uploads |
| Env validation | COMPLETE | `lib/env.ts` (zod), `scripts/verify-ai-env.mjs`, `scripts/verify-production.mjs` |
| Deployment docs | COMPLETE | `docs/DEPLOYMENT.md`, `docs/production-setup.md`, `vercel.json` |
| Release metadata | COMPLETE | `/api/version`, `lib/version.ts`, version unit tests |
| Safe logging | COMPLETE | `lib/security/observability.ts` |

## Roadmap only — must NOT be presented as implemented

From `docs/ROADMAP.md`: Gmail OAuth live sync (Phase A), live Telegram/WhatsApp/Meta
API sync (B), Google Calendar (C), Operator task extraction (D), Negotiator (E),
team workspaces (F). The assistants API returns `Operator` and `Negotiator` as
`status: "coming_later"` previews — the rebuild may show them only as clearly
labeled future modules, never as working features.

## Legacy / unused

- `lib/auth/rateLimit.ts` — **resolved 2026-07-19 (Prompt 002):** zero imports
  anywhere in the LEGACY tree (`grep -rn "auth/rateLimit\b"` across the whole
  checkout, excluding `node_modules`, returns nothing); fully superseded by
  `lib/auth/rate-limit.ts` (imported by 15 route files). Safe to delete
  outright in Prompt 004; no consolidation work needed.
- `lib/plans.ts` vs `lib/billing/plans.ts` — **resolved 2026-07-19 (Prompt
  002): neither is dead, both are canonical for different concerns.**
  `lib/billing/plans.ts` is canonical for entitlement/access logic (imported
  by `lib/billing/entitlements.ts`, `lib/billing/lemonsqueezy.ts`, 3 test
  files), prices in cents (`amount: 2000`/`4000`). `lib/plans.ts` is canonical
  for pricing-page marketing display (imported only by `app/pricing/page.tsx`
  and its own test), prices as dollar numbers (`price: 20`/`40`) plus
  Ukrainian copy/features. They hardcode the same $20/$40 figures
  independently — see RISKS.md R11 for the desync risk this creates.
- `tsconfig.tsbuildinfo`, stray root file `how 3d674a7` — build noise (Prompt 004).
- `components/HeroOrb.tsx`, `components/HeroGlassScene.tsx`, `components/AltrShardScene.tsx` — superseded hero experiments; raw material for Phase 3.

## Verified invariants (Prompt 002 audit, 2026-07-19, against LEGACY @ `a22927d`)

Citations for the 10 security invariants in `MASTER_CONTEXT.md` § Security
invariants, verified directly against LEGACY code (read-only).

1. **Server-authoritative auth/entitlements** — `lib/supabase/middleware.ts:14`
   (`supabase.auth.getUser()` gate), `lib/billing/entitlements.ts:20,37`
   (`getUserEntitlement`, `requirePlan`). Holds.
2. **Return pages never grant access** — `app/payment/success/page.tsx` and
   `PaymentConfirmation.tsx` do no DB writes (auth-gate + render only);
   confirmed by `tests/security-regression.test.ts:14-17`. The actual
   entitlement mutator is `lib/billing/webhook-handler.ts`. Holds.
3. **Service-role/OpenAI keys server-only** — `lib/env.ts:36-53`
   (`getServerEnv`) vs `lib/env.ts:28-34` (`getPublicEnv`, `NEXT_PUBLIC_`-only
   ); `getServerEnv` is only called from
   `app/api/privacy/deletion-requests/route.ts` and `lib/supabase/admin.ts`,
   never a client component. Holds structurally. **Citation gap found:**
   `MASTER_CONTEXT.md` attributes this guarantee to
   `tests/security-regression.test.ts`, but that file does not reference
   `SERVICE_ROLE_KEY` or `OPENAI_API_KEY` at all — the real enforcement is the
   `NEXT_PUBLIC_` naming convention plus the `lib/env.ts` schema split, not a
   test assertion. Tracked as RISKS.md R12 (MASTER_CONTEXT.md is out of this
   prompt's allowed-files scope to correct directly).
4. **RLS on all user tables** — all 26 `altr_`-prefixed public tables carry
   both `enable row level security` and ≥1 `create policy` in the migrations
   (see the full per-table list below); `supabase/tests/phase_3_rls_verification.sql`
   exists. Holds.
5. **Draft-only, untrusted import content** — `app/api/ai/draft-reply/route.ts:41-47`
   (developer instruction treats imported content as untrusted); no
   `sendMessage`/`/send` pathway exists anywhere under `app/api/`. Holds.
6. **AI output never auto-sent** — same citation as #5, plus
   `tests/security-regression.test.ts:36-39`. Holds.
7. **Raw archives never uploaded** — `app/api/imports/route.ts:28`
   (`rawFileStored: z.literal(false)`). Holds.
8. **Destructive-action confirmation** — `app/api/privacy/account/route.ts:12`
   (literal string `"DELETE MY ACCOUNT"`) plus `:104` (email match +
   `email_confirmed_at` check). Holds.
9. **Safe logging (no secrets/content)** — `lib/security/observability.ts:20`
   (`safeErrorResponse`). Holds.
10. **CSP nonce/HSTS/frame-deny** — `middleware.ts:10-14` (nonce-based CSP),
    `:49` and `:53` (`X-Frame-Options: DENY`), `:56` (HSTS). Holds.

### RLS coverage (all 26 `altr_` tables — full list)

`altr_profiles`, `altr_consents`, `altr_consent_history`, `altr_consent_events`,
`altr_conversation_imports`, `altr_conversations`, `altr_messages`,
`altr_memories`, `altr_memory_sources`, `altr_assistant_configs`,
`altr_assistant_runs`, `altr_draft_replies`, `altr_draft_feedback`,
`altr_subscriptions`, `altr_invoices`, `altr_billing_orders`,
`altr_billing_invoices`, `altr_billing_webhook_events`, `altr_usage_counters`,
`altr_user_preferences`, `altr_deletion_requests`,
`altr_deletion_request_history`, `altr_data_connections`, `altr_audit_logs`,
`altr_audit_events`, `altr_auth_rate_limits` — **all confirmed RLS-enabled
with at least one policy**, including 3 that only show a policy on a
multi-line read (`altr_consent_history`, `altr_billing_webhook_events`,
`altr_auth_rate_limits`) and 15 enabled via the dynamic loop in
`20260714212000_phase_3_rls_indexes_and_triggers.sql:4-7`.

`private.altr_rate_limit_buckets` has no RLS, but lives in the `private`
schema (not exposed via PostgREST/the Supabase client) — consistent with
MASTER_CONTEXT's description, not a gap.

### Traceability gate

Holds — every COMPLETE row already has a non-empty Rebuild prompt, Test
prompt, and Manual-check value. No gaps found.
