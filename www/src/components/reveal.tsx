"use client";

import { useLayoutEffect, useRef, useState, type ReactNode } from "react";

// Content renders fully visible by default (correct for no-JS, slow-JS, and
// crawlers). Only once React has mounted and IntersectionObserver is
// confirmed available do we opt an element into the hidden "about to reveal"
// state — so a JS failure or slow load never leaves copy stuck invisible.
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
        // Overshooting easing — copy arrives the way the lines do.
        transition: `opacity 0.75s var(--ease-expo-out) ${delay}ms, transform 0.95s var(--ease-expo-out) ${delay}ms`,
      }}
    >
      {children}
    </div>
  );
}
