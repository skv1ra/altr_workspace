"use client";

import { Header } from "@/components/site/Header";

/**
 * Client-only demo wrapper, same pattern as ControlsDemo/OverlaysDemo/
 * MotionDemo. `Header` is `position: fixed` (it's meant to sit over the
 * whole viewport in real use) — `transform: translateZ(0)` on this
 * wrapper is the standard CSS trick that makes a `position: fixed`
 * descendant position against *this* box instead of the real viewport, so
 * the live preview stays contained inside its frame rather than sticking
 * to the top of the whole styleguide page. Scroll the frame itself to see
 * the 24px backdrop threshold (this prompt's own required behavior) fire
 * for real, and resize the browser through the `lg` (1024px) breakpoint to
 * see the mobile menu trigger appear — raised from the more usual `md`
 * (768px) after real testing found Ukrainian nav labels + the CTA button
 * cramped/wrapping right at 768px; 1024px has real room (verified with a
 * screenshot, see STATUS.md).
 *
 * Auth state is real (`getCurrentProfile()` -> `/api/me`), not mocked —
 * there's no existing override mechanism for it in this repo the way
 * `lib/motion.ts` provides one for reduced motion (and adding one isn't in
 * this prompt's allowed files: `lib/` may only change for i18n copy). In a
 * local dev session with no signed-in Supabase session, this will always
 * show the logged-out state; the signed-in swap is illustrated statically
 * below instead, and should be spot-checked for real once Prompt 025+
 * ships real sign-in.
 */
export function HeaderDemo() {
  return (
    <div className="space-y-6">
      <div
        className="relative h-72 overflow-hidden rounded-lg hairline-top hairline-bottom bg-altr-white"
        style={{ transform: "translateZ(0)" }}
      >
        <Header />
        <p className="absolute inset-x-0 bottom-0 px-6 py-4 text-label uppercase text-text-muted">
          Scroll this frame to see the 24px backdrop threshold
        </p>
      </div>

      <div className="hairline-top hairline-bottom px-6 py-4">
        <p className="text-label uppercase text-text-muted">Signed-in state (static illustration)</p>
        <p className="mt-2 text-body">
          &ldquo;Log in&rdquo; swaps to &ldquo;Dashboard&rdquo; once <code>getCurrentProfile()</code>{" "}
          resolves a real profile — not reproducible here without a real session; verify against a
          live logged-in session once auth screens exist (Prompt 025+).
        </p>
      </div>
    </div>
  );
}
