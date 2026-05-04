import type { SkillNode, SkillEdge } from "./types";

export function cn(...classes: (string | undefined | false | null)[]) {
  return classes.filter(Boolean).join(" ");
}

const NODE_W = 232;
const NODE_H = 78;
const GOAL_W = 264;
const GOAL_H = 78;

function nw(n: SkillNode, isGoal?: boolean) {
  return isGoal ? GOAL_W : NODE_W;
}
function nh(n: SkillNode, isGoal?: boolean) {
  return isGoal ? GOAL_H : NODE_H;
}

/**
 * Computes SVG connection points between two nodes.
 * Chooses connection face (left/right/top/bottom) based on relative position,
 * so horizontal edges connect right→left and vertical branches connect top→bottom.
 */
export function edgePoints(
  fromNode: SkillNode,
  toNode: SkillNode,
  fromIsGoal = false,
  toIsGoal = false,
): { x1: number; y1: number; x2: number; y2: number } {
  const fw = nw(fromNode, fromIsGoal);
  const fh = nh(fromNode, fromIsGoal);
  const tw = nw(toNode, toIsGoal);
  const th = nh(toNode, toIsGoal);

  const fCX = fromNode.x + fw / 2;
  const fCY = fromNode.y + fh / 2;
  const tCX = toNode.x + tw / 2;
  const tCY = toNode.y + th / 2;

  const adx = Math.abs(tCX - fCX);
  const ady = Math.abs(tCY - fCY);

  if (ady > adx * 0.7) {
    // Primarily vertical — branch/return case
    if (tCY < fCY) {
      // Going UP: top of from → bottom of to
      return { x1: fCX, y1: fromNode.y, x2: tCX, y2: toNode.y + th };
    } else {
      // Going DOWN
      return { x1: fCX, y1: fromNode.y + fh, x2: tCX, y2: toNode.y };
    }
  } else {
    // Primarily horizontal
    if (tCX >= fCX) {
      // Going RIGHT: right of from → left of to
      return { x1: fromNode.x + fw, y1: fCY, x2: toNode.x, y2: tCY };
    } else {
      // Going LEFT
      return { x1: fromNode.x, y1: fCY, x2: toNode.x + tw, y2: tCY };
    }
  }
}

/**
 * Adaptive bezier SVG path. Uses horizontal control points when the edge is
 * primarily horizontal, vertical control points when primarily vertical.
 */
export function adaptiveBezierPath(
  x1: number,
  y1: number,
  x2: number,
  y2: number,
): string {
  const dx = x2 - x1;
  const dy = y2 - y1;
  const adx = Math.abs(dx);
  const ady = Math.abs(dy);

  if (adx >= ady) {
    // Horizontal S-curve
    const cp = adx * 0.42;
    const sx = Math.sign(dx);
    return `M${x1},${y1} C${x1 + cp * sx},${y1} ${x2 - cp * sx},${y2} ${x2},${y2}`;
  } else {
    // Vertical S-curve
    const cp = ady * 0.42;
    const sy = Math.sign(dy);
    return `M${x1},${y1} C${x1},${y1 + cp * sy} ${x2},${y2 - cp * sy} ${x2},${y2}`;
  }
}

/** Compute edge visual kind from node states */
export function edgeKind(
  fromNode: SkillNode,
  toNode: SkillNode,
): "done" | "active" | "open" | "locked" {
  if (fromNode.status === "completed" && toNode.status === "completed")
    return "done";
  if (fromNode.status === "completed" && toNode.status === "current")
    return "active";
  if (fromNode.status === "completed") return "open";
  return "locked";
}

/** Topological sort of nodes for layout ordering */
export function topoSort(nodes: SkillNode[], edges: SkillEdge[]): SkillNode[] {
  const inDegree = new Map(nodes.map((n) => [n.id, 0]));
  const adj = new Map(nodes.map((n) => [n.id, [] as string[]]));

  for (const e of edges) {
    adj.get(e.fromNodeId)?.push(e.toNodeId);
    inDegree.set(e.toNodeId, (inDegree.get(e.toNodeId) ?? 0) + 1);
  }

  const queue = nodes.filter((n) => inDegree.get(n.id) === 0);
  const sorted: SkillNode[] = [];

  while (queue.length) {
    const node = queue.shift()!;
    sorted.push(node);
    for (const neighbor of adj.get(node.id) ?? []) {
      const deg = (inDegree.get(neighbor) ?? 1) - 1;
      inDegree.set(neighbor, deg);
      if (deg === 0) queue.push(nodes.find((n) => n.id === neighbor)!);
    }
  }

  return sorted;
}
