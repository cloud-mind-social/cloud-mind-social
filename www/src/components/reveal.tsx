"use client";

import { useLayoutEffect, useRef, useState, type ReactNode } from "react";

// Content renders fully visible by default (correct for no-JS, slow-JS, and
// crawlers). Anything already on screen when the page loads is left exactly
// as it arrived — the page is meant to land bare and still. Only content
// further down opts into the hidden "about to reveal" state, so it has
// something to do when the reader scrolls to it.
export function Reveal({
  children,
  delay = 0,
  from = "up",
  className = "",
}: {
  children: ReactNode;
  delay?: number;
  /** Which way it skids in from. */
  from?: "up" | "left" | "right";
  className?: string;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const [primed, setPrimed] = useState(false);
  const [visible, setVisible] = useState(false);

  useLayoutEffect(() => {
    const el = ref.current;
    if (!el || typeof IntersectionObserver === "undefined") return;
    if (window.matchMedia?.("(prefers-reduced-motion: reduce)").matches) return;
    if (el.getBoundingClientRect().top < window.innerHeight) return;

    setPrimed(true);

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setVisible(true);
          observer.disconnect();
        }
      },
      { threshold: 0.15, rootMargin: "0px 0px -8% 0px" },
    );

    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  const revealed = !primed || visible;
  const resting =
    from === "left"
      ? "translateX(-1.5rem)"
      : from === "right"
        ? "translateX(1.5rem)"
        : "translateY(1.25rem)";

  return (
    <div
      ref={ref}
      className={className}
      style={{
        opacity: revealed ? 1 : 0,
        transform: revealed ? "none" : resting,
        transition: `opacity 0.75s var(--ease-expo-out) ${delay}ms, transform 0.95s var(--ease-expo-out) ${delay}ms`,
      }}
    >
      {children}
    </div>
  );
}
