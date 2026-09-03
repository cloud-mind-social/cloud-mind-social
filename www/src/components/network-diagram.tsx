"use client";

import { type CSSProperties } from "react";

import { useMotionAllowed } from "@/components/lineart/motion";

const specialists = [
  { y: 52, label: "STRATEGY" },
  { y: 128, label: "CONTENT" },
  { y: 204, label: "PAID MEDIA" },
  { y: 280, label: "COMMUNITY" },
  { y: 356, label: "BRAND SYSTEMS" },
];

const paths = [
  { y: 76, label: "01", matched: false },
  { y: 162, label: "02", matched: false },
  { y: 248, label: "03", matched: true },
  { y: 334, label: "04", matched: false },
];

const CENTER = { x: 380, y: 204 };
const LEFT_X = 118;
const RIGHT_X = 630;

/** The loose lap the line runs around the whole drawing, forever. */
const ORBIT =
  "M 62 300 C 40 150, 210 22, 380 34 C 560 46, 726 122, 714 236 C 704 340, 540 400, 372 388 C 214 377, 82 392, 62 300 Z";

const sparks = [0, 1, 2, 3, 4, 5, 6, 7];

/** Where a cubic curve is at its halfway point, for hanging a node on. */
function midpoint(x0: number, y0: number) {
  return { x: 242.5, y: (y0 + CENTER.y) / 2, from: x0 };
}

export function NetworkDiagram() {
  const live = useMotionAllowed();

  const stroke = (delay: number, duration = 1400): CSSProperties =>
    ({ "--trace-dur": `${duration}ms`, "--trace-delay": `${delay}ms` }) as CSSProperties;

  return (
    <svg
      viewBox="0 0 760 420"
      className="w-full max-w-[560px] overflow-visible text-ink-mid"
      role="img"
      aria-label="A diagram showing specialist inputs converging into a single diagnosis, then matching to one right-sized service path"
      fill="none"
    >
      {/* The whimsical lap: a line with somewhere to be, going nowhere.
          Its track is invisible — only the runner on it shows. */}
      {live ? (
        <path
          className="cms-lap"
          d={ORBIT}
          pathLength={1}
          stroke="var(--color-sage)"
          strokeWidth="1.6"
          strokeLinecap="round"
          strokeDasharray="0.055 0.945"
          data-boost="true"
          style={{ "--lap-dur": "11s", "--lap-weight": "1.6px" } as CSSProperties}
        />
      ) : null}

      {/* Left: five specialists, each arriving at its own speed. */}
      {specialists.map((s, i) => (
        <g key={s.label}>
          <path
            className="cms-trace"
            d={`M ${LEFT_X + 8} ${s.y} C ${LEFT_X + 130} ${s.y}, ${CENTER.x - 140} ${CENTER.y}, ${CENTER.x - 30} ${CENTER.y}`}
            stroke="var(--color-sage)"
            strokeOpacity="0.8"
            strokeWidth="1.2"
            pathLength={1}
            data-armed={live || undefined}
            data-run={live || undefined}
            style={stroke(140 + i * 110, 1500)}
          />
          {/* Open nodes, and a smaller one riding each link — the way the
              mark draws a network. */}
          <circle
            cx={midpoint(LEFT_X, s.y).x}
            cy={midpoint(LEFT_X, s.y).y}
            r="2.6"
            fill="var(--color-paper)"
            stroke="var(--color-sage)"
            strokeWidth="1"
            strokeOpacity="0.7"
            className={live ? "cms-pop" : undefined}
            style={{ "--pop-delay": `${900 + i * 90}ms` } as CSSProperties}
          />
          <circle
            cx={LEFT_X}
            cy={s.y}
            r="3.8"
            fill="var(--color-paper)"
            stroke="var(--color-sage)"
            strokeWidth="1.4"
            className={live ? "cms-pop" : undefined}
            style={{ "--pop-delay": `${140 + i * 110}ms` } as CSSProperties}
          />
          <text
            x={LEFT_X - 12}
            y={s.y}
            textAnchor="end"
            dominantBaseline="middle"
            className="font-mono text-[9px] tracking-[0.14em]"
            fill="currentColor"
          >
            {s.label}
          </text>
        </g>
      ))}

      {/* Right: four possible depths — one of them lights up. */}
      {paths.map((p, i) => {
        const d = `M ${CENTER.x + 30} ${CENTER.y} C ${CENTER.x + 140} ${CENTER.y}, ${RIGHT_X - 130} ${p.y}, ${RIGHT_X - 10} ${p.y}`;
        return (
          <g key={p.label}>
            <path
              className="cms-trace"
              d={d}
              stroke={p.matched ? "var(--color-amber)" : "var(--color-ink)"}
              strokeOpacity={p.matched ? 0.95 : 0.42}
              strokeWidth={p.matched ? 1.6 : 1.1}
              pathLength={1}
              data-armed={live || undefined}
              data-run={live || undefined}
              style={stroke(700 + i * 120, p.matched ? 1100 : 1600)}
            />
            {p.matched && live ? (
              <path
                className="cms-lap"
                d={d}
                pathLength={1}
                stroke="var(--color-amber)"
                strokeWidth="2.2"
                strokeLinecap="round"
                strokeDasharray="0.14 0.86"
                data-boost="true"
                style={
                  {
                    "--lap-dur": "2.6s",
                    "--lap-delay": "1600ms",
                    "--lap-weight": "2.2px",
                  } as CSSProperties
                }
              />
            ) : null}
            <circle
              cx={RIGHT_X}
              cy={p.y}
              r={p.matched ? 5 : 3.4}
              fill={p.matched ? "var(--color-amber)" : "var(--color-ink)"}
              stroke={p.matched ? "none" : "var(--color-ink)"}
              strokeWidth={1.2}
              strokeOpacity={p.matched ? 1 : 0.45}
              className={live ? "cms-pop" : undefined}
              style={{ "--pop-delay": `${1100 + i * 120}ms` } as CSSProperties}
            />
            <text
              x={RIGHT_X + 14}
              y={p.y}
              dominantBaseline="middle"
              className={`font-mono text-[10px] tracking-[0.14em] ${p.matched ? "text-amber-deep" : ""}`}
              fill="currentColor"
              opacity={p.matched ? 1 : 0.45}
            >
              {p.label}
              {p.matched ? " — MATCHED" : ""}
            </text>
          </g>
        );
      })}

      {/* Centre: the diagnosis, drawn last and celebrated. */}
      {live
        ? sparks.map((i) => {
            const angle = (i / sparks.length) * Math.PI * 2 - Math.PI / 2;
            const inner = 26;
            const reach = 46 + ((i * 29) % 17);
            return (
              <line
                key={i}
                className="cms-spoke"
                x1={CENTER.x + Math.cos(angle) * inner}
                y1={CENTER.y + Math.sin(angle) * inner}
                x2={CENTER.x + Math.cos(angle) * reach}
                y2={CENTER.y + Math.sin(angle) * reach}
                stroke="var(--color-amber)"
                strokeWidth="1.3"
                strokeLinecap="round"
                pathLength={1}
                strokeDasharray="0.42 1"
                style={
                  {
                    "--burst-dur": `${1000 + ((i * 61) % 260)}ms`,
                    "--burst-delay": `${1500 + ((i * 47) % 180)}ms`,
                  } as CSSProperties
                }
              />
            );
          })
        : null}

      <path
        className="cms-trace"
        d={`M ${CENTER.x - 24} ${CENTER.y} A 24 24 0 1 0 ${CENTER.x + 24} ${CENTER.y} A 24 24 0 1 0 ${CENTER.x - 24} ${CENTER.y} Z`}
        pathLength={1}
        stroke="var(--color-amber)"
        strokeWidth="1.2"
        data-armed={live || undefined}
        data-run={live || undefined}
        style={stroke(900, 900)}
      />
      <circle
        cx={CENTER.x}
        cy={CENTER.y}
        r="4"
        fill="var(--color-amber)"
        className={live ? "animate-pulse-soft" : undefined}
        style={{ transformOrigin: `${CENTER.x}px ${CENTER.y}px` }}
      />
      <text
        x={CENTER.x}
        y={CENTER.y + 46}
        textAnchor="middle"
        className="font-mono text-[10px] tracking-[0.18em] text-ink"
        fill="currentColor"
      >
        DIAGNOSIS
      </text>
    </svg>
  );
}
