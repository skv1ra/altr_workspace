"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/Button";
import { Field } from "@/components/ui/Field";
import { Surface } from "@/components/ui/Surface";
import { TextField } from "@/components/ui/TextField";
import { toast } from "@/components/ui/Toast";
import { Body, Display, Label } from "@/components/ui/Text";
import { getSharedCopy } from "@/lib/i18n/copy";
import { useLang } from "@/lib/i18n/lang-store";
import { TwinRoadmapPreview, type TwinPreview } from "./TwinRoadmapPreview";
import styles from "./TwinConfigView.module.css";

const NAME_MAX_LENGTH = 120;
const INSTRUCTIONS_MAX_LENGTH = 3000;
const TONE_VALUES = ["balanced", "warm", "direct", "formal"] as const;
type Tone = (typeof TONE_VALUES)[number];

/** Shape of one row from `GET /api/assistants` (must-not-change) — every
 *  field here mirrors that route's own `select(...)` list, nothing added. */
interface TwinAssistant {
  id: string;
  name: string;
  assistant_type: string;
  system_instructions: string | null;
  tone: Tone;
  is_active: boolean;
  config: Record<string, unknown>;
}

export interface TwinConfigViewProps {
  /** Real, server-side count of this user's active memories — same direct
   *  `altr_memories` query `app/(app)/memory/page.tsx` (036) already runs,
   *  since `GET /api/memories` (must-not-change) has no active-only count
   *  of its own (same precedent Prompt 038 established for the header
   *  QuotaMeter's own count). */
  activeMemoryCount: number;
}

/**
 * `POST /api/assistants/:id` — there is no such route; the real contract is
 * `PATCH`, and it has no `active`/`is_active` field at all (verified by
 * reading `app/api/assistants/[id]/route.ts`'s own zod schema in full) —
 * only `name`/`tone`/`systemInstructions`/`config`. `is_active` is real and
 * consequential (`app/api/ai/draft-reply/route.ts` gates generation on it,
 * returning 409 `ACTIVE_TWIN_REQUIRED` when false) but genuinely
 * unwritable from this workspace's current API surface — `app/api/**` is
 * outside this prompt's file scope regardless. So "Status" below is a real,
 * honest, non-interactive readout of the server's own `is_active` value
 * (always `true` today, since nothing anywhere ever sets it `false`), not
 * an active toggle — a toggle with no working write path would be exactly
 * the "dead button" RISKS R9 already forbids elsewhere in this app.
 */
export function TwinConfigView({ activeMemoryCount }: TwinConfigViewProps) {
  const [lang] = useLang("EN");
  const t = getSharedCopy(lang).twin;
  const common = getSharedCopy(lang).common;

  const [baseline, setBaseline] = useState<TwinAssistant | null>(null);
  const [previews, setPreviews] = useState<TwinPreview[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState(false);

  const [name, setName] = useState("");
  const [tone, setTone] = useState<Tone>("balanced");
  const [instructions, setInstructions] = useState("");
  const [nameError, setNameError] = useState<string | undefined>(undefined);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const response = await fetch("/api/assistants");
        const body = await response.json();
        if (!response.ok) throw new Error(body.error);
        const twin = (body.assistants ?? []).find((item: TwinAssistant) => item.assistant_type === "digital_twin") ?? null;
        if (cancelled) return;
        if (!twin) {
          setLoadError(true);
          return;
        }
        setBaseline(twin);
        setName(twin.name);
        setTone(twin.tone);
        setInstructions(twin.system_instructions ?? "");
        setPreviews(body.previews ?? []);
      } catch {
        if (!cancelled) setLoadError(true);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const dirty = baseline !== null && (name !== baseline.name || tone !== baseline.tone || instructions !== (baseline.system_instructions ?? ""));

  async function handleSave() {
    if (!baseline || saving || !dirty) return;
    if (name.trim().length === 0) {
      setNameError(t.nameRequiredError);
      return;
    }
    setNameError(undefined);
    setSaving(true);
    try {
      const update: Record<string, unknown> = {};
      if (name !== baseline.name) update.name = name;
      if (tone !== baseline.tone) update.tone = tone;
      if (instructions !== (baseline.system_instructions ?? "")) update.systemInstructions = instructions;

      const response = await fetch(`/api/assistants/${baseline.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(update),
      });
      const body = await response.json();
      if (!response.ok) throw new Error(body.error);

      const updated: TwinAssistant = { ...baseline, ...body.assistant };
      setBaseline(updated);
      setName(updated.name);
      setTone(updated.tone);
      setInstructions(updated.system_instructions ?? "");
      toast.push(t.savedToast);
    } catch {
      toast.push(t.saveErrorGeneric);
    } finally {
      setSaving(false);
    }
  }

  const memoryLinkSuffix = activeMemoryCount === 1 ? t.memoryLinkSuffixOne : t.memoryLinkSuffixMany;

  return (
    <div className={styles.wrap}>
      <Surface variant="inverse" className={styles.presence}>
        <div className={styles.shardWrap} aria-hidden="true">
          <picture>
            <source type="image/avif" srcSet="/assets/hero/shards-trimmed/shard-main.avif" />
            <source type="image/webp" srcSet="/assets/hero/shards-trimmed/shard-main.webp" />
            <img
              src="/assets/hero/shards-trimmed/shard-main.png"
              alt=""
              width={1102}
              height={651}
              className={`${styles.shardImg} motion-drift`}
              draggable={false}
            />
          </picture>
        </div>

        {loading ? (
          <p className={styles.loadingLine}>{common.loading}</p>
        ) : loadError ? (
          <p className={styles.loadingLine} role="alert">
            {t.loadFailed}
          </p>
        ) : (
          <div className={styles.presenceContent}>
            <Label>{t.eyebrow}</Label>
            <Display className={styles.presenceName}>{baseline?.name}</Display>
          </div>
        )}
      </Surface>

      {!loading && !loadError && baseline && (
        <>
          <section className={`v3-panel ${styles.section}`} aria-labelledby="twin-identity-heading">
            <h2 id="twin-identity-heading" className={styles.sectionHeading}>
              {t.identityHeading}
            </h2>
            <p className={styles.sectionBody}>{t.identityBody}</p>
            <div className={styles.fields}>
              <TextField
                label={t.nameLabel}
                value={name}
                onChange={(event) => {
                  setName(event.target.value);
                  setNameError(undefined);
                }}
                maxLength={NAME_MAX_LENGTH}
                error={nameError}
                required
              />
            </div>
          </section>

          <section className={`v3-panel ${styles.section}`} aria-labelledby="twin-voice-heading">
            <h2 id="twin-voice-heading" className={styles.sectionHeading}>
              {t.voiceHeading}
            </h2>
            <p className={styles.sectionBody}>{t.voiceBody}</p>
            <div className={styles.fields}>
              <div>
                <span className="v3-field-label">{t.toneLabel}</span>
                <div className={styles.chipRow}>
                  {TONE_VALUES.map((value) => (
                    <button
                      key={value}
                      type="button"
                      className="v3-chip"
                      data-active={tone === value}
                      onClick={() => setTone(value)}
                    >
                      {t.toneOptions[value]}
                    </button>
                  ))}
                </div>
              </div>
              <Field label={t.instructionsLabel} help={`${instructions.length}/${INSTRUCTIONS_MAX_LENGTH} · ${t.instructionsHint}`}>
                {({ id, describedBy }) => (
                  <textarea
                    id={id}
                    aria-describedby={describedBy}
                    rows={6}
                    maxLength={INSTRUCTIONS_MAX_LENGTH}
                    className="field-input control-focus"
                    value={instructions}
                    onChange={(event) => setInstructions(event.target.value)}
                  />
                )}
              </Field>
            </div>
          </section>

          <section className={`v3-panel ${styles.section}`} aria-labelledby="twin-status-heading">
            <h2 id="twin-status-heading" className={styles.sectionHeading}>
              {t.statusHeading}
            </h2>
            <div className={styles.statusRow}>
              <span className={styles.statusPill}>
                <span className={baseline.is_active ? `${styles.statusDot} ${styles.statusDotActive}` : styles.statusDot} aria-hidden="true" />
                {baseline.is_active ? t.statusActiveLabel : t.statusInactiveLabel}
              </span>
            </div>
            <p className={styles.statusBody}>{baseline.is_active ? t.statusActiveBody : t.statusInactiveBody}</p>

            <Body muted className={styles.memoryLink}>
              {t.memoryLinkPrefix} {activeMemoryCount} {memoryLinkSuffix} ·{" "}
              <Link href="/memory">{t.memoryLinkCta}</Link>
            </Body>
          </section>

          <div className={styles.saveBar}>
            <Button onClick={() => void handleSave()} loading={saving} disabled={!dirty}>
              {t.saveLabel}
            </Button>
          </div>

          <TwinRoadmapPreview previews={previews} lang={lang} />
        </>
      )}
    </div>
  );
}
