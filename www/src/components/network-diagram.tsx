const specialists = [
  { y: 46, label: "STRATEGY" },
  { y: 122, label: "CONTENT" },
  { y: 198, label: "PAID MEDIA" },
  { y: 274, label: "COMMUNITY" },
  { y: 350, label: "BRAND SYSTEMS" },
];

const paths = [
  { y: 70, label: "01", matched: false },
  { y: 156, label: "02", matched: false },
  { y: 242, label: "03", matched: true },
  { y: 328, label: "04", matched: false },
];

const CENTER = { x: 380, y: 198 };
const LEFT_X = 112;
const RIGHT_X = 628;

export function NetworkDiagram() {
  return (
    <svg
      viewBox="0 0 760 396"
      className="w-full max-w-[560px] text-cream-dim"
      role="img"
      aria-label="A diagram showing specialist inputs converging into a single diagnosis, then matching to one right-sized service path"
    >
      <circle
        cx={CENTER.x}
        cy={CENTER.y}
        r="120"
        fill="var(--color-amber)"
        opacity="0.06"
      />

      {/* left: specialist nodes feeding into diagnosis */}
      {specialists.map((s, i) => (
        <g key={s.label}>
          <path
            d={`M ${LEFT_X + 8} ${s.y} C ${LEFT_X + 120} ${s.y}, ${CENTER.x - 130} ${CENTER.y}, ${CENTER.x - 26} ${CENTER.y}`}
            fill="none"
            stroke="var(--color-sage)"
            strokeOpacity="0.4"
            strokeWidth="1"
            pathLength={1}
            strokeDasharray={1}
            className="animate-draw"
            style={{ animationDelay: `${180 + i * 90}ms` }}
          />
          <circle cx={LEFT_X} cy={s.y} r="3.5" fill="var(--color-sage)" />
          <text
            x={LEFT_X - 10}
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

      {/* right: the four possible depths, one matched */}
      {paths.map((p, i) => (
        <g key={p.label}>
          <path
            d={`M ${CENTER.x + 26} ${CENTER.y} C ${CENTER.x + 130} ${CENTER.y}, ${RIGHT_X - 120} ${p.y}, ${RIGHT_X - 10} ${p.y}`}
            fill="none"
            stroke={p.matched ? "var(--color-amber)" : "var(--color-cream)"}
            strokeOpacity={p.matched ? 0.85 : 0.16}
            strokeWidth={p.matched ? 1.5 : 1}
            pathLength={1}
            strokeDasharray={1}
            className="animate-draw"
            style={{ animationDelay: `${620 + i * 90}ms` }}
          />
          <circle
            cx={RIGHT_X}
            cy={p.y}
            r={p.matched ? 5 : 3}
            fill={p.matched ? "var(--color-amber)" : "none"}
            stroke={p.matched ? "none" : "var(--color-cream)"}
            strokeOpacity={p.matched ? 1 : 0.3}
          />
          <text
            x={RIGHT_X + 12}
            y={p.y}
            dominantBaseline="middle"
            className={`font-mono text-[10px] tracking-[0.14em] ${p.matched ? "text-amber" : ""}`}
            fill="currentColor"
            opacity={p.matched ? 1 : 0.45}
          >
            {p.label}
            {p.matched ? " — MATCHED" : ""}
          </text>
        </g>
      ))}

      <circle
        cx={CENTER.x}
        cy={CENTER.y}
        r="22"
        fill="var(--color-ink)"
        stroke="var(--color-amber)"
        strokeWidth="1"
      />
      <circle
        cx={CENTER.x}
        cy={CENTER.y}
        r="4"
        fill="var(--color-amber)"
        className="animate-pulse-soft"
        style={{ transformOrigin: `${CENTER.x}px ${CENTER.y}px` }}
      />
      <text
        x={CENTER.x}
        y={CENTER.y + 40}
        textAnchor="middle"
        className="font-mono text-[10px] tracking-[0.18em] text-cream"
        fill="currentColor"
      >
        DIAGNOSIS
      </text>
    </svg>
  );
}
