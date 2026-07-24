"use client";

import { Ban, RefreshCw, UploadCloud } from "lucide-react";
import Link from "next/link";
import { useEffect, useRef, useState, type DragEvent } from "react";
import { Button } from "@/components/ui/Button";
import { Checkbox } from "@/components/ui/Checkbox";
import { getSharedCopy } from "@/lib/i18n/copy";
import { useLang } from "@/lib/i18n/lang-store";
import type { PlanLimits } from "@/lib/billing/limits";
import { IMPORT_LIMITS } from "@/lib/imports/limits";
import type { ImportPlatform, ParseResult } from "@/lib/imports/types";
import { QuotaMeter } from "@/components/app/QuotaMeter";
import { ProviderGuide } from "./ProviderGuide";
import { StageRail } from "./StageRail";
import { DuplicatePanel, type DuplicateExisting } from "./DuplicatePanel";
import styles from "./ImportFlow.module.css";

const MIME: Record<string, string> = {
  json: "application/json",
  txt: "text/plain",
  html: "text/html",
  htm: "text/html",
  csv: "text/csv",
  zip: "application/zip",
  mbox: "application/mbox",
};
const SUPPORTED_EXTENSIONS = Object.keys(MIME);

/** Below this, a stage's own transition would visually flash — this
 *  prompt's own "very fast small imports must not flash-skip unreadably"
 *  edge case. Applied once per named stage (parsing / saving / extracting),
 *  never per chunk/batch inside a stage — a large import with hundreds of
 *  chunks must not pay this cost hundreds of times. */
const MIN_STAGE_DISPLAY_MS = 450;

type ActiveWorker = { worker: Worker; requestId: string; reject: (error: Error) => void; timeoutId: number };

type ExtractionPauseReason = "MEMORY_LIMIT_REACHED" | "MEMORY_PROCESSING_CONCURRENCY_LIMIT";

type StatusState =
  | { kind: "idle" }
  | { kind: "parsing" }
  | { kind: "uploading"; index: number; total: number }
  | { kind: "extracting"; batch: number; createdTotal: number }
  | { kind: "aiNotConfigured"; importId: string; createdTotal: number }
  | { kind: "extractionPaused"; importId: string; createdTotal: number; reason: ExtractionPauseReason }
  | { kind: "extractionFailed"; importId: string; message: string; createdTotal: number }
  | { kind: "done"; createdTotal: number }
  | { kind: "cancelled" }
  | { kind: "timeout" }
  | { kind: "duplicate"; existing: DuplicateExisting }
  | { kind: "quotaReached" }
  | { kind: "rejected"; message: string }
  | { kind: "failed"; message: string };

function monthStartIso() {
  const now = new Date();
  return new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1)).toISOString();
}

function extensionOf(name: string) {
  return name.toLowerCase().split(".").pop() ?? "";
}

function holdStage(enteredAt: number) {
  const elapsed = Date.now() - enteredAt;
  if (elapsed >= MIN_STAGE_DISPLAY_MS) return Promise.resolve();
  return new Promise<void>((resolve) => setTimeout(resolve, MIN_STAGE_DISPLAY_MS - elapsed));
}

/**
 * Orchestration logic (hashing, chunk size of 10, the extract-poll loop,
 * every error-message mapping) is ported line-for-line from LEGACY's
 * `run()`/`extractMemories()` (Prompt 032) — this prompt (033) adds real
 * cancellation during upload (LEGACY/032 only ever aborted the parse
 * worker; the chunk-upload loop had no way to stop), a designed duplicate
 * resolution panel in place of the raw 409 message, a monthly-quota 429
 * path that flips the existing `QuotaMeter` above into its own reached
 * state rather than rendering a second one, and a cursor-based "retry
 * extraction" action that never re-uploads or re-parses.
 *
 * The consent checkbox does NOT call `/api/consents/grant` — verified in
 * 032 by reading LEGACY's page in full: that endpoint is only ever called
 * from `components/legal/PrivacySettingsPanel.tsx`, an unrelated
 * account-level privacy surface. LEGACY's import consent is, and always
 * was, a local, unpersisted gate in front of the upload.
 */
export function ImportFlow() {
  const [lang] = useLang("EN");
  const t = getSharedCopy(lang).imports;

  const [platform, setPlatform] = useState<ImportPlatform>("telegram");
  const [status, setStatus] = useState<StatusState>({ kind: "idle" });
  const [consent, setConsent] = useState(false);
  const [busy, setBusy] = useState(false);
  const [dragOver, setDragOver] = useState(false);
  const [lastFile, setLastFile] = useState<File | null>(null);
  const [limits, setLimits] = useState<PlanLimits | null>(null);
  const [planId, setPlanId] = useState("");
  const [importsThisMonth, setImportsThisMonth] = useState<number | null>(null);
  const activeWorker = useRef<ActiveWorker | null>(null);
  const runController = useRef<AbortController | null>(null);
  /** Furthest stage actually reached this run — lets a cancel/timeout/
   *  generic failure freeze the stage rail on the real stage it stopped at,
   *  instead of guessing. 0 parsing / 1 saving / 2 extracting. */
  const lastStageIndex = useRef(0);

  useEffect(() => {
    fetch("/api/imports")
      .then(async (response) => {
        const body = await response.json();
        if (!response.ok) throw new Error(body.error);
        setLimits(body.limits);
        setPlanId(body.planId);
        const monthStart = monthStartIso();
        const recent = Array.isArray(body.imports)
          ? body.imports.filter((item: { created_at: string; status: string }) => item.created_at >= monthStart && item.status !== "deleted")
          : [];
        setImportsThisMonth(recent.length);
      })
      .catch(() => setStatus({ kind: "failed", message: t.limitsUnavailable }));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const cancelRun = () => {
    const active = activeWorker.current;
    if (active) {
      window.clearTimeout(active.timeoutId);
      active.worker.terminate();
      activeWorker.current = null;
      active.reject(new Error("IMPORT_CANCELLED"));
      return;
    }
    runController.current?.abort();
  };

  const stopWorker = (reason: "PROCESSING_TIMEOUT") => {
    const active = activeWorker.current;
    if (!active) return;
    window.clearTimeout(active.timeoutId);
    active.worker.terminate();
    activeWorker.current = null;
    active.reject(new Error(reason));
  };

  /** Cursor-based — the server's own `extraction_cursor` (`lib/ai/memory-
   *  extraction.ts`) resumes from where the last successful batch left
   *  off, so calling this again after a pause/failure never re-imports or
   *  re-uploads anything. `createdTotal` is a running, honest count across
   *  every batch this run has actually persisted (each batch response's
   *  own `created` field) — never fabricated. */
  const extractMemories = async (importId: string, startingTotal = 0) => {
    let createdTotal = startingTotal;
    const stageStart = Date.now();
    for (let batch = 0; batch < 250; batch += 1) {
      setStatus({ kind: "extracting", batch: batch + 1, createdTotal });
      const response = await fetch(`/api/imports/${importId}/extract`, { method: "POST" });
      const body = await response.json();
      if (!response.ok) {
        await holdStage(stageStart);
        if (body.error === "AI_PROVIDER_NOT_CONFIGURED") return setStatus({ kind: "aiNotConfigured", importId, createdTotal });
        if (body.error === "MEMORY_LIMIT_REACHED" || body.error === "MEMORY_PROCESSING_CONCURRENCY_LIMIT") {
          return setStatus({ kind: "extractionPaused", importId, createdTotal, reason: body.error });
        }
        return setStatus({ kind: "extractionFailed", importId, message: body.error ?? "MEMORY_EXTRACTION_FAILED", createdTotal });
      }
      createdTotal += typeof body.created === "number" ? body.created : 0;
      if (body.done) {
        await holdStage(stageStart);
        return setStatus({ kind: "done", createdTotal });
      }
    }
    await holdStage(stageStart);
    return setStatus({ kind: "extractionFailed", importId, message: "MEMORY_EXTRACTION_BATCH_LIMIT", createdTotal });
  };

  const retryExtraction = async (importId: string, createdTotal: number) => {
    setBusy(true);
    try {
      await extractMemories(importId, createdTotal);
    } finally {
      setBusy(false);
    }
  };

  /** This prompt's own "precise designed rejections BEFORE parsing" —
   *  extension is checked against the same allow-list the server itself
   *  enforces (`app/api/imports/route.ts`'s `mimeExtensions`, read, not
   *  modified); file-size-vs-plan-limit stays inside `run()` since it
   *  needs `limits`, matching LEGACY's own check location exactly. */
  function preCheckRejection(file: File): string | null {
    if (file.size === 0) return t.emptyFile;
    if (!SUPPORTED_EXTENSIONS.includes(extensionOf(file.name))) return t.unsupportedFormat;
    return null;
  }

  const run = async (file: File) => {
    if (!consent) return setStatus({ kind: "rejected", message: t.consentRequired });
    if (!limits) return setStatus({ kind: "rejected", message: t.limitsLoading });
    const rejection = preCheckRejection(file);
    if (rejection) return setStatus({ kind: "rejected", message: rejection });
    if (file.size > limits.maxFileBytes) {
      return setStatus({ kind: "rejected", message: `File exceeds your ${(limits.maxFileBytes / 1024 / 1024).toFixed(0)} MB plan limit.` });
    }

    setLastFile(file);
    setBusy(true);
    const controller = new AbortController();
    runController.current = controller;
    lastStageIndex.current = 0;
    setStatus({ kind: "parsing" });
    const parseStageStart = Date.now();
    const worker = new Worker(new URL("../../../workers/conversation-parser.worker.ts", import.meta.url));
    const requestId = crypto.randomUUID();
    let createdImportId: string | null = null;

    try {
      const parsed = await new Promise<ParseResult>((resolve, reject) => {
        const timeoutId = window.setTimeout(() => stopWorker("PROCESSING_TIMEOUT"), IMPORT_LIMITS.processingTimeoutMs);
        activeWorker.current = { worker, requestId, reject, timeoutId };
        worker.onmessage = (event) => {
          if (event.data?.requestId !== requestId) return;
          window.clearTimeout(timeoutId);
          activeWorker.current = null;
          event.data.ok ? resolve(event.data) : reject(new Error(event.data.error));
        };
        worker.onerror = () => {
          window.clearTimeout(timeoutId);
          activeWorker.current = null;
          reject(new Error("WORKER_FAILED"));
        };
        worker.postMessage({ type: "parse", requestId, file, platform });
      });
      await holdStage(parseStageStart);

      if (parsed.conversations.length > limits.maxConversationsPerImport) throw new Error("CONVERSATION_LIMIT_REACHED");
      const parsedMessageCount = parsed.conversations.reduce((sum, conversation) => sum + conversation.messages.length, 0);
      if (parsedMessageCount > limits.maxMessagesPerImport) throw new Error("MESSAGE_LIMIT_REACHED");

      const hash = Array.from(new Uint8Array(await crypto.subtle.digest("SHA-256", await file.arrayBuffer())))
        .map((byte) => byte.toString(16).padStart(2, "0"))
        .join("");
      const extension = extensionOf(file.name);
      const create = await fetch("/api/imports", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        signal: controller.signal,
        body: JSON.stringify({
          platform,
          sourceName: file.name,
          sourceHash: hash,
          bytes: file.size,
          mimeType: MIME[extension] ?? file.type,
          extension,
          parserVersion: parsed.parserVersion,
          preview: parsed.preview,
          rawFileStored: false,
        }),
      });
      const created = await create.json();
      if (!create.ok) {
        if (created.error === "DUPLICATE_IMPORT") return setStatus({ kind: "duplicate", existing: created.import });
        if (created.error === "IMPORT_MONTHLY_QUOTA_REACHED") {
          setImportsThisMonth(limits.importsPerMonth);
          return setStatus({ kind: "quotaReached" });
        }
        throw new Error(created.error);
      }
      createdImportId = created.import.id;

      lastStageIndex.current = 1;
      const uploadStageStart = Date.now();
      const chunks: (typeof parsed.conversations)[] = [];
      for (let index = 0; index < parsed.conversations.length; index += 10) chunks.push(parsed.conversations.slice(index, index + 10));
      for (let index = 0; index < chunks.length; index += 1) {
        setStatus({ kind: "uploading", index: index + 1, total: chunks.length });
        const response = await fetch(`/api/imports/${created.import.id}/chunks`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          signal: controller.signal,
          body: JSON.stringify({ chunkIndex: index, final: index === chunks.length - 1, conversations: chunks[index] }),
        });
        if (!response.ok) throw new Error((await response.json()).error);
      }
      await holdStage(uploadStageStart);
      lastStageIndex.current = 2;
      setImportsThisMonth((current) => (current ?? 0) + 1);
      await extractMemories(created.import.id);
    } catch (error) {
      const aborted = error instanceof DOMException && error.name === "AbortError";
      const message = aborted ? "IMPORT_CANCELLED" : error instanceof Error ? error.message : "IMPORT_FAILED";
      if (createdImportId) await fetch(`/api/imports/${createdImportId}`, { method: "DELETE" }).catch(() => undefined);
      if (message === "IMPORT_CANCELLED") setStatus({ kind: "cancelled" });
      else if (message === "PROCESSING_TIMEOUT") setStatus({ kind: "timeout" });
      else setStatus({ kind: "failed", message });
    } finally {
      if (activeWorker.current?.worker === worker) {
        window.clearTimeout(activeWorker.current.timeoutId);
        activeWorker.current = null;
      }
      runController.current = null;
      worker.terminate();
      setBusy(false);
    }
  };

  function handleFiles(files: FileList | null) {
    // "Drag of multiple files" edge case: first file only, stated in the UI.
    const file = files?.[0];
    if (file) void run(file);
  }

  function handleDrop(event: DragEvent<HTMLDivElement>) {
    event.preventDefault();
    setDragOver(false);
    if (!busy) handleFiles(event.dataTransfer.files);
  }

  const cancellable = status.kind === "parsing" || status.kind === "uploading";
  const canRetryFull = !busy && lastFile && (status.kind === "failed" || status.kind === "timeout" || status.kind === "cancelled");
  const canRetryExtraction =
    !busy && (status.kind === "aiNotConfigured" || status.kind === "extractionPaused" || status.kind === "extractionFailed");

  return (
    <div className={styles.wrap}>
      <div className={styles.topline}>
        <Link href="/dashboard" className={styles.back}>
          {getSharedCopy(lang).common.backDashboard}
        </Link>
      </div>

      <p className="mt-8 text-label uppercase text-text-muted">{t.eyebrow}</p>
      <h1 className="mt-4 text-h1 font-normal text-text-primary">{t.title}</h1>
      <p className="mt-4 max-w-[60ch] text-body text-text-muted">{t.intro}</p>
      <p className="mt-3 text-label normal-case text-text-muted">{t.privacyStatement}</p>

      {limits && (
        <div className={styles.limits}>
          <p className={styles.limitsLine}>
            {planId} · {(limits.maxFileBytes / 1024 / 1024).toFixed(0)} MB ·{" "}
            {limits.maxMessagesPerImport.toLocaleString(lang === "UA" ? "uk-UA" : "en-US")} {t.messagesLabel}
          </p>
          <QuotaMeter
            label={t.importsThisMonthLabel}
            used={importsThisMonth ?? 0}
            limit={limits.importsPerMonth}
            lang={lang}
            unknown={importsThisMonth === null}
          />
        </div>
      )}

      <div className="mt-8">
        <ProviderGuide platform={platform} onSelect={setPlatform} lang={lang} disabled={busy} />
      </div>

      <div className="mt-8">
        <Checkbox checked={consent} disabled={busy} onChange={(event) => setConsent(event.target.checked)} label={t.consentLabel} />
      </div>

      <div
        className={dragOver ? `${styles.dropZone} ${styles.dropZoneActive}` : styles.dropZone}
        onDragOver={(event) => {
          event.preventDefault();
          if (!busy) setDragOver(true);
        }}
        onDragLeave={() => setDragOver(false)}
        onDrop={handleDrop}
      >
        <UploadCloud aria-hidden="true" width={22} height={22} strokeWidth={1.5} />
        <label className={styles.dropLabel}>
          {t.dropHeading}
          <input
            type="file"
            disabled={busy}
            accept=".json,.txt,.html,.htm,.csv,.zip,.mbox"
            className={styles.hiddenInput}
            onChange={(event) => handleFiles(event.target.files)}
          />
        </label>
        <p className={styles.dropHint}>{t.dropHint}</p>
        <p className={styles.dropHint}>{t.dropMultipleNote}</p>
      </div>

      {status.kind !== "idle" && status.kind !== "duplicate" && status.kind !== "rejected" && status.kind !== "quotaReached" && (
        <StageRail currentIndex={deriveStageIndex(status, lastStageIndex.current)} error={deriveStageError(status)} lang={lang} />
      )}

      {cancellable && (
        <Button variant="ghost" className="mt-4" onClick={cancelRun}>
          <Ban aria-hidden="true" width={16} height={16} strokeWidth={1.6} />
          {t.cancel}
        </Button>
      )}
      {canRetryFull && (
        <Button variant="ghost" className="mt-4" onClick={() => lastFile && void run(lastFile)}>
          <RefreshCw aria-hidden="true" width={16} height={16} strokeWidth={1.6} />
          {t.retry}
        </Button>
      )}
      {canRetryExtraction && "importId" in status && (
        <Button variant="ghost" className="mt-4" onClick={() => void retryExtraction(status.importId, status.createdTotal)}>
          <RefreshCw aria-hidden="true" width={16} height={16} strokeWidth={1.6} />
          {t.retryExtraction}
        </Button>
      )}
      {status.kind === "extractionPaused" && status.reason === "MEMORY_LIMIT_REACHED" && (
        <p className="mt-2 text-label text-text-muted">
          <Link href="/pricing" className="underline underline-offset-[3px]">
            {getSharedCopy(lang).quota.upgradeLink}
          </Link>
        </p>
      )}

      {status.kind === "duplicate" && <DuplicatePanel existing={status.existing} lang={lang} />}

      {status.kind !== "idle" && status.kind !== "duplicate" && (
        <p
          role={status.kind === "failed" || status.kind === "rejected" || status.kind === "extractionFailed" ? "alert" : "status"}
          className={
            status.kind === "failed" || status.kind === "rejected" || status.kind === "extractionFailed"
              ? `${styles.statusLine} ${styles.statusAlert}`
              : styles.statusLine
          }
        >
          <StatusText status={status} t={t} />
        </p>
      )}
    </div>
  );
}

function deriveStageIndex(status: StatusState, lastKnown: number): number {
  switch (status.kind) {
    case "parsing":
      return 0;
    case "uploading":
      return 1;
    case "extracting":
    case "aiNotConfigured":
    case "extractionPaused":
    case "extractionFailed":
      return 2;
    case "done":
      return 3;
    case "cancelled":
    case "timeout":
    case "quotaReached":
    case "failed":
      return lastKnown;
    default:
      return lastKnown;
  }
}

function deriveStageError(status: StatusState): boolean {
  return (
    status.kind === "aiNotConfigured" ||
    status.kind === "extractionPaused" ||
    status.kind === "extractionFailed" ||
    status.kind === "cancelled" ||
    status.kind === "timeout" ||
    status.kind === "quotaReached" ||
    status.kind === "failed"
  );
}

function StatusText({ status, t }: { status: StatusState; t: ReturnType<typeof getSharedCopy>["imports"] }) {
  switch (status.kind) {
    case "idle":
      return null;
    case "parsing":
      return <>{t.statusParsing}</>;
    case "uploading":
      return (
        <>
          {t.statusUploadingPrefix} {status.index}/{status.total}…
        </>
      );
    case "extracting":
      return (
        <>
          {t.statusExtractingPrefix} {status.batch}
          {status.createdTotal > 0 ? ` (${status.createdTotal} ${t.savedSoFarSuffix})` : "…"}
        </>
      );
    case "aiNotConfigured":
      return (
        <>
          {t.statusAiNotConfigured}
          {status.createdTotal > 0 ? ` ${status.createdTotal} ${t.memoriesCreatedSuffix}` : ""}
        </>
      );
    case "extractionPaused":
      return (
        <>
          {status.reason === "MEMORY_LIMIT_REACHED" ? t.statusExtractionMemoryLimit : t.statusExtractionConcurrency}
          {status.createdTotal > 0 ? ` ${status.createdTotal} ${t.memoriesCreatedSuffix}` : ""}
        </>
      );
    case "extractionFailed":
      return (
        <>
          {t.statusExtractionFailedPrefix} {status.message}. {t.statusExtractionFailedSuffix}
          {status.createdTotal > 0 ? ` ${status.createdTotal} ${t.memoriesCreatedSuffix}` : ""}
        </>
      );
    case "done":
      return (
        <>
          {t.statusDone} {status.createdTotal} {t.memoriesCreatedSuffix}
        </>
      );
    case "cancelled":
      return <>{t.statusCancelled}</>;
    case "timeout":
      return <>{t.statusTimeout}</>;
    case "duplicate":
      return <>{t.statusDuplicate}</>;
    case "quotaReached":
      return <>{t.statusQuotaReached}</>;
    case "rejected":
      return <>{status.message}</>;
    case "failed":
      return (
        <>
          {t.statusFailedPrefix} {status.message}. {t.statusFailedSuffix}
        </>
      );
    default:
      return null;
  }
}
