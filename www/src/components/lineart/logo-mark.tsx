"use client";

import { useRef, type CSSProperties } from "react";

import { useInView, useMotionAllowed } from "@/components/lineart/motion";

/**
 * The house mark, drawn the way the logo is drawn — one stroke weight,
 * open circle nodes, and the zigzag that climbs out of the cloud and
 * keeps going. On load the cloud traces itself, the climb accelerates
 * uphill, the arrowhead pops, and a sprite keeps running the outline.
 */

const CLOUD =
  "M 10 25 C 4 25, 1.5 20, 5 16.5 C 3 11, 8 6.5, 12.5 9 " +
  "C 15 3, 23.5 2.5, 26.5 8.5 C 31 5, 37.5 8, 36.5 13.5 " +
  "C 42 13.5, 43 24.5, 36 25 Z";

const CLIMB = "M 8.5 21 L 14 15.5 L 18.5 19.5 L 26 10 L 40.5 2.5";
const ARROWHEAD = "M 37.1 7.9 L 40.5 2.5 L 34.2 2.2";
const LINK = "M 21.6 6.8 L 25.3 9.4";

const nodes = [
  { cx: 14, cy: 15.5, r: 1.7, delay: 900 },
  { cx: 18.5, cy: 19.5, r: 1.7, delay: 1000 },
  { cx: 21, cy: 6, r: 1.5, delay: 1100 },
];

export function LogoMark({
  className = "text-sage",
  climbClassName = "text-amber",
}: {
  className?: string;
  climbClassName?: string;
}) {
  const live = useMotionAllowed();

  const trace = (delay: number, duration: number): CSSProperties =>
    ({ "--trace-dur": `${duration}ms`, "--trace-delay": `${delay}ms` }) as CSSProperties;

  return (
    <svg
      aria-hidden
      viewBox="0 0 46 30"
      className={`h-7 w-[46px] shrink-0 overflow-visible ${className}`}
      fill="none"
    >
      <path
        className="cms-trace"
        d={CLOUD}
        pathLength={1}
        stroke="currentColor"
        strokeWidth="1.4"
        strokeLinejoin="round"
        data-armed={live || undefined}
        data-run={live || undefined}
        style={trace(120, 1500)}
      />

      {live ? (
        <path
          className="cms-lap"
          d={CLOUD}
          pathLength={1}
          stroke="currentColor"
          strokeWidth="1.8"
          strokeLinecap="round"
          strokeDasharray="0.1 0.9"
          data-boost="true"
          style={{ "--lap-dur": "6.5s", "--lap-weight": "1.8px" } as CSSProperties}
        />
      ) : null}

      <g className={climbClassName}>
        <path
          className="cms-trace"
          d={LINK}
          pathLength={1}
          stroke="currentColor"
          strokeWidth="1"
          strokeOpacity="0.6"
          data-armed={live || undefined}
          data-run={live || undefined}
          style={trace(760, 400)}
        />
        <path
          className="cms-trace"
          d={CLIMB}
          pathLength={1}
          stroke="currentColor"
          strokeWidth="1.5"
          strokeLinecap="round"
          strokeLinejoin="round"
          data-armed={live || undefined}
          data-run={live || undefined}
          data-dir="climb"
          style={trace(520, 1100)}
        />
        <path
          className={`cms-climb-head ${live ? "cms-pop" : ""}`}
          d={ARROWHEAD}
          stroke="currentColor"
          strokeWidth="1.5"
          strokeLinecap="round"
          strokeLinejoin="round"
          style={{ "--pop-delay": "1560ms", "--pop-dur": "620ms" } as CSSProperties}
        />
      </g>

      {nodes.map((node) => (
        <circle
          key={`${node.cx}-${node.cy}`}
          className={live ? "cms-pop" : undefined}
          cx={node.cx}
          cy={node.cy}
          r={node.r}
          fill="var(--color-paper)"
          stroke="currentColor"
          strokeWidth="1.2"
          style={{ "--pop-delay": `${node.delay}ms` } as CSSProperties}
        />
      ))}
    </svg>
  );
}

/* ------------------------------------------------------------------ */

const BADGE_CLOUD =
  "M 20 50 C 10 50, 4 43, 9.5 36 C 5.5 26, 15 17, 22.5 21.5 " +
  "C 26 9, 44 7, 50 18 C 59 11, 75 16, 73 26 C 85 26, 88 46, 76 50 Z";

const BADGE_CLIMB = "M 14 46 L 26 40 L 33 45 L 44 26 L 92 3";
const BADGE_ARROWHEAD = "M 87.4 9.6 L 92 3 L 84 2.4";

const bubbles = [
  { x: 17, y: 21, w: 19, h: 12, tail: "M 22 33 L 19 38 L 28 33", delay: 1500 },
  { x: 52, y: 32, w: 22, h: 12, tail: "M 57 44 L 55 49 L 63 44", delay: 1750 },
];

const badgeNodes = [
  { cx: 39, cy: 23, r: 2 },
  { cx: 44, cy: 18, r: 2.2 },
  { cx: 49, cy: 13.5, r: 1.8 },
];

const badgeLinks = ["M 40.4 21.6 L 42.4 19.6", "M 45.6 16.5 L 47.7 14.7"];

/** A rounded rectangle drawn clockwise from just past the top-left corner. */
function bubblePath(w: number, h: number, r: number) {
  return [
    `M ${r} 0`,
    `H ${w - r}`,
    `A ${r} ${r} 0 0 1 ${w} ${r}`,
    `V ${h - r}`,
    `A ${r} ${r} 0 0 1 ${w - r} ${h}`,
    `H ${r}`,
    `A ${r} ${r} 0 0 1 0 ${h - r}`,
    `V ${r}`,
    `A ${r} ${r} 0 0 1 ${r} 0`,
    "Z",
  ].join(" ");
}

/**
 * The mark at a size where the rest of the logo's furniture fits: the
 * speech bubbles (dots taking their turn), the node cluster, and the
 * climb breaking out through the top of the cloud.
 */
export function LogoBadge({
  className = "text-ink-faint",
  climbClassName = "text-amber",
}: {
  className?: string;
  climbClassName?: string;
}) {
  const motionAllowed = useMotionAllowed();
  // Its own choreography, so it waits to be looked at rather than being
  // scrubbed: cloud, then network, then bubbles, then the climb out.
  const ref = useRef<SVGSVGElement>(null);
  const on = useInView(ref, motionAllowed, { threshold: 0.35 });

  const trace = (delay: number, duration: number): CSSProperties =>
    ({ "--trace-dur": `${duration}ms`, "--trace-delay": `${delay}ms` }) as CSSProperties;

  return (
    <svg
      ref={ref}
      aria-hidden
      viewBox="0 0 96 58"
      className={`w-full overflow-visible ${className}`}
      fill="none"
    >
      <path
        className="cms-trace"
        d={BADGE_CLOUD}
        pathLength={1}
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinejoin="round"
        data-armed={on || undefined}
        data-run={on || undefined}
        style={trace(150, 2200)}
      />

      {on ? (
        <path
          className="cms-lap"
          d={BADGE_CLOUD}
          pathLength={1}
          stroke="currentColor"
          strokeWidth="1.9"
          strokeLinecap="round"
          strokeDasharray="0.08 0.92"
          data-boost="true"
          style={{ "--lap-dur": "9s", "--lap-weight": "1.9px" } as CSSProperties}
        />
      ) : null}

      {badgeLinks.map((d, i) => (
        <path
          key={d}
          className="cms-trace"
          d={d}
          pathLength={1}
          stroke="currentColor"
          strokeWidth="1"
          strokeOpacity="0.65"
          data-armed={on || undefined}
          data-run={on || undefined}
          style={trace(1000 + i * 120, 420)}
        />
      ))}

      {badgeNodes.map((node, i) => (
        <circle
          key={`${node.cx}-${node.cy}`}
          className={on ? "cms-pop" : undefined}
          cx={node.cx}
          cy={node.cy}
          r={node.r}
          fill="var(--color-paper)"
          stroke="currentColor"
          strokeWidth="1.2"
          style={{ "--pop-delay": `${1150 + i * 110}ms` } as CSSProperties}
        />
      ))}

      {bubbles.map((bubble) => (
        <g key={bubble.tail} className="text-sage">
          <g transform={`translate(${bubble.x} ${bubble.y})`}>
            <path
              className="cms-trace"
              d={bubblePath(bubble.w, bubble.h, 6)}
              pathLength={1}
              stroke="currentColor"
              strokeWidth="1.2"
              data-armed={on || undefined}
              data-run={on || undefined}
              style={trace(bubble.delay, 900)}
            />
          </g>
          <path
            className="cms-trace"
            d={bubble.tail}
            pathLength={1}
            stroke="currentColor"
            strokeWidth="1.2"
            strokeLinejoin="round"
            data-armed={on || undefined}
            data-run={on || undefined}
            style={trace(bubble.delay + 260, 420)}
          />
          {[0.26, 0.5, 0.74].map((t, i) => (
            <circle
              key={t}
              className={on ? "cms-dot" : undefined}
              cx={bubble.x + bubble.w * t}
              cy={bubble.y + bubble.h / 2}
              r="1.3"
              fill="currentColor"
              style={
                {
                  "--dot-delay": `${bubble.delay + 700 + i * 160}ms`,
                } as CSSProperties
              }
            />
          ))}
        </g>
      ))}

      <g className={climbClassName}>
        <path
          className="cms-trace"
          d={BADGE_CLIMB}
          pathLength={1}
          stroke="currentColor"
          strokeWidth="1.7"
          strokeLinecap="round"
          strokeLinejoin="round"
          data-armed={on || undefined}
          data-run={on || undefined}
          data-dir="climb"
          style={trace(700, 1500)}
        />
        <path
          className={on ? "cms-pop" : undefined}
          d={BADGE_ARROWHEAD}
          stroke="currentColor"
          strokeWidth="1.7"
          strokeLinecap="round"
          strokeLinejoin="round"
          style={{ "--pop-delay": "2150ms", "--pop-dur": "640ms" } as CSSProperties}
        />
      </g>
    </svg>
  );
}
