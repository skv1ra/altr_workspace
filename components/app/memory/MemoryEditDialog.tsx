"use client";

import { useEffect, useState, type FormEvent } from "react";
import { Button } from "@/components/ui/Button";
import { Dialog } from "@/components/ui/Dialog";
import { Field } from "@/components/ui/Field";
import { TextField } from "@/components/ui/TextField";
import { getSharedCopy } from "@/lib/i18n/copy";
import type { Lang } from "@/lib/i18n/lang-store";
import type { Memory } from "./MemoryOverview";

export interface MemoryEditDialogProps {
  memory: Memory | null;
  lang: Lang;
  saving: boolean;
  onCancel: () => void;
  onSave: (patch: { title: string; category: string; description: string; confidence: number }) => void;
}

/**
 * `category` is a plain `TextField`, not a fixed-option `Select` — the
 * real schema (`app/api/memories/[id]/route.ts`'s `updateSchema`, read,
 * not modified: `z.string().trim().min(1).max(80)`) accepts any string.
 * The dead LEGACY prototype's `MemoryEditModal.tsx` used a `<select>`
 * bound to a fictional 5-value enum that doesn't match either the real
 * schema or the real AI-extraction category set (`lib/ai/memory-
 * extraction.ts`'s own 6-value `categorySchema`) — free text is the
 * honest choice here, not a fabricated constraint.
 */
export function MemoryEditDialog({ memory, lang, saving, onCancel, onSave }: MemoryEditDialogProps) {
  const t = getSharedCopy(lang).memory;
  const [title, setTitle] = useState("");
  const [category, setCategory] = useState("");
  const [description, setDescription] = useState("");
  const [confidence, setConfidence] = useState("1");

  useEffect(() => {
    if (!memory) return;
    setTitle(memory.title);
    setCategory(memory.category);
    setDescription(memory.description);
    setConfidence(String(memory.confidence));
  }, [memory]);

  function submit(event: FormEvent) {
    event.preventDefault();
    if (!title.trim() || !category.trim() || !description.trim()) return;
    onSave({ title: title.trim(), category: category.trim(), description: description.trim(), confidence: Math.min(1, Math.max(0, Number(confidence) || 0)) });
  }

  return (
    <Dialog open={memory !== null} onClose={onCancel} title={t.editDialogTitle} tone="dark">
      <form onSubmit={submit} className="flex flex-col gap-5">
        <TextField label={t.editDialogTitleLabel} value={title} onChange={(event) => setTitle(event.target.value)} required />
        <TextField label={t.editDialogCategoryLabel} value={category} onChange={(event) => setCategory(event.target.value)} required />
        <Field label={t.editDialogDescriptionLabel}>
          {({ id, describedBy }) => (
            <textarea
              id={id}
              aria-describedby={describedBy}
              rows={6}
              required
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
    </Dialog>
  );
}
