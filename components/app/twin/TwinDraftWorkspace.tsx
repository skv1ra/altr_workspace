"use client";

import { useEffect, useRef, useState } from "react";
import { QuotaMeter } from "@/components/app/QuotaMeter";
import { Button } from "@/components/ui/Button";
import { Checkbox } from "@/components/ui/Checkbox";
import { Field } from "@/components/ui/Field";
import { Select } from "@/components/ui/Select";
import { Surface } from "@/components/ui/Surface";
import { TextField } from "@/components/ui/TextField";
import { toast } from "@/components/ui/Toast";
import { getSharedCopy } from "@/lib/i18n/copy";
import { useLang } from "@/lib/i18n/lang-store";
import { formatProvenance } from "./draftProvenance";
import { TwinDraftHistory } from "./TwinDraftHistory";
import styles from "./TwinDraftWorkspace.module.css";

const INCOMING_MAX_LENGTH = 6_000;
const CONTACT_MAX_LENGTH = 160;
const REQUEST_TONE_VALUES = ["neutral", "warm", "direct", "professional", "casual"] as const;
type RequestTone = (typeof REQUEST_TONE_VALUES)[number];
const LENGTH_VALUES = ["short", "medium", "long"] as const;
type RequestLength = (typeof LENGTH_VALUES)[number];

/** Shape of `POST /api/ai/draft-reply`'s real 200 response (must-not-
 *  change route, read only) — every field here mirrors it exactly. */
interface DraftResult {
  draft: string;
  usedMemoryIds: string[];
  usedMessageIds: string[];
  usedConversationIds: string[];
  model: string;
  assistantRunId: string;
  quota: { used: number; limit: number };
}

type ComposeStatus =
  | { kind: "idle" }
  | { kind: "pending" }
  | { kind: "ready"; result: DraftResult }
  | { kind: "quotaReached"; limit: number }
  | { kind: "providerNotConfigured" }
  | { kind: "twinInactive" }
  | { kind: "failed" };

/**
 * The draft workspace half of `/assistants` (039 built the Twin config
 * half). Compose -> review -> act -> history, all against the real,
 * must-not-change `POST /api/ai/draft-reply` and `POST /api/ai/drafts/:id/
 * feedback` contracts, plus the new `GET /api/ai/drafts` (this prompt's
 * own history-parity endpoint).
 *
 * **Tone enum mismatch, verified not assumed:** `requestedTone` here
 * (`neutral/warm/direct/professional/casual`) is a genuinely different
 * enum from the Twin config's own `tone` (`balanced/warm/direct/formal`,
 * 039) — read the real zod schema before building this rather than
 * guessing the two lined up. "Default from Twin config" (instruction #1)
 * is therefore implemented as *omitting* `requestedTone` entirely when
 * the picker is left on its default option — the server itself already
 * falls back to `assistant.tone` in that case (`input.requestedTone ??
 * assistant.tone`), so this UI doesn't need to (and structurally cannot,
 * without inventing a fake mapping between two unrelated enums) send the
 * Twin's own tone value through a field that doesn't accept it.
 *
 * This component fetches its own `GET /api/assistants` on mount purely to
 * show the Twin's real current tone as a hint next to the default option
 * — a second, independent request from `TwinConfigView`'s own fetch of
 * the same endpoint. Deliberately not lifted into shared state: both
 * components are small, independently testable, and the endpoint is a
 * cheap single-row read: the "premature abstraction" tradeoff wasn't
 * worth it for one extra GET on page load.
 */
export function TwinDraftWorkspace() {
  const [lang] = useLang("EN");
  const t = getSharedCopy(lang).twin;

  const [twinToneHint, setTwinToneHint] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const response = await fetch("/api/assistants");
        const body = await response.json();
        if (!response.ok || cancelled) return;
        const twin = (body.assistants ?? []).find((item: { assistant_type: string }) => item.assistant_type === "digital_twin");
        if (twin && !cancelled) setTwinToneHint(twin.tone ?? null);
      } catch {
        // Leave the hint absent — the default option's own label still
        // reads correctly without it, and generation itself is unaffected
        // (the server resolves the real tone regardless of this hint).
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const [incomingMessage, setIncomingMessage] = useState("");
  const [contact, setContact] = useState("");
  const [tone, setTone] = useState<RequestTone | "">("");
  const [length, setLength] = useState<RequestLength>("medium");
  const [language, setLanguage] = useState("auto");
  const [incomingError, setIncomingError] = useState<string | undefined>(undefined);

  const [status, setStatus] = useState<ComposeStatus>({ kind: "idle" });
  const [editing, setEditing] = useState(false);
  const [editedDraft, setEditedDraft] = useState("");
  const [clipboardDenied, setClipboardDenied] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const [feedbackGiven, setFeedbackGiven] = useState<"accepted" | "rejected" | null>(null);
  const [feedbackNote, setFeedbackNote] = useState("");
  const [feedbackConsent, setFeedbackConsent] = useState(false);
  const [feedbackSaving, setFeedbackSaving] = useState(false);

  const [historyRefreshToken, setHistoryRefreshToken] = useState(0);

  useEffect(() => {
    if (clipboardDenied) textareaRef.current?.select();
  }, [clipboardDenied]);

  const pending = status.kind === "pending";

  async function generate() {
    if (pending) return;
    if (!incomingMessage.trim()) {
      setIncomingError(t.incomingMessageRequiredError);
      return;
    }
    setIncomingError(undefined);
    setStatus({ kind: "pending" });
    try {
      const body: Record<string, unknown> = {
        incomingMessage: incomingMessage.trim().slice(0, INCOMING_MAX_LENGTH),
        requestedLength: length,
        language: language.trim() || "auto",
      };
      if (contact.trim()) body.contact = contact.trim();
      if (tone) body.requestedTone = tone;

      const response = await fetch("/api/ai/draft-reply", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const responseBody = await response.json();

      if (!response.ok) {
        if (responseBody.error === "AI_DRAFT_QUOTA_REACHED") {
          setStatus({ kind: "quotaReached", limit: responseBody.limits?.aiDraftsPerMonth ?? 0 });
          return;
        }
        if (responseBody.error === "AI_PROVIDER_NOT_CONFIGURED") {
          setStatus({ kind: "providerNotConfigured" });
          return;
        }
        if (responseBody.error === "ACTIVE_TWIN_REQUIRED") {
          setStatus({ kind: "twinInactive" });
          return;
        }
        setStatus({ kind: "failed" });
        return;
      }

      const result = responseBody as DraftResult;
      setStatus({ kind: "ready", result });
      setEditedDraft(result.draft);
      setEditing(false);
      setClipboardDenied(false);
      setFeedbackGiven(null);
      setFeedbackNote("");
      setFeedbackConsent(false);
      setHistoryRefreshToken((value) => value + 1);
    } catch {
      setStatus({ kind: "failed" });
    }
  }

  async function handleCopy() {
    try {
      await navigator.clipboard.writeText(editedDraft);
      toast.push(t.copiedToast);
      setClipboardDenied(false);
    } catch {
      setClipboardDenied(true);
    }
  }

  async function submitFeedback(outcome: "accepted" | "rejected") {
    if (status.kind !== "ready" || feedbackSaving) return;
    setFeedbackSaving(true);
    try {
      const response = await fetch(`/api/ai/drafts/${status.result.assistantRunId}/feedback`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          outcome,
          finalDraft: editedDraft !== status.result.draft ? editedDraft : undefined,
          feedback: feedbackNote.trim() || undefined,
          consentToPersonalization: feedbackConsent,
        }),
      });
      if (!response.ok) throw new Error();
      toast.push(t.feedbackSuccessToast);
      setFeedbackGiven(outcome);
    } catch {
      toast.push(t.feedbackErrorGeneric);
    } finally {
      setFeedbackSaving(false);
    }
  }

  const showAsTextarea = editing || clipboardDenied;

  return (
    <div className={styles.wrap}>
      <h2 className={styles.heading}>{t.composeHeading}</h2>
      <p className={styles.intro}>{t.composeIntro}</p>

      <div className={styles.composeFields}>
        <Field label={t.incomingMessageLabel} help={`${incomingMessage.length}/${INCOMING_MAX_LENGTH}`} error={incomingError}>
          {({ id, describedBy }) => (
            <textarea
              id={id}
              aria-describedby={describedBy}
              rows={5}
              maxLength={INCOMING_MAX_LENGTH}
              className="field-input control-focus"
              value={incomingMessage}
              onChange={(event) => {
                setIncomingMessage(event.target.value);
                setIncomingError(undefined);
              }}
              disabled={pending}
            />
          )}
        </Field>

        <TextField
          label={t.contactLabel}
          value={contact}
          onChange={(event) => setContact(event.target.value)}
          maxLength={CONTACT_MAX_LENGTH}
          disabled={pending}
        />

        <div className={styles.composeRow}>
          <Select
            label={t.requestToneLabel}
            value={tone}
            onChange={(event) => setTone(event.target.value as RequestTone | "")}
            disabled={pending}
            options={[
              { value: "", label: twinToneHint ? `${t.requestToneDefaultOption} (${twinToneHint})` : t.requestToneDefaultOption },
              ...REQUEST_TONE_VALUES.map((value) => ({ value, label: t.requestToneOptions[value] })),
            ]}
          />
          <Select
            label={t.lengthLabel}
            value={length}
            onChange={(event) => setLength(event.target.value as RequestLength)}
            disabled={pending}
            options={LENGTH_VALUES.map((value) => ({ value, label: t.lengthOptions[value] }))}
          />
        </div>

        <TextField
          label={t.languageLabel}
          help={t.languageHint}
          value={language}
          onChange={(event) => setLanguage(event.target.value)}
          maxLength={40}
          disabled={pending}
        />

        <div>
          <Button onClick={() => void generate()} loading={pending} disabled={pending}>
            {t.generateAction}
          </Button>
          {pending && (
            <p className={styles.pendingLine} role="status">
              {t.pendingLabel}
            </p>
          )}
        </div>
      </div>

      {status.kind === "quotaReached" && (
        <div className={styles.errorPanel}>
          <p className={styles.errorHeading}>{t.quotaReachedHeading}</p>
          <p className={styles.errorBody}>{t.quotaReachedBody}</p>
          <QuotaMeter ariaLabel={t.quotaReachedHeading} used={status.limit} limit={status.limit} lang={lang} />
        </div>
      )}

      {status.kind === "providerNotConfigured" && (
        <div className={styles.errorPanel}>
          <p className={styles.errorBody}>{t.providerNotConfiguredNotice}</p>
        </div>
      )}

      {status.kind === "twinInactive" && (
        <div className={styles.errorPanel}>
          <p className={styles.errorBody}>{t.twinInactiveNotice}</p>
          <a href="#twin-status-heading" className={styles.errorLink}>
            {t.twinInactiveLinkLabel}
          </a>
        </div>
      )}

      {status.kind === "failed" && (
        <div className={styles.errorPanel} role="alert">
          <p className={styles.errorBody}>{t.genericFailureNotice}</p>
          <Button variant="secondary" className="mt-4" onClick={() => void generate()}>
            {t.retryAction}
          </Button>
        </div>
      )}

      {status.kind === "ready" && (
        <Surface variant="inverse" className={styles.reviewPanel}>
          <span className={styles.draftBadge}>{t.draftBadge}</span>

          <div className={styles.draftCard}>
            {showAsTextarea ? (
              <textarea
                ref={textareaRef}
                className={styles.draftTextarea}
                value={editedDraft}
                onChange={(event) => setEditedDraft(event.target.value)}
                readOnly={!editing}
                rows={8}
              />
            ) : (
              <p className={styles.draftText}>{editedDraft}</p>
            )}
          </div>

          {editing && <p className={styles.metaLine}>{t.editingHint}</p>}
          {clipboardDenied && !editing && <p className={styles.clipboardNotice}>{t.clipboardDeniedNotice}</p>}

          <p className={styles.metaLine}>{formatProvenance(status.result.usedMemoryIds.length, status.result.usedMessageIds.length, lang)}</p>
          <p className={styles.metaLine}>
            {status.result.quota.used}/{status.result.quota.limit} {t.quotaLineSuffix}
          </p>

          <div className={styles.actionsRow}>
            <Button variant="secondary" onClick={() => void handleCopy()}>
              {t.copyAction}
            </Button>
            <Button variant="ghost" onClick={() => setEditing((value) => !value)}>
              {editing ? t.doneEditingAction : t.editAction}
            </Button>
            <Button variant="ghost" onClick={() => void generate()} loading={pending} disabled={pending}>
              {t.regenerateAction}
            </Button>
          </div>

          <div className={styles.feedbackRow}>
            {feedbackGiven ? (
              <p className={styles.metaLine}>{t.feedbackGivenNotice}</p>
            ) : (
              <>
                <div className={styles.feedbackButtons}>
                  <Button variant="ghost" onClick={() => void submitFeedback("accepted")} loading={feedbackSaving} disabled={feedbackSaving}>
                    {t.thumbsUpLabel}
                  </Button>
                  <Button variant="ghost" onClick={() => void submitFeedback("rejected")} loading={feedbackSaving} disabled={feedbackSaving}>
                    {t.thumbsDownLabel}
                  </Button>
                </div>
                <div className={styles.feedbackFields}>
                  <TextField
                    label={t.feedbackNoteLabel}
                    placeholder={t.feedbackNotePlaceholder}
                    value={feedbackNote}
                    onChange={(event) => setFeedbackNote(event.target.value)}
                    maxLength={2_000}
                  />
                  <Checkbox
                    label={t.feedbackConsentLabel}
                    checked={feedbackConsent}
                    onChange={(event) => setFeedbackConsent(event.target.checked)}
                  />
                </div>
              </>
            )}
          </div>
        </Surface>
      )}

      <TwinDraftHistory lang={lang} refreshToken={historyRefreshToken} />
    </div>
  );
}
