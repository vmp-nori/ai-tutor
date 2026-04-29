"use client";

import { useEffect, useRef } from "react";
import type { SkillNode, SkillEdge } from "@/lib/types";
import { edgePoints, adaptiveBezierPath, edgeKind } from "@/lib/utils";

// Wider aspect ratio to match horizontal canvas (2300 × 560 → ~4:1)
const MM_W = 220;
const MM_H = 68;

const NODE_W = 232;
const NODE_H = 78;
const GOAL_W = 264;
const GOAL_H = 78;

interface MiniMapProps {
  nodes: SkillNode[];
  edges: SkillEdge[];
  canvasWidth: number;
  canvasHeight: number;
  scrollEl: HTMLElement | null;
  zoom: number;
}

export function MiniMap({ nodes, edges, canvasWidth, canvasHeight, scrollEl, zoom }: MiniMapProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const vpRef = useRef<HTMLDivElement>(null);

  const sx = MM_W / canvasWidth;
  const sy = MM_H / canvasHeight;

  const nodeMap = new Map(nodes.map((n) => [n.id, n]));
  const goalId = nodes[nodes.length - 1]?.id;

  useEffect(() => {
    const ctx = canvasRef.current?.getContext("2d");
    if (!ctx) return;

    ctx.clearRect(0, 0, MM_W, MM_H);
    ctx.fillStyle = "oklch(96% 0.006 215)";
    ctx.fillRect(0, 0, MM_W, MM_H);

    // Edges
    for (const e of edges) {
      const fn = nodeMap.get(e.fromNodeId);
      const tn = nodeMap.get(e.toNodeId);
      if (!fn || !tn) continue;

      const toIsGoal = tn.id === goalId;
      const { x1, y1, x2, y2 } = edgePoints(fn, tn, false, toIsGoal);
      const kind = edgeKind(fn, tn);

      ctx.beginPath();
      ctx.moveTo(x1 * sx, y1 * sy);
      ctx.lineTo(x2 * sx, y2 * sy);
      ctx.strokeStyle =
        kind === "done" ? "oklch(73% 0.055 154)" :
        kind === "active" ? "oklch(54% 0.095 184)" :
        "oklch(84% 0.007 215)";
      ctx.lineWidth = 0.8;
      ctx.stroke();
    }

    // Nodes
    for (const n of nodes) {
      const isGoal = n.id === goalId;
      const w = (isGoal ? GOAL_W : NODE_W) * sx;
      const h = (isGoal ? GOAL_H : NODE_H) * sy;

      ctx.fillStyle =
        isGoal ? "oklch(18.5% 0.018 230)" :
        n.status === "completed" ? "oklch(94.7% 0.020 158)" :
        n.status === "current" ? "oklch(93.2% 0.026 184)" :
        n.status === "available" ? "oklch(99.3% 0.003 215)" :
        "oklch(93.6% 0.005 215)";

      ctx.fillRect(n.x * sx, n.y * sy, w, h);

      ctx.strokeStyle = n.status === "current" ? "oklch(54% 0.095 184)" : "oklch(86.5% 0.008 215)";
      ctx.lineWidth = n.status === "current" ? 1 : 0.4;
      ctx.strokeRect(n.x * sx, n.y * sy, w, h);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [nodes, edges, sx, sy, goalId]);

  useEffect(() => {
    if (!scrollEl || !vpRef.current) return;

    const sync = () => {
      if (!vpRef.current) return;
      const viewLeft = scrollEl.scrollLeft / zoom;
      const viewTop = scrollEl.scrollTop / zoom;
      const viewWidth = scrollEl.clientWidth / zoom;
      const viewHeight = scrollEl.clientHeight / zoom;
      vpRef.current.style.left = `${Math.max(0, (viewLeft / canvasWidth) * MM_W)}px`;
      vpRef.current.style.top = `${Math.max(0, (viewTop / canvasHeight) * MM_H)}px`;
      vpRef.current.style.width = `${Math.min((viewWidth / canvasWidth) * MM_W, MM_W)}px`;
      vpRef.current.style.height = `${Math.min((viewHeight / canvasHeight) * MM_H, MM_H)}px`;
    };

    sync();
    scrollEl.addEventListener("scroll", sync, { passive: true });
    window.addEventListener("resize", sync);
    return () => {
      scrollEl.removeEventListener("scroll", sync);
      window.removeEventListener("resize", sync);
    };
  }, [scrollEl, canvasWidth, canvasHeight, zoom]);

  return (
    <div
      style={{
        position: "fixed",
        top: 64,       // just below top bar with a gap
        right: "calc(clamp(220px, 28vw, 360px) + 16px)",
        width: MM_W,
        background: "var(--color-chrome)",
        border: "1px solid var(--color-border)",
        borderRadius: 6,
        overflow: "hidden",
        zIndex: 190,
        boxShadow: "0 2px 8px oklch(34% 0.018 230 / 0.10)",
      }}
      aria-hidden="true"
    >
      <canvas ref={canvasRef} width={MM_W} height={MM_H} style={{ display: "block" }} />
      <div
        ref={vpRef}
        style={{
          position: "absolute",
          border: "1px solid var(--color-accent)",
          borderRadius: 2,
          background: "oklch(54% 0.095 184 / 0.09)",
          pointerEvents: "none",
          transition: "left 60ms linear, top 60ms linear",
        }}
      />
      <div
        style={{
          padding: "3px 6px 4px",
          fontSize: 7.5,
          fontWeight: 600,
          textTransform: "uppercase" as const,
          letterSpacing: "0.06em",
          color: "var(--color-text-muted)",
          borderTop: "1px solid var(--color-border)",
        }}
      >
        Overview
      </div>
    </div>
  );
}
