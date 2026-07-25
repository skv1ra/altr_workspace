-- Run against a disposable Supabase branch or wrap in a transaction.
-- Replace the UUIDs with two existing auth.users IDs.
--
-- Cannot run in CI without real Supabase credentials (no local Postgres
-- instance is available in this environment) — this remains a manual-
-- verification script, run by whoever holds a development Supabase
-- instance's credentials. See docs/claude-prompts/STATUS.md's 047 entry
-- for the run status of this specific extension.
--
-- Prompt 047 extends this from the original 9-table version (2026-07-19)
-- to cover all 26 `altr_` tables named in docs/claude-prompts/
-- MASTER_CONTEXT.md's own "Database (26 tables)" list, cross-checked
-- against every `create policy`/`enable row level security` statement in
-- supabase/migrations/*.sql (not assumed from the table list alone) —
-- see the per-table comments below for which migration each expectation
-- was verified against.

begin;

set local role authenticated;
select set_config('request.jwt.claim.sub', '00000000-0000-4000-8000-000000000001', true);

-- === Owner-scoped tables (RLS restricts to auth.uid() = user_id) ===
-- Every query below should return only rows belonging to the JWT owner
-- above, never another user's rows, when run against a fixture with data
-- for at least two distinct users.

-- 202607130001_production_foundation.sql: profiles_owner_all,
-- consents_owner_select, imports_owner_all, memories_owner_all,
-- drafts_owner_all, subscriptions_owner_select, invoices_owner_select,
-- audit_owner_select.
select count(*) as visible_profiles from public.altr_profiles;
select count(*) as visible_consents from public.altr_consents;
select count(*) as visible_conversation_imports from public.altr_conversation_imports;
select count(*) as visible_memories from public.altr_memories;
select count(*) as visible_draft_replies from public.altr_draft_replies;
select count(*) as visible_subscriptions from public.altr_subscriptions;
select count(*) as visible_invoices from public.altr_invoices;
select count(*) as visible_audit_logs from public.altr_audit_logs;

-- 20260714193000_phase_2_auth_sessions_consents_rate_limits.sql:
-- "Users can read own consent history".
select count(*) as visible_consent_history from public.altr_consent_history;

-- 20260714212000_phase_3_rls_indexes_and_triggers.sql: preferences own
-- all, connections own all, consent events own select, conversations own
-- all, messages own all, memory sources own all, assistant configs own
-- all, assistant runs own all, draft feedback own all (redefined
-- identically in 20260715120000_phase_7_real_altr_twin_ai.sql), billing
-- orders own select, billing invoices own select.
select count(*) as visible_user_preferences from public.altr_user_preferences;
select count(*) as visible_data_connections from public.altr_data_connections;
select count(*) as visible_consent_events from public.altr_consent_events;
select count(*) as visible_conversations from public.altr_conversations;
select count(*) as visible_messages from public.altr_messages;
select count(*) as visible_memory_sources from public.altr_memory_sources;
select count(*) as visible_assistant_configs from public.altr_assistant_configs;
select count(*) as visible_assistant_runs from public.altr_assistant_runs;
select count(*) as visible_draft_feedback from public.altr_draft_feedback;
select count(*) as visible_orders from public.altr_billing_orders;
select count(*) as visible_invoices_billing from public.altr_billing_invoices;

-- 20260714213000_phase_3_service_table_policies.sql: usage counters own
-- select.
select count(*) as visible_usage_counters from public.altr_usage_counters;

-- 20260714212000_phase_3_rls_indexes_and_triggers.sql, later narrowed by
-- 20260715123000_phase_8_data_export_and_deletion.sql (the original
-- "deletion requests own insert" policy was dropped there and never
-- recreated — real writes now go through the service role only, from
-- `app/api/privacy/{account,deletion-requests}` (must-not-change); a
-- direct authenticated-client insert should fail RLS today, verified by
-- the commented-out insert attempt below).
select count(*) as visible_deletion_requests from public.altr_deletion_requests;

-- 20260715123000_phase_8_data_export_and_deletion.sql — ownership is
-- indirect (via a subquery against altr_deletion_requests.user_id), not
-- a direct user_id column on this table itself.
select count(*) as visible_deletion_request_history from public.altr_deletion_request_history;

-- === Service-only tables (deny all to anon/authenticated) ===
-- Every query below must return zero rows to a normal authenticated
-- role, regardless of whose data exists — only the service role (used
-- exclusively by createSupabaseAdminClient() server-side) can read
-- these.

-- 20260714213000_phase_3_service_table_policies.sql: "deny client audit
-- events", "deny client billing webhook events".
select count(*) as visible_webhook_events from public.altr_billing_webhook_events;
select count(*) as visible_audit_events from public.altr_audit_events;

-- 20260714193000_phase_2_auth_sessions_consents_rate_limits.sql: "Deny
-- direct auth rate limit access".
select count(*) as visible_auth_rate_limits from public.altr_auth_rate_limits;

-- `private.altr_rate_limit_buckets` (the 27th table, atomic rate
-- limiting) is intentionally not queried here: it lives in the `private`
-- schema, which PostgREST never exposes to any client role regardless of
-- RLS — there is no client-reachable surface to verify for it, unlike
-- the 26 `public.altr_*` tables above, which PostgREST does expose and
-- therefore genuinely need a policy to gate.

-- Direct billing writes must fail for authenticated clients.
-- savepoint billing_write_test;
-- insert into public.altr_billing_orders (user_id, provider_order_id, plan_id, status)
-- values ('00000000-0000-4000-8000-000000000001', 'rls-test', 'personal', 'paid');
-- rollback to billing_write_test;

-- A direct authenticated insert into altr_deletion_requests must fail
-- RLS today (047's own finding — the insert policy was dropped in
-- phase 8 and never recreated).
-- savepoint deletion_request_write_test;
-- insert into public.altr_deletion_requests (user_id, email, requested_scope, request_type, status, source, verification_state)
-- values ('00000000-0000-4000-8000-000000000001', 'test@example.com', 'all', 'full_account', 'requested', 'authenticated', 'pending');
-- rollback to deletion_request_write_test;

-- Entitlement policy smoke checks use controlled test rows on a disposable branch:
-- on_trial/active => premium
-- cancelled => premium only while ends_at > now()
-- past_due => premium only while past_due_grace_ends_at > now()
-- paused/unpaid/expired => no premium
select * from public.altr_user_entitlement('00000000-0000-4000-8000-000000000001');

rollback;
