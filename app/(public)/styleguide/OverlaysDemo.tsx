"use client";

import { useState } from "react";
import { Button } from "@/components/ui/Button";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import { Dialog } from "@/components/ui/Dialog";
import { Menu } from "@/components/ui/Menu";
import { toast } from "@/components/ui/Toast";
import { Toaster } from "@/components/ui/Toaster";

/** Client-only demo wrapper, same pattern as ControlsDemo — real interactive
 *  behavior for the keyboard-only manual verification pass. */
export function OverlaysDemo() {
  const [infoOpen, setInfoOpen] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [typedConfirmOpen, setTypedConfirmOpen] = useState(false);

  return (
    <div className="flex flex-wrap items-center gap-4">
      <Button variant="secondary" onClick={() => setInfoOpen(true)}>
        Open info dialog
      </Button>
      <Dialog
        open={infoOpen}
        onClose={() => setInfoOpen(false)}
        title="Import complete"
        description="14 conversations were added to your memory."
      >
        <div className="flex justify-end">
          <Button variant="primary" onClick={() => setInfoOpen(false)}>
            Done
          </Button>
        </div>
      </Dialog>

      <Button variant="danger" onClick={() => setConfirmOpen(true)}>
        Delete a memory
      </Button>
      <ConfirmDialog
        open={confirmOpen}
        onClose={() => setConfirmOpen(false)}
        onConfirm={() => {
          setConfirmOpen(false);
          toast.push("Memory deleted.");
        }}
        title="Delete this memory permanently"
        description="This memory will be removed from your personal AI model. This action cannot be undone."
        confirmLabel="Delete memory"
      />

      <Button variant="danger" onClick={() => setTypedConfirmOpen(true)}>
        Delete account (typed confirm)
      </Button>
      <ConfirmDialog
        open={typedConfirmOpen}
        onClose={() => setTypedConfirmOpen(false)}
        onConfirm={() => {
          setTypedConfirmOpen(false);
          toast.push("Account deletion requested.");
        }}
        title="Delete your account permanently"
        description="This removes your profile, memory, and imports. This action cannot be undone."
        confirmLabel="Delete account"
        typedConfirmation={{ phrase: "DELETE MY ACCOUNT" }}
      />

      <Button variant="secondary" onClick={() => toast.push("Saved successfully.")}>
        Push a toast
      </Button>

      <Menu
        label="Row actions"
        items={[
          { id: "rename", label: "Rename", onSelect: () => toast.push("Renamed.") },
          { id: "archive", label: "Archive", onSelect: () => toast.push("Archived.") },
          { id: "delete", label: "Delete", onSelect: () => toast.push("Deleted.") },
        ]}
      />

      <Toaster />
    </div>
  );
}
