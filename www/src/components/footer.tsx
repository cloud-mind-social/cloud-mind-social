import { nav } from "@/lib/data";
import { LeapTrack } from "@/components/lineart/leap-track";
import { LogoBadge } from "@/components/lineart/logo-mark";
import { SparkRule } from "@/components/lineart/spark-rule";

export function Footer() {
  return (
    <footer className="bg-paper">
      <div className="mx-auto max-w-[1180px] px-6 py-14 md:px-10">
        <LeapTrack duration={6.8} height={20} className="text-sage/70" />

        <div className="mt-6 flex flex-col gap-10 md:flex-row md:items-start md:justify-between">
          <div>
            <div className="mb-6 w-[176px] text-ink-faint">
              <LogoBadge />
            </div>
            <p className="font-mono text-[13px] uppercase tracking-[0.22em] text-ink">
              Cloud Mind Social
            </p>
            <p className="mt-3 max-w-[34ch] text-sm text-ink-faint">
              Diagnosis before prescription — the right specialists, matched
              to what a business actually needs.
            </p>
          </div>

          <nav className="flex flex-wrap gap-x-8 gap-y-3">
            {nav.map((item) => (
              <a
                key={item.href}
                href={item.href}
                className="cms-link font-mono text-[11px] uppercase tracking-[0.14em] text-ink-faint transition-colors hover:text-ink"
              >
                {item.label}
              </a>
            ))}
          </nav>
        </div>

        <div className="mt-14">
          <SparkRule duration={1800} className="text-rule-strong" span={46} />
        </div>

        <div className="mt-6 flex flex-col gap-4 text-[11px] font-mono uppercase tracking-[0.1em] text-ink-faint md:flex-row md:items-center md:justify-between">
          <p>© {new Date().getFullYear()} Cloud Mind Social</p>
          <p>
            Designed by{" "}
            <a
              href="https://coastalcarolinatech.com"
              target="_blank"
              rel="noopener noreferrer"
              className="cms-link text-ink-mid transition-colors hover:text-ink"
            >
              Coastal Carolina Tech
            </a>
          </p>
          <p>Cloud · Mind · Social</p>
        </div>
      </div>
    </footer>
  );
}
