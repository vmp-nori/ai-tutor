"use client";

import { useRef, useState, useCallback, useEffect, useMemo } from "react";
import type { NodeStatus, SkillNode as SkillNodeType, SkillEdge as SkillEdgeType } from "@/lib/types";
import { edgePoints, adaptiveBezierPath } from "@/lib/utils";
import { SkillNode } from "./SkillNode";
import { SkillEdge } from "./SkillEdge";
import { GoalPathPanel } from "@/components/ui/GoalPathPanel";
import { JsonInputPanel } from "@/components/ui/JsonInputPanel";
import { MiniMap } from "@/components/ui/MiniMap";
import { TopBar } from "@/components/ui/TopBar";

const CANVAS_W = 3000;
const CANVAS_H = 820;
const RIGHT_PANEL_W = "clamp(220px, 28vw, 360px)";
const NODE_W = 232;
const NODE_H = 78;
const GOAL_W = 264;
const GOAL_H = 78;
const IMPORT_COLUMN_GAP = 304;
const ABSOLUTE_MIN_ZOOM = 0.12;
const MAX_ZOOM = 2.8;
const ZOOM_FACTOR = 1.18;
const WHEEL_ZOOM_SENSITIVITY = 0.0016;
const MAX_WHEEL_ZOOM_STEP = 1.08;

// Spring constants — stiffness + damping give a small overshoot (Obsidian-like feel)
const STIFF     = 0.10;
const DAMP      = 0.84;
const THRESHOLD = 0.15; // px/frame below which we snap to home

interface SkillTreeCanvasProps {
  nodes: SkillNodeType[];
  edges: SkillEdgeType[];
  subject: string;
}

interface GraphState {
  nodes: SkillNodeType[];
  edges: SkillEdgeType[];
  subject: string;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function toNumber(value: unknown, fallback: number) {
  return typeof value === "number" && Number.isFinite(value) ? value : fallback;
}

function toStringArray(value: unknown) {
  return Array.isArray(value) ? value.filter((item): item is string => typeof item === "string") : [];
}

function toString(value: unknown, fallback: string) {
  return typeof value === "string" && value.trim() ? value.trim() : fallback;
}

function normalizeZoneColor(value: unknown, index: number) {
  const fallbackColors = [
    "oklch(54% 0.095 184)",
    "oklch(55% 0.105 154)",
    "oklch(58% 0.110 260)",
    "oklch(56% 0.115 28)",
    "oklch(60% 0.095 310)",
  ];
  if (typeof value !== "string") return fallbackColors[index % fallbackColors.length];

  const color = value.trim();
  const colorPatterns = [
    /^#[0-9a-fA-F]{3,8}$/,
    /^oklch\([0-9.%\s/+-]+(?:deg)?\)$/i,
    /^rgb(a)?\([0-9.,%\s/+-]+\)$/i,
    /^hsl(a)?\([0-9.,%\s/+-]+(?:deg)?\)$/i,
  ];
  return colorPatterns.some((pattern) => pattern.test(color))
    ? color
    : fallbackColors[index % fallbackColors.length];
}

function normalizeStatus(value: unknown, hasAnyStatus: boolean, index: number): NodeStatus {
  if (value === "completed" || value === "current" || value === "available") return value;
  if (value === "locked") return "available";
  return !hasAnyStatus && index === 0 ? "current" : "available";
}

function clampZoom(value: number, minZoom = ABSOLUTE_MIN_ZOOM) {
  return Math.min(MAX_ZOOM, Math.max(minZoom, value));
}

function graphToSchema(graph: GraphState) {
  const goal = graph.nodes[graph.nodes.length - 1];
  const steppingStones = graph.nodes.slice(0, -1);
  return JSON.stringify({
    subject: graph.subject,
    goal: goal?.description ?? goal?.name ?? "",
    nodes: steppingStones.map((node) => ({
      id: node.id,
      name: node.name,
      description: node.description,
      difficulty_level: node.difficultyLevel ?? 1,
      is_checkpoint: node.isCheckpoint ?? false,
      zone: node.zone ?? "Core",
      zone_color: node.zoneColor ?? "oklch(54% 0.095 184)",
      prerequisite_ids: node.prereqs,
      coordinates: { x: node.x, y: node.y, z: 0 },
    })),
  }, null, 2);
}

function graphFromSchema(value: unknown): GraphState {
  if (!isRecord(value)) throw new Error("JSON must be an object with subject, goal, and nodes.");
  if (!Array.isArray(value.nodes) || value.nodes.length === 0) {
    throw new Error("JSON must include a non-empty nodes array.");
  }

  const rawNodes = value.nodes;
  const records = rawNodes.map((node, index) => {
    if (!isRecord(node)) throw new Error(`Node ${index + 1} must be an object.`);
    const id = typeof node.id === "string" && node.id.trim() ? node.id.trim() : `node_${index + 1}`;
    const name = typeof node.name === "string" && node.name.trim() ? node.name.trim() : id;
    const description = typeof node.description === "string" ? node.description : "";
    const coords = isRecord(node.coordinates) ? node.coordinates : {};
    return {
      id,
      name,
      description,
      difficultyLevel: toNumber(node.difficulty_level, toNumber(node.difficultyLevel, 1)),
      isCheckpoint: typeof node.is_checkpoint === "boolean" ? node.is_checkpoint : node.isCheckpoint === true,
      zone: toString(node.zone, "Core"),
      zoneColor: normalizeZoneColor(node.zone_color ?? node.zoneColor, index),
      prereqs: toStringArray(node.prerequisite_ids ?? node.prereqs),
      subTopics: toStringArray(node.sub_topics ?? node.subTopics),
      coordX: toNumber(coords.x, index * 25),
      coordY: toNumber(coords.y, 0),
      status: node.status,
    };
  });

  const ids = new Set(records.map((node) => node.id));
  if (ids.size !== records.length) throw new Error("Every node id must be unique.");

  const uniqueColumns = Array.from(new Set(records.map((node) => node.coordX))).sort((a, b) => a - b);
  const xByColumn = new Map(uniqueColumns.map((coordX, index) => [coordX, 96 + index * IMPORT_COLUMN_GAP]));
  const hasAnyStatus = records.some((node) => typeof node.status === "string");

  const nodes: SkillNodeType[] = records.map((node, index) => ({
    id: node.id,
    treeId: "input-json",
    name: node.name,
    description: node.description,
    status: normalizeStatus(node.status, hasAnyStatus, index),
    x: xByColumn.get(node.coordX) ?? 96 + index * IMPORT_COLUMN_GAP,
    y: Math.max(112, Math.min(600, Math.round(356 - node.coordY * 8))),
    prereqs: node.prereqs.filter((id) => ids.has(id)),
    difficultyLevel: node.difficultyLevel,
    subTopics: node.subTopics,
    isCheckpoint: node.isCheckpoint,
    zone: node.zone,
    zoneColor: node.zoneColor,
  }));

  const edges: SkillEdgeType[] = [];
  nodes.forEach((node) => {
    node.prereqs.forEach((fromNodeId) => {
      edges.push({
        id: `edge_${fromNodeId}_${node.id}`,
        treeId: "input-json",
        fromNodeId,
        toNodeId: node.id,
      });
    });
  });

  const sourceIds = new Set(edges.map((edge) => edge.fromNodeId));
  const terminalIds = nodes.filter((node) => !sourceIds.has(node.id)).map((node) => node.id);
  const goalText = typeof value.goal === "string" && value.goal.trim()
    ? value.goal.trim()
    : "Complete this learning path.";
  const subject = typeof value.subject === "string" && value.subject.trim()
    ? value.subject.trim()
    : "Imported Learning Path";
  const goalNode: SkillNodeType = {
    id: "goal",
    treeId: "input-json",
    name: subject,
    description: goalText,
    status: "available",
    x: Math.max(...nodes.map((node) => node.x)) + IMPORT_COLUMN_GAP,
    y: 340,
    prereqs: terminalIds,
    difficultyLevel: Math.max(...nodes.map((node) => node.difficultyLevel ?? 1)),
    isCheckpoint: true,
    zone: "End goal",
    zoneColor: "var(--color-accent)",
  };

  terminalIds.forEach((fromNodeId) => {
    edges.push({
      id: `edge_${fromNodeId}_goal`,
      treeId: "input-json",
      fromNodeId,
      toNodeId: "goal",
    });
  });

  return {
    subject,
    nodes: [...nodes, goalNode],
    edges,
  };
}

export function SkillTreeCanvas({ nodes: initialNodes, edges: initialEdges, subject: initialSubject }: SkillTreeCanvasProps) {
  const scrollRef  = useRef<HTMLDivElement>(null);
  const [graph, setGraph] = useState<GraphState>({
    nodes: initialNodes,
    edges: initialEdges,
    subject: initialSubject,
  });
  const [selectedNode, setSelectedNode] = useState<SkillNodeType | null>(null);
  const [pressedNodeId, setPressedNodeId] = useState<string | null>(null);
  const [scrollEl, setScrollEl]         = useState<HTMLElement | null>(null);
  const [jsonInputOpen, setJsonInputOpen] = useState(false);
  const [jsonDraft, setJsonDraft] = useState(() => graphToSchema({
    nodes: initialNodes,
    edges: initialEdges,
    subject: initialSubject,
  }));
  const [jsonError, setJsonError] = useState<string | null>(null);
  const [zoom, setZoom] = useState(1);
  const [viewportSize, setViewportSize] = useState({ width: 0, height: 0 });
  const [scrollPosition, setScrollPosition] = useState({ left: 0, top: 0 });

  const { nodes, edges, subject } = graph;

  // ── Imperative animation state ────────────────────────────────────────────
  // posRef: current display position for every node (canvas coords)
  const posRef = useRef(new Map(nodes.map(n => [n.id, { x: n.x, y: n.y }])));
  // velRef: spring velocity per node
  const velRef = useRef(new Map(nodes.map(n => [n.id, { vx: 0, vy: 0 }])));
  // DOM element refs — written once on mount, read during animation
  const nodeEls = useRef(new Map<string, HTMLDivElement>());
  const pathEls = useRef(new Map<string, SVGPathElement>());
  const zoomRef = useRef(zoom);
  // Drag state
  const dragRef    = useRef<{ id: string; ox: number; oy: number } | null>(null);
  const didDragRef = useRef(false);
  const rafRef     = useRef<number | null>(null);

  const nodeMap = useMemo(() => new Map(nodes.map(n => [n.id, n])), [nodes]);
  const goalId  = nodes[nodes.length - 1]?.id;

  const goalNode        = nodes[nodes.length - 1];
  const regularNodes    = nodes.slice(0, -1);
  const completedCount = regularNodes.filter(n => n.status === "completed").length;
  const canvasWidth = useMemo(() => {
    const rightMost = nodes.reduce((max, node) => {
      const width = node.id === goalId ? GOAL_W : NODE_W;
      return Math.max(max, node.x + width);
    }, CANVAS_W);
    return Math.max(CANVAS_W, rightMost + 160);
  }, [nodes, goalId]);
  const canvasHeight = useMemo(() => {
    const bottomMost = nodes.reduce((max, node) => Math.max(max, node.y + NODE_H), CANVAS_H);
    return Math.max(CANVAS_H, bottomMost + 160);
  }, [nodes]);
  const minZoom = useMemo(() => {
    if (!viewportSize.width || !viewportSize.height) return ABSOLUTE_MIN_ZOOM;
    const coverViewport = Math.max(viewportSize.width / canvasWidth, viewportSize.height / canvasHeight);
    return Math.min(1, Math.max(ABSOLUTE_MIN_ZOOM, coverViewport));
  }, [canvasWidth, canvasHeight, viewportSize]);
  const zoomPct = Math.round(zoom * 100);
  const zoneRegions = useMemo(() => {
    const zoneMap = new Map<string, { color: string; nodes: SkillNodeType[] }>();
    regularNodes.forEach((node) => {
      if (!node.zone) return;
      const zone = zoneMap.get(node.zone) ?? {
        color: node.zoneColor ?? "var(--color-accent)",
        nodes: [],
      };
      zone.nodes.push(node);
      zoneMap.set(node.zone, zone);
    });

    const lanes = Array.from(zoneMap.entries())
      .map(([name, zone]) => ({
        name,
        color: zone.color,
        minX: Math.min(...zone.nodes.map((node) => node.x)),
        maxX: Math.max(...zone.nodes.map((node) => node.x + NODE_W)),
      }))
      .sort((a, b) => a.minX - b.minX);

    return lanes.map((zone, index) => {
      const prev = lanes[index - 1];
      const next = lanes[index + 1];
      const left = prev ? Math.round((prev.maxX + zone.minX) / 2) : 0;
      const right = next ? Math.round((zone.maxX + next.minX) / 2) : canvasWidth;
      return {
        name: zone.name,
        color: zone.color,
        x: Math.max(0, left),
        y: 0,
        width: Math.max(220, right - left),
        height: canvasHeight,
      };
    });
  }, [regularNodes, canvasWidth, canvasHeight]);
  const activeZone = useMemo(() => {
    if (zoneRegions.length === 0) return null;
    const viewAnchorX = scrollPosition.left / zoom + 32 / zoom;
    const containingZone = zoneRegions.find((zone) => (
      viewAnchorX >= zone.x && viewAnchorX < zone.x + zone.width
    ));
    if (containingZone) return containingZone;

    return zoneRegions.reduce((closest, zone) => {
      const closestDistance = Math.abs(viewAnchorX - (closest.x + closest.width / 2));
      const zoneDistance = Math.abs(viewAnchorX - (zone.x + zone.width / 2));
      return zoneDistance < closestDistance ? zone : closest;
    }, zoneRegions[0]);
  }, [scrollPosition.left, zoom, zoneRegions]);

  useEffect(() => {
    posRef.current = new Map(nodes.map(n => [n.id, { x: n.x, y: n.y }]));
    velRef.current = new Map(nodes.map(n => [n.id, { vx: 0, vy: 0 }]));
    nodeEls.current.clear();
    pathEls.current.clear();
    setPressedNodeId(null);
    setSelectedNode(null);
  }, [nodes]);

  const handleOpenJsonInput = useCallback(() => {
    setJsonDraft(graphToSchema(graph));
    setJsonError(null);
    setJsonInputOpen(true);
  }, [graph]);

  const handleApplyJson = useCallback(() => {
    try {
      const nextGraph = graphFromSchema(JSON.parse(jsonDraft));
      setGraph(nextGraph);
      setJsonDraft(graphToSchema(nextGraph));
      setJsonError(null);
      setJsonInputOpen(false);
      requestAnimationFrame(() => {
        scrollRef.current?.scrollTo({ left: 0, top: 0, behavior: "smooth" });
      });
    } catch (error) {
      setJsonError(error instanceof Error ? error.message : "Could not parse that JSON.");
    }
  }, [jsonDraft]);

  // ── DOM helpers ───────────────────────────────────────────────────────────
  const setZoomFromPoint = useCallback((nextZoom: number, origin?: { x: number; y: number }) => {
    const scroll = scrollRef.current;
    setZoom((prevZoom) => {
      const next = clampZoom(nextZoom, minZoom);
      if (!scroll || Math.abs(next - prevZoom) < 0.001) return next;

      const rect = scroll.getBoundingClientRect();
      const originX = origin ? origin.x - rect.left : scroll.clientWidth / 2;
      const originY = origin ? origin.y - rect.top : scroll.clientHeight / 2;
      const graphX = (scroll.scrollLeft + originX) / prevZoom;
      const graphY = (scroll.scrollTop + originY) / prevZoom;

      requestAnimationFrame(() => {
        scroll.scrollTo({
          left: Math.max(0, graphX * next - originX),
          top: Math.max(0, graphY * next - originY),
          behavior: "instant",
        });
      });

      return next;
    });
  }, [minZoom]);

  const zoomIn = useCallback(() => {
    setZoomFromPoint(zoom * ZOOM_FACTOR);
  }, [setZoomFromPoint, zoom]);

  const zoomOut = useCallback(() => {
    setZoomFromPoint(zoom / ZOOM_FACTOR);
  }, [setZoomFromPoint, zoom]);

  const fitGraph = useCallback(() => {
    const scroll = scrollRef.current;
    if (!scroll) return;
    const next = minZoom;
    setZoom(next);
    requestAnimationFrame(() => {
      scroll.scrollTo({ left: 0, top: 0, behavior: "smooth" });
    });
  }, [minZoom]);

  const resetZoom = useCallback(() => {
    setZoomFromPoint(Math.max(1, minZoom));
  }, [minZoom, setZoomFromPoint]);

  const applyPos = useCallback((id: string, x: number, y: number) => {
    const el = nodeEls.current.get(id);
    if (el) { el.style.left = `${x}px`; el.style.top = `${y}px`; }
  }, []);

  const refreshEdgePath = useCallback((e: SkillEdgeType) => {
    const fn = nodeMap.get(e.fromNodeId);
    const tn = nodeMap.get(e.toNodeId);
    if (!fn || !tn) return;
    const fp = posRef.current.get(e.fromNodeId)!;
    const tp = posRef.current.get(e.toNodeId)!;
    const { x1, y1, x2, y2 } = edgePoints(
      { ...fn, x: fp.x, y: fp.y },
      { ...tn, x: tp.x, y: tp.y },
      false,
      tn.id === goalId,
    );
    pathEls.current.get(e.id)?.setAttribute("d", adaptiveBezierPath(x1, y1, x2, y2));
  }, [nodeMap, goalId]);

  const refreshAllEdges = useCallback(() => {
    edges.forEach(refreshEdgePath);
  }, [edges, refreshEdgePath]);

  // ── Spring animation loop ─────────────────────────────────────────────────
  const springTick = useCallback(() => {
    let anyActive = false;

    for (const node of nodes) {
      // Don't spring a node that's currently being dragged
      if (dragRef.current?.id === node.id) { anyActive = true; continue; }

      const pos = posRef.current.get(node.id)!;
      const vel = velRef.current.get(node.id)!;

      const dx = node.x - pos.x;
      const dy = node.y - pos.y;

      vel.vx = vel.vx * DAMP + dx * STIFF;
      vel.vy = vel.vy * DAMP + dy * STIFF;

      const settled =
        Math.abs(vel.vx) < THRESHOLD &&
        Math.abs(vel.vy) < THRESHOLD &&
        Math.abs(dx)     < THRESHOLD &&
        Math.abs(dy)     < THRESHOLD;

      if (settled) {
        posRef.current.set(node.id, { x: node.x, y: node.y });
        velRef.current.set(node.id, { vx: 0, vy: 0 });
        applyPos(node.id, node.x, node.y);
      } else {
        const nx = pos.x + vel.vx;
        const ny = pos.y + vel.vy;
        posRef.current.set(node.id, { x: nx, y: ny });
        applyPos(node.id, nx, ny);
        anyActive = true;
      }
    }

    refreshAllEdges();

    if (anyActive) {
      rafRef.current = requestAnimationFrame(springTick);
    } else {
      rafRef.current = null;
    }
  }, [nodes, applyPos, refreshAllEdges]);

  const startSpring = useCallback(() => {
    if (rafRef.current === null) {
      rafRef.current = requestAnimationFrame(springTick);
    }
  }, [springTick]);

  // ── Drag ─────────────────────────────────────────────────────────────────
  const handlePointerDown = useCallback((
    e: React.PointerEvent<HTMLDivElement>,
    nodeId: string,
  ) => {
    e.preventDefault();
    setPressedNodeId(nodeId);
    // Capture so pointermove fires even if cursor leaves the element
    (e.currentTarget as HTMLDivElement).setPointerCapture(e.pointerId);

    const scroll = scrollRef.current!;
    const rect   = scroll.getBoundingClientRect();
    const mx     = (e.clientX - rect.left + scroll.scrollLeft) / zoom;
    const my     = (e.clientY - rect.top  + scroll.scrollTop) / zoom;
    const pos    = posRef.current.get(nodeId)!;

    dragRef.current  = { id: nodeId, ox: mx - pos.x, oy: my - pos.y };
    didDragRef.current = false;

    // Reset velocity so spring starts clean from wherever drag lands
    velRef.current.set(nodeId, { vx: 0, vy: 0 });

    const el = nodeEls.current.get(nodeId);
    if (el) {
      el.style.cursor    = "grabbing";
      el.style.zIndex    = "20";
      el.style.boxShadow = "0 8px 28px oklch(34% 0.018 230 / 0.22), 0 2px 8px oklch(34% 0.018 230 / 0.10)";
      el.style.transition = "none"; // disable CSS transition during drag
    }

    const onMove = (ev: PointerEvent) => {
      if (!dragRef.current) return;
      const r  = scroll.getBoundingClientRect();
      const x  = (ev.clientX - r.left + scroll.scrollLeft) / zoom - dragRef.current.ox;
      const y  = (ev.clientY - r.top  + scroll.scrollTop) / zoom - dragRef.current.oy;
      posRef.current.set(dragRef.current.id, { x, y });
      applyPos(dragRef.current.id, x, y);
      // Update only the edges connected to this node
      edges.forEach(edge => {
        if (edge.fromNodeId === dragRef.current!.id || edge.toNodeId === dragRef.current!.id) {
          refreshEdgePath(edge);
        }
      });
      didDragRef.current = true;
    };

    const onUp = () => {
      if (!dragRef.current) return;
      const nid = dragRef.current.id;
      dragRef.current = null;
      setPressedNodeId(null);
      const nEl = nodeEls.current.get(nid);
      if (nEl) {
        nEl.style.cursor    = "";
        nEl.style.zIndex    = "";
        nEl.style.boxShadow = "";
        nEl.style.transition = "";
      }
      document.removeEventListener("pointermove", onMove);
      startSpring();
    };

    document.addEventListener("pointermove", onMove);
    document.addEventListener("pointerup", onUp, { once: true });
    document.addEventListener("pointercancel", onUp, { once: true });
  }, [edges, applyPos, refreshEdgePath, startSpring, zoom]);

  // Suppress click when the pointer actually moved (drag, not tap)
  const handleNodeClick = useCallback((node: SkillNodeType) => {
    if (didDragRef.current) { didDragRef.current = false; return; }
    setSelectedNode(prev => prev?.id === node.id ? null : node);
  }, []);

  const handlePanelSelect = useCallback((node: SkillNodeType) => {
    setSelectedNode(node);
    const scroll = scrollRef.current;
    if (!scroll) return;

    const nodeCenterX = node.x + (node.id === goalId ? GOAL_W / 2 : NODE_W / 2);
    const nodeCenterY = node.y + (node.id === goalId ? GOAL_H / 2 : NODE_H / 2);
    scroll.scrollTo({
      left: Math.max(0, nodeCenterX * zoom - scroll.clientWidth / 2),
      top: Math.max(0, nodeCenterY * zoom - scroll.clientHeight / 2),
      behavior: "smooth",
    });
  }, [goalId, zoom]);

  // ── Lifecycle ─────────────────────────────────────────────────────────────
  useEffect(() => {
    zoomRef.current = zoom;
  }, [zoom]);

  useEffect(() => {
    const scroll = scrollRef.current;
    if (!scroll) return;

    setScrollEl(scroll);
    const syncViewportSize = () => {
      setViewportSize({
        width: scroll.clientWidth,
        height: scroll.clientHeight,
      });
      setScrollPosition({
        left: scroll.scrollLeft,
        top: scroll.scrollTop,
      });
    };

    syncViewportSize();
    const observer = new ResizeObserver(syncViewportSize);
    observer.observe(scroll);
    scroll.addEventListener("scroll", syncViewportSize, { passive: true });
    window.addEventListener("resize", syncViewportSize);

    return () => {
      observer.disconnect();
      scroll.removeEventListener("scroll", syncViewportSize);
      window.removeEventListener("resize", syncViewportSize);
    };
  }, []);

  useEffect(() => {
    const scroll = scrollRef.current;
    if (!scroll) return;

    const onWheel = (event: WheelEvent) => {
      if (!event.ctrlKey && !event.metaKey) return;
      event.preventDefault();
      event.stopPropagation();
      const clampedDelta = Math.max(-50, Math.min(50, event.deltaY));
      const wheelScale = Math.exp(-clampedDelta * WHEEL_ZOOM_SENSITIVITY);
      const cappedScale = Math.max(1 / MAX_WHEEL_ZOOM_STEP, Math.min(MAX_WHEEL_ZOOM_STEP, wheelScale));
      setZoomFromPoint(zoomRef.current * cappedScale, {
        x: event.clientX,
        y: event.clientY,
      });
    };

    scroll.addEventListener("wheel", onWheel, { passive: false });
    return () => {
      scroll.removeEventListener("wheel", onWheel);
    };
  }, [setZoomFromPoint]);

  useEffect(() => {
    setZoom((current) => clampZoom(current, minZoom));
  }, [minZoom]);

  // Scroll to current node on mount (horizontal)
  useEffect(() => {
    const cur = nodes.find(n => n.status === "current");
    if (cur && scrollRef.current) {
      const el     = scrollRef.current;
      const target = Math.max(0, (cur.x + NODE_W / 2) * zoom - el.clientWidth / 2);
      el.scrollTo({ left: target, behavior: "instant" });
    }
  }, [nodes, zoom]);

  // Cleanup RAF on unmount
  useEffect(() => () => { if (rafRef.current) cancelAnimationFrame(rafRef.current); }, []);

  // ── Render ────────────────────────────────────────────────────────────────
  return (
    <>
      <TopBar
        subject={subject}
        completedCount={completedCount}
        totalCount={regularNodes.length}
        onOpenJsonInput={handleOpenJsonInput}
      />

      {jsonInputOpen && (
        <JsonInputPanel
          value={jsonDraft}
          error={jsonError}
          onChange={(value) => {
            setJsonDraft(value);
            setJsonError(null);
          }}
          onApply={handleApplyJson}
          onClose={() => setJsonInputOpen(false)}
        />
      )}

      <div
        ref={scrollRef}
        style={{
          position: "fixed",
          inset: `48px ${RIGHT_PANEL_W} 0 0`,
          overflow: "auto",
          background: "var(--color-canvas)",
          overscrollBehavior: "contain",
        }}
      >
        <div
          style={{
            position: "relative",
            width: canvasWidth * zoom,
            height: canvasHeight * zoom,
            minHeight: "calc(100vh - 48px)",
          }}
        >
          <div
            style={{
              position: "absolute",
              left: 0,
              top: 0,
              width: canvasWidth,
              height: canvasHeight,
              transform: `scale(${zoom})`,
              transformOrigin: "top left",
            }}
          >
          {zoneRegions.map((zone) => (
            <div
              key={zone.name}
              aria-hidden="true"
              style={{
                position: "absolute",
                left: zone.x,
                top: zone.y,
                width: zone.width,
                height: zone.height,
                borderLeft: `1px solid color-mix(in oklch, ${zone.color} 30%, transparent)`,
                borderRight: `1px solid color-mix(in oklch, ${zone.color} 24%, transparent)`,
                background: `color-mix(in oklch, ${zone.color} 11%, var(--color-canvas))`,
                pointerEvents: "none",
                zIndex: 0,
              }}
            >
              <div
                style={{
                  position: "absolute",
                  right: 18,
                  bottom: 18,
                  color: zone.color,
                  fontSize: 46,
                  fontWeight: 800,
                  letterSpacing: 0,
                  opacity: 0.13,
                  textTransform: "uppercase",
                  whiteSpace: "nowrap",
                }}
              >
                {zone.name}
              </div>
            </div>
          ))}

          {/* Edge layer — paths are updated imperatively during animation */}
          <svg
            style={{
              position: "absolute",
              inset: 0,
              width: "100%",
              height: "100%",
              pointerEvents: "none",
              overflow: "visible",
              zIndex: 1,
            }}
            aria-hidden="true"
          >
            {edges.map((e, i) => {
              const fn = nodeMap.get(e.fromNodeId);
              const tn = nodeMap.get(e.toNodeId);
              if (!fn || !tn) return null;
              return (
                <SkillEdge
                  key={e.id}
                  fromNode={fn}
                  toNode={tn}
                  markerId={`arr-${i}`}
                  toIsGoal={tn.id === goalId}
                  setPathRef={el => {
                    if (el) pathEls.current.set(e.id, el);
                    else pathEls.current.delete(e.id);
                  }}
                />
              );
            })}
          </svg>

          {/* Regular nodes — positioned imperatively during animation */}
          {regularNodes.map(node => (
            <SkillNode
              key={node.id}
              node={node}
              isSelected={pressedNodeId === node.id}
              setRef={el => {
                if (el) nodeEls.current.set(node.id, el);
                else nodeEls.current.delete(node.id);
              }}
              onPointerDown={e => handlePointerDown(e, node.id)}
              onClick={handleNodeClick}
            />
          ))}

          {/* Goal node — not draggable */}
          {goalNode && <SkillNode key={goalNode.id} node={goalNode} isGoal />}
          </div>
        </div>
      </div>

      {goalNode && (
        <GoalPathPanel
          goal={goalNode}
          steppingStones={regularNodes}
          selectedNode={selectedNode}
          completedCount={completedCount}
          onSelectNode={handlePanelSelect}
        />
      )}

      <MiniMap
        nodes={nodes}
        edges={edges}
        canvasWidth={canvasWidth}
        canvasHeight={canvasHeight}
        scrollEl={scrollEl}
        zoom={zoom}
      />

      <div
        style={{
          position: "fixed",
          top: 152,
          right: `calc(${RIGHT_PANEL_W} + 16px)`,
          display: "flex",
          alignItems: "center",
          gap: 4,
          padding: 4,
          background: "var(--color-chrome)",
          border: "1px solid var(--color-border)",
          borderRadius: 6,
          boxShadow: "0 2px 8px oklch(34% 0.018 230 / 0.10)",
          zIndex: 190,
        }}
        aria-label="Graph zoom controls"
      >
        <button
          type="button"
          onClick={zoomOut}
          disabled={zoom <= minZoom + 0.005}
          title="Zoom out"
          aria-label="Zoom out"
          style={{
            ...zoomButtonStyle,
            opacity: zoom <= minZoom + 0.005 ? 0.42 : 1,
            cursor: zoom <= minZoom + 0.005 ? "default" : "pointer",
          }}
        >
          -
        </button>
        <button type="button" onClick={resetZoom} title="Reset zoom" aria-label="Reset zoom" style={{ ...zoomButtonStyle, width: 44 }}>
          {zoomPct}%
        </button>
        <button type="button" onClick={zoomIn} title="Zoom in" aria-label="Zoom in" style={zoomButtonStyle}>
          +
        </button>
        <button type="button" onClick={fitGraph} title="Fit graph" aria-label="Fit graph" style={{ ...zoomButtonStyle, width: 34 }}>
          Fit
        </button>
      </div>
    </>
  );
}

const zoomButtonStyle: React.CSSProperties = {
  width: 28,
  height: 26,
  border: "1px solid var(--color-border)",
  borderRadius: 5,
  background: "var(--color-node)",
  color: "var(--color-text-primary)",
  cursor: "pointer",
  display: "inline-flex",
  alignItems: "center",
  justifyContent: "center",
  fontSize: 12,
  fontWeight: 750,
  lineHeight: 1,
};
