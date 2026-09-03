"use client";

import { useEffect } from "react";

const WAKE_EVENTS = [
  "scroll",
  "pointermove",
  "pointerdown",
  "touchstart",
  "keydown",
  "wheel",
] as const;

/**
 * The page arrives as a still drawing and stays that way until the
 * reader does something — scrolls, points, taps, or tabs into it. From
 * that moment `data-awake` is set on <html> and every line on the site
 * is allowed to move. Nothing animates at somebody who hasn't arrived.
 */
export function PageLife() {
  useEffect(() => {
    const root = document.documentElement;
    if (root.dataset.awake === "true") return;

    // Landing part-way down (a #hash, a restored position) already
    // counts as having moved through the page.
    if (window.scrollY > 4) {
      root.dataset.awake = "true";
      return;
    }

    const wake = () => {
      root.dataset.awake = "true";
      for (const event of WAKE_EVENTS) {
        window.removeEventListener(event, wake);
      }
    };

    for (const event of WAKE_EVENTS) {
      window.addEventListener(event, wake, { passive: true, once: false });
    }

    return () => {
      for (const event of WAKE_EVENTS) {
        window.removeEventListener(event, wake);
      }
    };
  }, []);

  return null;
}
