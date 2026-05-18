"use client";

import type { SkillNode } from "@/lib/types";
import { edgePoints, adaptiveBezierPath, edgeKind } from "@/lib/utils";

const STROKE: Record<string, string> = {
  done:   "var(--color-success)",
  active: "var(--color-border-accent)",
  open:   "var(--color-border-accent)",
  locked: "var(--color-border-accent)",
};

const WIDTH: Record<string, number> = {
  done:   1.75,
  active: 2.2,
  open:   1.65,
  locked: 1.45,
};

const OPACITY: Record<string, number> = {
  done:   0.82,
  active: 1,
  open:   0.72,
  locked: 0.54,
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
  const isBranchEdge = fromNode.isBranch || toNode.isBranch;
  const stroke = isBranchEdge ? "var(--brand-sage-600, #1F8755)" : STROKE[kind];
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
            strokeWidth={isBranchEdge ? 1.1 : 1.45}
            strokeLinecap="round"
            strokeLinejoin="round"
            opacity={isBranchEdge ? 0.68 : 0.9}
          />
        </marker>
      </defs>
      {!isBranchEdge && (
        <path
          d={d}
          fill="none"
          stroke="var(--color-accent)"
          strokeWidth={7}
          strokeLinecap="round"
          opacity={kind === "active" ? 0.16 : 0.09}
        />
      )}
      <path
        ref={setPathRef}
        d={d}
        fill="none"
        stroke={stroke}
        strokeLinecap="round"
        strokeWidth={isBranchEdge ? 1.35 : WIDTH[kind]}
        strokeDasharray={isBranchEdge ? "5 5" : undefined}
        opacity={isBranchEdge ? 0.62 : OPACITY[kind]}
        markerEnd={`url(#${markerId})`}
      />
    </>
  );
}
