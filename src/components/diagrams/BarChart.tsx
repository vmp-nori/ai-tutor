"use client";

import {
  BarChart as RechartsBar,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from "recharts";

interface BarEntry {
  label: string;
  value: number;
  color?: string;
}

interface Spec {
  data: BarEntry[];
  xLabel?: string;
  yLabel?: string;
}

const DEFAULT_COLORS = [
  "oklch(50.5% 0.181 258)",
  "oklch(49.1% 0.122 150)",
  "oklch(57.7% 0.209 25)",
  "oklch(72.3% 0.164 25)",
  "oklch(62% 0.15 300)",
  "oklch(55% 0.17 200)",
];

export function BarChart({ spec }: { spec: Record<string, unknown> }) {
  const s = spec as Partial<Spec>;
  if (!Array.isArray(s.data) || s.data.length === 0) return null;

  const data = s.data.map((d) => ({ name: d.label, value: d.value, color: d.color }));

  return (
    <ResponsiveContainer width="100%" height={280}>
      <RechartsBar data={data} margin={{ top: 8, right: 16, left: 0, bottom: s.xLabel ? 28 : 8 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="oklch(90.6% 0.008 100)" vertical={false} />
        <XAxis
          dataKey="name"
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
          cursor={{ fill: "oklch(90.6% 0.008 100 / 0.5)" }}
        />
        <Bar dataKey="value" radius={[4, 4, 0, 0]}>
          {data.map((entry, i) => (
            <Cell key={i} fill={entry.color ?? DEFAULT_COLORS[i % DEFAULT_COLORS.length]} />
          ))}
        </Bar>
      </RechartsBar>
    </ResponsiveContainer>
  );
}
