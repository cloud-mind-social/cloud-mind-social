"use client";

import { useActionState } from "react";
import { useFormStatus } from "react-dom";

import { loginAction } from "@/actions/admin";
import { emptyFormState } from "@/lib/form-state";
import { Alert, Field, inputClasses } from "@/components/admin/ui";

function Submit({ label }: { label: string }) {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      className="w-full rounded-full bg-amber px-8 py-3.5 font-mono text-[12px] uppercase tracking-[0.14em] text-ink transition-opacity disabled:opacity-60"
    >
      {pending ? "Checking…" : label}
    </button>
  );
}

export function LoginForm({ next }: { next?: string }) {
  const [state, formAction] = useActionState(loginAction, emptyFormState);

  return (
    <form action={formAction} className="grid gap-5">
      {state.error ? <Alert tone="error">{state.error}</Alert> : null}
      <input type="hidden" name="next" value={next ?? "/admin"} />

      <Field label="Email" htmlFor="email">
        <input
          id="email"
          name="email"
          type="email"
          required
          autoComplete="username"
          autoFocus
          className={inputClasses}
        />
      </Field>

      <Field label="Password" htmlFor="password">
        <input
          id="password"
          name="password"
          type="password"
          required
          autoComplete="current-password"
          className={inputClasses}
        />
      </Field>

      <Submit label="Sign in" />
    </form>
  );
}
