"use client";

import { type CSSProperties } from "react";

import { useBoxSize, useTracedElement } from "@/components/lineart/motion";

/**
 * A single vertical stroke that draws itself down a list — bolting
 * between the first few items and easing into the last. Fills its
 * parent, which should be a `relative` 1px-wide box.
 */
export function Spine({
  className = "text-rule-strong",
  duration = 2400,
}: {
  className?: string;
  duration?: number;
}) {
  const { ref, armed, run, scroll } = useTracedElement<SVGSVGElement>();
  const size = useBoxSize(ref);

  const live = armed && size.height > 0;

  return (
    <svg
      ref={ref}
      aria-hidden
      className={`cms-frame absolute inset-0 h-full w-full overflow-visible ${className}`}
      fill="none"
      preserveAspectRatio="none"
    >
      {live ? null : (
        <line
          x1="0.5"
          y1="0"
          x2="0.5"
          y2="100%"
          stroke="currentColor"
          strokeWidth="1"
        />
      )}

      {live ? (
        <path
          className="cms-trace"
          d={`M 0.5 0 V ${size.height}`}
          pathLength={1}
          stroke="currentColor"
          strokeWidth="1"
          data-armed="true"
          data-run={run || undefined}
          data-scroll={scroll || undefined}
          style={
            {
              "--trace-dur": `${duration}ms`,
              "--trace-to": "62%",
            } as CSSProperties
          }
        />
      ) : null}
    </svg>
  );
}
