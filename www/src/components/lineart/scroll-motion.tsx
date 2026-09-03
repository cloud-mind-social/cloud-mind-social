"use client";

import { useEffect } from "react";

/**
 * Publishes how the page is being moved as three custom properties on
 * <html>, so any line on the site can react to it in pure CSS:
 *
 *   --page-progress  0 → 1 down the document
 *   --scroll-v       0 → 1 how hard it is being thrown right now
 *   --scroll-dir     1 down, -1 up
 *
 * The loop only runs while the page is actually moving, plus a short
 * tail so velocity can decay smoothly instead of snapping to zero.
 */
export function ScrollMotion() {
  useEffect(() => {
    if (typeof window === "undefined") return;
    if (window.matchMedia?.("(prefers-reduced-motion: reduce)").matches) return;

    const root = document.documentElement;
    let last = window.scrollY;
    let velocity = 0;
    let raf = 0;
    let quiet = 0;

    const frame = () => {
      const y = window.scrollY;
      const dy = y - last;
      last = y;

      const target = Math.min(1, Math.abs(dy) / 55);
      // Fast attack, slow release: lines leap the instant you move and
      // coast back down long after you stop.
      velocity += (target - velocity) * (target > velocity ? 0.55 : 0.07);
      if (velocity < 0.002) velocity = 0;

      const travel = Math.max(1, root.scrollHeight - window.innerHeight);
      root.style.setProperty("--page-progress", (y / travel).toFixed(4));
      root.style.setProperty("--scroll-v", velocity.toFixed(3));
      if (Math.abs(dy) > 0.4) {
        root.style.setProperty("--scroll-dir", dy > 0 ? "1" : "-1");
      }

      quiet = Math.abs(dy) < 0.4 && velocity === 0 ? quiet + 1 : 0;
      if (quiet > 8) {
        raf = 0;
        return;
      }
      raf = requestAnimationFrame(frame);
    };

    const kick = () => {
      if (raf) return;
      quiet = 0;
      raf = requestAnimationFrame(frame);
    };

    kick();
    window.addEventListener("scroll", kick, { passive: true });
    window.addEventListener("resize", kick, { passive: true });

    return () => {
      if (raf) cancelAnimationFrame(raf);
      window.removeEventListener("scroll", kick);
      window.removeEventListener("resize", kick);
    };
  }, []);

  return null;
}
