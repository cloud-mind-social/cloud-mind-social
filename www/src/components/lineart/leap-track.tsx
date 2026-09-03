"use client";

import { type CSSProperties } from "react";

import { useMotionAllowed } from "@/components/lineart/motion";

type LeapTrackProps = {
  /** Seconds for one crossing. */
  duration?: number;
  delay?: number;
  /** Apex of the ordinary bounds, in px. The last one goes much higher. */
  height?: number;
  className?: string;
  /** Draw the dashed ground it bounds along. */
  ground?: boolean;
};

/**
 * The runner. One dot bounds across the page — two short hops to get
 * going, then a long flat sprint into a leap that clears everything.
 * Horizontal travel and the arc are separate animations so both stay
 * on the compositor.
 */
export function LeapTrack({
  duration = 5.6,
  delay = 0,
  height = 26,
  className = "text-amber",
  ground = true,
}: LeapTrackProps) {
  const motionAllowed = useMotionAllowed();

  return (
    <div
      aria-hidden
      className={`pointer-events-none relative h-14 w-full ${className}`}
    >
      {ground ? (
        <svg
          className="absolute bottom-2 left-0 h-px w-full overflow-visible"
          preserveAspectRatio="none"
          fill="none"
        >
          <line
            className="cms-drift"
            x1="0"
            y1="0.5"
            x2="100%"
            y2="0.5"
            stroke="currentColor"
            strokeWidth="1"
            strokeOpacity="0.22"
            strokeDasharray="4 13"
            style={{ "--drift-dur": "11s" } as CSSProperties}
          />
        </svg>
      ) : null}

      {motionAllowed ? (
        <span
          className="cms-hop-x absolute bottom-2 left-0 block w-[calc(100%-8px)]"
          style={
            {
              "--hop-dur": `${duration}s`,
              "--hop-delay": `${delay}ms`,
            } as CSSProperties
          }
        >
          <span
            className="cms-hop-y block h-[8px] w-[8px] rounded-full bg-current"
            style={
              {
                "--hop-dur": `${duration}s`,
                "--hop-delay": `${delay}ms`,
                "--hop-h": `${height}px`,
              } as CSSProperties
            }
          />
        </span>
      ) : null}
    </div>
  );
}
