import Link from "next/link";
import { redirect } from "next/navigation";

import { SetupForm } from "@/components/admin/setup-form";
import { Eyebrow } from "@/components/admin/ui";
import { countAdmins } from "@/lib/auth";

export const dynamic = "force-dynamic";

export default async function SetupPage() {
  // Setup is a one-time door: it closes as soon as an account exists.
  if ((await countAdmins()) > 0) redirect("/admin/login");

  return (
    <main className="grain flex min-h-screen items-center justify-center px-6 py-16">
      <div className="w-full max-w-[440px]">
        <p className="font-mono text-[12px] uppercase tracking-[0.22em] text-cream">
          Cloud Mind Social
        </p>
        <div className="mt-10 rounded-2xl border border-line bg-ink-soft/60 p-8">
          <Eyebrow>First run</Eyebrow>
          <h1 className="mt-4 font-display text-3xl leading-tight text-cream">
            Create the owner account.
          </h1>
          <p className="mt-3 mb-8 text-[15px] leading-relaxed text-cream-dim">
            This page works once. After the account exists it redirects to sign-in.
          </p>
          <SetupForm />
        </div>
        <p className="mt-6 text-center text-[13px] text-cream-faint">
          Already set up?{" "}
          <Link href="/admin/login" className="text-sage hover:text-amber">
            Sign in
          </Link>
        </p>
      </div>
    </main>
  );
}
