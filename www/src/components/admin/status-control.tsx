"use client";

import { useActionState } from "react";

import { updateStatusAction } from "@/actions/admin";
import { emptyFormState } from "@/lib/form-state";
import { INQUIRY_STATUSES, STATUS_LABELS, type InquiryStatus } from "@/lib/inquiry-status";

export function StatusControl({
  inquiryId,
  current,
}: {
  inquiryId: string;
  current: InquiryStatus;
}) {
  const [, formAction, pending] = useActionState(updateStatusAction, emptyFormState);

  return (
    <div className="flex flex-wrap gap-2">
      {INQUIRY_STATUSES.map((status) => {
        const active = status === current;
        return (
          <form key={status} action={formAction}>
            <input type="hidden" name="inquiryId" value={inquiryId} />
            <input type="hidden" name="status" value={status} />
            <button
              type="submit"
              disabled={active || pending}
              aria-pressed={active}
              className={`rounded-full border px-4 py-2 font-mono text-[11px] uppercase tracking-[0.12em] transition-colors disabled:cursor-default ${
                active
                  ? "border-amber bg-amber text-ink"
                  : "border-line text-cream-faint hover:border-line-strong hover:text-cream disabled:opacity-50"
              }`}
            >
              {STATUS_LABELS[status]}
            </button>
          </form>
        );
      })}
    </div>
  );
}
