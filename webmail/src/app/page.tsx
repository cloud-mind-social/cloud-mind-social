"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { auth } from "@/lib/api";
import { Spinner } from "@/components/ui";

export default function RootPage() {
  const router = useRouter();

  useEffect(() => {
    // Whatever the reason the profile did not load — signed out, or the API
    // unreachable — the login page is the one that can say so. Spinning here
    // forever tells the person nothing.
    auth
      .me()
      .then(() => router.replace("/mail/inbox"))
      .catch(() => router.replace("/login"));
  }, [router]);

  return (
    <div className="flex h-screen items-center justify-center bg-paper text-ink-faint">
      <Spinner className="h-5 w-5" />
    </div>
  );
}
