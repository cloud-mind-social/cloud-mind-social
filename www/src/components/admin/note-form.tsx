"use client";

import { useActionState, useRef } from "react";
import { useFormStatus } from "react-dom";

import { addNoteAction } from "@/actions/admin";
import { emptyFormState } from "@/lib/form-state";
import { Alert, inputClasses } from "@/components/admin/ui";

function Submit() {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      className="justify-self-start rounded-full border border-line-strong px-6 py-2.5 font-mono text-[11px] uppercase tracking-[0.12em] text-cream transition-colors hover:border-amber hover:text-amber disabled:opacity-60"
    >
      {pending ? "Saving…" : "Save note"}
    </button>
  );
}

export function NoteForm({ inquiryId }: { inquiryId: string }) {
  const formRef = useRef<HTMLFormElement>(null);
  const [state, formAction] = useActionState(
    async (prev: typeof emptyFormState, form: FormData) => {
      const result = await addNoteAction(prev, form);
      if (result.notice) formRef.current?.reset();
      return result;
    },
    emptyFormState,
  );

  return (
    <form ref={formRef} action={formAction} className="grid gap-4">
      <input type="hidden" name="inquiryId" value={inquiryId} />
      {state.error ? <Alert tone="error">{state.error}</Alert> : null}
      <label htmlFor="note-body" className="sr-only">
        Private note
      </label>
      <textarea
        id="note-body"
        name="body"
        rows={3}
        required
        placeholder="Something to remember before the call…"
        className={`${inputClasses} resize-y`}
      />
      <Submit />
    </form>
  );
}
