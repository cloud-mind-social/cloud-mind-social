"use client";

import { useActionState } from "react";
import { useFormStatus } from "react-dom";

import { setupAction } from "@/actions/admin";
import { emptyFormState } from "@/lib/form-state";
import { Alert, Field, inputClasses } from "@/components/admin/ui";

function Submit() {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      className="w-full rounded-full bg-amber px-8 py-3.5 font-mono text-[12px] uppercase tracking-[0.14em] text-ink transition-opacity disabled:opacity-60"
    >
      {pending ? "Creating…" : "Create the account"}
    </button>
  );
}

export function SetupForm() {
  const [state, formAction] = useActionState(setupAction, emptyFormState);

  return (
    <form action={formAction} className="grid gap-5">
      {state.error ? <Alert tone="error">{state.error}</Alert> : null}

      <Field
        label="Setup token"
        htmlFor="token"
        hint="The ADMIN_SETUP_TOKEN secret set on the Worker."
      >
        <input id="token" name="token" type="password" required className={inputClasses} />
      </Field>

      <Field
        label="Your name"
        htmlFor="name"
        hint="Replies you send are signed with this."
      >
        <input
          id="name"
          name="name"
          type="text"
          required
          autoComplete="name"
          className={inputClasses}
        />
      </Field>

      <Field label="Email" htmlFor="email">
        <input
          id="email"
          name="email"
          type="email"
          required
          autoComplete="username"
          className={inputClasses}
        />
      </Field>

      <Field label="Password" htmlFor="password" hint="At least 12 characters.">
        <input
          id="password"
          name="password"
          type="password"
          required
          autoComplete="new-password"
          className={inputClasses}
        />
      </Field>

      <Field label="Confirm password" htmlFor="confirm">
        <input
          id="confirm"
          name="confirm"
          type="password"
          required
          autoComplete="new-password"
          className={inputClasses}
        />
      </Field>

      <Submit />
    </form>
  );
}
