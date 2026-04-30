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
    ? "#0E0F12"
    : isCurrent
    ? "#EFF6FF"
    : isDone
    ? "#DCFCE7"
    : "#FFFFFF";

  const border = isGoal
    ? "none"
    : isSelected
    ? "1px solid #93C5FD"
    : isCurrent
    ? "1px solid #93C5FD"
    : isDone
    ? "1px solid #BBF7D0"
    : "1px solid #E6E5DF";

  const boxShadow = isGoal
    ? "0 6px 20px rgba(20,15,10,0.12)"
    : isSelected
    ? "0 0 0 3px rgba(147,197,253,0.22), 0 4px 18px rgba(20,15,10,0.08)"
    : isCurrent
    ? "0 1px 3px rgba(147,197,253,0.34), 0 4px 12px rgba(147,197,253,0.13)"
    : "0 1px 2px rgba(20,15,10,0.04)";

  const dotColor = isCurrent
    ? "#93C5FD"
    : isDone
    ? "#15803D"
    : node.status === "available"
    ? "#8A8A82"
    : "#D1D5DB";

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
        background,
        border,
        borderRadius: isGoal ? 10 : 8,
        padding: isGoal ? "12px 16px" : "11px 13px",
        cursor: isGoal ? "default" : interactive ? "grab" : "default",
        boxShadow,
        transition: "box-shadow 150ms ease-out, border-color 120ms",
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
            letterSpacing: "0.16em",
            textTransform: "uppercase" as const,
            color: "#93C5FD",
            marginBottom: 6,
          }}>
            <span style={{ width: 14, height: 1, background: "#93C5FD", display: "inline-block" }} />
            End Goal
          </div>
          <div style={{
            fontSize: 14.5,
            fontWeight: 700,
            color: "#FCFCFA",
            lineHeight: 1.2,
            letterSpacing: "-0.01em",
          }}>
            {node.name}
          </div>
        </>
      ) : (
        <>
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 5 }}>
            <span style={{
              width: 5,
              height: 5,
              borderRadius: "50%",
              background: dotColor,
              flexShrink: 0,
            }} />
            <span style={{
              fontSize: 9.5,
              fontWeight: 700,
              letterSpacing: "0.12em",
              textTransform: "uppercase" as const,
              color: isCurrent ? "#2563EB" : isDone ? "#15803D" : "#8A8A82",
            }}>
              {STATUS_LABELS[node.status]}
            </span>
            {node.isCheckpoint && (
              <span style={{
                fontSize: 9,
                fontWeight: 700,
                letterSpacing: "0.10em",
                color: "#2563EB",
                border: "1px solid rgba(147,197,253,0.58)",
                borderRadius: 3,
                padding: "1px 5px",
                textTransform: "uppercase" as const,
              }}>
                Checkpoint
              </span>
            )}
            <span style={{ flex: 1 }} />
            {typeof node.difficultyLevel === "number" && (
              <span style={{
                fontSize: 10.5,
                color: "#8A8A82",
                fontVariantNumeric: "tabular-nums",
                fontWeight: 500,
              }}>
                L{node.difficultyLevel}
              </span>
            )}
          </div>
          <div style={{
            fontSize: 14,
            fontWeight: 600,
            color: node.status === "locked" ? "#B8B8AE" : "#0E0F12",
            lineHeight: 1.25,
            letterSpacing: "-0.005em",
          }}>
            {node.name}
          </div>
        </>
      )}
    </div>
  );
}
