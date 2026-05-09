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

interface SkillNodeProps {
  node: SkillNodeType;
  isGoal?: boolean;
  isSelected?: boolean;
  setRef?: (el: HTMLDivElement | null) => void;
  onPointerDown?: (e: React.PointerEvent<HTMLDivElement>) => void;
  onClick?: (node: SkillNodeType, e: React.MouseEvent) => void;
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
  const isCurrent = node.status === "current";
  const isDone = node.status === "completed";

  const background = isGoal
    ? "var(--color-goal)"
    : isCurrent
    ? "var(--color-node-current)"
    : isDone
    ? "var(--color-node-done)"
    : "var(--color-node)";

  const border = isGoal
    ? "none"
    : isSelected
    ? "1px solid var(--color-border-accent)"
    : isCurrent
    ? "1px solid var(--color-border-accent)"
    : isDone
    ? "1px solid var(--color-success-border)"
    : "1px solid var(--color-border)";

  const boxShadow = isGoal
    ? "var(--shadow-goal)"
    : isSelected
    ? "var(--shadow-node-selected)"
    : isCurrent
    ? "var(--shadow-node-active)"
    : "var(--shadow-node)";

  const dotColor = isCurrent
    ? "var(--color-accent)"
    : isDone
    ? "var(--color-success)"
    : node.status === "available"
    ? "var(--color-available)"
    : "var(--color-locked)";

  return (
    <div
      ref={setRef}
      onPointerDown={interactive ? onPointerDown : undefined}
      onClick={interactive ? (e) => { e.stopPropagation(); onClick?.(node, e); } : undefined}
      style={{
        position: "absolute",
        left: node.x,
        top: node.y,
        zIndex: isGoal ? 3 : 2,
        width,
        minHeight: 78,
        background,
        border,
        borderRadius: isGoal ? 10 : 8,
        padding: isGoal ? "12px 16px" : "11px 13px",
        display: "flex",
        flexDirection: "column",
        justifyContent: "center",
        cursor: isGoal ? "default" : interactive ? "grab" : "default",
        boxShadow,
        transition: "box-shadow 180ms cubic-bezier(0.16, 1, 0.3, 1), border-color 160ms cubic-bezier(0.16, 1, 0.3, 1)",
        userSelect: "none",
        touchAction: "none",
      }}
    >
      {isGoal ? (
        <>
          <div style={{
            display: "inline-flex",
            alignItems: "center",
            gap: 8,
            fontSize: 9.5,
            fontWeight: 800,
            letterSpacing: "0.12em",
            textTransform: "uppercase" as const,
            color: "var(--color-text-accent)",
            marginBottom: 6,
          }}>
            <span style={{ width: 14, height: 1, background: "var(--color-accent)", display: "inline-block" }} />
            End Goal
          </div>
          <div style={{
            fontSize: 14.5,
            fontWeight: 750,
            color: "var(--color-text-inverted)",
            lineHeight: 1.2,
            letterSpacing: 0,
          }}>
            {node.name}
          </div>
        </>
      ) : (
        <>
          <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 5 }}>
            {/* Status pill badge */}
            <span style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 5,
              padding: "2px 7px",
              borderRadius: 999,
              fontSize: 10.5,
              fontWeight: 600,
              letterSpacing: "-0.005em",
              border: "1px solid transparent",
              background: isCurrent
                ? "rgba(31,135,85,0.10)"
                : isDone
                ? "rgba(15,20,17,0.06)"
                : node.status === "available"
                ? "transparent"
                : "transparent",
              color: isCurrent
                ? "var(--brand-sage-700, #176544)"
                : isDone
                ? "var(--color-text-primary)"
                : node.status === "locked"
                ? "var(--color-text-muted)"
                : "var(--color-text-muted)",
              borderColor: node.status === "locked" ? "var(--color-border)" : "transparent",
            }}>
              <span style={{
                width: 5,
                height: 5,
                borderRadius: "50%",
                background: dotColor,
                flexShrink: 0,
              }} />
              {STATUS_LABELS[node.status]}
            </span>
            {node.isCheckpoint && (
              <span style={{
                fontSize: 9.5,
                fontWeight: 700,
                letterSpacing: "0.06em",
                color: "var(--brand-clay, #C44536)",
                background: "rgba(196,69,54,0.10)",
                borderRadius: 999,
                padding: "2px 7px",
                textTransform: "uppercase" as const,
              }}>
                Check
              </span>
            )}
            <span style={{ flex: 1 }} />
            {typeof node.difficultyLevel === "number" && (
              <span style={{
                fontSize: 10,
                color: "var(--color-text-muted)",
                fontVariantNumeric: "tabular-nums",
                fontWeight: 500,
                fontFamily: "var(--font-mono, 'JetBrains Mono', monospace)",
              }}>
                L{node.difficultyLevel}
              </span>
            )}
          </div>
          <div style={{
            fontSize: 14,
            fontWeight: 700,
            color: node.status === "locked" ? "var(--color-text-subtle)" : "var(--color-text-primary)",
            lineHeight: 1.25,
            letterSpacing: 0,
          }}>
            {node.name}
          </div>
        </>
      )}
    </div>
  );
}
