import { logoutAction } from "@/actions/admin";
import { Wordmark } from "@/components/admin/ui";
import type { AdminUser } from "@/lib/auth";

export function AdminShell({
  admin,
  children,
}: {
  admin: AdminUser;
  children: React.ReactNode;
}) {
  return (
    <div className="grain min-h-screen">
      <header className="border-b border-line">
        <div className="mx-auto flex max-w-[1100px] items-center justify-between gap-6 px-6 py-5 md:px-10">
          <Wordmark />
          <div className="flex items-center gap-5">
            <span className="hidden font-mono text-[11px] uppercase tracking-[0.12em] text-cream-faint sm:inline">
              {admin.name}
            </span>
            <form action={logoutAction}>
              <button
                type="submit"
                className="font-mono text-[11px] uppercase tracking-[0.12em] text-cream-faint transition-colors hover:text-amber"
              >
                Sign out
              </button>
            </form>
          </div>
        </div>
      </header>
      <main className="mx-auto max-w-[1100px] px-6 py-10 md:px-10 md:py-14">
        {children}
      </main>
    </div>
  );
}
