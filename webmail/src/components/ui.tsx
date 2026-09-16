import { forwardRef } from "react";
import type { ButtonHTMLAttributes, InputHTMLAttributes, TextareaHTMLAttributes } from "react";
import { cn } from "@/lib/cn";

export const Button = forwardRef<
  HTMLButtonElement,
  ButtonHTMLAttributes<HTMLButtonElement> & { variant?: "primary" | "ghost" | "danger" }
>(function Button({ className, variant = "primary", ...props }, ref) {
  return (
    <button
      ref={ref}
      className={cn(
        "inline-flex items-center justify-center gap-2 rounded-sm px-4 py-2 text-sm font-medium tracking-wide transition-colors duration-150 disabled:cursor-not-allowed disabled:opacity-50",
        variant === "primary" &&
          "bg-accent text-paper hover:bg-accent-strong active:bg-accent-strong",
        variant === "ghost" &&
          "border border-hairline bg-transparent text-ink hover:border-hairline-strong hover:bg-paper-raised",
        variant === "danger" && "bg-danger text-paper hover:opacity-90",
        className,
      )}
      {...props}
    />
  );
});

export const Input = forwardRef<HTMLInputElement, InputHTMLAttributes<HTMLInputElement>>(
  function Input({ className, ...props }, ref) {
    return (
      <input
        ref={ref}
        className={cn(
          "w-full rounded-sm border border-hairline bg-paper-raised px-3 py-2 text-sm text-ink placeholder:text-ink-faint outline-none transition-colors focus:border-accent",
          className,
        )}
        {...props}
      />
    );
  },
);

export const Textarea = forwardRef<HTMLTextAreaElement, TextareaHTMLAttributes<HTMLTextAreaElement>>(
  function Textarea({ className, ...props }, ref) {
    return (
      <textarea
        ref={ref}
        className={cn(
          "w-full rounded-sm border border-hairline bg-paper-raised px-3 py-2 text-sm text-ink placeholder:text-ink-faint outline-none transition-colors focus:border-accent",
          className,
        )}
        {...props}
      />
    );
  },
);

export function Label({ className, ...props }: React.LabelHTMLAttributes<HTMLLabelElement>) {
  return (
    <label
      className={cn("mb-1.5 block text-xs font-medium uppercase tracking-[0.08em] text-ink-soft", className)}
      {...props}
    />
  );
}

export function ErrorText({ children }: { children?: string | null }) {
  if (!children) return null;
  return (
    <p className="rounded-sm border border-danger/30 bg-danger-soft px-3 py-2 text-sm text-danger" role="alert">
      {children}
    </p>
  );
}

export function Spinner({ className }: { className?: string }) {
  return (
    <svg
      className={cn("animate-spin", className)}
      width="16"
      height="16"
      viewBox="0 0 16 16"
      fill="none"
      aria-hidden
    >
      <circle cx="8" cy="8" r="6.5" stroke="currentColor" strokeOpacity="0.25" strokeWidth="1.5" />
      <path d="M14.5 8a6.5 6.5 0 0 0-6.5-6.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  );
}
