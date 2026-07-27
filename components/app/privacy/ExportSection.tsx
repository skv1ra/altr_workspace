"use client";

import { Download } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/Button";
import { getSharedCopy } from "@/lib/i18n/copy";
import type { Lang } from "@/lib/i18n/lang-store";

type ExportFormat = "json" | "csv";

function filenameFrom(disposition: string | null, format: ExportFormat) {
  const match = disposition ? /filename="([^"]+)"/.exec(disposition) : null;
  return match?.[1] ?? `altr-export.${format === "csv" ? "zip" : "json"}`;
}

/** `GET /api/privacy/export` (must-not-change) — a real, no-store,
 *  authenticated download. Fetched (not a plain `<a href>`) so a single
 *  in-flight guard and an honest pending/error state are possible — the
 *  edge cases this prompt names ("export while a deletion is pending",
 *  "double-click export") both need real client state, not just a link. */
export function ExportSection({ lang }: { lang: Lang }) {
  const t = getSharedCopy(lang).privacy;
  const [pending, setPending] = useState<ExportFormat | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function runExport(format: ExportFormat) {
    if (pending) return;
    setPending(format);
    setError(null);
    try {
      const response = await fetch(`/api/privacy/export${format === "csv" ? "?format=csv" : ""}`, { cache: "no-store" });
      if (!response.ok) {
        setError(response.status === 429 ? t.exportRateLimited : t.exportFailed);
        return;
      }
      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      const anchor = document.createElement("a");
      anchor.href = url;
      anchor.download = filenameFrom(response.headers.get("content-disposition"), format);
      document.body.appendChild(anchor);
      anchor.click();
      anchor.remove();
      URL.revokeObjectURL(url);
    } catch {
      setError(t.exportFailed);
    } finally {
      setPending(null);
    }
  }

  return (
    <section aria-labelledby="privacy-export-heading">
      <h2 id="privacy-export-heading" className="text-h3 font-normal text-text-primary">
        {t.exportHeading}
      </h2>
      <p className="mt-2 text-body text-text-muted">{t.exportBody}</p>
      <div className="mt-4 flex flex-wrap gap-3">
        <Button variant="secondary" onClick={() => void runExport("json")} loading={pending === "json"} disabled={pending !== null}>
          <Download aria-hidden="true" className="h-4 w-4" />
          {t.exportJson}
        </Button>
        <Button variant="secondary" onClick={() => void runExport("csv")} loading={pending === "csv"} disabled={pending !== null}>
          <Download aria-hidden="true" className="h-4 w-4" />
          {t.exportCsv}
        </Button>
      </div>
      {pending && <p className="mt-3 text-label text-text-muted">{t.exportPending}</p>}
      {error && (
        <p role="alert" className="mt-3 text-label text-alarm-red">
          {error}
        </p>
      )}
    </section>
  );
}
