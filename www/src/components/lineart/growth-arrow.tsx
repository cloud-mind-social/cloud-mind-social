"use client";

import { type CSSProperties } from "react";

import { useTracedElement } from "@/components/lineart/motion";

const CLIMB = "M 4 52 L 28 36 L 46 45 L 74 16 L 116 5";
const ARROWHEAD = "M 111.4 12.3 L 116 5 L 107.6 3.7";

const vertices = [
  { cx: 28, cy: 36, r: 3 },
  { cx: 46, cy: 45, r: 3 },
  { cx: 74, cy: 16, r: 3.4 },
];

/**
 * The logo's growth arrow, at size. Each leg of the climb is covered
 * faster than the one before it, so it gathers pace uphill rather than
 * arriving at an even trot — then throws the head off the end.
 */
export function GrowthArrow({
  className = "text-amber",
  nodeClassName = "text-sage",
}: {
  className?: string;
  nodeClassName?: string;
}) {
  const { ref, armed, run, scroll } = useTracedElement<SVGSVGElement>();

  return (
    <svg
      ref={ref}
      aria-hidden
      viewBox="0 0 124 58"
      className={`cms-frame w-full overflow-visible ${className}`}
      fill="none"
    >
      <path
        className="cms-trace"
        d={CLIMB}
        pathLength={1}
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
        data-armed={armed || undefined}
        data-run={run || undefined}
        data-scroll={scroll || undefined}
        data-dir="climb"
        style={
          { "--trace-dur": "1500ms", "--trace-to": "40%" } as CSSProperties
        }
      />
      <path
        className={run ? "cms-pop" : undefined}
        d={ARROWHEAD}
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
        style={{ "--pop-delay": "1400ms", "--pop-dur": "620ms" } as CSSProperties}
      />

      <g className={nodeClassName}>
        {vertices.map((v, i) => (
          <circle
            key={v.cx}
            className={run ? "cms-pop" : undefined}
            cx={v.cx}
            cy={v.cy}
            r={v.r}
            fill="var(--color-paper)"
            stroke="currentColor"
            strokeWidth="1.4"
            style={{ "--pop-delay": `${420 + i * 190}ms` } as CSSProperties}
          />
        ))}
      </g>
    </svg>
  );
}
