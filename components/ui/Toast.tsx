export interface ToastOptions {
  duration?: number;
}

export interface ToastMessage {
  id: string;
  message: string;
  duration: number;
}

type Listener = (toasts: ToastMessage[]) => void;

let toasts: ToastMessage[] = [];
const listeners = new Set<Listener>();

function notify() {
  listeners.forEach((listener) => listener(toasts));
}

function subscribe(listener: Listener) {
  listeners.add(listener);
  listener(toasts);
  return () => {
    listeners.delete(listener);
  };
}

function push(message: string, options: ToastOptions = {}) {
  const id =
    typeof crypto !== "undefined" && "randomUUID" in crypto
      ? crypto.randomUUID()
      : `${Date.now()}-${Math.random()}`;
  toasts = [...toasts, { id, message, duration: options.duration ?? 5000 }];
  notify();
  return id;
}

function dismiss(id: string) {
  toasts = toasts.filter((item) => item.id !== id);
  notify();
}

/**
 * Module-level singleton store — survives route changes as long as
 * `<Toaster />` stays mounted somewhere persistent (root layout). Not wired
 * into app/layout.tsx yet — that's outside this prompt's file scope and no
 * screen needs real toasts yet (ADR-013: nothing half-wired ships). The
 * first screen prompt that needs toasts for real should mount `<Toaster />`
 * at the root layout.
 */
export const toast = { push, dismiss, subscribe };
