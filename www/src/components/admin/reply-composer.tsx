"use client";

import { useActionState, useRef } from "react";
import { useFormStatus } from "react-dom";

import { sendReplyAction } from "@/actions/admin";
import { emptyFormState } from "@/lib/form-state";
import { Alert, Field, inputClasses } from "@/components/admin/ui";

function Submit() {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      className="justify-self-start rounded-full bg-amber px-8 py-3.5 font-mono text-[12px] uppercase tracking-[0.14em] text-ink transition-opacity disabled:opacity-60"
    >
      {pending ? "Sending…" : "Send reply"}
    </button>
  );
}

export function ReplyComposer({
  inquiryId,
  defaultSubject,
  recipient,
}: {
  inquiryId: string;
  defaultSubject: string;
  recipient: string;
}) {
  const formRef = useRef<HTMLFormElement>(null);
  const [state, formAction] = useActionState(
    async (prev: typeof emptyFormState, form: FormData) => {
      const result = await sendReplyAction(prev, form);
      if (result.notice) formRef.current?.reset();
      return result;
    },
    emptyFormState,
  );

  return (
    <form ref={formRef} action={formAction} className="grid gap-5">
      <input type="hidden" name="inquiryId" value={inquiryId} />

      {state.error ? <Alert tone="error">{state.error}</Alert> : null}
      {state.notice ? <Alert tone="notice">{state.notice}</Alert> : null}

      <Field label="Subject" htmlFor="subject">
        <input
          id="subject"
          name="subject"
          type="text"
          defaultValue={defaultSubject}
          className={inputClasses}
        />
      </Field>

      <Field
        label="Message"
        htmlFor="body"
        hint={`Goes to ${recipient} in the Cloud Mind Social template. Their reply comes back to your inbox.`}
      >
        <textarea
          id="body"
          name="body"
          rows={9}
          required
          placeholder="Write it the way you'd say it."
          className={`${inputClasses} resize-y`}
        />
      </Field>

      <Submit />
    </form>
  );
}
