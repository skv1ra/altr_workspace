import { describe, expect, it } from "vitest";
import { describeImportErrorCode } from "@/components/app/imports/ImportHistory";

/**
 * The real, complete list of error codes this app can actually produce —
 * grepped directly from `lib/imports/parsers.ts` (`throw new Error(...)`),
 * `lib/imports/zip.ts`, every route under `app/api/imports/**`, and
 * `lib/ai/memory-extraction.ts` (all read in full for Prompt 034, none of
 * them modified — outside this prompt's own file scope). This test exists
 * so the taxonomy in `lib/i18n/copy.ts`'s `imports.errors` can't silently
 * drift from the real code list — every entry here must resolve to a
 * real, non-generic mapping, in both languages.
 */
const REAL_ERROR_CODES = [
  // lib/imports/parsers.ts
  "MALFORMED_ENCODING",
  "JSON_TOO_DEEP",
  "JSON_MALFORMED",
  "OBJECT_CYCLE",
  "JSON_TOO_COMPLEX",
  "LINE_TOO_LONG",
  "MESSAGE_LIMIT_EXCEEDED",
  "NO_MESSAGES_FOUND",
  "CONVERSATION_LIMIT_EXCEEDED",
  "COMPRESSED_FILE_TOO_LARGE",
  "UNSUPPORTED_BINARY_FILE",
  // lib/imports/zip.ts
  "ZIP_PATH_TRAVERSAL",
  "ZIP_EOCD_NOT_FOUND",
  "ZIP_MULTIDISK_UNSUPPORTED",
  "ZIP64_UNSUPPORTED",
  "ZIP_TOO_MANY_ENTRIES",
  "ZIP_CENTRAL_DIRECTORY_INVALID",
  "ZIP_ENCRYPTED_UNSUPPORTED",
  "ZIP_COMPRESSION_UNSUPPORTED",
  "ZIP_ENTRY_TOO_LARGE",
  "ZIP_UNCOMPRESSED_LIMIT",
  "ZIP_SUSPICIOUS_RATIO",
  "ZIP_ENTRY_COUNT_MISMATCH",
  "ZIP_HAS_NO_SUPPORTED_EXPORT",
  "ZIP_ENTRY_MISSING",
  "ZIP_ENTRY_SIZE_MISMATCH",
  // app/api/imports/route.ts
  "FILE_SIZE_LIMIT_REACHED",
  "MIME_EXTENSION_MISMATCH",
  "DUPLICATE_IMPORT",
  "STALE_PROCESSING_IMPORT",
  "IMPORT_MONTHLY_QUOTA_REACHED",
  "IMPORT_CONCURRENCY_LIMIT",
  "INVALID_IMPORT_METADATA",
  "IMPORT_CREATE_FAILED",
  "IMPORT_LIST_FAILED",
  // app/api/imports/[id]/chunks/route.ts
  "IMPORT_NOT_PROCESSING",
  "MESSAGE_LIMIT_REACHED",
  "CONVERSATION_LIMIT_REACHED",
  "INVALID_IMPORT_CHUNK",
  "IMPORT_CHUNK_FAILED",
  // app/api/imports/[id]/route.ts
  "IMPORT_NOT_FOUND",
  "INVALID_IMPORT_ID",
  "IMPORT_DELETE_FAILED",
  // app/api/imports/[id]/extract/route.ts + lib/ai/memory-extraction.ts
  "AI_PROVIDER_NOT_CONFIGURED",
  "IMPORT_NOT_READY_FOR_EXTRACTION",
  "MEMORY_PROCESSING_CONCURRENCY_LIMIT",
  "MEMORY_LIMIT_REACHED",
  "EMBEDDING_MODEL_REQUIRES_DOCUMENTED_MIGRATION",
  "MEMORY_EXTRACTION_FAILED",
  // client-side-only codes (033's ImportFlow / conversation-parser.worker.ts)
  "WORKER_FAILED",
  "PROCESSING_TIMEOUT",
  "IMPORT_CANCELLED",
  "MEMORY_EXTRACTION_BATCH_LIMIT",
] as const;

describe("describeImportErrorCode", () => {
  it.each(REAL_ERROR_CODES)("maps the real code %s to real EN copy, not the generic fallback", (code) => {
    const text = describeImportErrorCode(code, "EN");
    expect(text).not.toMatch(/^Something went wrong \(code:/);
    expect(text.length).toBeGreaterThan(10);
  });

  it.each(REAL_ERROR_CODES)("maps the real code %s to real UA copy, not the generic fallback", (code) => {
    const text = describeImportErrorCode(code, "UA");
    expect(text).not.toMatch(/^Щось пішло не так/);
    expect(text.length).toBeGreaterThan(10);
  });

  it("falls back to a designed generic message with the raw code visible for an unknown code", () => {
    expect(describeImportErrorCode("SOME_FUTURE_CODE_NOT_YET_MAPPED", "EN")).toBe(
      "Something went wrong (code: SOME_FUTURE_CODE_NOT_YET_MAPPED).",
    );
  });

  it("never returns an empty string for an empty/garbage code", () => {
    expect(describeImportErrorCode("", "EN").length).toBeGreaterThan(0);
  });
});
