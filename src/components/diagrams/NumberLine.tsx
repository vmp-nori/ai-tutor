"use client";

interface Point {
  value: number;
  label?: string;
  color?: string;
}

interface Range {
  from: number;
  to: number;
  label?: string;
  color?: string;
}

interface Spec {
  min: number;
  max: number;
  points?: Point[];
  ranges?: Range[];
}

const ACCENT = "oklch(78.4% 0.097 249)";
const ACCENT_SOFT = "oklch(92.6% 0.034 249)";

export function NumberLine({ spec }: { spec: Record<string, unknown> }) {
  const s = spec as Partial<Spec>;
  const min = typeof s.min === "number" ? s.min : 0;
  const max = typeof s.max === "number" ? s.max : 10;
  if (min >= max) return null;

  const W = 560;
  const H = 90;
  const PAD = 40;
  const lineY = 44;
  const range = max - min;

  const toX = (v: number) => PAD + ((v - min) / range) * (W - PAD * 2);

  const ticks: number[] = [];
  const step = Math.pow(10, Math.floor(Math.log10(range)) - 1) * (range > 50 ? 10 : range > 20 ? 5 : range > 10 ? 2 : 1);
  for (let v = Math.ceil(min / step) * step; v <= max + step * 0.01; v += step) {
    ticks.push(parseFloat(v.toPrecision(10)));
  }

  const points = Array.isArray(s.points) ? s.points : [];
  const ranges = Array.isArray(s.ranges) ? s.ranges : [];

  return (
    <svg viewBox={`0 0 ${W} ${H}`} style={{ width: "100%", height: "auto", overflow: "visible" }}>
      {/* Ranges */}
      {ranges.map((r, i) => {
        const x1 = toX(Math.max(r.from, min));
        const x2 = toX(Math.min(r.to, max));
        const color = r.color ?? ACCENT_SOFT;
        return (
          <g key={i}>
            <rect x={x1} y={lineY - 10} width={x2 - x1} height={20} fill={color} rx={3} opacity={0.7} />
            {r.label && (
              <text x={(x1 + x2) / 2} y={lineY - 16} textAnchor="middle" fontSize={10} fill="oklch(50.5% 0.181 258)" fontWeight={600}>
                {r.label}
              </text>
            )}
          </g>
        );
      })}

      {/* Axis line */}
      <line x1={PAD} y1={lineY} x2={W - PAD} y2={lineY} stroke="oklch(74.2% 0.011 100)" strokeWidth={1.5} />

      {/* Arrow heads */}
      <polygon points={`${W - PAD + 6},${lineY} ${W - PAD},${lineY - 4} ${W - PAD},${lineY + 4}`} fill="oklch(74.2% 0.011 100)" />

      {/* Ticks */}
      {ticks.map((v) => (
        <g key={v}>
          <line x1={toX(v)} y1={lineY - 5} x2={toX(v)} y2={lineY + 5} stroke="oklch(61.2% 0.010 100)" strokeWidth={1} />
          <text x={toX(v)} y={lineY + 18} textAnchor="middle" fontSize={10} fill="oklch(61.2% 0.010 100)">
            {v % 1 === 0 ? v : v.toFixed(1)}
          </text>
        </g>
      ))}

      {/* Points */}
      {points.map((p, i) => {
        const cx = toX(p.value);
        const color = p.color === "accent" ? ACCENT : p.color ?? ACCENT;
        return (
          <g key={i}>
            <circle cx={cx} cy={lineY} r={5} fill={color} />
            {p.label && (
              <text x={cx} y={lineY - 12} textAnchor="middle" fontSize={11} fill={color} fontWeight={650}>
                {p.label}
              </text>
            )}
          </g>
        );
      })}
    </svg>
  );
}
