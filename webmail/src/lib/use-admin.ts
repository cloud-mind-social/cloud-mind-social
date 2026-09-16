"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useMe } from "./use-me";

/** Redirects non-owner/admin users away. Use at the top of owner-tool pages. */
export function useRequireAdmin() {
  const router = useRouter();
  const { me, loading } = useMe();
  const isMember = !loading && me?.role === "member";

  useEffect(() => {
    if (isMember) router.replace("/mail/inbox");
  }, [isMember, router]);

  return { me, loading: loading || isMember };
}
