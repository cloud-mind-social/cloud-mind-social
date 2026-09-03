"use client";

import { type CSSProperties } from "react";

import { useAmbient } from "@/components/lineart/ambient";
import {
  roundedRectPath,
  useBoxSize,
  useTracedElement,
} from "@/components/lineart/motion";

type TraceFrameProps = {
  /** Corner radius in px, matched to the content it wraps. */
  radius?: number;
  strokeWidth?: number;
  /** Milliseconds — only used where the browser can't drive off scroll. */
  duration?: number;
  delay?: number;
  /** Which way the pen runs around the box. */
  direction?: "fwd" | "rev";
  /** A short dash that keeps running laps once the box is drawn. */
  runner?: boolean;
  runnerDuration?: number;
  runnerDelay?: number;
  /** Ticks at the corners, like registration marks on a drawing. */
  corners?: boolean;
  className?: string;
  runnerClassName?: string;
};

/**
 * Draws the border of whatever it is dropped into — the parent needs
 * `relative`. Un-armed (no JS, reduced motion) it renders a plain drawn
 * rectangle, so the box always has an edge; armed, a pen races that edge.
 */
export function TraceFrame({
  radius = 16,
  strokeWidth = 1,
  duration = 1500,
  delay = 0,
  direction = "fwd",
  runner = false,
  runnerDuration = 7000,
  runnerDelay = 0,
  corners = false,
  className = "text-rule",
  runnerClassName = "text-amber",
}: TraceFrameProps) {
  const { ref, armed, run, scroll } = useTracedElement<SVGSVGElement>();
  const size = useBoxSize(ref);
  // Only frames carrying a sprite need parking when they scroll away.
  useAmbient(ref, runner);

  const measured = size.width > 0 && size.height > 0;
  const live = armed && measured;
  const d = roundedRectPath(size.width, size.height, radius, strokeWidth / 2);

  return (
    <svg
      ref={ref}
      aria-hidden
      className={`cms-frame pointer-events-none absolute inset-0 h-full w-full overflow-visible ${className}`}
      fill="none"
    >
      {/* The plain edge: what everyone sees before the pen picks it up. */}
      {live && d ? null : (
        <rect
          x={strokeWidth / 2}
          y={strokeWidth / 2}
          width="100%"
          height="100%"
          rx={radius}
          stroke="currentColor"
          strokeWidth={strokeWidth}
        />
      )}

      {d ? (
        <path
          className="cms-trace"
          d={d}
          pathLength={1}
          stroke="currentColor"
          strokeWidth={strokeWidth}
          strokeLinejoin="round"
          data-armed={live || undefined}
          data-run={run || undefined}
          data-scroll={scroll || undefined}
          data-dir={direction === "rev" ? "rev" : undefined}
          style={
            {
              "--trace-dur": `${duration}ms`,
              "--trace-delay": `${delay}ms`,
            } as CSSProperties
          }
        />
      ) : null}

      {d && runner && live ? (
        <path
          className={`cms-lap ${runnerClassName}`}
          d={d}
          pathLength={1}
          stroke="currentColor"
          strokeWidth={strokeWidth + 0.4}
          strokeLinecap="round"
          strokeDasharray="0.1 0.9"
          style={
            {
              "--lap-dur": `${runnerDuration}ms`,
              "--lap-delay": `${runnerDelay}ms`,
              "--lap-weight": `${strokeWidth + 0.4}px`,
            } as CSSProperties
          }
        />
      ) : null}

      {corners && live ? (
        <CornerTicks
          width={size.width}
          height={size.height}
          run={run}
          scroll={scroll}
        />
      ) : null}
    </svg>
  );
}

function CornerTicks({
  width,
  height,
  run,
  scroll,
}: {
  width: number;
  height: number;
  run: boolean;
  scroll: boolean;
}) {
  const t = 10;
  const marks = [
    `M 0 ${t} V 0 H ${t}`,
    `M ${width - t} 0 H ${width} V ${t}`,
    `M ${width} ${height - t} V ${height} H ${width - t}`,
    `M ${t} ${height} H 0 V ${height - t}`,
  ];

  return (
    <g className="text-amber" opacity={0.75}>
      {marks.map((d, i) => (
        <path
          key={d}
          className="cms-trace"
          d={d}
          pathLength={1}
          stroke="currentColor"
          strokeWidth={1.4}
          data-armed="true"
          data-run={run || undefined}
          data-scroll={scroll || undefined}
          style={
            {
              "--trace-dur": "620ms",
              "--trace-delay": `${420 + i * 110}ms`,
              "--trace-from": "10%",
              "--trace-to": `${34 + i * 5}%`,
            } as CSSProperties
          }
        />
      ))}
    </g>
  );
}
