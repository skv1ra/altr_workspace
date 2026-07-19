# PROMPT 020 — Hero integration and product section

## Current project state

Hero verified (018) and header built (019). `app/(public)/page.tsx` still
renders the minimal single-line page from Prompt 004.

## Objective

Replace the legacy homepage top with the new header + hero, and build the
`#product` section (what Altr is) — the first two viewports of the new landing.

## Why this task exists

This is the moment the rebuild becomes visible. Isolating integration from hero
construction keeps regressions attributable.

## Dependencies

018, 019.

## Files to inspect first

- WORKSPACE: `app/(public)/page.tsx`, `components/hero/HeroScene.tsx` API,
  `components/site/Header.tsx`
- LEGACY (reference): `app/page.tsx` and its sections — content the landing
  covered before, so nothing communicated there is silently lost
- LEGACY `tests/e2e/critical-flows.spec.ts` (homepage-dependent blocks to port)

## Files allowed to change

- `app/(public)/page.tsx` (build the real landing), landing structure
- `components/site/` (ProductSection.tsx create)
- `tests/e2e/` (port + adapt the LEGACY homepage blocks)
- `lib/i18n/home-copy.ts` (ported in 004 — new EN/UA strings)
- `docs/claude-prompts/STATUS.md`, `INDEX.md`

(Note: the legacy hero components named in the original in-place plan were
never ported into WORKSPACE — no deletion needed; they remain only in the
read-only LEGACY checkout.)

## Files that must not be changed

`app/api/`, `lib/` (other than i18n), `supabase/`, other pages.

## Implementation instructions

1. Build the landing top in `app/(public)/page.tsx`: Header + HeroScene
   (server-rendered copy) + `#product` section. Content the LEGACY landing
   communicated that is not yet re-covered must be re-covered by 021–022
   within this phase — keep the ledger in STATUS.md.
2. `#product` section: editorial explanation of Altr (imports → memory → Twin
   drafts) in the new type system; one restrained visual (e.g. a single quiet
   shard with a fragment) — no card grid, no icon rows.
3. CTA wiring: "Create your Altr" → `/auth?mode=register`; "How it works" anchor
   scrolls smoothly (respecting reduced motion).
4. Verify every header anchor resolves; no dead links.
5. Port the LEGACY homepage e2e blocks into the WORKSPACE suite and adapt
   selectors to roles/testids. `yarn check` + `yarn test:e2e`.

## Visual requirements

The fold must match the approved `/hero-lab` composition exactly; the product
section continues the fog atmosphere without competing with the hero.

## Security and privacy requirements

- No product claims beyond implemented features (no roadmap promises —
  FEATURE_PARITY_MATRIX "Roadmap only" list).

## Edge cases

- Users landing at `/#product` directly (anchor pre-scroll) — layout settled,
  no CLS jump.
- e2e homepage tests under `ALTR_E2E_MOCKS`.

## Acceptance criteria

- [ ] New homepage fold live with hero + header; `/hero-lab` parity confirmed.
- [ ] Product section complete with truthful copy (EN + UA).
- [ ] Zero dead links/anchors.
- [ ] `yarn check` and `yarn test:e2e` pass.

## Verification commands

- `yarn check`
- `yarn test:e2e`

## Manual verification

Full homepage walkthrough desktop + mobile emulation; JS-disabled render;
screenshot for report.

## Required tests

Updated homepage e2e; RTL for ProductSection copy rendering.

## Completion report

Report: sections shipped/removed, deleted files list with importer proof,
selector migrations, command results.

## Git checkpoint

`feat(site): integrate hero and product section`

## Status update

Update `STATUS.md` (homepage = rebuilt; removed-content ledger) and INDEX 020 row.
