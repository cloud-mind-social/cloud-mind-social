import { redirect } from "next/navigation";

import { LoginForm } from "@/components/admin/login-form";
import { Eyebrow } from "@/components/admin/ui";
import { countAdmins, getCurrentAdmin } from "@/lib/auth";

export const dynamic = "force-dynamic";

export default async function LoginPage({ searchParams }: PageProps<"/admin/login">) {
  if (await getCurrentAdmin()) redirect("/admin");
  if ((await countAdmins()) === 0) redirect("/admin/setup");

  const params = await searchParams;
  const raw = params.next;
  const next = typeof raw === "string" && raw.startsWith("/admin") ? raw : "/admin";

  return (
    <main className="grain flex min-h-screen items-center justify-center px-6 py-16">
      <div className="w-full max-w-[420px]">
        <p className="font-mono text-[12px] uppercase tracking-[0.22em] text-cream">
          Cloud Mind Social
        </p>
        <div className="mt-10 rounded-2xl border border-line bg-ink-soft/60 p-8">
          <Eyebrow>Inbox</Eyebrow>
          <h1 className="mt-4 mb-8 font-display text-3xl leading-tight text-cream">
            Sign in.
          </h1>
          <LoginForm next={next} />
        </div>
        <p className="mt-8 text-center font-mono text-[11px] uppercase tracking-[0.1em] text-cream-faint">
          Cloud · Mind · Social
        </p>
      </div>
    </main>
  );
}
