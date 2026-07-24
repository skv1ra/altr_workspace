"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Button } from "@/components/ui/Button";
import { Select } from "@/components/ui/Select";
import { TextField } from "@/components/ui/TextField";
import { updateCurrentProfile, type ToneMode } from "@/lib/auth";
import { getSharedCopy } from "@/lib/i18n/copy";
import { useLang } from "@/lib/i18n/lang-store";
import styles from "./OnboardingFlow.module.css";

type Step = "name" | "tone" | "action";

export interface OnboardingFlowProps {
  initialAltrName: string;
  initialTone: ToneMode;
}

/**
 * Max three steps, one question per viewport, no progress dots (this
 * prompt's own visual requirement — the small "One"/"Two"/"Three" eyebrow
 * is a label, not a completion percentage). "Skip for now" is present on
 * every step at the same size and position as "Continue" — this prompt's
 * own "skipping must be as easy as completing" requirement — and does the
 * exact same thing "Continue" does on the last step: mark onboarding
 * complete and leave, with no extra field write. The third step is
 * intentionally not a real "Import conversations" link — that page
 * doesn't exist in this workspace yet (Prompt 032), so ADR-013 applies
 * here the same way it already has to every other pre-existing (app)
 * surface (029/030): informational only, no dead link.
 */
export function OnboardingFlow({ initialAltrName, initialTone }: OnboardingFlowProps) {
  const router = useRouter();
  const [lang] = useLang("EN");
  const t = getSharedCopy(lang);
  const o = t.onboarding;

  const [step, setStep] = useState<Step>("name");
  const [altrName, setAltrName] = useState(initialAltrName);
  const [tone, setTone] = useState<ToneMode>(initialTone);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  async function finish(fields: Partial<{ altrName: string; tone: ToneMode }> = {}) {
    if (saving) return;
    setSaving(true);
    setError("");
    try {
      await updateCurrentProfile({ ...fields, onboardingCompleted: true });
      router.replace("/dashboard");
      router.refresh();
    } catch {
      setError(o.saveError);
      setSaving(false);
    }
  }

  async function handleNameContinue() {
    if (saving) return;
    setSaving(true);
    setError("");
    try {
      await updateCurrentProfile({ altrName });
      setStep("tone");
    } catch {
      setError(o.saveError);
    } finally {
      setSaving(false);
    }
  }

  async function handleToneContinue() {
    if (saving) return;
    setSaving(true);
    setError("");
    try {
      await updateCurrentProfile({ tone });
      setStep("action");
    } catch {
      setError(o.saveError);
    } finally {
      setSaving(false);
    }
  }

  const toneOptions = (Object.keys(t.settings.toneOptions) as ToneMode[]).map((value) => ({
    value,
    label: t.settings.toneOptions[value],
  }));

  return (
    <div className={styles.wrap}>
      <div className={styles.shardField} aria-hidden="true">
        <picture>
          <source srcSet="/assets/hero/shards-trimmed/shard-foreground-01@1x.avif" type="image/avif" />
          <source srcSet="/assets/hero/shards-trimmed/shard-foreground-01@1x.webp" type="image/webp" />
          <img
            src="/assets/hero/shards-trimmed/shard-foreground-01@1x.png"
            alt=""
            width={481}
            height={690}
            className={`${styles.shardImg} motion-drift`}
          />
        </picture>
      </div>

      <div className={styles.card}>
        {step === "name" && (
          <>
            <p className="text-label uppercase text-text-muted">{o.nameStepEyebrow}</p>
            <h1 className="mt-4 text-display font-normal text-white">{o.nameStepTitle}</h1>
            <p className="mt-4 max-w-[46ch] text-body text-text-muted">{o.nameStepBody}</p>
            <div className={styles.field}>
              <TextField label={t.settings.altrNameLabel} value={altrName} onChange={(event) => setAltrName(event.target.value)} />
            </div>
          </>
        )}

        {step === "tone" && (
          <>
            <p className="text-label uppercase text-text-muted">{o.toneStepEyebrow}</p>
            <h1 className="mt-4 text-display font-normal text-white">{o.toneStepTitle}</h1>
            <p className="mt-4 max-w-[46ch] text-body text-text-muted">{o.toneStepBody}</p>
            <div className={styles.field}>
              <Select
                label={t.settings.toneLabel}
                value={tone}
                onChange={(event) => setTone(event.target.value as ToneMode)}
                options={toneOptions}
              />
            </div>
          </>
        )}

        {step === "action" && (
          <>
            <p className="text-label uppercase text-text-muted">{o.actionStepEyebrow}</p>
            <h1 className="mt-4 text-display font-normal text-white">{o.actionStepTitle}</h1>
            <p className="mt-4 max-w-[46ch] text-body text-text-muted">{o.actionStepBody}</p>
          </>
        )}

        {error && (
          <p role="alert" className={styles.alert}>
            {error}
          </p>
        )}

        <div className={styles.actions}>
          {step === "name" && (
            <>
              <Button loading={saving} onClick={() => void handleNameContinue()}>
                {o.continueLabel}
              </Button>
              <Button variant="ghost" disabled={saving} onClick={() => void finish()}>
                {o.skip}
              </Button>
            </>
          )}
          {step === "tone" && (
            <>
              <Button loading={saving} onClick={() => void handleToneContinue()}>
                {o.continueLabel}
              </Button>
              <Button variant="ghost" disabled={saving} onClick={() => void finish()}>
                {o.skip}
              </Button>
            </>
          )}
          {step === "action" && (
            <>
              <Button loading={saving} onClick={() => void finish()}>
                {o.finish}
              </Button>
              <Button variant="ghost" disabled={saving} onClick={() => void finish()}>
                {o.skip}
              </Button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
