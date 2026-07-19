# Dependency graph

Prompts are numbered in a safe sequential order. Running them strictly in order is
always valid. This file documents where limited independence exists.

## Hard sequential spine (never reorder)

```
001 → 002 → 003            (audit before anything)
003 → 004 → 005 → 006      (foundation)
006 → 007 → 008 → 009 → 010 → 011   (design system builds on itself)
011 → 012 → 013 → 014 → 015 → 016 → 017 → 018   (hero pipeline)
011 → 019                  (public site needs design system)
018 → 020                  (hero integration needs finished hero)
043 → 044, 050 → 051       (tests/deploy after their features)
047 → 048 → 049 → 050 → 051 (final quality gate is strictly ordered)
```

## Parallel-safe groups (different files, no shared architecture)

After the design system (011) and dashboard shell (029) exist, these feature
tracks touch disjoint directories and may be executed independently of each
other (still sequentially *within* each track):

- Track A — Public site: 019 → 020 → 021 → 022 → 023 → 024
  (needs 018 only for 020+)
- Track B — Auth: 025 → 026 → 027 → 028 (needs 011)
- Track C — User foundation: 029 → 030 → 031 (needs 027)
- Track D — Import: 032 → 033 → 034 → 035 (needs 029)
- Track E — Memory: 036 → 037 → 038 (needs 029)
- Track F — Twin: 039 → 040 → 041 (needs 029; 040 benefits from 036–038 done)
- Track G — Billing: 042 → 043 → 044 (needs 029; 023 pricing should exist first)
- Track H — Privacy: 045 → 046 (needs 029)

Do NOT run two tracks in the same working tree simultaneously if both modify
shared files: `components/` design-system primitives, `app/layout.tsx`,
`tailwind.config.ts`, `tests/e2e/critical-flows.spec.ts`, or anything under
`supabase/migrations/`. Tracks D–H all touch the e2e spec — when run in
parallel worktrees, merge e2e changes carefully and re-run `yarn test:e2e`.

## Per-prompt dependency table

| Prompt | Depends on |
| --- | --- |
| 001 | — |
| 002 | 001 |
| 003 | 002 |
| 004 | 003 |
| 005 | 004 |
| 006 | 005 |
| 007–011 | each on the previous, starting from 006 |
| 012 | 011 |
| 013–018 | each on the previous |
| 019 | 011 |
| 020 | 018, 019 |
| 021–024 | each on the previous |
| 025 | 011 |
| 026–028 | each on the previous |
| 029 | 027 |
| 030–031 | each on the previous |
| 032 | 029 |
| 033–035 | each on the previous |
| 036 | 029 |
| 037–038 | each on the previous |
| 039 | 029 |
| 040 | 039 (036 recommended) |
| 041 | 040 |
| 042 | 029, 023 |
| 043 | 042 |
| 044 | 043 |
| 045 | 029 |
| 046 | 045, 024 |
| 047 | all feature tracks complete (028, 031, 035, 038, 041, 044, 046) |
| 048 | 047 |
| 049 | 048 |
| 050 | 049 |
| 051 | 050 |
