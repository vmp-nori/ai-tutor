"use client";

import { Mafs, Coordinates, Plot } from "mafs";
import "mafs/core.css";

interface FunctionEntry {
  fn: string;
  label?: string;
  color?: string;
}

interface Spec {
  functions: FunctionEntry[];
  xRange?: [number, number];
  yRange?: [number, number];
}

const COLORS = ["oklch(50.5% 0.181 258)", "oklch(49.1% 0.122 150)", "oklch(57.7% 0.209 25)", "oklch(72.3% 0.164 25)"];

function compileFunction(fn: string): ((x: number) => number) | null {
  try {
    const f = new Function("x", `"use strict"; return (${fn});`) as (x: number) => number;
    f(0); // smoke test
    return f;
  } catch {
    return null;
  }
}

export function FunctionPlot({ spec }: { spec: Record<string, unknown> }) {
  const s = spec as Partial<Spec>;
  const fns = Array.isArray(s.functions) ? s.functions : [];
  const xRange = Array.isArray(s.xRange) && s.xRange.length === 2 ? s.xRange : [-5, 5];
  const yRange = Array.isArray(s.yRange) && s.yRange.length === 2 ? s.yRange : [-5, 5];

  const compiled = fns
    .map((entry, i) => ({ ...entry, compiled: compileFunction(entry.fn), color: entry.color ?? COLORS[i % COLORS.length] }))
    .filter((e) => e.compiled !== null);

  if (compiled.length === 0) return null;

  return (
    <div>
      <Mafs
        viewBox={{ x: xRange as [number, number], y: yRange as [number, number] }}
        preserveAspectRatio={false}
        height={320}
      >
        <Coordinates.Cartesian />
        {compiled.map((e, i) => (
          <Plot.OfX key={i} y={e.compiled!} color={e.color} />
        ))}
      </Mafs>
      {compiled.some((e) => e.label) && (
        <div style={{ display: "flex", gap: 16, marginTop: 10, flexWrap: "wrap" }}>
          {compiled.map((e, i) =>
            e.label ? (
              <span key={i} style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 12.5, color: "var(--color-text-secondary)" }}>
                <span style={{ width: 16, height: 2, background: e.color, display: "inline-block", borderRadius: 1 }} />
                {e.label}
              </span>
            ) : null,
          )}
        </div>
      )}
    </div>
  );
}
