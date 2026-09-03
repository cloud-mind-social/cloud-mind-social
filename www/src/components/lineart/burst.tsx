"use client";

import { useRef, type CSSProperties } from "react";

import { useInView, useMotionAllowed } from "@/components/lineart/motion";

type BurstProps = {
  /** Number of sparks thrown. */
  spokes?: number;
  /** Diameter of the burst in px. */
  size?: number;
  duration?: number;
  delay?: number;
  className?: string;
  /** Keep firing on a loop instead of once on arrival. */
  loop?: boolean;
};

/**
 * Sparks thrown out of a point when the content around it arrives.
 * Every spoke leaves at its own speed and reaches its own distance, so
 * the burst scatters instead of expanding as a tidy ring.
 */
export function Burst({
  spokes = 9,
  size = 120,
  duration = 900,
  delay = 0,
  className = "text-amber",
  loop = false,
}: BurstProps) {
  const motionAllowed = useMotionAllowed();
  const ref = useRef<HTMLSpanElement>(null);
  const inView = useInView(ref, motionAllowed, { threshold: 0.4 });

  const fire = motionAllowed && (loop || inView);
  const half = size / 2;

  return (
    <span
      ref={ref}
      aria-hidden
      className={`pointer-events-none absolute ${className}`}
      style={{
        width: size,
        height: size,
        left: "50%",
        top: "50%",
        marginLeft: -half,
        marginTop: -half,
      }}
    >
      {fire ? (
        <svg
          viewBox={`${-half} ${-half} ${size} ${size}`}
          className="h-full w-full overflow-visible"
          fill="none"
        >
          <circle
            className="cms-ring"
            r={half * 0.62}
            stroke="currentColor"
            strokeWidth={1.2}
            opacity={0.6}
            style={
              {
                "--burst-dur": `${Math.round(duration * 1.25)}ms`,
                "--burst-delay": `${delay}ms`,
                animationIterationCount: loop ? "infinite" : 1,
              } as CSSProperties
            }
          />
          {Array.from({ length: spokes }, (_, i) => {
            const angle = (i / spokes) * Math.PI * 2 - Math.PI / 2;
            // Uneven reach and stagger — an even starburst reads mechanical.
            const reach = half * (0.62 + ((i * 37) % 11) / 26);
            const inner = half * 0.16;
            return (
              <line
                key={angle}
                className="cms-spoke"
                x1={Math.cos(angle) * inner}
                y1={Math.sin(angle) * inner}
                x2={Math.cos(angle) * reach}
                y2={Math.sin(angle) * reach}
                stroke="currentColor"
                strokeWidth={1.4}
                strokeLinecap="round"
                pathLength={1}
                strokeDasharray="0.42 1"
                style={
                  {
                    "--burst-dur": `${duration + ((i * 53) % 240)}ms`,
                    "--burst-delay": `${delay + ((i * 41) % 150)}ms`,
                    animationIterationCount: loop ? "infinite" : 1,
                  } as CSSProperties
                }
              />
            );
          })}
        </svg>
      ) : null}
    </span>
  );
}
