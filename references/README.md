# references/

## `altr-hero-reference.png`

**What it is:** the target visual direction for the rebuilt marketing hero —
light silver fog, dark obsidian glass shards with white shatter-crack
networks, heavy foreground/background depth-of-field, a focal shard etched
with a memory fragment (`MAY 17, 2018 · VOICE MEMO · excerpt · 0:23
waveform`), minimal nav (Product / How it works / Pricing / Log in), the
two-line headline "Your past learns / to remain.", the support line, and an
obsidian "Create your Altr" CTA. See `docs/claude-prompts/DESIGN_DIRECTION.md`
for the full visual analysis.

**It is inspiration only — never a production asset.** No later prompt may
ship this file, or any crop of it, to the live site. Hero prompts (012–018)
rebuild the scene from primitives (shards, lighting, DOF layers) to match this
reference's mood and composition, not by embedding the image itself.

**Provenance:** user-supplied screenshot, uploaded 2026-07-19. Contains only a
UI mockup — no private personal data, no real user content, no third-party
material beyond the design itself.

**Checksum:** SHA-256 `cb1b36ab21e31021008da03276056716c875144924b6901046f5b0c90210a48e`
(1318×716 PNG, ~1.1 MB). This is the canonical copy; the original upload
folder `altr-hero-reference.png/` at the workspace root has been removed
after its contents were confirmed byte-identical (same checksum) to this
file.

## Legacy audit pin

The previous working implementation, `skv1ra/altrtest2`, is pinned at commit
`a22927d` (branch `agent/altr-light-redesign`) as the audited reference for
`FEATURE_PARITY_MATRIX.md` and all later diff-proofs. That repository is
**read-only** with respect to this rebuild: no tags, branches, commits, or
pushes ever target it from this workspace or its prompt sequence. See
`docs/claude-prompts/MASTER_CONTEXT.md` § Repository model for the binding
rules.
