import { nav } from "@/lib/data";

export function Footer() {
  return (
    <footer className="bg-ink">
      <div className="mx-auto max-w-[1180px] px-6 py-14 md:px-10">
        <div className="flex flex-col gap-10 md:flex-row md:items-start md:justify-between">
          <div>
            <p className="font-mono text-[13px] uppercase tracking-[0.22em] text-cream">
              Cloud Mind Social
            </p>
            <p className="mt-3 max-w-[34ch] text-sm text-cream-faint">
              Diagnosis before prescription — the right specialists, matched
              to what a business actually needs.
            </p>
          </div>

          <nav className="flex flex-wrap gap-x-8 gap-y-3">
            {nav.map((item) => (
              <a
                key={item.href}
                href={item.href}
                className="font-mono text-[11px] uppercase tracking-[0.14em] text-cream-faint transition-colors hover:text-cream"
              >
                {item.label}
              </a>
            ))}
          </nav>
        </div>

        <div className="mt-14 flex flex-col gap-4 border-t border-line pt-8 text-[11px] font-mono uppercase tracking-[0.1em] text-cream-faint md:flex-row md:items-center md:justify-between">
          <p>© {new Date().getFullYear()} Cloud Mind Social</p>
          <p>Cloud · Mind · Social</p>
        </div>
      </div>
    </footer>
  );
}
