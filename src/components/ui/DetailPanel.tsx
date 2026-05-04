"use client";

import type { SkillNode } from "@/lib/types";

const STATUS_LABELS: Record<string, string> = {
  completed: "Completed",
  current: "In progress",
  available: "Available",
  locked: "Locked",
};

interface DetailPanelProps {
  node: SkillNode | null;
  allNodes: SkillNode[];
  onClose: () => void;
}

export function DetailPanel({ node, allNodes, onClose }: DetailPanelProps) {
  const nodeMap = new Map(allNodes.map((n) => [n.id, n]));

  return (
    <aside
      aria-label="Concept detail"
      style={{
        position: "fixed",
        inset: "48px 0 0 auto",
        width: 296,
        background: "var(--color-panel)",
        borderLeft: "1px solid var(--color-border)",
        boxShadow: "var(--shadow-card)",
        transform: node ? "translateX(0)" : "translateX(100%)",
        transition: "transform 210ms cubic-bezier(0.16, 1, 0.3, 1)",
        zIndex: 150,
        display: "flex",
        flexDirection: "column",
        overflow: "hidden",
      }}
    >
      {/* Close button */}
      <div style={{ padding: "14px 14px 0", display: "flex", justifyContent: "flex-end" }}>
        <button
          onClick={onClose}
          aria-label="Close panel"
          style={{
            width: 24,
            height: 24,
            borderRadius: 4,
            border: "none",
            background: "transparent",
            cursor: "pointer",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            color: "var(--color-text-muted)",
          }}
        >
          <svg width="13" height="13" viewBox="0 0 13 13" fill="none">
            <path
              d="M1.5 1.5L11.5 11.5M11.5 1.5L1.5 11.5"
              stroke="currentColor"
              strokeWidth="1.5"
              strokeLinecap="round"
            />
          </svg>
        </button>
      </div>

      {/* Content */}
      {node && (
        <div style={{ padding: "10px 16px 24px", flex: 1, overflowY: "auto" }}>
          <div
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 5,
              fontSize: 9.5,
              fontWeight: 600,
              textTransform: "uppercase",
              letterSpacing: "0.06em",
              color: node.status === "current"
                ? "var(--color-text-accent)"
                : node.status === "completed"
                ? "var(--color-success)"
                : "var(--color-text-muted)",
              marginBottom: 6,
            }}
          >
            <span
              style={{
                width: 5,
                height: 5,
                borderRadius: "50%",
                background:
                  node.status === "current"
                    ? "var(--color-accent)"
                    : node.status === "completed"
                    ? "var(--color-success)"
                    : "var(--color-available)",
                display: "inline-block",
                flexShrink: 0,
              }}
            />
            {STATUS_LABELS[node.status]}
          </div>

          <div
            style={{
              fontSize: 17,
              fontWeight: 600,
              color: "var(--color-text-primary)",
              lineHeight: 1.25,
              letterSpacing: 0,
              marginBottom: 10,
            }}
          >
            {node.name}
          </div>

          <p
            style={{
              fontSize: 13,
              lineHeight: 1.65,
              color: "var(--color-text-secondary)",
              marginBottom: 20,
            }}
          >
            {node.description}
          </p>

          {node.prereqs.length > 0 && (
            <>
              <div
                style={{
                  fontSize: 9.5,
                  fontWeight: 600,
                  textTransform: "uppercase",
                  letterSpacing: "0.06em",
                  color: "var(--color-text-muted)",
                  marginBottom: 7,
                }}
              >
                Prerequisites
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: 3, marginBottom: 20 }}>
                {node.prereqs.map((pid) => {
                  const p = nodeMap.get(pid);
                  if (!p) return null;
                  const done = p.status === "completed";
                  return (
                    <div
                      key={pid}
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: 8,
                        padding: "7px 10px",
                        borderRadius: 5,
                        background: "var(--color-chrome)",
                        border: "1px solid var(--color-border)",
                        fontSize: 12,
                        color: "var(--color-text-secondary)",
                      }}
                    >
                      <div
                        style={{
                          width: 14,
                          height: 14,
                          borderRadius: 3,
                          border: done ? "none" : "1.5px solid var(--color-border-mid)",
                          background: done ? "var(--color-success)" : "transparent",
                          flexShrink: 0,
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                        }}
                      >
                        {done && (
                          <svg width="8" height="6" viewBox="0 0 8 6" fill="none">
                            <path
                              d="M1 3L3 5L7 1"
                              stroke="var(--color-text-inverted)"
                              strokeWidth="1.5"
                              strokeLinecap="round"
                              strokeLinejoin="round"
                            />
                          </svg>
                        )}
                      </div>
                      <span>{p.name}</span>
                    </div>
                  );
                })}
              </div>
            </>
          )}

          <button
            disabled={node.status !== "current" && node.status !== "available"}
            style={{
              width: "100%",
              padding: "9px 16px",
              borderRadius: 6,
              background:
                node.status === "current" || node.status === "available"
                  ? "var(--color-accent)"
                  : "var(--color-node-locked)",
              border:
                node.status === "current" || node.status === "available"
                  ? "none"
                  : "1px solid var(--color-border)",
              color:
                node.status === "current" || node.status === "available"
                  ? "var(--color-text-on-accent)"
                  : "var(--color-text-muted)",
              fontSize: 13,
              fontWeight: 600,
              cursor:
                node.status === "current" || node.status === "available"
                  ? "pointer"
                  : "default",
              letterSpacing: 0,
            }}
          >
            {node.status === "current" ? "Continue lesson" : "Start lesson"}
          </button>
        </div>
      )}
    </aside>
  );
}
