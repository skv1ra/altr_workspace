"use client";

import { useEffect, useId, useRef, useState, type KeyboardEvent, type ReactNode, type RefObject } from "react";
import { createPortal } from "react-dom";

function cx(...classes: Array<string | false | undefined>) {
  return classes.filter(Boolean).join(" ");
}

/**
 * Native <dialog>.showModal() is not implemented by jsdom (this repo's test
 * environment), so this is a fully-managed portal instead: manual focus
 * trap, manual Escape/backdrop handling, manual scroll lock. Verified
 * against jsdom 29.1.1 directly before choosing this approach.
 */

let openDialogCount = 0;

function registerOpenDialog() {
  if (openDialogCount > 0) {
    throw new Error("Stacked dialogs are forbidden — only one Dialog may be open at a time.");
  }
  openDialogCount += 1;
}

function unregisterOpenDialog() {
  openDialogCount = Math.max(0, openDialogCount - 1);
}

function getFocusableElements(container: HTMLElement): HTMLElement[] {
  return Array.from(
    container.querySelectorAll<HTMLElement>(
      'a[href], button:not([disabled]), textarea:not([disabled]), input:not([disabled]), select:not([disabled]), [tabindex]',
    ),
  ).filter((el) => el.tabIndex !== -1);
}

export interface DialogProps {
  open: boolean;
  onClose: () => void;
  title: string;
  description?: string;
  children: ReactNode;
  /** Info dialogs default to closing on backdrop click; destructive confirmations must pass false. */
  closeOnBackdropClick?: boolean;
  /** Element focused when the dialog opens; defaults to the panel itself. */
  initialFocusRef?: RefObject<HTMLElement>;
  /** "dark" for dialogs opened from a dark/dashboard context — flips backdrop veil + panel surface. */
  tone?: "light" | "dark";
  className?: string;
}

export function Dialog({
  open,
  onClose,
  title,
  description,
  children,
  closeOnBackdropClick = true,
  initialFocusRef,
  tone = "light",
  className,
}: DialogProps) {
  const [mounted, setMounted] = useState(false);
  const panelRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLElement | null>(null);
  const titleId = useId();
  const descId = useId();

  useEffect(() => setMounted(true), []);

  useEffect(() => {
    // Guard on `mounted` too: the portal (and its children/refs, including
    // `initialFocusRef`'s target) doesn't exist in the DOM until one render
    // after `open` first becomes true — see the SSR-safety `mounted` state.
    if (!mounted || !open) return;

    triggerRef.current = document.activeElement as HTMLElement | null;
    registerOpenDialog();

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    const focusTarget = initialFocusRef?.current ?? panelRef.current;
    focusTarget?.focus();

    return () => {
      document.body.style.overflow = previousOverflow;
      unregisterOpenDialog();
      triggerRef.current?.focus?.();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, mounted]);

  if (!mounted || !open) return null;

  function handleKeyDown(event: KeyboardEvent<HTMLDivElement>) {
    if (event.key === "Escape") {
      event.stopPropagation();
      onClose();
      return;
    }
    if (event.key !== "Tab") return;
    const panel = panelRef.current;
    if (!panel) return;
    const focusables = getFocusableElements(panel);
    if (focusables.length === 0) {
      event.preventDefault();
      return;
    }
    const first = focusables[0];
    const last = focusables[focusables.length - 1];
    if (event.shiftKey && document.activeElement === first) {
      event.preventDefault();
      last.focus();
    } else if (!event.shiftKey && document.activeElement === last) {
      event.preventDefault();
      first.focus();
    }
  }

  return createPortal(
    <div
      className={cx("dialog-backdrop", tone === "dark" && "dialog-backdrop-dark")}
      onMouseDown={(event) => {
        if (event.target === event.currentTarget && closeOnBackdropClick) onClose();
      }}
    >
      <div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        aria-describedby={description ? descId : undefined}
        tabIndex={-1}
        onKeyDown={handleKeyDown}
        className={cx(
          "dialog-panel shadow-elevated",
          tone === "dark" ? "surface-inverse" : "surface-page",
          className,
        )}
      >
        <h2 id={titleId} className="text-h3">
          {title}
        </h2>
        {description && (
          <p id={descId} className="mt-2 text-body text-text-muted">
            {description}
          </p>
        )}
        <div className="mt-6">{children}</div>
      </div>
    </div>,
    document.body,
  );
}
