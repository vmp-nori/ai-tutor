"use client";

import type { SkillNode } from "@/lib/types";
import { edgePoints, adaptiveBezierPath, edgeKind } from "@/lib/utils";

const STROKE: Record<string, string> = {
  done:   "var(--color-success-soft)",
  active: "var(--color-accent)",
  open:   "oklch(74% 0.018 215)",
  locked: "oklch(84% 0.007 215)",
};

interface SkillEdgeProps {
  fromNode: SkillNode;
  toNode: SkillNode;
  markerId: string;
  toIsGoal?: boolean;
  /** Callback ref — SkillTreeCanvas stores the path element for imperative animation */
  setPathRef?: (el: SVGPathElement | null) => void;
}

export function SkillEdge({
  fromNode,
  toNode,
  markerId,
  toIsGoal,
  setPathRef,
}: SkillEdgeProps) {
  const kind = edgeKind(fromNode, toNode);
  const stroke = STROKE[kind];
  const { x1, y1, x2, y2 } = edgePoints(fromNode, toNode, false, toIsGoal);
  const d = adaptiveBezierPath(x1, y1, x2, y2);

  return (
    <>
      <defs>
        <marker
          id={markerId}
          markerWidth="7"
          markerHeight="7"
          refX="5"
          refY="3.5"
          orient="auto"
        >
          <path
            d="M1,1 L5.5,3.5 L1,6"
            fill="none"
            stroke={stroke}
            strokeWidth="1.2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </marker>
      </defs>
      <path
        ref={setPathRef}
        d={d}
        fill="none"
        stroke={stroke}
        strokeWidth={kind === "active" ? 1.5 : 1}
        strokeDasharray={kind === "locked" ? "4 3.5" : undefined}
        markerEnd={`url(#${markerId})`}
      />
    </>
  );
}
