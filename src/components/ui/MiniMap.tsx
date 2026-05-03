"use client";

import { useEffect, useRef, useState } from "react";
import type { SkillNode, SkillEdge } from "@/lib/types";
import { edgePoints, adaptiveBezierPath, edgeKind } from "@/lib/utils";

const MM_W = 220;
const MM_H = 68;

const NODE_W = 232;
const NODE_H = 78;
const GOAL_W = 264;
const GOAL_H = 78;

function themeColor(name: string, fallback: string) {
  if (typeof window === "undefined") return fallback;
  return getComputedStyle(document.documentElement).getPropertyValue(name).trim() || fallback;
}

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
  const [themeRevision, setThemeRevision] = useState(0);

  const sx = MM_W / canvasWidth;
  const sy = MM_H / canvasHeight;

  const nodeMap = new Map(nodes.map((n) => [n.id, n]));
  const goalId = nodes[nodes.length - 1]?.id;

  useEffect(() => {
    const media = window.matchMedia("(prefers-color-scheme: dark)");
    const handleThemeChange = () => setThemeRevision((revision) => revision + 1);
    media.addEventListener("change", handleThemeChange);
    return () => media.removeEventListener("change", handleThemeChange);
  }, []);

  useEffect(() => {
    const ctx = canvasRef.current?.getContext("2d");
    if (!ctx) return;

    const colors = {
      canvas: themeColor("--color-canvas", "oklch(98.8% 0.004 100)"),
      goal: themeColor("--color-goal", "oklch(18.4% 0.006 255)"),
      node: themeColor("--color-node", "oklch(99.4% 0.003 100)"),
      nodeCurrent: themeColor("--color-node-current", "oklch(97.2% 0.022 249)"),
      nodeDone: themeColor("--color-node-done", "oklch(95.5% 0.044 150)"),
      nodeLocked: themeColor("--color-node-locked", "oklch(96.5% 0.005 100)"),
      border: themeColor("--color-border", "oklch(90.6% 0.008 100)"),
      borderMid: themeColor("--color-border-mid", "oklch(80.9% 0.012 100)"),
      accent: themeColor("--color-accent", "oklch(78.4% 0.097 249)"),
      success: themeColor("--color-success", "oklch(49.1% 0.122 150)"),
    };

    ctx.clearRect(0, 0, MM_W, MM_H);
    ctx.fillStyle = colors.canvas;
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
        kind === "done"   ? colors.success :
        kind === "active" ? colors.accent :
        colors.borderMid;
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
        isGoal            ? colors.goal :
        n.status === "completed" ? colors.nodeDone :
        n.status === "current"   ? colors.nodeCurrent :
        n.status === "available" ? colors.node :
        colors.nodeLocked;

      ctx.fillRect(n.x * sx, n.y * sy, w, h);

      ctx.strokeStyle = n.status === "current" ? colors.accent :
        isGoal ? colors.goal :
        colors.border;
      ctx.lineWidth = n.status === "current" ? 0.8 : 0.4;
      ctx.strokeRect(n.x * sx, n.y * sy, w, h);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [nodes, edges, sx, sy, goalId, themeRevision]);

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
        background: "var(--color-panel)",
        border: "1px solid var(--color-border)",
        borderRadius: 6,
        overflow: "hidden",
        zIndex: 190,
        boxShadow: "var(--shadow-card)",
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
          background: "color-mix(in srgb, var(--color-accent) 16%, transparent)",
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
          color: "var(--color-text-muted)",
          borderTop: "1px solid var(--color-border)",
        }}
      >
        Overview
      </div>
    </div>
  );
}
