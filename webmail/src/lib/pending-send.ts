/**
 * The message that is on its way out, if there is one.
 *
 * Undo has to survive the composer: pressing Send navigates away, so the
 * component that knows about the send is gone by the time the offer to take it
 * back needs to be on screen. This is the smallest thing that outlives it — a
 * single value plus subscribers, read by a toast mounted in the mail layout.
 *
 * Deliberately not persisted. A window that survives a page reload would be a
 * lie: the server delivers on its own schedule, and an "Undo" that has already
 * expired is worse than no button at all.
 */

export interface PendingSend {
  id: string;
  subject: string;
  /** Epoch ms when the window closes and the message leaves. */
  expiresAt: number;
}

let pending: PendingSend | null = null;
const listeners = new Set<(p: PendingSend | null) => void>();

function emit() {
  for (const listener of listeners) listener(pending);
}

export function setPendingSend(next: PendingSend | null) {
  pending = next;
  emit();
}

export function getPendingSend(): PendingSend | null {
  return pending;
}

export function subscribePendingSend(listener: (p: PendingSend | null) => void) {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}
