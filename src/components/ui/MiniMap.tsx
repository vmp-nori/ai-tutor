"use client";

import { useEffect, useRef } from "react";
import type { SkillNode, SkillEdge } from "@/lib/types";
import { edgePoints, adaptiveBezierPath, edgeKind } from "@/lib/utils";

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
    ctx.fillStyle = "#FCFCFA";
    ctx.fillRect(0, 0, MM_W, MM_H);

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
        kind === "done"   ? "#15803D" :
        kind === "active" ? "#93C5FD" :
        "#C9C7BD";
      ctx.lineWidth = kind === "active" ? 1.2 : 0.8;
      ctx.globalAlpha = kind === "active" ? 1 : 0.65;
      ctx.stroke();
      ctx.globalAlpha = 1;
    }

    for (const n of nodes) {
      const isGoal = n.id === goalId;
      const w = (isGoal ? GOAL_W : NODE_W) * sx;
      const h = (isGoal ? GOAL_H : NODE_H) * sy;

      ctx.fillStyle =
        isGoal            ? "#0E0F12" :
        n.status === "completed" ? "#DCFCE7" :
        n.status === "current"   ? "#EFF6FF" :
        n.status === "available" ? "#FFFFFF" :
        "#F6F6F2";

      ctx.fillRect(n.x * sx, n.y * sy, w, h);

      ctx.strokeStyle = n.status === "current" ? "#93C5FD" :
        isGoal ? "#0E0F12" :
        "#E6E5DF";
      ctx.lineWidth = n.status === "current" ? 0.8 : 0.4;
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
        bottom: 52,
        left: 16,
        width: MM_W,
        background: "#FFFFFF",
        border: "1px solid #E6E5DF",
        borderRadius: 6,
        overflow: "hidden",
        zIndex: 190,
        boxShadow: "0 2px 8px rgba(20,15,10,0.08)",
      }}
      aria-hidden="true"
    >
      <canvas ref={canvasRef} width={MM_W} height={MM_H} style={{ display: "block" }} />
      <div
        ref={vpRef}
        style={{
          position: "absolute",
          border: "1px solid #93C5FD",
          borderRadius: 2,
          background: "rgba(147,197,253,0.12)",
          pointerEvents: "none",
          transition: "left 60ms linear, top 60ms linear",
        }}
      />
      <div
        style={{
          padding: "3px 6px 4px",
          fontSize: 7.5,
          fontWeight: 700,
          textTransform: "uppercase" as const,
          letterSpacing: "0.10em",
          color: "#8A8A82",
          borderTop: "1px solid #E6E5DF",
        }}
      >
        Overview
      </div>
    </div>
  );
}
