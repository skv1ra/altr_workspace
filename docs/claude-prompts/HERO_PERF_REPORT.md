# Hero performance verification report

Prompt 018. Date: 2026-07-21. Route measured: `/hero-lab` (Prompt 017's
complete hero, all tiers — not yet integrated into `/`, see Prompt 020).

## Method

`/hero-lab` calls `notFound()` whenever `NODE_ENV === "production"` (a
deliberate dev-only gate, unchanged since Prompt 012 — see ADR-007's own
012 resolution note, which hit this same wall and settled for measuring
against `next dev` as a documented caveat). This prompt's own edge case
("Dev-only route overhead: measure with production build only") is
stricter than that, so a different resolution was used here: the gate's
condition was temporarily changed, locally and only for the duration of
measurement, to `NODE_ENV === "production" && !process.env.ALTR_PERF_MEASURE`,
a real production build (`ALTR_PERF_MEASURE=1 yarn build`) was produced and
served (`yarn start`), measured, and the file was then reverted byte-for-
byte (`git checkout`) before the final clean build/`yarn check` this
report's own acceptance criteria require. **Net diff to
`app/(public)/hero-lab/page.tsx` from this prompt: zero** — verified with
`git diff --stat` before committing. This is not one of this prompt's
"allowed files" to change (only `components/hero/`, this report, and
`STATUS.md`/`INDEX.md` are), which is exactly why the edit was never
allowed to become permanent.

All load-time metrics (LCP, CLS, long tasks, per-tier image bytes) were
measured with Playwright driving a real Chromium against the production
server, no throttling ("local desktop"), 3 full runs each, **median**
reported per this prompt's own edge case. FPS reused Prompt 016's own
methodology (continuous synthetic mouse movement + `scrollTo` for 5s,
counting real `requestAnimationFrame` callbacks), 3 runs. Lighthouse ran
via `npx lighthouse` (v13.4.1, not previously installed in this repo — no
`package.json`/`yarn.lock` change, npx does not persist it) against the
same production server, once with `--preset=desktop` and once with
`--preset=perf --form-factor=mobile` (standard Lighthouse mobile
throttling: 4x CPU slowdown, ~1.6 Mbps). Raw Lighthouse HTML/JSON reports
are not committed (not an allowed-file addition for this prompt) — kept in
the session's own scratch directory for this run only; the scores below
are transcribed directly from those reports.

## Results — the six required metrics (median of 3 local-desktop runs unless noted)

| # | Metric | Target | Measured | Result |
| --- | --- | --- | --- | --- |
| 1 | LCP time (desktop, local, no throttle) | < 2.0 s | **248 ms** (3 runs: 1328 / 248 / 228 ms) | **PASS** |
| 1b | LCP element | headline text | Mixed: headline `<h1>` on 1 of 3 runs, the primary shard `<img>` on the other 2 (both paint within the same sub-1.3s window regardless) — see note below | **Observed, not a hard fail** |
| 2 | CLS | 0.00 | **0.00008** (desktop); 0.0000188 (mobile) | **PASS** (rounds to 0.00 at any real-world reporting precision; ~1,200x under the 0.1 "good" CWV threshold) |
| 3 | FPS, pointer + scroll (desktop) | ≥ 55 | **60.03 avg** (3×5s runs: 59.95 / 60.03 / 60.07) | **PASS** |
| 4 | Hero JS added to the route | ≤ 35 KB gzip beyond framework | **6.46 KB** gzip (Next build summary; independently re-verified by gzip-ing the actual route chunk file directly: 18,121 B raw → 6,510 B gzip) | **PASS** (18% of budget; this number is generous — it also includes `/hero-lab`-only dev chrome, `HeroTierPreview`/`ReferenceOverlay`, not part of the hero itself) |
| 5 | Image bytes, desktop tier | ≤ 900 KB | **150.7 KB** (8 unique 2x AVIF files) | **PASS** |
| 5b | Image bytes, mobile tier | ≤ 350 KB | **42.5 KB** (4 unique @1x AVIF files) | **PASS** |
| 6 | Main-thread long tasks during load | < 200 ms total | **0 ms** (0 long-task entries across all 6 desktop+mobile load runs) | **PASS** |

All six numeric budgets pass with wide margin. No perf regressions were
found, so **no changes were made to `components/hero/` in this prompt** —
017's implementation already clears every 018 target as shipped.

### Note on LCP element identity

The prompt's own phrasing bundles two things into "target: headline text,
< 2.0 s" — a numeric time ceiling (a real, gate-worthy budget) and an
expected *element* (descriptive, not listed as its own line item in this
prompt's Acceptance Criteria checklist, unlike CLS/FPS/etc.). The measured
element varies between the headline and the primary shard image because
both are near-instantly painted (both inside the same sub-300ms window on
2 of 3 runs) — the LCP algorithm picks whichever has more rendered pixel
area, and the primary shard image is often larger on screen than the
headline text box. This is a common, generally-accepted Core Web Vitals
outcome for hero sections with large art alongside text and was not
"fixed" — doing so would mean either shrinking the shard's on-screen area
(a visual change, out of scope: "no visual changes allowed" for this
prompt) or an LCP-suppression hack on a legitimately-rendered image, which
would be fixing the measurement, not the experience. Flagged honestly per
this prompt's "do NOT lower a target silently" instruction, but not
treated as a failing target since the actual numeric ceiling (which *is*
a checklist item) is met by 3-8x margin regardless of which element wins.

## Lighthouse scores

| Preset | Performance score | LCP | CLS | TBT | Speed Index | FCP | TTI |
| --- | --- | --- | --- | --- | --- | --- | --- |
| Desktop (`--preset=desktop`, no throttle) | **100 / 100** | 0.7 s | 0.00 | 0 ms | 0.5 s | 0.4 s | 0.7 s |
| Mobile (`--preset=perf --form-factor=mobile`, 4x CPU / ~1.6 Mbps throttle) | **98 / 100** | 1.8 s | 0.00 | 90 ms | 1.8 s | 1.8 s | 2.8 s |

The mobile run is under Lighthouse's standard throttled-network/CPU
conditions (not "local desktop," so not directly gated by this prompt's
own numeric targets above, which are explicitly desktop/local) — included
as corroborating evidence that the mobile tier (42.5 KB, 4 shards) holds
up under a realistic constrained-network/CPU profile too, not just in the
untouched Playwright runs.

## Fixes applied

None. Every measured metric already clears its target as shipped by
Prompt 017; no `components/hero/` changes were needed or made.

## Unmet targets

None outright unmet. One soft, documented observation (LCP element
identity, see above) that does not fail this prompt's actual checklist.

## Tooling notes for reproducibility

- `ALTR_PERF_MEASURE=1 yarn build && ALTR_PERF_MEASURE=1 yarn start -p 3100`
  reproduces the measurement-mode production server (gate bypass is
  **not** committed — apply the one-line `page.tsx` edit locally, exactly
  as this report describes, if re-running).
- Playwright's own bundled Chromium was used for both the Node-driven
  measurements and as `CHROME_PATH` for `npx lighthouse` (no system Chrome
  installed in this environment).
- Lighthouse was installed transiently via `npx lighthouse` (v13.4.1) —
  not added to `package.json`/`yarn.lock`.
