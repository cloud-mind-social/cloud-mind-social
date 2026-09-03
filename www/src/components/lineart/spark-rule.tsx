"use client";

import { type CSSProperties } from "react";

import { useTracedElement } from "@/components/lineart/motion";

type SparkRuleProps = {
  /** Milliseconds — only used where the browser can't drive off scroll. */
  duration?: number;
  delay?: number;
  className?: string;
  /** How much scrolling the run is spread over, under scroll timelines. */
  span?: number;
};

/**
 * A hairline that shoots across its track from the left, spark first —
 * fast off the mark, coasting, then whipping into the finish.
 */
export function SparkRule({
  duration = 1400,
  delay = 0,
  className = "text-line-strong",
  span = 42,
}: SparkRuleProps) {
  // Watched on the track, not the rule: the rule waits its turn parked
  // outside the track's clip, where an observer would never see it.
  const { ref, armed, run, scroll } = useTracedElement<HTMLSpanElement>();

  return (
    <span
      ref={ref}
      aria-hidden
      className={`cms-rule-track h-3 w-full ${className}`}
    >
      <span
        className="cms-rule absolute top-1/2 left-0 -translate-y-1/2"
        data-armed={armed || undefined}
        data-run={run || undefined}
        data-scroll={scroll || undefined}
        style={
          {
            "--rule-dur": `${duration}ms`,
            "--rule-delay": `${delay}ms`,
            "--rule-to": `${span}%`,
          } as CSSProperties
        }
      />
    </span>
  );
}
