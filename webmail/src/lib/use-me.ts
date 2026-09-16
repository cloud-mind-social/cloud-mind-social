"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { auth, ApiError, type Me } from "./api";

/** True when the API says the session is gone: signed out, expired, or suspended. */
export function isSignedOut(err: unknown): boolean {
  return err instanceof ApiError && (err.status === 401 || err.status === 403);
}

/**
 * The login page, remembering where the person was so that signing in again
 * puts them straight back. A session that dies mid-search should cost a
 * password, not the search.
 */
export function loginHref(): string {
  if (typeof window === "undefined") return "/login";
  const here = window.location.pathname + window.location.search;
  if (here === "/" || here.startsWith("/login")) return "/login";
  return `/login?next=${encodeURIComponent(here)}`;
}

export function useMe() {
  const router = useRouter();
  const [me, setMe] = useState<Me | null>(null);
  const [loading, setLoading] = useState(true);
  /**
   * Why the profile could not be loaded, when the reason is not "signed out".
   * A dead session goes to the login page instead; this is for the server
   * being down or unreachable, which deserves a message rather than a spinner
   * that never stops.
   */
  const [error, setError] = useState<string | null>(null);
  const [attempt, setAttempt] = useState(0);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);
    auth
      .me()
      .then((res) => {
        if (!cancelled) setMe(res);
      })
      .catch((err) => {
        if (cancelled) return;
        if (isSignedOut(err)) {
          router.replace(loginHref());
          return;
        }
        setError(err instanceof ApiError ? err.message : "Couldn't reach the mail server.");
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [attempt]);

  const retry = useCallback(() => setAttempt((n) => n + 1), []);

  return { me, loading, error, retry };
}
