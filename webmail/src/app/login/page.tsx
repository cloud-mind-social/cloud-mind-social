"use client";

import { Suspense, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { auth, ApiError } from "@/lib/api";
import { Button, ErrorText, Input, Label, Spinner } from "@/components/ui";

function RedirectIfAuthed() {
  const router = useRouter();
  const searchParams = useSearchParams();
  useEffect(() => {
    auth
      .me()
      .then(() => router.replace(searchParams.get("next") ?? "/mail/inbox"))
      .catch(() => {});
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  return null;
}

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [address, setAddress] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSubmitting(true);
    try {
      await auth.login(address, password);
      router.replace(searchParams.get("next") ?? "/mail/inbox");
      router.refresh();
    } catch (err) {
      if (err instanceof ApiError && err.status === 401) {
        setError("That address and password don't match.");
      } else if (err instanceof ApiError && err.status === 429) {
        setError("Too many attempts. Try again in a few minutes.");
      } else {
        setError("Something went wrong signing in. Try again in a moment.");
      }
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form onSubmit={onSubmit} className="flex w-full flex-col gap-5">
      <div>
        <Label htmlFor="address">Address</Label>
        <Input
          id="address"
          type="email"
          autoComplete="username"
          placeholder="you@cloudmindsocial.com"
          value={address}
          onChange={(e) => setAddress(e.target.value)}
          required
          autoFocus
        />
      </div>
      <div>
        <Label htmlFor="password">Password</Label>
        <Input
          id="password"
          type="password"
          autoComplete="current-password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
        />
      </div>
      <ErrorText>{error}</ErrorText>
      <Button type="submit" disabled={submitting} className="mt-1 w-full">
        {submitting && <Spinner />}
        Sign in
      </Button>
    </form>
  );
}

export default function LoginPage() {
  return (
    <main className="grain relative flex min-h-screen items-center justify-center overflow-hidden bg-paper px-6">
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 opacity-[0.06]"
        style={{
          backgroundImage:
            "repeating-linear-gradient(0deg, var(--ink) 0, var(--ink) 1px, transparent 1px, transparent 28px)",
        }}
      />

      <div className="rise-in relative w-full max-w-[380px]">
        <div className="mb-10 text-center">
          <div className="mb-3 inline-flex items-center gap-2 text-brass">
            <span className="h-px w-8 bg-brass" />
            <span className="text-[10px] font-semibold uppercase tracking-[0.3em]">Cloud Mind Social</span>
            <span className="h-px w-8 bg-brass" />
          </div>
          <h1 className="font-display text-[2.75rem] leading-none text-ink">Cloud Mind Social Mail</h1>
          <p className="mt-3 text-sm text-ink-soft">Sign in to your cloudmindsocial.com mailbox</p>
        </div>

        <div className="rounded-sm border border-hairline bg-paper-raised p-8 shadow-[var(--shadow-lift)]">
          <Suspense>
            <RedirectIfAuthed />
            <LoginForm />
          </Suspense>
        </div>

        <p className="mt-6 text-center text-xs text-ink-faint">
          Invited by the owner? Use the link in your invitation to set a password.
        </p>
      </div>
    </main>
  );
}
