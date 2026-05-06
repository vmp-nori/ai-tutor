"use client";

import type { LessonDiagram } from "@/lib/types";
import { FunctionPlot } from "./FunctionPlot";
import { NumberLine } from "./NumberLine";
import { BarChart } from "./BarChart";
import { LineChart } from "./LineChart";
import { StepSequence } from "./StepSequence";
import { ComparisonTable } from "./ComparisonTable";

interface Props {
  diagram: LessonDiagram;
}

function DiagramBody({ diagram }: Props) {
  switch (diagram.type) {
    case "function_plot":    return <FunctionPlot spec={diagram.spec} />;
    case "number_line":      return <NumberLine spec={diagram.spec} />;
    case "bar_chart":        return <BarChart spec={diagram.spec} />;
    case "line_chart":       return <LineChart spec={diagram.spec} />;
    case "step_sequence":    return <StepSequence spec={diagram.spec} />;
    case "comparison_table": return <ComparisonTable spec={diagram.spec} />;
  }
}

export function DiagramRenderer({ diagram }: Props) {
  return (
    <section style={{ margin: "26px 0 32px" }}>
      {diagram.title && (
        <div
          style={{
            fontSize: 10,
            fontWeight: 750,
            color: "var(--color-text-muted)",
            letterSpacing: "0.12em",
            textTransform: "uppercase",
            marginBottom: 14,
          }}
        >
          {diagram.title}
        </div>
      )}
      <div
        style={{
          background: "var(--color-panel)",
          border: "1.5px solid var(--color-border)",
          borderRadius: 10,
          padding: "20px 24px",
        }}
      >
        <DiagramBody diagram={diagram} />
      </div>
    </section>
  );
}
