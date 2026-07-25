# Accessibility audit (Prompt 046)

Closes Phase 11. Structured, evidence-based audit of every rebuilt screen
plus legal/consent surface verification. Methodology: static/structural
source review (heading hierarchy, landmarks, ARIA, focus management,
label association, contrast via the existing token math, reduced-motion
and forced-colors CSS coverage) across every rebuilt component and page —
not a substitute for a live screen-reader/keyboard/High-Contrast device
pass, which remains a manual follow-up (see "Manual verification
remaining" at the end, matching this project's own established precedent
for Phase 3's hero manual-verification items).

`tests/phase11-ux-a11y.test.ts` (LEGACY's own "existing baseline",
pinned `a22927d`) was read in full and found to assert against files
this rebuild replaced entirely (`components/Navigation.tsx`,
`components/HeroOrb.tsx`, `components/Reveal.tsx`, `app/page.tsx`'s
`homeCopy`) — none exist in this workspace. Not ported verbatim; its
intent (accessible mobile menu, locale sync, no fake social links,
reduced motion + focus-visible) is instead covered by real, already-
passing suites against the current file set (`smoke.spec.ts`'s mobile
menu e2e test, `tests/components/contrast.test.ts`, the new
`tests/unit/a11y-regression.test.ts` below) rather than one dead file.

## Findings log

Severity: **Critical** (blocks a task for AT/keyboard users) / **Serious**
(major AT/keyboard friction) / **Minor** (cosmetic or narrow-impact).

| # | Screen / area | Finding | Severity | Status |
| --- | --- | --- | --- | --- |
| 1 | Dashboard (`DashboardHome.tsx`) | Page's own greeting — its *only* heading, per `AppShell.tsx`'s own doc comment — was a `<p className="text-h1">`, not a real `<h1>`. Zero headings existed on `/dashboard` for screen-reader heading-navigation. | **Serious** | **Fixed** — real `<h1>`; `emptyAccountTitle` (the alternate empty-state message) changed from `<p className="text-h3">` to `<h2>` for the same reason. Regression-tested (`DashboardHome.test.tsx`). |
| 2 | Settings (`SettingsView.tsx`) | Same bug: `<p className="text-h1">` instead of `<h1>` — `/settings`'s only heading was invisible to heading navigation. | **Serious** | **Fixed** — real `<h1>`. Regression-tested (`SettingsView.test.tsx`). |
| 3 | Account deletion ceremony (`AccountDeletionSteps.tsx`, 045) | "Account deleted." success-state title was `<p className="text-h4">`, not a heading, inside a `Dialog` whose own `<h2>` title stays static across steps ("Delete your Altr account permanently?"). | Minor | **Fixed** — real `<h3>` (correctly nested under the Dialog's own `<h2>`). Regression-tested. |
| 4 | Public deletion-request form (`DeletionRequestForm.tsx`, 045) | Same pattern: "Request recorded." success title was `<p className="text-h4">`. | Minor | **Fixed** — real `<h2>` (this component isn't inside a Dialog; sits directly under `DeletionCenter`'s own `<h1>`). Regression-tested. |
| 5 | Windows High Contrast (`forced-colors`) | Zero `forced-colors` media-query coverage anywhere in `app/styles/*.css` before this prompt. The custom checkbox (`Checkbox.tsx`) survives by accident — its check/indeterminate mark is a conditionally-*rendered* SVG, not a color-only signal, so forced-colors (which only recolors, never removes DOM nodes) can't hide the real signal. The cookie-preferences functional toggle (`role="switch"`, 045) is weaker: its knob relies partly on its own background for a visible shape once forced-colors neutralizes the arbitrary track background. | Serious (real AT-adjacent user group; narrow surface) | **Fixed** — `app/styles/controls.css` now gives `[role="switch"] > span[aria-hidden]` an explicit `border: 1px solid CanvasText` under `@media (forced-colors: active)`, on top of the pre-existing, unaffected knob-position signal (`left` is a layout property, never touched by forced-colors). Regression-tested (`a11y-regression.test.ts`). Live Windows High Contrast device verification still recommended (see below) — this fix is reasoned from spec behavior, not observed on a real device. |
| 6 | Privacy center (`PrivacyCenter.tsx`, 045) | Legal verification instruction #3 ("legal pages linked from... relevant flows"): the in-app privacy center never linked to `/terms`, `/privacy`, `/cookies`, `/data-deletion`, or the cookie-preferences dialog — LEGACY's old `PrivacySettingsPanel` had exactly this "Policy versions"/"Cookie preferences" section; the rebuilt center dropped it. | Serious (legal-consistency requirement, not purely an a11y one) | **Fixed** — new "Legal documents" `<h2>` section with real links to all four documents plus a `CookiePreferencesButton` trigger. Regression-tested (`PrivacyCenter.test.tsx`), plus a durable cross-file consistency test (`tests/phase10-legal-consistency.test.ts`, adapted from LEGACY's own version — see below). |
| 7 | Documentation accuracy (STATUS.md/RISKS.md, from 045) | While auditing the real, mounted cookie banner, found LEGACY actually *does* have one — `components/CookieBanner.tsx`, imported and rendered in LEGACY's `app/layout.tsx` — a different file from the genuinely-unmounted `components/legal/CookieConsent.tsx`/`CookiePreferencesButton.tsx` this workspace ported in 045. 045's own STATUS.md/RISKS.md prose said LEGACY "never mounted this component anywhere," which is true only for the specific files ported, not for LEGACY's cookie-consent *mechanism* as a whole (which was real and live, via a different, simpler, single-surface component using the identical `cookie-store.ts` calls). | N/A (documentation-accuracy correction, not a code defect) | **Corrected** — see STATUS.md's 046 entry for the full correction; 045's actual code/behavior needed no change, since the ported `CookieConsent.tsx` is functionally equivalent (same `getCookiePreferences`/`saveCookiePreferences`/event-name contract) to LEGACY's real `CookieBanner.tsx`, just a restyled two-step (banner + `Dialog`) shape instead of LEGACY's one-surface `role="dialog"` shape. Both are valid, accessible ARIA patterns. |
| 8 | Navigation/app shell (`AppNav.tsx`, `Header.tsx`, `Footer.tsx`) | Reviewed for landmark structure, `aria-current`, `aria-expanded`, mobile-sheet focus trap, desktop/mobile DOM exclusivity (`display: none`, not just visual hiding — confirmed no duplicate-landmark risk). | — | **Verified, no defect found.** Already correctly built (010/019/024/039). |
| 9 | Hero fragments (`HeroFragments.tsx`, `HeroScene.tsx`) | Reviewed the explicit "screen-reader pass on hero fragments" instruction target. All decorative visual shard/fragment layers are `aria-hidden`; the real memory-fragment content has its own `sr-only role="group" aria-label="Examples of remembered moments"` text alternative, plus a genuine text alternative for the waveform (not just an `aria-label` echo). | — | **Verified, no defect found.** Already correctly built (016/017). |
| 10 | Import lifecycle (`ImportFlow.tsx`, `StageRail.tsx`) | Reviewed the explicit "screen-reader pass on import lifecycle" instruction target. `StageRail` (the four-node visual progress rail) is `aria-hidden="true"` — verified this is *correct*, not a bug: the real, stage-differentiated progress text lives in a sibling `<p role="status">` (or `role="alert"` on failure), so a screen-reader user gets the same information through a real live region instead of a duplicate, non-live-announced node list. | — | **Verified, no defect found.** |
| 11 | Draft view (`TwinDraftWorkspace.tsx`) | Reviewed the explicit "screen-reader pass on draft view" instruction target. Pending/error states use `role="status"`/`role="alert"` correctly. | — | **Verified, no defect found.** |
| 12 | Deletion ceremony (`AccountDeletionDialog.tsx`/`AccountDeletionSteps.tsx`, 045) | Reviewed the explicit "screen-reader pass on... deletion ceremony" instruction target. Real `<label>`-associated `TextField`s for email/phrase/reason, `role="alert"` on every real error path (stale session, email mismatch, rate limit, generic), typed-phrase gate exactly mirrors the already-audited `ConfirmDialog` pattern. Heading nesting fixed per finding #3 above. | — | **Verified** (one Minor finding fixed, #3). |
| 13 | Color contrast | `tests/components/contrast.test.ts` (008) already verifies the core token pairs (graphite-on-white body text, white-on-obsidian, mist-on-obsidian muted text, and the composited `--text-muted`-on-white value) against WCAG AA 4.5:1 for body text — re-run and still passing. Swept every component for LEGACY-style raw low-contrast opacity classes (`text-white/N`, `text-black/N`) — zero found; every rebuilt component consistently uses the vetted token classes. Now pinned as a permanent regression guard (`a11y-regression.test.ts`). | — | **Verified, no defect found.** New regression guard added. |
| 14 | Images / `alt` text | Zero raster `<img>`/`next/image` usage exists anywhere except `HeroLayers.tsx`'s `<picture>`/`<img>` shard chain, which already has `alt=""` (correctly decorative — verified against its own documented zero-CLS/art-direction rationale). Now pinned as a permanent regression guard. | — | **Verified, no defect found.** New regression guard added. |
| 15 | Reduced motion | `prefers-reduced-motion` is honored in `motion.css`, `controls.css`, `materials.css`, and `overlays.css` (four separate, correctly-scoped rules — buttons, dialogs/toasts/menus, materials, and the dedicated motion system all degrade independently). Re-verified present, not re-tested behaviorally (already covered by Phase 3's own manual-verification items). | — | **Verified present**, unchanged from prior prompts. |
| 16 | Zoom 200% / 320px reflow | Not independently re-verified this session — this project's own established precedent (STATUS.md, "Phase 3's manual-verification gaps (014-018)") already treats zoom/reflow and other rendered-viewport checks as manual, device-dependent verification outside what static source review can confirm. No fixed-`px` container-width smell found in a targeted grep of the newest (043-045) components, but this is not equivalent to a real 200%-zoom pass. | — | **Deferred — manual verification** (see below), consistent with existing precedent, not a new gap this prompt introduces. |

## Legal verification

- **`legal-config.ts` placeholder inventory** (23 unresolved `[NEEDS OWNER
  INPUT: ...]` values, enumerated by direct read, not assumed):
  `LEGAL_ENTITY_NAME`, `COMPANY_COUNTRY`, `REGISTERED_ADDRESS`,
  `COMPANY_REGISTRATION_NUMBER`, `PRIVACY_EMAIL`, `SUPPORT_EMAIL`,
  `DPO_CONTACT`, `GOVERNING_LAW`, `DISPUTE_JURISDICTION`,
  `REFUND_POLICY`, `SUBSCRIPTION_RENEWAL_POLICY`,
  `PROMOTIONAL_PRICING_POLICY`, `LIABILITY_CAP`, `MINIMUM_AGE`,
  `INTERNATIONAL_TRANSFER_MECHANISM`, `DATA_RETENTION_PERIOD`,
  `BACKUP_RETENTION_PERIOD`, `AVAILABLE_IN_EEA`, `AVAILABLE_IN_UK`,
  `AVAILABLE_IN_UKRAINE`, `AVAILABLE_IN_USA`, `AVAILABLE_IN_CALIFORNIA`,
  `AI_TRAINING_ON_USER_DATA`, `AVAILABLE_REGIONS`. All 23 are genuine
  owner/legal-review action items — read in full from
  `docs/LEGAL_LAUNCH_CHECKLIST.md` at LEGACY's pinned `a22927d` (that
  file itself is outside this prompt's own allowed-files list to port —
  not in `docs/claude-prompts/`, not listed — so it stays LEGACY-only;
  its guidance is instead summarized in STATUS.md's own "legal
  user-action items" note for the user). None were invented or resolved
  with guesses, per that checklist's own explicit instruction not to.
- **Consent version display consistency**: `ConsentsSection.tsx` (045)
  displays `profile.consents.policyVersion` — the value the server
  actually recorded (`GET /api/me`) — never a separately hardcoded
  duplicate of `LEGAL_CONFIG.PRIVACY_POLICY_VERSION`, so it can never
  drift from what was truly consented to.
- **Legal pages linked from footer + relevant flows**: Footer already
  links `/privacy`, `/terms`, `/cookies`, and the cookie-preferences
  dialog (024). The privacy center did not (finding #6, fixed).
- **`tests/phase10-legal-consistency.test.ts`** (LEGACY-only, pinned
  `a22927d`): read in full, not ported verbatim — it asserted against
  `components/CookieBanner.tsx` and `components/legal/
  PrivacySettingsPanel.tsx`, both gone in this rebuild. Adapted with the
  same assertions in spirit against the real current files
  (`CookieConsent.tsx`, `ConsentsSection.tsx`, `ExportSection.tsx`,
  `useAccountDeletion.ts`, `DeletionRequestForm.tsx`) — 6/6 passing.

## Findings statistics

- 16 areas audited.
- 6 real findings (2 Serious — missing `<h1>` on `/dashboard` and
  `/settings`; 1 Serious/narrow — forced-colors toggle visibility; 1
  Serious — privacy-center legal-linking gap; 2 Minor — non-heading
  success titles).
- 1 documentation-accuracy correction (LEGACY's real cookie banner was
  misattributed in 045's own STATUS.md/RISKS.md prose).
- 6 areas explicitly named by this prompt's own instructions
  (navigation, hero fragments, import lifecycle, draft view, deletion
  ceremony, contrast) verified with no defect found — already correctly
  built by their own originating prompts.
- 0 findings deferred without a fix, except the explicitly-manual zoom/
  reflow and live-device (NVDA/VoiceOver/Narrator, real Windows High
  Contrast) verification, both consistent with this project's own
  established manual-verification precedent, not new debt this prompt
  introduces.
- 4 new durable regression tests added:
  `tests/unit/a11y-regression.test.ts` (low-contrast-class guard,
  forced-colors CSS guard, `role="switch"` labeling guard, `alt=`
  guard), plus heading-role assertions folded into
  `DashboardHome.test.tsx`, `SettingsView.test.tsx`,
  `AccountDeletionDialog.test.tsx`, `DeletionRequestForm.test.tsx`, and
  a new `PrivacyCenter.test.tsx` covering heading hierarchy and the new
  legal-links section.

## Manual verification remaining (user/device-dependent, not automatable here)

- One complete keyboard-only journey (land → register (mock) → onboard
  → import → memory → draft → billing → privacy → sign out) — every
  interactive element reviewed this session is a real `<button>`/`<a>`/
  native form control with visible `:focus-visible` styling and no
  custom click-only `<div>`s found anywhere, but an actual keyboard-only
  run was not performed live.
- Live screen-reader pass (NVDA/VoiceOver/Narrator) on the five named
  surfaces — structurally verified (see findings #9-12 above); a live
  AT pass would still be the authoritative check.
- Live Windows High Contrast (`forced-colors: active`) pass — the
  fix in finding #5 is reasoned from the CSS forced-colors spec, not
  observed on a real high-contrast Windows session.
- 200% browser zoom and 320px-width reflow, on real rendered pages.
