"use client";

interface Step {
  label: string;
  description?: string;
  highlight?: boolean;
}

interface Spec {
  steps: Step[];
}

export function StepSequence({ spec }: { spec: Record<string, unknown> }) {
  const s = spec as Partial<Spec>;
  const steps = Array.isArray(s.steps) ? s.steps : [];
  if (steps.length === 0) return null;

  const isVertical = steps.length > 4 || steps.some((st) => (st.description?.length ?? 0) > 60);

  if (isVertical) {
    return (
      <div style={{ display: "flex", flexDirection: "column", gap: 0 }}>
        {steps.map((step, i) => (
          <div key={i} style={{ display: "flex", gap: 16, alignItems: "stretch" }}>
            {/* Left column: number + connector */}
            <div style={{ display: "flex", flexDirection: "column", alignItems: "center", flexShrink: 0, width: 32 }}>
              <div
                style={{
                  width: 32,
                  height: 32,
                  borderRadius: "50%",
                  background: step.highlight ? "var(--color-accent)" : "var(--color-panel)",
                  border: `1.5px solid ${step.highlight ? "var(--color-accent)" : "var(--color-border-mid)"}`,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontSize: 12,
                  fontWeight: 750,
                  color: step.highlight ? "var(--color-text-inverted)" : "var(--color-text-muted)",
                  flexShrink: 0,
                }}
              >
                {i + 1}
              </div>
              {i < steps.length - 1 && (
                <div style={{ width: 1.5, flex: 1, minHeight: 16, background: "var(--color-border)", margin: "4px 0" }} />
              )}
            </div>
            {/* Content */}
            <div style={{ paddingBottom: i < steps.length - 1 ? 20 : 0, paddingTop: 4, minWidth: 0 }}>
              <div style={{ fontSize: 13.5, fontWeight: 700, color: "var(--color-text-primary)", marginBottom: step.description ? 4 : 0 }}>
                {step.label}
              </div>
              {step.description && (
                <div style={{ fontSize: 13, lineHeight: 1.6, color: "var(--color-text-secondary)" }}>{step.description}</div>
              )}
            </div>
          </div>
        ))}
      </div>
    );
  }

  return (
    <div style={{ display: "flex", gap: 0, alignItems: "flex-start" }}>
      {steps.map((step, i) => (
        <div key={i} style={{ display: "flex", alignItems: "flex-start", flex: 1, minWidth: 0 }}>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div
              style={{
                width: 32,
                height: 32,
                borderRadius: "50%",
                background: step.highlight ? "var(--color-accent)" : "var(--color-panel)",
                border: `1.5px solid ${step.highlight ? "var(--color-accent)" : "var(--color-border-mid)"}`,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: 12,
                fontWeight: 750,
                color: step.highlight ? "var(--color-text-inverted)" : "var(--color-text-muted)",
                marginBottom: 10,
              }}
            >
              {i + 1}
            </div>
            <div style={{ fontSize: 13, fontWeight: 700, color: "var(--color-text-primary)", marginBottom: 4 }}>{step.label}</div>
            {step.description && (
              <div style={{ fontSize: 12.5, lineHeight: 1.55, color: "var(--color-text-secondary)" }}>{step.description}</div>
            )}
          </div>
          {/* Arrow connector */}
          {i < steps.length - 1 && (
            <div style={{ padding: "15px 8px 0", color: "var(--color-text-subtle)", fontSize: 14, flexShrink: 0 }}>→</div>
          )}
        </div>
      ))}
    </div>
  );
}
