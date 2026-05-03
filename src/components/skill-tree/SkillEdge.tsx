"use client";

import type { SkillNode } from "@/lib/types";
import { edgePoints, adaptiveBezierPath, edgeKind } from "@/lib/utils";

const STROKE: Record<string, string> = {
  done:   "var(--color-success)",
  active: "var(--color-accent)",
  open:   "var(--color-border-mid)",
  locked: "var(--color-border)",
};

const WIDTH: Record<string, number> = {
  done:   1,
  active: 1.6,
  open:   1,
  locked: 1,
};

const OPACITY: Record<string, number> = {
  done:   0.70,
  active: 1,
  open:   0.70,
  locked: 0.70,
};

interface SkillEdgeProps {
  fromNode: SkillNode;
  toNode: SkillNode;
  markerId: string;
  glowFilterId?: string;
  toIsGoal?: boolean;
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
        strokeWidth={WIDTH[kind]}
        strokeDasharray={kind === "locked" ? "3 3" : undefined}
        opacity={OPACITY[kind]}
        markerEnd={`url(#${markerId})`}
      />
    </>
  );
}
