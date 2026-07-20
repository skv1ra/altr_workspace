"use client";

import { useEffect, useRef, useState } from "react";
import { Button } from "./Button";
import { Dialog } from "./Dialog";
import { TextField } from "./TextField";

export interface TypedConfirmation {
  /** Exact phrase the user must type, e.g. "DELETE MY ACCOUNT". */
  phrase: string;
  label?: string;
}

export interface ConfirmDialogProps {
  open: boolean;
  onClose: () => void;
  onConfirm: () => void;
  /**
   * Must name the specific, permanent action — e.g. "Delete this memory
   * permanently". Never a generic "Are you sure?" (security requirement).
   */
  title: string;
  description?: string;
  confirmLabel?: string;
  cancelLabel?: string;
  loading?: boolean;
  typedConfirmation?: TypedConfirmation;
  tone?: "light" | "dark";
}

/** Destructive confirmation: cancel gets initial focus, backdrop click never
 *  closes it (only Escape or an explicit button does). */
export function ConfirmDialog({
  open,
  onClose,
  onConfirm,
  title,
  description,
  confirmLabel = "Delete",
  cancelLabel = "Cancel",
  loading = false,
  typedConfirmation,
  tone = "light",
}: ConfirmDialogProps) {
  const cancelRef = useRef<HTMLButtonElement>(null);
  const [typedValue, setTypedValue] = useState("");

  useEffect(() => {
    if (!open) setTypedValue("");
  }, [open]);

  useEffect(() => {
    if (process.env.NODE_ENV !== "production" && /are you sure/i.test(title)) {
      console.warn(
        `ConfirmDialog title "${title}" is generic — name the specific, permanent action instead (e.g. "Delete this memory permanently").`,
      );
    }
  }, [title]);

  const confirmDisabled = loading || (typedConfirmation ? typedValue !== typedConfirmation.phrase : false);

  return (
    <Dialog
      open={open}
      onClose={onClose}
      title={title}
      description={description}
      closeOnBackdropClick={false}
      initialFocusRef={cancelRef}
      tone={tone}
    >
      {typedConfirmation && (
        <div className="mb-6">
          <TextField
            label={typedConfirmation.label ?? `Type "${typedConfirmation.phrase}" to confirm`}
            value={typedValue}
            onChange={(event) => setTypedValue(event.target.value)}
            autoComplete="off"
            spellCheck={false}
          />
        </div>
      )}
      <div className="flex justify-end gap-3">
        <button ref={cancelRef} type="button" onClick={onClose} className="btn btn-secondary control-focus">
          {cancelLabel}
        </button>
        <Button variant="danger" onClick={onConfirm} disabled={confirmDisabled} loading={loading}>
          {confirmLabel}
        </Button>
      </div>
    </Dialog>
  );
}
