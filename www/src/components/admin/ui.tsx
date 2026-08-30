import Link from "next/link";

import { STATUS_LABELS, type InquiryStatus } from "@/lib/inquiry-status";

export function Eyebrow({ children }: { children: React.ReactNode }) {
  return (
    <p className="font-mono text-[11px] uppercase tracking-[0.22em] text-sage">
      {children}
    </p>
  );
}

export function Wordmark() {
  return (
    <Link
      href="/admin"
      className="font-mono text-[12px] uppercase tracking-[0.22em] text-cream transition-colors hover:text-amber"
    >
      Cloud Mind Social
    </Link>
  );
}

const STATUS_STYLES: Record<InquiryStatus, string> = {
  new: "border-amber/50 bg-amber/15 text-amber-soft",
  reading: "border-sage/50 bg-sage/15 text-sage",
  replied: "border-line-strong bg-ink-raised text-cream-dim",
  archived: "border-line bg-transparent text-cream-faint",
};

export function StatusChip({ status }: { status: InquiryStatus }) {
  return (
    <span
      className={`inline-flex shrink-0 items-center rounded-full border px-3 py-1 font-mono text-[10px] uppercase tracking-[0.12em] ${STATUS_STYLES[status]}`}
    >
      {STATUS_LABELS[status]}
    </span>
  );
}

export function Field({
  label,
  htmlFor,
  children,
  hint,
}: {
  label: string;
  htmlFor: string;
  children: React.ReactNode;
  hint?: string;
}) {
  return (
    <div>
      <label
        htmlFor={htmlFor}
        className="mb-2 block font-mono text-[11px] uppercase tracking-[0.14em] text-cream-faint"
      >
        {label}
      </label>
      {children}
      {hint ? <p className="mt-2 text-[13px] text-cream-faint">{hint}</p> : null}
    </div>
  );
}

export const inputClasses =
  "w-full rounded-lg border border-line bg-ink-raised/60 px-4 py-3 text-[15px] text-cream placeholder:text-cream-faint outline-none transition-colors focus:border-amber";

export function Alert({
  tone,
  children,
}: {
  tone: "error" | "notice";
  children: React.ReactNode;
}) {
  const styles =
    tone === "error"
      ? "border-amber/40 bg-amber/10 text-amber-soft"
      : "border-sage/40 bg-sage/10 text-sage";
  return (
    <p role="alert" className={`rounded-lg border px-4 py-3 text-[14px] ${styles}`}>
      {children}
    </p>
  );
}
