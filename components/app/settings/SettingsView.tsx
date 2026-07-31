"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/Button";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import { Field } from "@/components/ui/Field";
import { Select } from "@/components/ui/Select";
import { TextField } from "@/components/ui/TextField";
import { toast } from "@/components/ui/Toast";
import { updateCurrentProfile, type AltrProfile, type ToneMode } from "@/lib/auth";
import { getSharedCopy } from "@/lib/i18n/copy";
import { useLang, type Lang } from "@/lib/i18n/lang-store";
import styles from "./SettingsView.module.css";

type IdentityState = { name: string; altrName: string; role: string; bio: string; tone: ToneMode };
type PreferencesState = { learning: boolean; autoDrafts: boolean; weeklyDigest: boolean; privacyMode: boolean };
type IdentityErrors = Partial<Record<keyof IdentityState, string>>;

function identityFrom(profile: AltrProfile): IdentityState {
  return { name: profile.name, altrName: profile.altrName, role: profile.role, bio: profile.bio, tone: profile.tone };
}

function preferencesFrom(profile: AltrProfile): PreferencesState {
  return {
    learning: profile.preferences.learning,
    autoDrafts: profile.preferences.autoDrafts,
    weeklyDigest: profile.preferences.weeklyDigest,
    privacyMode: profile.preferences.privacyMode,
  };
}

/**
 * `name`/`altrName`/`role`/`bio`/`tone` are exactly the `altr_profiles`
 * columns (verified against `supabase/migrations/202607130001_production_
 * foundation.sql`); `learning`/`autoDrafts`/`weeklyDigest`/`privacyMode` are
 * exactly `altr_user_preferences.memory_learning_enabled` and the three
 * `settings` jsonb keys `getProfileForUser` already reads (must-not-change,
 * read not modified) — no field here was invented. LEGACY's own dashboard
 * settings tab only ever exposed the five identity fields inline; this
 * prompt's own "gives it a proper home and structure for later settings"
 * framing is why Preferences gets real UI for the first time here, using
 * only fields the schema and `/api/me` PATCH contract already accept.
 */
export function SettingsView({ profile }: { profile: AltrProfile }) {
  const router = useRouter();
  const [lang] = useLang("EN");
  const t = getSharedCopy(lang).settings;

  const [baseline, setBaseline] = useState(profile);
  const [identity, setIdentity] = useState<IdentityState>(() => identityFrom(profile));
  const [preferences, setPreferences] = useState<PreferencesState>(() => preferencesFrom(profile));
  const [errors, setErrors] = useState<IdentityErrors>({});
  const [saving, setSaving] = useState(false);
  const [pendingHref, setPendingHref] = useState<string | null>(null);

  const dirty =
    JSON.stringify(identity) !== JSON.stringify(identityFrom(baseline)) ||
    JSON.stringify(preferences) !== JSON.stringify(preferencesFrom(baseline));
  const dirtyRef = useRef(dirty);
  dirtyRef.current = dirty;

  /**
   * Two-part unsaved-changes guard (this prompt's own "Dialog from 010 on
   * navigation" instruction): `beforeunload` covers tab close/refresh/typed
   * URL; a document-level capture-phase click listener covers in-app
   * `<Link>` navigation, including clicks on `AppNav` — a sibling of this
   * page in `AppShell`, not a descendant, so a listener scoped to this
   * component's own subtree could never see those clicks. `AppNav.tsx`
   * isn't in this prompt's own file list, so intercepting at `document`
   * level (reaches the whole page regardless of DOM position) is the only
   * way to guard against it without modifying that file.
   */
  useEffect(() => {
    function handleBeforeUnload(event: BeforeUnloadEvent) {
      if (!dirtyRef.current) return;
      event.preventDefault();
      event.returnValue = "";
    }
    window.addEventListener("beforeunload", handleBeforeUnload);
    return () => window.removeEventListener("beforeunload", handleBeforeUnload);
  }, []);

  useEffect(() => {
    function handleClick(event: MouseEvent) {
      if (!dirtyRef.current || event.defaultPrevented) return;
      if (event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
      const anchor = (event.target as HTMLElement).closest("a[href]");
      if (!anchor) return;
      const href = anchor.getAttribute("href");
      if (!href || href.startsWith("#") || anchor.getAttribute("target") === "_blank") return;
      event.preventDefault();
      setPendingHref(href);
    }
    document.addEventListener("click", handleClick, true);
    return () => document.removeEventListener("click", handleClick, true);
  }, []);

  function updateIdentityField<K extends keyof IdentityState>(key: K, value: IdentityState[K]) {
    setIdentity((current) => ({ ...current, [key]: value }));
    setErrors((current) => ({ ...current, [key]: undefined }));
  }

  function validate(): boolean {
    const nextErrors: IdentityErrors = {};
    if (identity.name.trim().length < 2 || identity.name.length > 120) nextErrors.name = t.errors.name;
    if (identity.altrName.trim().length < 1 || identity.altrName.length > 120) nextErrors.altrName = t.errors.altrName;
    if (identity.role.trim().length < 1 || identity.role.length > 120) nextErrors.role = t.errors.role;
    if (identity.bio.length > 2000) nextErrors.bio = t.errors.bio;
    setErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  }

  async function handleSave() {
    if (saving || !dirty || !validate()) return;
    setSaving(true);
    try {
      const baseIdentity = identityFrom(baseline);
      const basePreferences = preferencesFrom(baseline);
      const update: Record<string, unknown> = {};
      (Object.keys(identity) as Array<keyof IdentityState>).forEach((key) => {
        if (identity[key] !== baseIdentity[key]) update[key] = identity[key];
      });
      const preferenceDiff: Partial<PreferencesState> = {};
      (Object.keys(preferences) as Array<keyof PreferencesState>).forEach((key) => {
        if (preferences[key] !== basePreferences[key]) preferenceDiff[key] = preferences[key];
      });
      if (Object.keys(preferenceDiff).length > 0) update.preferences = preferenceDiff;

      // Server confirm then toast (this prompt's own "optimistic-free
      // save" instruction) — `baseline`/`identity`/`preferences` only
      // update once `updateCurrentProfile` resolves with the server's own
      // fresh row, which also satisfies "refresh state after save" for the
      // concurrent-two-tabs edge case (last write still wins; this tab's
      // own view just stays in sync with whatever the server now holds).
      const updated = await updateCurrentProfile(update as Partial<AltrProfile>);
      setBaseline(updated);
      setIdentity(identityFrom(updated));
      setPreferences(preferencesFrom(updated));
      toast.push(t.savedToast);
    } catch {
      toast.push(t.saveErrorGeneric);
    } finally {
      setSaving(false);
    }
  }

  function confirmLeave() {
    const href = pendingHref;
    setPendingHref(null);
    if (href) router.push(href);
  }

  const toneOptions = (Object.keys(t.toneOptions) as ToneMode[]).map((value) => ({
    value,
    label: t.toneOptions[value],
  }));

  return (
    <div className={styles.wrap}>
      <p className="v3-eyebrow">{t.eyebrow}</p>
      <h1 className="v3-h1">{t.heading}</h1>

      <section className={`v3-panel ${styles.section}`} aria-labelledby="settings-identity">
        <h2 id="settings-identity" className={styles.sectionHeading}>
          {t.identityHeading}
        </h2>
        <p className={styles.sectionBody}>{t.identityBody}</p>
        <div className={styles.grid}>
          <TextField
            label={t.nameLabel}
            value={identity.name}
            onChange={(event) => updateIdentityField("name", event.target.value)}
            error={errors.name}
            required
          />
          <TextField
            label={t.altrNameLabel}
            value={identity.altrName}
            onChange={(event) => updateIdentityField("altrName", event.target.value)}
            error={errors.altrName}
            required
          />
          <TextField
            label={t.roleLabel}
            value={identity.role}
            onChange={(event) => updateIdentityField("role", event.target.value)}
            error={errors.role}
            required
          />
          <Select
            label={t.toneLabel}
            value={identity.tone}
            onChange={(event) => updateIdentityField("tone", event.target.value as ToneMode)}
            options={toneOptions}
          />
          <div className={styles.gridFull}>
            <Field label={t.bioLabel} error={errors.bio}>
              {({ id, describedBy }) => (
                <textarea
                  id={id}
                  aria-describedby={describedBy}
                  aria-invalid={errors.bio ? true : undefined}
                  rows={4}
                  value={identity.bio}
                  onChange={(event) => updateIdentityField("bio", event.target.value)}
                  className="field-input control-focus"
                />
              )}
            </Field>
          </div>
        </div>
      </section>

      <section className={`v3-panel ${styles.section}`} aria-labelledby="settings-preferences">
        <h2 id="settings-preferences" className={styles.sectionHeading}>
          {t.preferencesHeading}
        </h2>
        <div className={styles.switchList}>
          <SwitchRow
            label={t.learningLabel}
            checked={preferences.learning}
            onChange={(checked) => setPreferences((current) => ({ ...current, learning: checked }))}
          />
          <SwitchRow
            label={t.autoDraftsLabel}
            checked={preferences.autoDrafts}
            onChange={(checked) => setPreferences((current) => ({ ...current, autoDrafts: checked }))}
          />
          <SwitchRow
            label={t.weeklyDigestLabel}
            checked={preferences.weeklyDigest}
            onChange={(checked) => setPreferences((current) => ({ ...current, weeklyDigest: checked }))}
          />
          <SwitchRow
            label={t.privacyModeLabel}
            checked={preferences.privacyMode}
            onChange={(checked) => setPreferences((current) => ({ ...current, privacyMode: checked }))}
          />
        </div>
      </section>

      <section className={`v3-panel ${styles.section}`} aria-labelledby="settings-language">
        <h2 id="settings-language" className={styles.sectionHeading}>
          {t.languageHeading}
        </h2>
        <p className={styles.sectionBody}>{t.languageBody}</p>
        <LanguagePicker />
      </section>

      <section className={`v3-panel ${styles.section} ${styles.danger}`} aria-labelledby="settings-danger">
        <h2 id="settings-danger" className={styles.sectionHeading}>
          {t.dangerHeading}
        </h2>
        <p className={styles.sectionBody}>{t.dangerBody}</p>
        <Link href="/privacy-center" className="btn btn-secondary control-focus mt-2 inline-flex w-fit">
          {t.dangerCta}
        </Link>
      </section>

      <div className={styles.saveBar}>
        <Button onClick={() => void handleSave()} loading={saving} disabled={!dirty}>
          {t.saveLabel}
        </Button>
      </div>

      <ConfirmDialog
        open={pendingHref !== null}
        onClose={() => setPendingHref(null)}
        onConfirm={confirmLeave}
        title={t.unsavedTitle}
        description={t.unsavedBody}
        confirmLabel={t.unsavedConfirm}
        cancelLabel={getSharedCopy(lang).common.cancel}
      />
    </div>
  );
}

function SwitchRow({ label, checked, onChange }: { label: string; checked: boolean; onChange: (checked: boolean) => void }) {
  return (
    <div className={styles.switchRow}>
      <span className={styles.switchLabel}>{label}</span>
      <button
        type="button"
        role="switch"
        aria-checked={checked}
        aria-label={label}
        className="v3-switch"
        data-on={checked}
        onClick={() => onChange(!checked)}
      >
        <span className="v3-switch-knob" />
      </button>
    </div>
  );
}

function LanguagePicker() {
  const [lang, setLang] = useLang("EN");
  return (
    <div className={styles.langSwitch}>
      {(["EN", "UA"] as Lang[]).map((code) => (
        <button
          key={code}
          type="button"
          aria-pressed={lang === code}
          onClick={() => setLang(code)}
          className={styles.langButton}
        >
          {code}
        </button>
      ))}
    </div>
  );
}
