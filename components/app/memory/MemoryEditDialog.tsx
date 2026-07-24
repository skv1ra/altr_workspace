"use client";

import { useEffect, useId, useState, type FormEvent } from "react";
import { Button } from "@/components/ui/Button";
import { Dialog } from "@/components/ui/Dialog";
import { Field } from "@/components/ui/Field";
import { TextField } from "@/components/ui/TextField";
import { getSharedCopy } from "@/lib/i18n/copy";
import type { Lang } from "@/lib/i18n/lang-store";
import type { Memory } from "./MemoryOverview";
import styles from "./MemoryEditDialog.module.css";

const LIMITS = { title: 180, category: 80, description: 4000 };

export type MemoryEditorState = { mode: "create" } | { mode: "edit"; memory: Memory } | null;

export interface MemoryEditPatch {
  title: string;
  category: string;
  description: string;
  confidence: number;
}

export interface MemoryEditDialogProps {
  state: MemoryEditorState;
  lang: Lang;
  saving: boolean;
  /** Existing category names this user already has — powers the combobox's
   *  suggestion list (native `<datalist>`, free entry still always works). */
  categoryOptions: string[];
  /** Set once a save attempt 404s (the "editing a memory deleted in
   *  another tab" edge case) — renders a designed gone-state instead of a
   *  raw error and blocks further saves. */
  goneError: boolean;
  onCancel: () => void;
  onSave: (patch: MemoryEditPatch) => void;
}

/**
 * One editor for both create and edit (this prompt's own instruction #1)
 * — `state.mode` is the only thing that changes: `POST /api/memories` vs
 * `PATCH /api/memories/:id`, decided by `MemoryOverview.tsx`, not this
 * component. Every field mirrors the real server schema exactly
 * (`app/api/memories/route.ts`'s `createSchema` / `[id]/route.ts`'s
 * `updateSchema`, both read, neither modified): `maxLength` attributes are
 * the same 180/80/4000 the server enforces, with a live count so the limit
 * is visible before a save attempt ever fails, not just guarded silently.
 *
 * `category` is a native combobox (`<input list>` + `<datalist>`), not a
 * fixed-option `<select>` — the real schema accepts any string ≤80 chars,
 * so the dead LEGACY prototype's fictional 5-value enum was never a real
 * constraint (036 already established this for the plain-text version;
 * this prompt upgrades it to suggest-from-real-data + free-entry, per its
 * own "combobox over existing categories + free entry" instruction).
 */
export function MemoryEditDialog({ state, lang, saving, categoryOptions, goneError, onCancel, onSave }: MemoryEditDialogProps) {
  const t = getSharedCopy(lang).memory;
  const [title, setTitle] = useState("");
  const [category, setCategory] = useState("");
  const [description, setDescription] = useState("");
  const [confidence, setConfidence] = useState("1");
  const datalistId = useId();

  useEffect(() => {
    if (!state) return;
    if (state.mode === "edit") {
      setTitle(state.memory.title);
      setCategory(state.memory.category);
      setDescription(state.memory.description);
      setConfidence(String(state.memory.confidence));
    } else {
      setTitle("");
      setCategory("");
      setDescription("");
      setConfidence("1");
    }
  }, [state]);

  function submit(event: FormEvent) {
    event.preventDefault();
    if (!title.trim() || !category.trim() || !description.trim()) return;
    onSave({
      title: title.trim().slice(0, LIMITS.title),
      category: category.trim().slice(0, LIMITS.category),
      description: description.trim().slice(0, LIMITS.description),
      confidence: Math.min(1, Math.max(0, Number(confidence) || 0)),
    });
  }

  const dialogTitle = state?.mode === "create" ? t.createDialogTitle : t.editDialogTitle;

  return (
    <Dialog open={state !== null} onClose={onCancel} title={dialogTitle} tone="dark" className={styles.panel}>
      {goneError ? (
        <div className={styles.gone}>
          <p role="alert" className="text-body text-text-primary">
            {t.goneErrorHeading}
          </p>
          <p className="mt-2 text-label normal-case text-text-muted">{t.goneErrorBody}</p>
          <button type="button" onClick={onCancel} className="btn btn-secondary control-focus mt-6">
            {getSharedCopy(lang).common.close}
          </button>
        </div>
      ) : (
        <form onSubmit={submit} className="flex flex-col gap-5">
          <TextField
            label={t.editDialogTitleLabel}
            value={title}
            onChange={(event) => setTitle(event.target.value)}
            maxLength={LIMITS.title}
            help={`${title.length}/${LIMITS.title}`}
            required
          />
          <Field label={t.editDialogCategoryLabel} help={`${category.length}/${LIMITS.category} · ${t.categoryComboboxHint}`}>
            {({ id, describedBy }) => (
              <>
                <input
                  id={id}
                  aria-describedby={describedBy}
                  list={datalistId}
                  value={category}
                  onChange={(event) => setCategory(event.target.value)}
                  maxLength={LIMITS.category}
                  className="field-input control-focus"
                  required
                />
                <datalist id={datalistId}>
                  {categoryOptions.map((option) => (
                    <option key={option} value={option} />
                  ))}
                </datalist>
              </>
            )}
          </Field>
          <Field label={t.editDialogDescriptionLabel} help={`${description.length}/${LIMITS.description}`}>
            {({ id, describedBy }) => (
              <textarea
                id={id}
                aria-describedby={describedBy}
                rows={8}
                required
                maxLength={LIMITS.description}
                className="field-input control-focus"
                value={description}
                onChange={(event) => setDescription(event.target.value)}
              />
            )}
          </Field>
          <TextField
            label={t.editDialogConfidenceLabel}
            type="number"
            min={0}
            max={1}
            step={0.01}
            value={confidence}
            onChange={(event) => setConfidence(event.target.value)}
          />
          <div className="mt-2 flex justify-end gap-3">
            <button type="button" onClick={onCancel} className="btn btn-secondary control-focus">
              {getSharedCopy(lang).common.cancel}
            </button>
            <Button type="submit" loading={saving}>
              {t.editDialogSave}
            </Button>
          </div>
        </form>
      )}
    </Dialog>
  );
}
