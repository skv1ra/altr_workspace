# Prompt index

Columns: Impl = implementation status, Verif = verification status, MR = manual review
required. Statuses: `todo` / `in-progress` / `done` / `failed` / `blocked`.

Repository model: every prompt executes inside `skv1ra/altr_workspace` (the new
application, built from scratch); `skv1ra/altrtest2` is read-only legacy
reference (see MASTER_CONTEXT § Repository model). All commits below target
altr_workspace only.

| # | Title | Phase | Purpose | Deps | Complexity | Impl | Verif | MR | Suggested commit message |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| 001 | Workspace and legacy baseline | 0 | Verify repo wiring; record baselines of workspace and legacy reference | — | S | done | done | no | `docs: record workspace and legacy baseline` |
| 002 | Parity and security audit verification | 0 | Independently verify FEATURE_PARITY_MATRIX claims against the legacy checkout | 001 | M | done | done | no | `docs: verify feature parity and security audit` |
| 003 | Repository wiring and reference assets | 0 | Pin legacy audit SHA, verify remotes, commit reference assets | 002 | S | done | done | yes | `chore: pin legacy reference and commit hero assets` (committed locally only, not pushed per user instruction) |
| 004 | Workspace scaffold and backend port | 1 | Scaffold the Next.js app; port proven backend, migrations, non-UI tests, CI | 003 | L | todo | todo | no | `feat: scaffold workspace and port proven backend` |
| 005 | Design token foundation | 1 | tokens.css + Tailwind mapping + font pipeline | 004 | M | done | done | no | `feat(design): add Altr design token foundation` |
| 006 | Application shell and boundaries | 1 | New root layout, error/loading boundaries, route groups | 005 | M | done | done | no | `feat(app): new application shell with boundaries` |
| 007 | Typography and spacing | 2 | Type scale, prose styles, spacing rhythm | 006 | M | done | done | yes | `feat(design): typography and spacing system` |
| 008 | Color, materials, surfaces | 2 | Obsidian/fog/paper surface primitives | 007 | M | done | done | yes | `feat(design): material and surface system` |
| 009 | Buttons, inputs, forms | 2 | Core interactive primitives | 008 | M | done | done | yes | `feat(design): core form and button primitives` |
| 010 | Dialogs, overlays, a11y states | 2 | Modal/toast/menu + focus/keyboard system | 009 | M | done | done | yes | `feat(design): overlay components and a11y states` |
| 011 | Motion system | 2 | Motion tokens, Reveal, reduced-motion rules | 010 | M | done | done | yes | `feat(design): motion system with reduced-motion` |
| 012 | Hero technical prototype | 3 | Prove ADR-007 hybrid approach or amend it | 011 | L | done | done | yes | `feat(hero): hybrid hero technical prototype` |
| 013 | Shard asset pipeline | 3 | Generate/optimize final shard + DOF assets | 012 | L | done | done | yes | `feat(hero): production shard asset pipeline` |
| 014 | Hero scene composition | 3 | Fog, layers, lighting, shadows, composition | 013 | L | done | done | yes | `feat(hero): cinematic scene composition` |
| 015 | Memory fragment content | 3 | Voice memo, excerpts, dates inside shards | 014 | M | done | done | yes | `feat(hero): memory fragment content overlays` |
| 016 | Hero pointer and scroll motion | 3 | Parallax, drift, scroll choreography | 015 | M | done | done | yes | `feat(hero): pointer and scroll motion` |
| 017 | Hero fallbacks and loading | 3 | Mobile, reduced-motion, no-JS, zero-CLS loading | 016 | M | done | done | yes | `feat(hero): fallbacks and loading strategy` |
| 018 | Hero performance verification | 3 | FPS, asset budget, CLS measurements | 017 | M | done | done | yes | `perf(hero): verify hero performance budget` |
| 019 | Public header and navigation | 4 | Premium fixed header, mobile menu | 011 | M | done | done | yes | `feat(site): premium public header` |
| 020 | Hero integration and product section | 4 | Landing top: hero + product explanation | 018,019 | M | done | done | yes | `feat(site): integrate hero and product section` |
| 021 | How-it-works and memory demo | 4 | Editorial process + memory demonstration | 020 | M | done | done | yes | `feat(site): how-it-works and memory demo` |
| 022 | Twin demo and privacy section | 4 | Draft demo + security/privacy explanation | 021 | M | done | done | yes | `feat(site): twin demo and privacy section` |
| 023 | Pricing page | 4 | Free/Personal/Work pricing, checkout entry | 022 | M | done | done | yes | `feat(site): premium pricing page` |
| 024 | Footer, legal restyle, SEO, mobile | 4 | Footer, legal pages skin, metadata, polish | 023 | M | done | done | yes | `feat(site): footer, legal restyle and SEO` |
| 025 | Auth screens redesign | 5 | Login/register in new visual system | 011 | M | done | done | yes | `feat(auth): redesigned auth screens` |
| 026 | Recovery, reset, callback | 5 | Forgot/reset pages + callback + Google entry | 025 | M | done | done | yes | `feat(auth): recovery and callback flows` |
| 027 | Protected routes and sign-out | 5 | Route guards, session UX, sign-out | 026 | S | done | done | no | `feat(auth): protected routing and sign-out UX` |
| 028 | Auth tests and polish | 5 | Component + e2e coverage, edge polish | 027 | M | done | done | no | `test(auth): auth flow coverage and polish` |
| 029 | Dashboard shell | 6 | Authenticated layout, nav, user state | 027 | L | done | done | yes | `feat(app): premium dashboard shell` |
| 030 | Profile and settings | 6 | Profile surface, settings structure | 029 | M | done | done | yes | `feat(app): profile and settings surfaces` |
| 031 | Onboarding and quota display | 6 | New onboarding flow + entitlement/quota UI | 030 | M | done | done | yes | `feat(app): onboarding and quota display` |
| 032 | Import experience redesign | 7 | Picker, drag-drop, provider guidance | 029 | L | done | done | yes | `feat(import): redesigned import experience` |
| 033 | Import progress, cancel, retry | 7 | Progress, cancellation, duplicates, extraction | 032 | M | done | done | yes | `feat(import): progress and recovery flows` |
| 034 | Import history and errors | 7 | History list, provenance, error states | 033 | M | done | done | yes | `feat(import): history and error states` |
| 035 | Import tests | 7 | Parser matrix + e2e verification | 034 | M | done | done | no | `test(import): full import flow coverage` |
| 036 | Memory overview redesign | 8 | List, search, filters, pagination | 029 | M | done | done | yes | `feat(memory): redesigned memory overview` |
| 037 | Memory editing and provenance | 8 | Create/edit/disable/delete + provenance | 036 | M | done | done | yes | `feat(memory): editing and provenance UX` |
| 038 | Memory quotas and tests | 8 | Quota surfaces + memory test coverage | 037 | S | done | done | no | `test(memory): quotas and coverage` |
| 039 | Twin configuration redesign | 9 | Twin identity/style configuration | 029 | M | done | done | yes | `feat(twin): redesigned twin configuration` |
| 040 | Draft reply interface | 9 | Generate/review/copy/regenerate/history | 039 | L | done | done | yes | `feat(twin): draft reply interface` |
| 041 | Twin security and tests | 9 | Injection defense, quotas, error coverage | 040 | M | done | done | no | `test(twin): security and draft coverage` |
| 042 | Billing overview redesign | 10 | Status, invoices, portal in new system | 029,023 | M | done | done | yes | `feat(billing): redesigned billing overview` |
| 043 | Checkout and payment returns | 10 | Checkout entry + success/cancel/receipt | 042 | M | done | done | yes | `feat(billing): checkout and return pages` |
| 044 | Billing regression tests | 10 | Webhook/entitlement/e2e verification | 043 | M | done | done | no | `test(billing): regression coverage` |
| 045 | Privacy center redesign | 11 | Consents, export, deletion in one surface | 029 | M | done | done | yes | `feat(privacy): unified privacy center` |
| 046 | Accessibility and legal audit | 11 | WCAG pass + legal placeholder verification | 045,024 | M | done | done | yes | `fix(a11y): accessibility and legal audit fixes` |
| 047 | Unit/integration test expansion | 12 | Close coverage gaps incl. RLS/isolation | tracks done | L | done | done | no | `test: expand unit and integration coverage` |
| 048 | E2E flow update | 12 | Full mocked e2e across rebuilt screens | 047 | M | todo | todo | no | `test(e2e): rebuilt critical flows` |
| 049 | Visual QA pass | 12 | Reference comparison across all surfaces | 048 | L | todo | todo | yes | `fix(design): visual QA corrections` |
| 050 | Performance and Web Vitals | 12 | LCP/CLS/INP, bundle and asset budgets | 049 | M | todo | todo | yes | `perf: meet performance budgets` |
| 051 | Production deployment and smoke | 12 | Env verify, deploy, smoke test, rollback drill | 050 | M | todo | todo | yes | `chore(release): production deployment verification` |
