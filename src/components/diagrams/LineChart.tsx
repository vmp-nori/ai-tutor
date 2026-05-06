"use client";

import {
  LineChart as RechartsLine,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";

interface SeriesEntry {
  label: string;
  data: Array<{ x: number; y: number }>;
  color?: string;
}

interface Spec {
  series: SeriesEntry[];
  xLabel?: string;
  yLabel?: string;
}

const DEFAULT_COLORS = [
  "oklch(50.5% 0.181 258)",
  "oklch(49.1% 0.122 150)",
  "oklch(57.7% 0.209 25)",
  "oklch(62% 0.15 300)",
];

export function LineChart({ spec }: { spec: Record<string, unknown> }) {
  const s = spec as Partial<Spec>;
  if (!Array.isArray(s.series) || s.series.length === 0) return null;

  // Merge all x values into a unified dataset
  const allX = Array.from(new Set(s.series.flatMap((se) => se.data.map((d) => d.x)))).sort((a, b) => a - b);
  const merged = allX.map((x) => {
    const row: Record<string, number> = { x };
    for (const se of s.series!) {
      const point = se.data.find((d) => d.x === x);
      if (point !== undefined) row[se.label] = point.y;
    }
    return row;
  });

  return (
    <ResponsiveContainer width="100%" height={280}>
      <RechartsLine data={merged} margin={{ top: 8, right: 16, left: 0, bottom: s.xLabel ? 28 : 8 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="oklch(90.6% 0.008 100)" />
        <XAxis
          dataKey="x"
          type="number"
          domain={["dataMin", "dataMax"]}
          tick={{ fontSize: 12, fill: "oklch(61.2% 0.010 100)" }}
          axisLine={{ stroke: "oklch(90.6% 0.008 100)" }}
          tickLine={false}
          label={s.xLabel ? { value: s.xLabel, position: "insideBottom", offset: -16, fontSize: 12, fill: "oklch(61.2% 0.010 100)" } : undefined}
        />
        <YAxis
          tick={{ fontSize: 12, fill: "oklch(61.2% 0.010 100)" }}
          axisLine={false}
          tickLine={false}
          label={s.yLabel ? { value: s.yLabel, angle: -90, position: "insideLeft", fontSize: 12, fill: "oklch(61.2% 0.010 100)" } : undefined}
        />
        <Tooltip
          contentStyle={{
            background: "oklch(99.1% 0.003 100)",
            border: "1px solid oklch(90.6% 0.008 100)",
            borderRadius: 6,
            fontSize: 12,
          }}
        />
        {s.series.length > 1 && (
          <Legend wrapperStyle={{ fontSize: 12, color: "oklch(61.2% 0.010 100)" }} />
        )}
        {s.series.map((se, i) => (
          <Line
            key={se.label}
            type="monotone"
            dataKey={se.label}
            stroke={se.color ?? DEFAULT_COLORS[i % DEFAULT_COLORS.length]}
            strokeWidth={2}
            dot={{ r: 3 }}
            activeDot={{ r: 5 }}
            connectNulls
          />
        ))}
      </RechartsLine>
    </ResponsiveContainer>
  );
}
