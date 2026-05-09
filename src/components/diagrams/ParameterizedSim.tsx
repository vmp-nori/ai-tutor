"use client";

import { Coordinates, Mafs, Plot } from "mafs";
import { useMemo, useState } from "react";
import "mafs/core.css";

interface ControlSpec {
  id: string;
  label: string;
  min: number;
  max: number;
  step: number;
  default: number;
  unit?: string;
}

interface Spec {
  controls: ControlSpec[];
  expression: string;
  xRange?: [number, number];
  yRange?: [number, number];
  resultLabel?: string;
  captionTemplate?: string;
}

function isControl(value: unknown): value is ControlSpec {
  if (typeof value !== "object" || value === null || Array.isArray(value)) return false;
  const record = value as Partial<ControlSpec>;
  return (
    typeof record.id === "string" &&
    /^[a-zA-Z_][a-zA-Z0-9_]*$/.test(record.id) &&
    typeof record.label === "string" &&
    typeof record.min === "number" &&
    typeof record.max === "number" &&
    typeof record.step === "number" &&
    typeof record.default === "number" &&
    Number.isFinite(record.min) &&
    Number.isFinite(record.max) &&
    Number.isFinite(record.step) &&
    Number.isFinite(record.default) &&
    record.min < record.max &&
    record.step > 0
  );
}

function isRange(value: unknown): value is [number, number] {
  return (
    Array.isArray(value) &&
    value.length === 2 &&
    typeof value[0] === "number" &&
    typeof value[1] === "number" &&
    Number.isFinite(value[0]) &&
    Number.isFinite(value[1]) &&
    value[0] < value[1]
  );
}

function compileExpression(expression: string, controlIds: string[]) {
  try {
    const fn = new Function(
      "x",
      ...controlIds,
      `"use strict"; return (${expression});`,
    ) as (x: number, ...values: number[]) => number;

    return (x: number, values: Record<string, number>) => {
      const result = fn(x, ...controlIds.map((id) => values[id] ?? 0));
      return Number.isFinite(result) ? result : Number.NaN;
    };
  } catch {
    return null;
  }
}

function formatNumber(value: number) {
  if (!Number.isFinite(value)) return "n/a";
  if (Math.abs(value) >= 100 || Math.abs(value) < 0.01) return value.toPrecision(3);
  return value.toFixed(2).replace(/\.?0+$/, "");
}

function captionText(template: string | undefined, values: Record<string, number>, result: number) {
  if (!template) return "";
  return template.replace(/\{([a-zA-Z_][a-zA-Z0-9_]*|result)\}/g, (_, key: string) => {
    if (key === "result") return formatNumber(result);
    return formatNumber(values[key] ?? Number.NaN);
  });
}

export function ParameterizedSim({ spec }: { spec: Record<string, unknown> }) {
  const s = spec as Partial<Spec>;
  const controls = Array.isArray(s.controls) ? s.controls.filter(isControl).slice(0, 2) : [];
  const expression = typeof s.expression === "string" ? s.expression : "";
  const xRange: [number, number] = isRange(s.xRange) ? s.xRange : [-5, 5];
  const yRange: [number, number] = isRange(s.yRange) ? s.yRange : [-5, 5];

  const [values, setValues] = useState<Record<string, number>>(() => (
    Object.fromEntries(controls.map((control) => [control.id, control.default]))
  ));

  const evaluator = useMemo(
    () => compileExpression(expression, controls.map((control) => control.id)),
    [controls, expression],
  );

  if (controls.length === 0 || !expression || !evaluator) return null;

  const resultAtZero = evaluator(0, values);
  const caption = captionText(typeof s.captionTemplate === "string" ? s.captionTemplate : undefined, values, resultAtZero);

  return (
    <div style={{ display: "grid", gap: 18 }}>
      <Mafs viewBox={{ x: xRange, y: yRange }} preserveAspectRatio={false} height={300}>
        <Coordinates.Cartesian />
        <Plot.OfX y={(x) => evaluator(x, values)} color="var(--color-accent)" />
      </Mafs>

      <div style={{ display: "grid", gap: 12 }}>
        {controls.map((control) => {
          const value = values[control.id] ?? control.default;
          return (
            <label
              key={control.id}
              style={{
                display: "grid",
                gridTemplateColumns: "minmax(110px, 160px) 1fr minmax(64px, auto)",
                gap: 12,
                alignItems: "center",
                fontSize: 12.5,
                color: "var(--color-text-secondary)",
              }}
            >
              <span style={{ fontWeight: 700, color: "var(--color-text-primary)" }}>{control.label}</span>
              <input
                type="range"
                min={control.min}
                max={control.max}
                step={control.step}
                value={value}
                onChange={(event) => {
                  const nextValue = Number(event.target.value);
                  setValues((current) => ({ ...current, [control.id]: nextValue }));
                }}
                style={{ width: "100%" }}
              />
              <span style={{ fontVariantNumeric: "tabular-nums", textAlign: "right" }}>
                {formatNumber(value)}{control.unit ?? ""}
              </span>
            </label>
          );
        })}
      </div>

      {(caption || s.resultLabel) && (
        <div style={{ fontSize: 12.5, lineHeight: 1.55, color: "var(--color-text-secondary)" }}>
          {s.resultLabel && <strong style={{ color: "var(--color-text-primary)" }}>{s.resultLabel}: </strong>}
          {caption || formatNumber(resultAtZero)}
        </div>
      )}
    </div>
  );
}
