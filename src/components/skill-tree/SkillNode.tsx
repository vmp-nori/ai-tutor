"use client";

import type { SkillNode as SkillNodeType } from "@/lib/types";

const NODE_W = 232;
const GOAL_W = 264;

const STATUS_LABELS: Record<string, string> = {
  completed: "Completed",
  current:   "In progress",
  available: "Available",
  locked:    "Locked",
};

const DOT_COLOR: Record<string, string> = {
  completed: "var(--color-success)",
  current:   "var(--color-accent)",
  available: "var(--color-available)",
  locked:    "var(--color-locked)",
};

interface SkillNodeProps {
  node: SkillNodeType;
  isGoal?: boolean;
  isSelected?: boolean;
  /** Callback ref — SkillTreeCanvas stores the DOM element for imperative animation */
  setRef?: (el: HTMLDivElement | null) => void;
  onPointerDown?: (e: React.PointerEvent<HTMLDivElement>) => void;
  onClick?: (node: SkillNodeType) => void;
}

export function SkillNode({
  node,
  isGoal,
  isSelected,
  setRef,
  onPointerDown,
  onClick,
}: SkillNodeProps) {
  const interactive = !isGoal && node.status !== "locked";
  const width = isGoal ? GOAL_W : NODE_W;

  const borderColor = isSelected
    ? "var(--color-accent)"
    : node.status === "current"
    ? "var(--color-border-accent)"
    : node.status === "completed"
    ? "oklch(80% 0.040 154)"
    : "var(--color-border)";

  const background = isGoal
    ? "var(--color-goal)"
    : node.status === "completed"
    ? "var(--color-node-done)"
    : node.status === "locked"
    ? "var(--color-node-locked)"
    : "var(--color-node)";
  return (
    <div
      ref={setRef}
      onPointerDown={interactive ? onPointerDown : undefined}
      onClick={interactive ? () => onClick?.(node) : undefined}
      style={{
        position: "absolute",
        left: node.x,
        top: node.y,
        zIndex: isGoal ? 3 : 2,
        width,
        background,
        border: isGoal ? "none" : `${node.status === "current" ? 1.5 : 1}px solid ${borderColor}`,
        borderRadius: 7,
        padding: isGoal ? "16px 18px 17px" : "13px 16px 14px",
        cursor: isGoal ? "default" : interactive ? "grab" : "default",
        boxShadow: isSelected
          ? "0 0 0 3px oklch(54% 0.095 184 / 0.16), 0 4px 14px oklch(34% 0.018 230 / 0.14)"
          : "0 1px 3px oklch(34% 0.018 230 / 0.10), 0 1px 2px oklch(34% 0.018 230 / 0.07)",
        transition: "box-shadow 150ms ease-out, border-color 120ms",
        userSelect: "none",
        touchAction: "none",
      }}
    >
      <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 5 }}>
        <span
          aria-hidden="true"
          style={{
            width: 6,
            height: 6,
            borderRadius: "50%",
            background: isGoal ? "oklch(58% 0.040 215)" : DOT_COLOR[node.status],
            flexShrink: 0,
          }}
        />
        <span
          style={{
            fontSize: 10,
            fontWeight: 600,
            textTransform: "uppercase" as const,
            letterSpacing: "0.05em",
            color: isGoal
              ? "oklch(58% 0.04 76)"
              : node.status === "completed"
              ? "oklch(43% 0.090 154)"
              : node.status === "current"
              ? "var(--color-text-accent)"
              : "var(--color-text-muted)",
          }}
        >
          {isGoal ? "Goal" : node.isCheckpoint ? "Checkpoint" : STATUS_LABELS[node.status]}
        </span>
      </div>

      <div
        style={{
          fontSize: isGoal ? 15 : 14.5,
          fontWeight: isGoal ? 600 : 500,
          color: isGoal
            ? "var(--color-text-inverted)"
            : node.status === "locked"
            ? "var(--color-text-muted)"
            : "var(--color-text-primary)",
          lineHeight: 1.3,
        }}
      >
        {node.name}
      </div>
    </div>
  );
}
