import { getSharedCopy } from "@/lib/i18n/copy";
import type { Lang } from "@/lib/i18n/lang-store";

/**
 * Shared between the freshly-generated draft's own provenance line
 * (`TwinDraftWorkspace`) and each history run's detail view
 * (`TwinDraftHistory`) — same real counts, same wording, written once.
 *
 * Deliberately counts only — no attempt to resolve `usedMemoryIds`/
 * `usedMessageIds` into real titles/excerpts. This prompt's own
 * instruction reads "ids -> titles resolved where cheap"; verified, not
 * assumed, that there is no cheap way to do that correctly here: `GET
 * /api/memories` (must-not-change) has no id-list filter, only
 * `q`/`category`/`page`/`pageSize`, so resolving titles for an arbitrary
 * set of up to 8 ids would mean paging through a user's entire memory
 * store (up to 25,000 on Work) client-side and hoping the right ones
 * appear on a fetched page — not cheap, and not reliably correct at
 * scale. The real counts below are exact, free (already in the response),
 * and never misleading.
 */
export function formatProvenance(memoryCount: number, messageCount: number, lang: Lang): string {
  const t = getSharedCopy(lang).twin;
  if (memoryCount === 0 && messageCount === 0) return t.provenanceNone;

  const parts: string[] = [];
  if (memoryCount > 0) parts.push(`${memoryCount} ${memoryCount === 1 ? t.provenanceMemoriesSuffixOne : t.provenanceMemoriesSuffixMany}`);
  if (messageCount > 0) parts.push(`${messageCount} ${messageCount === 1 ? t.provenanceMessagesSuffixOne : t.provenanceMessagesSuffixMany}`);

  const joined = parts.length === 2 ? `${parts[0]} ${t.provenanceAnd} ${parts[1]}` : parts[0];
  return `${t.provenanceUsedPrefix} ${joined}`;
}
