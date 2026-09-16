"use client";

import { Suspense, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { auth, ApiError } from "@/lib/api";
import { Button, ErrorText, Input, Label, Spinner } from "@/components/ui";

function AcceptForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get("token") ?? "";
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    if (!token) {
      setError("This invite link is missing its token.");
      return;
    }
    if (password.length < 12) {
      setError("Password must be at least 12 characters.");
      return;
    }
    if (password !== confirm) {
      setError("Passwords don't match.");
      return;
    }

    setSubmitting(true);
    try {
      await auth.acceptInvite(token, password);
      router.replace("/mail/inbox");
      router.refresh();
    } catch (err) {
      if (err instanceof ApiError) {
        setError(err.status === 400 ? "This invite has expired or already been used." : err.message);
      } else {
        setError("Something went wrong. Try again.");
      }
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form onSubmit={onSubmit} className="flex w-full flex-col gap-5">
      <div>
        <Label htmlFor="password">Choose a password</Label>
        <Input
          id="password"
          type="password"
          autoComplete="new-password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
          minLength={12}
          autoFocus
        />
      </div>
      <div>
        <Label htmlFor="confirm">Confirm password</Label>
        <Input
          id="confirm"
          type="password"
          autoComplete="new-password"
          value={confirm}
          onChange={(e) => setConfirm(e.target.value)}
          required
        />
      </div>
      <ErrorText>{error}</ErrorText>
      <Button type="submit" disabled={submitting} className="mt-1 w-full">
        {submitting && <Spinner />}
        Activate mailbox
      </Button>
    </form>
  );
}

export default function AcceptInvitePage() {
  return (
    <main className="grain flex min-h-screen items-center justify-center bg-paper px-6">
      <div className="rise-in w-full max-w-[380px]">
        <div className="mb-10 text-center">
          <div className="mb-3 inline-flex items-center gap-2 text-brass">
            <span className="h-px w-8 bg-brass" />
            <span className="text-[10px] font-semibold uppercase tracking-[0.3em]">Cloud Mind Social</span>
            <span className="h-px w-8 bg-brass" />
          </div>
          <h1 className="font-display text-[2.5rem] leading-none text-ink">You&rsquo;re invited</h1>
          <p className="mt-3 text-sm text-ink-soft">Set a password to activate your mailbox</p>
        </div>
        <div className="rounded-sm border border-hairline bg-paper-raised p-8 shadow-[var(--shadow-lift)]">
          <Suspense>
            <AcceptForm />
          </Suspense>
        </div>
      </div>
    </main>
  );
}
