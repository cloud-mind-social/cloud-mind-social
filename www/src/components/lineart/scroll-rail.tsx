"use client";

import { type CSSProperties } from "react";

import { useMotionAllowed } from "@/components/lineart/motion";

const streaks = [
  { top: "14%", gain: 7, height: 26 },
  { top: "31%", gain: 4, height: 14 },
  { top: "52%", gain: 9, height: 34 },
  { top: "68%", gain: 5, height: 18 },
  { top: "86%", gain: 6, height: 22 },
];

/**
 * The through-line. One stroke runs the full height of the window, fills
 * in behind you as you go, and carries a marker that stretches into a
 * streak the faster the page is thrown. The gutter ticks lean with it.
 */
export function ScrollRail() {
  const motionAllowed = useMotionAllowed();
  if (!motionAllowed) return null;

  return (
    <div
      aria-hidden
      className="pointer-events-none fixed inset-y-8 left-0 z-40 hidden w-6 lg:block"
    >
      <div className="absolute inset-y-0 left-1/2 w-px -translate-x-1/2 bg-rule" />

      <div className="absolute inset-y-0 left-1/2 w-px -translate-x-1/2 overflow-hidden">
        <div className="cms-rail-fill h-full w-full bg-sage" />
      </div>

      {streaks.map((streak) => (
        <span
          key={streak.top}
          className="cms-streak absolute left-1/2 w-px -translate-x-1/2 bg-cream-faint"
          style={
            {
              top: streak.top,
              height: streak.height,
              "--streak-gain": streak.gain,
            } as CSSProperties
          }
        />
      ))}

      <span className="cms-rail-runner absolute left-1/2 -ml-[3px] h-[7px] w-[7px] rounded-full bg-amber" />
    </div>
  );
}
