"use client";

import { Plus, Search } from "lucide-react";
import { usePathname, useRouter } from "next/navigation";
import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/Button";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import { toast } from "@/components/ui/Toast";
import type { AltrProfile } from "@/lib/auth";
import { getSharedCopy } from "@/lib/i18n/copy";
import { useLang } from "@/lib/i18n/lang-store";
import { MemoryEditDialog, type MemoryEditorState, type MemoryEditPatch } from "./MemoryEditDialog";
import { MemoryProvenanceDialog } from "./MemoryProvenanceDialog";
import { MemoryRow } from "./MemoryRow";
import { MemoryStatusHeader } from "./MemoryStatusHeader";
import styles from "./MemoryOverview.module.css";

const PAGE_SIZE = 12;
const SEARCH_DEBOUNCE_MS = 400;

export interface MemorySource {
  id: string;
  source_type: string;
  source_reference: string | null;
  excerpt: string | null;
  import_id: string | null;
  conversation_id: string | null;
  message_id: string | null;
  assistant_run_id: string | null;
}

/** Shape of one row from `GET /api/memories` (`app/api/memories/route.ts`,
 *  read, not modified — its own `select(...)` call is the source of
 *  truth). */
export interface Memory {
  id: string;
  category: string;
  title: string;
  description: string;
  confidence: number;
  source_type: string;
  source_reference: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  extraction_model: string | null;
  extraction_version: string | null;
  altr_memory_sources: MemorySource[];
}

export interface MemoryOverviewProps {
  initialQuery: string;
  initialCategory: string;
  initialPage: number;
  /** Snapshot from the Server Component at load time — `GET /api/memories`
   *  (must-not-change) has no "distinct categories" endpoint, so this is a
   *  direct server-side query in `page.tsx` instead (same "trusted server
   *  context, direct query" precedent `app/(app)/dashboard/page.tsx`
   *  already set for its own "last import"/"drafts" numbers). Per-tab
   *  counts can go stale within a session after edits/deletes — this
   *  prompt's own "category with zero results after deletion" edge case
   *  is handled by graceful degradation, not a live recount: a stale-
   *  count tab still fetches real data when clicked, and correctly shows
   *  the "no matches for this view" empty state if it's now actually
   *  empty, rather than crashing or showing wrong rows. */
  categoryCounts: Array<{ category: string; count: number }>;
  totalMemories: number;
  activeMemoryCount: number;
  memoryLimit: number;
  learningEnabled: boolean;
  connections: AltrProfile["connections"];
  preferences: AltrProfile["preferences"];
}

/**
 * `components/memory/*` in LEGACY (`MemoryCard`, `MemoryEditModal`,
 * `MemoryDeleteModal`, `MemoryCategoryTabs`, `MemoryStatusPanel`,
 * `DataSourcesPanel`) was never actually imported by LEGACY's own
 * `app/memory/page.tsx` — confirmed with a full-repo grep before writing
 * any of this: `app/memory/page.tsx` reimplements everything inline
 * (category as a free-text input, no tabs; `window.confirm()` for
 * delete; a fabricated `MemoryStatusPanel` "Learning Status" toggle with
 * no backing field; a `DataSourcesPanel` hardcoding "Telegram / Email /
 * Calendar — Not connected" for every user, always). Those six files are
 * dead prototype code with a `MemoryItem` shape that doesn't even match
 * the real `Memory` type the live page and the real API use (a fictional
 * fixed 5-category enum vs. the real free-text `category` column;
 * 0-100 integer confidence vs. the real 0-1 float).
 *
 * This rebuild treats `app/memory/page.tsx`'s own inline implementation
 * as the real behavioral contract (edit, delete, enable/disable, clear
 * all — all real, all kept), and brings back the *visual ideas* the dead
 * components sketched (category tabs, a status header, a connected-
 * sources panel) but backed by real data this time:
 * `getProfileForUser`'s `preferences.learning`/`connections` (real
 * columns) instead of fabricated ones — see `MemoryStatusHeader.tsx`'s
 * own module comment for the full mapping.
 */
export function MemoryOverview({
  initialQuery,
  initialCategory,
  initialPage,
  categoryCounts,
  totalMemories,
  activeMemoryCount,
  memoryLimit,
  learningEnabled,
  connections,
  preferences,
}: MemoryOverviewProps) {
  const [lang] = useLang("EN");
  const t = getSharedCopy(lang).memory;
  const router = useRouter();
  const pathname = usePathname();

  const [queryInput, setQueryInput] = useState(initialQuery);
  const [query, setQuery] = useState(initialQuery);
  const [category, setCategory] = useState(initialCategory);
  const [page, setPage] = useState(Math.max(1, initialPage));

  const [items, setItems] = useState<Memory[] | null>(null);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState(false);

  const [editorState, setEditorState] = useState<MemoryEditorState>(null);
  const [savingEdit, setSavingEdit] = useState(false);
  const [goneError, setGoneError] = useState(false);
  const [provenanceMemory, setProvenanceMemory] = useState<Memory | null>(null);
  const [togglingId, setTogglingId] = useState<string | null>(null);
  const [confirmingClearAll, setConfirmingClearAll] = useState(false);
  const [clearingAll, setClearingAll] = useState(false);
  // Tracks whether the user has ANY memories at all, independent of the
  // current filter — starts from the server's own snapshot but updates on
  // delete/clear-all so the two empty states (this prompt's own "no
  // memories at all" vs "no matches for filter") stay correct within the
  // session, not just on the next full page load.
  const [remainingTotal, setRemainingTotal] = useState(totalMemories);
  // Prompt 038: the header QuotaMeter and the create dialog's own quota
  // notice both need the real active count to stay live within a session
  // (create/enable/disable/delete all change it), not just the server's
  // snapshot at first load — same "start from server, adjust locally"
  // pattern `remainingTotal` above already established.
  const [activeCount, setActiveCount] = useState(activeMemoryCount);

  const debounceRef = useRef<number | null>(null);
  const requestIdRef = useRef(0);

  // Debounce: raw typing updates `queryInput` immediately (so the field
  // itself feels responsive); the value that actually drives a fetch/URL
  // sync only updates after this prompt's own "debounced search" is quiet.
  useEffect(() => {
    if (debounceRef.current) window.clearTimeout(debounceRef.current);
    debounceRef.current = window.setTimeout(() => {
      setQuery(queryInput);
      setPage(1);
    }, SEARCH_DEBOUNCE_MS);
    return () => {
      if (debounceRef.current) window.clearTimeout(debounceRef.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [queryInput]);

  const load = useCallback(async () => {
    const requestId = (requestIdRef.current += 1);
    setLoading(true);
    setLoadError(false);
    try {
      const params = new URLSearchParams();
      if (query) params.set("q", query);
      if (category) params.set("category", category);
      params.set("page", String(page));
      params.set("pageSize", String(PAGE_SIZE));
      const response = await fetch(`/api/memories?${params.toString()}`);
      const body = await response.json();
      if (!response.ok) throw new Error(body.error);
      if (requestId !== requestIdRef.current) return; // a newer request already superseded this one
      setItems(body.memories ?? []);
      setTotal(body.total ?? 0);
      setTotalPages(Math.max(1, body.totalPages ?? 1));
    } catch {
      if (requestId === requestIdRef.current) setLoadError(true);
    } finally {
      if (requestId === requestIdRef.current) setLoading(false);
    }
  }, [query, category, page]);

  useEffect(() => {
    void load();
  }, [load]);

  // URL-synced state (this prompt's own "shareable state" instruction) —
  // fires alongside the fetch above rather than blocking it.
  useEffect(() => {
    const params = new URLSearchParams();
    if (query) params.set("q", query);
    if (category) params.set("category", category);
    if (page > 1) params.set("page", String(page));
    const search = params.toString();
    router.replace(search ? `${pathname}?${search}` : pathname, { scroll: false });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [query, category, page, pathname]);

  // "Page beyond range (URL-edited) → clamp to last page" edge case.
  useEffect(() => {
    if (page > totalPages) setPage(totalPages);
  }, [page, totalPages]);

  /**
   * One editor, two endpoints — `state.mode` (set by whichever trigger
   * opened the dialog) decides `POST /api/memories` (create) vs.
   * `PATCH /api/memories/:id` (edit); the dialog component itself doesn't
   * know or care which (this prompt's own "create + edit in one
   * component" instruction). "Editing a memory deleted in another tab"
   * (this prompt's own edge case) is handled here, not assumed away: a
   * `404 MEMORY_NOT_FOUND` from the PATCH sets `goneError` instead of a
   * raw error, and still refreshes the list so the now-gone row actually
   * disappears rather than lingering.
   */
  async function handleSaveEdit(patch: MemoryEditPatch) {
    if (!editorState) return;
    setSavingEdit(true);
    try {
      if (editorState.mode === "create") {
        const response = await fetch("/api/memories", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(patch),
        });
        if (!response.ok) throw new Error((await response.json()).error);
        setEditorState(null);
        toast.push(t.createSuccessToast);
        setRemainingTotal((value) => value + 1);
        // A manually created memory is always active — `createSchema`
        // (server) defaults `active` to `true` and this dialog's own
        // `MemoryEditPatch` never sends the field, so this always holds.
        setActiveCount((value) => value + 1);
        await load();
        return;
      }

      const response = await fetch(`/api/memories/${editorState.memory.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(patch),
      });
      if (response.status === 404) {
        setGoneError(true);
        await load();
        return;
      }
      if (!response.ok) throw new Error((await response.json()).error);
      setEditorState(null);
      toast.push(t.editSuccessToast);
      await load();
    } finally {
      setSavingEdit(false);
    }
  }

  function closeEditor() {
    setEditorState(null);
    setGoneError(false);
  }

  async function handleToggleActive(memory: Memory) {
    setTogglingId(memory.id);
    try {
      const nextActive = !memory.is_active;
      const response = await fetch(`/api/memories/${memory.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ active: nextActive }),
      });
      if (!response.ok) throw new Error((await response.json()).error);
      toast.push(nextActive ? t.enableSuccessToast : t.disableSuccessToast);
      setActiveCount((value) => (nextActive ? value + 1 : Math.max(0, value - 1)));
      await load();
    } finally {
      setTogglingId(null);
    }
  }

  async function handleClearAll() {
    setClearingAll(true);
    try {
      const response = await fetch("/api/memories", { method: "DELETE" });
      if (!response.ok) throw new Error((await response.json()).error);
      setConfirmingClearAll(false);
      setRemainingTotal(0);
      setActiveCount(0);
      setPage(1);
      toast.push(t.clearAllSuccessToast);
      await load();
    } finally {
      setClearingAll(false);
    }
  }

  function handleRowDeleted(wasActive: boolean) {
    setRemainingTotal((value) => Math.max(0, value - 1));
    if (wasActive) setActiveCount((value) => Math.max(0, value - 1));
    void load();
  }

  function clearFilters() {
    setQueryInput("");
    setQuery("");
    setCategory("");
    setPage(1);
  }

  const hasAnyMemories = remainingTotal > 0;
  const showEmptyNone = !loading && !loadError && items !== null && items.length === 0 && !hasAnyMemories;
  const showEmptyFiltered = !loading && !loadError && items !== null && items.length === 0 && hasAnyMemories;

  return (
    <div className={styles.wrap}>
      <p className="text-label uppercase text-text-muted">{t.eyebrow}</p>
      <h1 className="mt-4 text-h1 font-normal text-text-primary">{t.title}</h1>
      <p className="mt-4 max-w-[60ch] text-body text-text-muted">{t.intro}</p>

      <MemoryStatusHeader
        lang={lang}
        activeMemoryCount={activeCount}
        memoryLimit={memoryLimit}
        learningEnabled={learningEnabled}
        connections={connections}
        preferences={preferences}
      />

      <div className={styles.toolbar}>
        <label className={styles.searchField}>
          <span className="sr-only">{t.searchLabel}</span>
          <Search aria-hidden="true" width={16} height={16} strokeWidth={1.6} />
          <input
            type="search"
            value={queryInput}
            onChange={(event) => setQueryInput(event.target.value)}
            placeholder={t.searchPlaceholder}
            className={styles.searchInput}
          />
        </label>

        {hasAnyMemories && (
          <div className={styles.tabs} role="tablist" aria-label={t.eyebrow}>
            <button
              type="button"
              role="tab"
              aria-selected={category === ""}
              onClick={() => {
                setCategory("");
                setPage(1);
              }}
              className={category === "" ? `${styles.tab} ${styles.tabActive}` : styles.tab}
            >
              {t.allCategoriesLabel} <span className={styles.tabCount}>{remainingTotal}</span>
            </button>
            {categoryCounts.map(({ category: value, count }) => (
              <button
                key={value}
                type="button"
                role="tab"
                aria-selected={category === value}
                onClick={() => {
                  setCategory(value);
                  setPage(1);
                }}
                className={category === value ? `${styles.tab} ${styles.tabActive}` : styles.tab}
              >
                {value} <span className={styles.tabCount}>{count}</span>
              </button>
            ))}
          </div>
        )}

        <Button variant="ghost" onClick={() => setEditorState({ mode: "create" })}>
          <Plus aria-hidden="true" width={14} height={14} strokeWidth={1.8} />
          {t.newMemoryAction}
        </Button>

        {hasAnyMemories && (
          <Button variant="ghost" onClick={() => setConfirmingClearAll(true)}>
            {t.clearAllAction}
          </Button>
        )}
      </div>

      {loadError && (
        <p className={styles.statusLine} role="alert">
          {t.loadFailed}
        </p>
      )}

      {!loadError && items !== null && !showEmptyNone && !showEmptyFiltered && (
        <p className={styles.resultsCount} role="status">
          {total} {t.resultsSuffix}
        </p>
      )}

      {showEmptyNone && (
        <div className={styles.empty}>
          <p className={styles.emptyHeading}>{t.emptyNoneHeading}</p>
          <p className={styles.emptyBody}>{t.emptyNoneBody}</p>
          <Link href="/import-conversations" className={styles.emptyCta}>
            {t.emptyNoneCta}
          </Link>
        </div>
      )}

      {showEmptyFiltered && (
        <div className={styles.empty}>
          <p className={styles.emptyHeading}>{t.emptyFilteredHeading}</p>
          <p className={styles.emptyBody}>{t.emptyFilteredBody}</p>
          <button type="button" onClick={clearFilters} className={styles.emptyCta}>
            {t.clearFiltersAction}
          </button>
        </div>
      )}

      {items !== null && items.length > 0 && (
        <>
          <ul className={styles.list}>
            {items.map((memory) => (
              <MemoryRow
                key={memory.id}
                memory={memory}
                lang={lang}
                onEdit={() => setEditorState({ mode: "edit", memory })}
                onOpenProvenance={() => setProvenanceMemory(memory)}
                onToggleActive={() => void handleToggleActive(memory)}
                onDeleted={() => handleRowDeleted(memory.is_active)}
                togglingActive={togglingId === memory.id}
              />
            ))}
          </ul>

          {totalPages > 1 && (
            <div className={styles.pager}>
              <Button variant="ghost" disabled={page <= 1} onClick={() => setPage((value) => value - 1)}>
                {t.pagerPrevious}
              </Button>
              <span className={styles.pagerLabel}>
                {page} {t.pagerOfLabel} {totalPages}
              </span>
              <Button variant="ghost" disabled={page >= totalPages} onClick={() => setPage((value) => value + 1)}>
                {t.pagerNext}
              </Button>
            </div>
          )}
        </>
      )}

      <MemoryEditDialog
        state={editorState}
        lang={lang}
        saving={savingEdit}
        categoryOptions={categoryCounts.map((entry) => entry.category)}
        goneError={goneError}
        activeMemoryCount={activeCount}
        memoryLimit={memoryLimit}
        onCancel={closeEditor}
        onSave={(patch) => void handleSaveEdit(patch)}
      />

      <MemoryProvenanceDialog memory={provenanceMemory} lang={lang} onClose={() => setProvenanceMemory(null)} />

      {/* Typed confirmation, not just a click-through ConfirmDialog — this
       * prompt's own "stricter than legacy's window.confirm, satisfying
       * invariant #8" instruction (MASTER_CONTEXT.md's own invariant #8 is
       * about account deletion specifically; this applies the same class
       * of friction to this app's own most consequential memory action).
       * The phrase itself is deliberately not translated in the UA copy —
       * same convention invariant #8 already set for "DELETE MY ACCOUNT". */}
      <ConfirmDialog
        open={confirmingClearAll}
        onClose={() => setConfirmingClearAll(false)}
        onConfirm={() => void handleClearAll()}
        title={t.clearAllConfirmTitle}
        description={t.clearAllConfirmDescription}
        confirmLabel={t.clearAllAction}
        loading={clearingAll}
        tone="dark"
        typedConfirmation={{ phrase: "DELETE ALL MEMORIES", label: t.clearAllTypedLabel }}
      />
    </div>
  );
}
