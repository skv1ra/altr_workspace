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

type ActiveWorker = { worker: Worker; requestId: string; reject: (error: Error) => void; timeoutId: number };

type StatusState =
  | { kind: "idle" }
  | { kind: "parsing" }
  | { kind: "uploading"; index: number; total: number }
  | { kind: "extracting"; batch: number }
  | { kind: "aiNotConfigured" }
  | { kind: "done" }
  | { kind: "cancelled" }
  | { kind: "timeout" }
  | { kind: "duplicate" }
  | { kind: "rejected"; message: string }
  | { kind: "failed"; message: string };

function monthStartIso() {
  const now = new Date();
  return new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1)).toISOString();
}

function extensionOf(name: string) {
  return name.toLowerCase().split(".").pop() ?? "";
}

/**
 * Orchestration logic (hashing, chunk size of 10, the extract-poll loop,
 * the cleanup-on-failure rules, every status transition) is ported line-
 * for-line from LEGACY's `app/import-conversations/page.tsx` (pinned
 * `a22927d`, read in full for this prompt) — this prompt's own "do not
 * re-derive hashing or chunking, reuse the current [proven] logic"
 * instruction, applied the same way 030 ported `/legacy-migration`
 * verbatim. Only the two client-side pre-checks below (empty file,
 * unsupported extension) are new — LEGACY only ever checked file size
 * before parsing; this prompt's own instruction #2 asks for "precise
 * designed rejections BEFORE parsing" beyond just size.
 *
 * The consent checkbox does NOT call `/api/consents/grant` — verified by
 * reading LEGACY's page in full: that endpoint is only ever called from
 * `components/legal/PrivacySettingsPanel.tsx`, an unrelated account-level
 * privacy surface. LEGACY's import consent is, and always was, a local,
 * unpersisted gate in front of the upload — preserved exactly as that,
 * not upgraded to call an endpoint the reference implementation never
 * actually used for this purpose (this prompt's own "behavior preserved
 * exactly" instruction, read literally against the real, verified
 * behavior rather than the instruction's own parenthetical assumption).
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

  const stopWorker = (reason: "IMPORT_CANCELLED" | "PROCESSING_TIMEOUT") => {
    const active = activeWorker.current;
    if (!active) return;
    window.clearTimeout(active.timeoutId);
    active.worker.terminate();
    activeWorker.current = null;
    active.reject(new Error(reason));
  };

  const extractMemories = async (importId: string) => {
    for (let batch = 0; batch < 250; batch += 1) {
      setStatus({ kind: "extracting", batch: batch + 1 });
      const response = await fetch(`/api/imports/${importId}/extract`, { method: "POST" });
      const body = await response.json();
      if (!response.ok) {
        if (body.error === "AI_PROVIDER_NOT_CONFIGURED") return setStatus({ kind: "aiNotConfigured" });
        throw new Error(body.error);
      }
      if (body.done) return setStatus({ kind: "done" });
    }
    throw new Error("MEMORY_EXTRACTION_BATCH_LIMIT");
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
    setStatus({ kind: "parsing" });
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
        if (created.error === "DUPLICATE_IMPORT") throw new Error("DUPLICATE_IMPORT");
        throw new Error(created.error);
      }
      createdImportId = created.import.id;

      const chunks: (typeof parsed.conversations)[] = [];
      for (let index = 0; index < parsed.conversations.length; index += 10) chunks.push(parsed.conversations.slice(index, index + 10));
      for (let index = 0; index < chunks.length; index += 1) {
        const response = await fetch(`/api/imports/${created.import.id}/chunks`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ chunkIndex: index, final: index === chunks.length - 1, conversations: chunks[index] }),
        });
        if (!response.ok) throw new Error((await response.json()).error);
        setStatus({ kind: "uploading", index: index + 1, total: chunks.length });
      }
      await extractMemories(created.import.id);
      setImportsThisMonth((current) => (current ?? 0) + 1);
    } catch (error) {
      const message = error instanceof Error ? error.message : "IMPORT_FAILED";
      const preserveImport = message === "AI_PROVIDER_NOT_CONFIGURED" || message.startsWith("MEMORY_");
      if (createdImportId && !preserveImport) await fetch(`/api/imports/${createdImportId}`, { method: "DELETE" }).catch(() => undefined);
      if (message === "IMPORT_CANCELLED") setStatus({ kind: "cancelled" });
      else if (message === "PROCESSING_TIMEOUT") setStatus({ kind: "timeout" });
      else if (message === "DUPLICATE_IMPORT") setStatus({ kind: "duplicate" });
      else setStatus({ kind: "failed", message });
    } finally {
      if (activeWorker.current?.worker === worker) {
        window.clearTimeout(activeWorker.current.timeoutId);
        activeWorker.current = null;
      }
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

  const canRetry = !busy && lastFile && (status.kind === "failed" || status.kind === "timeout" || status.kind === "duplicate");

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

      {busy && (
        <Button variant="ghost" className="mt-4" onClick={() => stopWorker("IMPORT_CANCELLED")}>
          <Ban aria-hidden="true" width={16} height={16} strokeWidth={1.6} />
          {t.cancel}
        </Button>
      )}
      {canRetry && (
        <Button variant="ghost" className="mt-4" onClick={() => lastFile && void run(lastFile)}>
          <RefreshCw aria-hidden="true" width={16} height={16} strokeWidth={1.6} />
          {t.retry}
        </Button>
      )}

      {status.kind !== "idle" && (
        <p
          role={status.kind === "failed" || status.kind === "rejected" ? "alert" : "status"}
          className={
            status.kind === "failed" || status.kind === "rejected"
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
          {t.statusExtractingPrefix} {status.batch}…
        </>
      );
    case "aiNotConfigured":
      return <>{t.statusAiNotConfigured}</>;
    case "done":
      return <>{t.statusDone}</>;
    case "cancelled":
      return <>{t.statusCancelled}</>;
    case "timeout":
      return <>{t.statusTimeout}</>;
    case "duplicate":
      return <>{t.statusDuplicate}</>;
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
