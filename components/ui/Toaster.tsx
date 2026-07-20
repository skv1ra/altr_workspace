"use client";

import { X } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { toast, type ToastMessage } from "./Toast";

function ToastCard({ item }: { item: ToastMessage }) {
  const [paused, setPaused] = useState(false);
  const remainingRef = useRef(item.duration);
  const startRef = useRef(Date.now());
  const timerRef = useRef<ReturnType<typeof setTimeout>>();

  useEffect(() => {
    if (paused) {
      clearTimeout(timerRef.current);
      remainingRef.current -= Date.now() - startRef.current;
      return;
    }
    startRef.current = Date.now();
    timerRef.current = setTimeout(() => toast.dismiss(item.id), Math.max(remainingRef.current, 0));
    return () => clearTimeout(timerRef.current);
  }, [paused, item.id]);

  return (
    <div
      role="status"
      aria-live="polite"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      onFocus={() => setPaused(true)}
      onBlur={() => setPaused(false)}
      className="toast-card surface-inverse"
    >
      <p className="flex-1 text-body">{item.message}</p>
      <button
        type="button"
        onClick={() => toast.dismiss(item.id)}
        aria-label="Dismiss notification"
        className="toast-dismiss control-focus"
      >
        <X className="h-4 w-4" aria-hidden="true" />
      </button>
    </div>
  );
}

/** Positioned bottom-right, fixed — never over the left-aligned primary CTA
 *  per DESIGN_DIRECTION's editorial layout. */
export function Toaster() {
  const [items, setItems] = useState<ToastMessage[]>([]);

  useEffect(() => toast.subscribe(setItems), []);

  if (items.length === 0) return null;

  return (
    <div className="toast-region" aria-label="Notifications">
      {items.map((item) => (
        <ToastCard key={item.id} item={item} />
      ))}
    </div>
  );
}
