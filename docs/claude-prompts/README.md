# Altr rebuild — Claude Code prompt pack

This directory contains the complete, sequential prompt pack for rebuilding Altr with a
new premium visual identity while preserving every completed legacy feature.

## How to use

1. Read `MASTER_CONTEXT.md` first. Every prompt assumes its rules.
2. Execute prompts strictly in numeric order unless `DEPENDENCY_GRAPH.md` says a prompt
   is independent.
3. To run a prompt, open a fresh Claude Code session and say, for example:
   `RUN PROMPT 001` — then paste (or let Claude Code read) `PROMPT_001_*.md`.
4. After each prompt, verify the acceptance criteria and confirm `STATUS.md` was updated.
5. Never mark a prompt complete if its verification commands fail.

## Files

| File | Purpose |
| --- | --- |
| `MASTER_CONTEXT.md` | Shared context, stack, security invariants, conduct rules |
| `FEATURE_PARITY_MATRIX.md` | Audit of every legacy feature with status and evidence |
| `ARCHITECTURE_DECISIONS.md` | Binding architecture decisions with alternatives and risks |
| `DESIGN_DIRECTION.md` | Art direction derived from the hero reference image |
| `DEPENDENCY_GRAPH.md` | Which prompts are sequential vs. independent |
| `INDEX.md` | Table of all prompts with status columns |
| `STATUS.md` | Live project status — updated by every prompt |
| `RISKS.md` | Highest technical risks and mitigations |
| `PROMPT_001…051` | The implementation prompts, one focused session each |

## Phases

- Phase 0 (001–003): audit and safety
- Phase 1 (004–006): new project foundation
- Phase 2 (007–011): design system
- Phase 3 (012–018): cinematic hero
- Phase 4 (019–024): public website
- Phase 5 (025–028): authentication
- Phase 6 (029–031): user foundation
- Phase 7 (032–035): conversation import
- Phase 8 (036–038): memory
- Phase 9 (039–041): Altr Twin and AI drafts
- Phase 10 (042–044): billing
- Phase 11 (045–046): privacy, legal, account controls
- Phase 12 (047–051): quality, security, deployment

## Ground rules (apply to every prompt)

- The new application is built **from scratch in this repository**
  (`skv1ra/altr_workspace`, branch `main`). All commits and pushes target this
  repository only (see ADR-001 and MASTER_CONTEXT § Repository model).
- The previous implementation (`skv1ra/altrtest2`, local read-only checkout at
  `C:\Users\golyb\altrtest2`, pinned at `a22927d`) is inspection-only reference
  material. Never modify, commit to, or push to it.
- Proven backend behavior — API routes, `lib/` domain logic,
  `supabase/migrations/`, the import worker, and non-UI tests — is carefully
  ported from the legacy repo into this one (bulk port in Prompt 004). The
  legacy frontend is never copied; every screen is designed and built new.
- No completed legacy feature may be silently omitted (parity matrix gate).
- Supabase migrations are ported verbatim and append-only thereafter. RLS is
  never weakened.
- Paid access activates only via the verified Lemon Squeezy webhook.
- Raw import archives never leave the browser.
- AI output is always a reviewable draft; nothing is auto-sent.
- No placeholder UI, dead buttons, or fabricated test results.
