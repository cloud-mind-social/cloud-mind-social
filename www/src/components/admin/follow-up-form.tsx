"use client";

import { useActionState } from "react";
import { useFormStatus } from "react-dom";

import { saveFollowUpAction } from "@/actions/admin";
import { Alert, Field, inputClasses } from "@/components/admin/ui";
import { emptyFormState } from "@/lib/form-state";
import {
  QUALIFICATION_LABELS,
  QUALIFICATION_OUTCOMES,
  type QualificationOutcome,
} from "@/lib/intake";

function Submit() {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      className="justify-self-start rounded-full border border-line-strong px-6 py-2.5 font-mono text-[11px] uppercase tracking-[0.12em] text-cream transition-colors hover:border-amber hover:text-amber disabled:opacity-60"
    >
      {pending ? "Saving…" : "Save follow-up"}
    </button>
  );
}

export function FollowUpForm({
  inquiryId,
  qualification,
  owner,
  nextAction,
  nextActionDue,
  defaultOwner,
}: {
  inquiryId: string;
  qualification: QualificationOutcome;
  owner: string | null;
  nextAction: string | null;
  nextActionDue: string | null;
  defaultOwner: string;
}) {
  const [state, formAction] = useActionState(saveFollowUpAction, emptyFormState);

  return (
    <form action={formAction} className="grid gap-5">
      <input type="hidden" name="inquiryId" value={inquiryId} />
      {state.error ? <Alert tone="error">{state.error}</Alert> : null}
      {state.notice ? <Alert tone="notice">{state.notice}</Alert> : null}

      <Field label="Outcome" htmlFor="qualification">
        <select
          id="qualification"
          name="qualification"
          defaultValue={qualification}
          className={inputClasses}
        >
          {QUALIFICATION_OUTCOMES.map((outcome) => (
            <option key={outcome} value={outcome}>
              {QUALIFICATION_LABELS[outcome]}
            </option>
          ))}
        </select>
      </Field>

      <Field label="Owner" htmlFor="owner" hint="The one person responsible for the next step.">
        <input
          id="owner"
          name="owner"
          type="text"
          maxLength={120}
          defaultValue={owner ?? defaultOwner}
          className={inputClasses}
        />
      </Field>

      <Field label="Next action" htmlFor="nextAction">
        <input
          id="nextAction"
          name="nextAction"
          type="text"
          maxLength={300}
          defaultValue={nextAction ?? ""}
          placeholder="Reply to confirm the review scope…"
          className={inputClasses}
        />
      </Field>

      <Field label="Due" htmlFor="nextActionDue">
        <input
          id="nextActionDue"
          name="nextActionDue"
          type="date"
          defaultValue={nextActionDue ?? ""}
          className={`${inputClasses} [color-scheme:dark]`}
        />
      </Field>

      <Submit />
    </form>
  );
}
