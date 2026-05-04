"use client";

import type { SkillNode } from "@/lib/types";

const STATUS_LABELS: Record<string, string> = {
  completed: "Completed",
  current: "In progress",
  available: "Available",
  locked: "Locked",
};

const STATUS_COLOR: Record<string, string> = {
  completed: "var(--color-success)",
  current: "var(--color-accent)",
  available: "var(--color-available)",
  locked: "var(--color-locked)",
};

interface GoalPathPanelProps {
  goal: SkillNode;
  steppingStones: SkillNode[];
  selectedNode: SkillNode | null;
  completedCount: number;
  onSelectNode: (node: SkillNode) => void;
}

export function GoalPathPanel({
  goal,
  steppingStones,
  selectedNode,
  completedCount,
  onSelectNode,
}: GoalPathPanelProps) {
  const progress = steppingStones.length > 0 ? completedCount / steppingStones.length : 0;
  const currentStep = selectedNode ?? steppingStones.find((node) => node.status === "current") ?? null;
  const zones = Array.from(new Map(
    steppingStones
      .filter((node) => node.zone)
      .map((node) => [node.zone, node.zoneColor ?? "var(--color-accent)"]),
  ));

  return (
    <aside
      aria-label="Goal path"
      style={{
        position: "fixed",
        top: 48,
        right: 0,
        bottom: 0,
        width: "clamp(220px, 28vw, 360px)",
        background: "var(--color-panel)",
        borderLeft: "1px solid var(--color-border)",
        boxShadow: "var(--shadow-card)",
        zIndex: 170,
        display: "flex",
        flexDirection: "column",
      }}
    >
      <section
        aria-label="Selected end goal"
        style={{
          padding: "16px 16px 14px",
          borderBottom: "1px solid var(--color-border)",
          background: "var(--color-chrome)",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 10, marginBottom: 10 }}>
          <span style={{ fontSize: 10, fontWeight: 700, letterSpacing: "0.06em", textTransform: "uppercase", color: "var(--color-text-muted)" }}>
            End goal
          </span>
          <span
            style={{
              fontSize: 11,
              fontWeight: 600,
              color: "var(--color-text-accent)",
              background: "var(--color-accent-subtle)",
              border: "1px solid var(--color-border-accent)",
              borderRadius: 999,
              padding: "3px 8px",
              whiteSpace: "nowrap",
            }}
          >
            {completedCount} / {steppingStones.length}
          </span>
        </div>

        <h2 style={{ margin: 0, color: "var(--color-text-primary)", fontSize: 17, fontWeight: 650, lineHeight: 1.25 }}>
          {goal.name}
        </h2>
        <p style={{ margin: "9px 0 14px", color: "var(--color-text-secondary)", fontSize: 12.5, lineHeight: 1.55 }}>
          {goal.description}
        </p>

        <div aria-label="Goal progress" style={{ height: 6, background: "var(--color-node-locked)", borderRadius: 999, overflow: "hidden" }}>
          <div style={{ width: `${Math.round(progress * 100)}%`, height: "100%", background: "var(--color-accent)", borderRadius: 999 }} />
        </div>

        {currentStep && (
          <div
            style={{
              marginTop: 12,
              display: "grid",
              gridTemplateColumns: "70px 1fr",
              columnGap: 10,
              rowGap: 4,
              fontSize: 11.5,
              lineHeight: 1.35,
            }}
          >
            <span style={{ color: "var(--color-text-muted)", fontWeight: 600 }}>Focus</span>
            <span style={{ color: "var(--color-text-primary)", fontWeight: 600 }}>{currentStep.name}</span>
            <span style={{ color: "var(--color-text-muted)", fontWeight: 600 }}>Depends on</span>
            <span style={{ color: "var(--color-text-secondary)" }}>{currentStep.prereqs.length} concepts</span>
            <span style={{ color: "var(--color-text-muted)", fontWeight: 600 }}>Difficulty</span>
            <span style={{ color: "var(--color-text-secondary)" }}>{currentStep.difficultyLevel ?? goal.difficultyLevel ?? "Not set"} / 10</span>
            {currentStep.zone && (
              <>
                <span style={{ color: "var(--color-text-muted)", fontWeight: 600 }}>Zone</span>
                <span style={{ color: "var(--color-text-secondary)" }}>{currentStep.zone}</span>
              </>
            )}
          </div>
        )}

        {zones.length > 0 && (
          <div style={{ display: "flex", flexWrap: "wrap", gap: 5, marginTop: 12 }}>
            {zones.map(([zone, color]) => (
              <span
                key={zone}
                style={{
                  color: "var(--color-text-secondary)",
                  background: "var(--color-node)",
                  border: "1px solid var(--color-border)",
                  borderTop: `3px solid ${color}`,
                  borderRadius: 5,
                  fontSize: 10.5,
                  fontWeight: 600,
                  padding: "4px 6px 3px",
                }}
              >
                {zone}
              </span>
            ))}
          </div>
        )}
      </section>

      <section aria-label="Stepping stones" style={{ minHeight: 0, flex: 1, overflowY: "auto", padding: "12px 10px 16px" }}>
        <div style={{ padding: "0 6px 8px", display: "flex", justifyContent: "space-between", alignItems: "center", gap: 12 }}>
          <span style={{ color: "var(--color-text-muted)", fontSize: 10, fontWeight: 700, letterSpacing: "0.06em", textTransform: "uppercase" }}>
            Stepping stones
          </span>
          <span style={{ color: "var(--color-text-muted)", fontSize: 11 }}>{steppingStones.length} total</span>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
          {steppingStones.map((node, index) => {
            const selected = selectedNode?.id === node.id;
            const zoneColor = node.zoneColor ?? "var(--color-accent)";
            return (
              <button
                key={node.id}
                type="button"
                onClick={() => onSelectNode(node)}
                style={{
                  width: "100%",
                  border: selected ? "1px solid var(--color-border-accent)" : "1px solid transparent",
                  borderTop: `3px solid ${zoneColor}`,
                  borderRadius: 6,
                  background: selected ? "var(--color-accent-subtle)" : "transparent",
                  padding: "8px",
                  display: "grid",
                  gridTemplateColumns: "24px 1fr",
                  columnGap: 8,
                  textAlign: "left",
                  cursor: "pointer",
                }}
              >
                <span
                  aria-hidden="true"
                  style={{
                    width: 18,
                    height: 18,
                    borderRadius: 5,
                    border: "1px solid var(--color-border)",
                    color: node.status === "completed" ? "var(--color-success)" : "var(--color-text-muted)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontSize: 10,
                    fontWeight: 700,
                    background: node.status === "completed" ? "var(--color-success-subtle)" : "var(--color-chrome)",
                  }}
                >
                  {index + 1}
                </span>
                <span style={{ minWidth: 0 }}>
                  <span style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 3 }}>
                    <span aria-hidden="true" style={{ width: 5, height: 5, borderRadius: "50%", background: STATUS_COLOR[node.status], flexShrink: 0 }} />
                    <span
                      style={{
                        color: node.status === "locked" ? "var(--color-text-muted)" : "var(--color-text-primary)",
                        fontSize: 12.5,
                        fontWeight: 600,
                        lineHeight: 1.25,
                      }}
                    >
                      {node.name}
                    </span>
                  </span>
                  <span
                    style={{
                      display: "block",
                      color: "var(--color-text-muted)",
                      fontSize: 10,
                      fontWeight: 650,
                      letterSpacing: "0.05em",
                      textTransform: "uppercase",
                      marginBottom: 3,
                    }}
                  >
                    {STATUS_LABELS[node.status]}
                  </span>
                  <span style={{ display: "block", color: "var(--color-text-secondary)", fontSize: 11.5, lineHeight: 1.45 }}>
                    {node.description}
                  </span>
                  <span
                    style={{
                      display: "flex",
                      flexWrap: "wrap",
                      alignItems: "center",
                      gap: 4,
                      marginTop: 6,
                    }}
                  >
                    {typeof node.difficultyLevel === "number" && (
                      <span
                        style={{
                          color: "var(--color-text-muted)",
                          border: "1px solid var(--color-border)",
                          borderRadius: 4,
                          fontSize: 10,
                          fontWeight: 650,
                          padding: "2px 5px",
                        }}
                      >
                        Level {node.difficultyLevel}
                      </span>
                    )}
                    {node.zone && (
                      <span
                        style={{
                          color: "var(--color-text-secondary)",
                          background: "var(--color-chrome)",
                          border: "1px solid var(--color-border)",
                          borderRadius: 4,
                          fontSize: 10,
                          fontWeight: 600,
                          padding: "2px 5px",
                        }}
                      >
                        {node.zone}
                      </span>
                    )}
                    {node.isCheckpoint && (
                      <span
                        style={{
                          color: "var(--color-text-accent)",
                          background: "var(--color-accent-subtle)",
                          border: "1px solid var(--color-border-accent)",
                          borderRadius: 4,
                          fontSize: 10,
                          fontWeight: 700,
                          padding: "2px 5px",
                        }}
                      >
                        Checkpoint
                      </span>
                    )}
                  </span>
                </span>
              </button>
            );
          })}
        </div>
      </section>
    </aside>
  );
}
