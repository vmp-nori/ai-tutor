"use client";

import { useRef, useState, useCallback, useEffect, useMemo } from "react";
import type { NodeStatus, SkillNode as SkillNodeType, SkillEdge as SkillEdgeType } from "@/lib/types";
import { edgePoints, adaptiveBezierPath } from "@/lib/utils";
import { SkillNode } from "./SkillNode";
import { SkillEdge } from "./SkillEdge";
import { JsonInputPanel } from "@/components/ui/JsonInputPanel";
import { MiniMap } from "@/components/ui/MiniMap";
import { TopBar } from "@/components/ui/TopBar";

const CANVAS_W = 3000;
const CANVAS_H = 820;
const TOPBAR_H = 48;
const CHAPTER_RAIL_H = 96;
const CANVAS_TOP = TOPBAR_H + CHAPTER_RAIL_H;
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
const STIFF     = 0.10;
const DAMP      = 0.84;
const THRESHOLD = 0.15;

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
    "#6EF1E0",
    "#7AE2A8",
    "#4DA8FF",
    "#F4C36B",
    "#C084FC",
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
      zone_color: node.zoneColor ?? "#6EF1E0",
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
    zoneColor: "#6EF1E0",
  };

  terminalIds.forEach((fromNodeId) => {
    edges.push({
      id: `edge_${fromNodeId}_goal`,
      treeId: "input-json",
      fromNodeId,
      toNodeId: "goal",
    });
  });

  return { subject, nodes: [...nodes, goalNode], edges };
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

  const { nodes, edges, subject } = graph;

  const posRef = useRef(new Map(nodes.map(n => [n.id, { x: n.x, y: n.y }])));
  const velRef = useRef(new Map(nodes.map(n => [n.id, { vx: 0, vy: 0 }])));
  const nodeEls = useRef(new Map<string, HTMLDivElement>());
  const pathEls = useRef(new Map<string, SVGPathElement>());
  const chapterEls = useRef(new Map<string, HTMLDivElement>());
  const zoomRef = useRef(zoom);
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
        color: node.zoneColor ?? "#6EF1E0",
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

  const zoomIn = useCallback(() => { setZoomFromPoint(zoom * ZOOM_FACTOR); }, [setZoomFromPoint, zoom]);
  const zoomOut = useCallback(() => { setZoomFromPoint(zoom / ZOOM_FACTOR); }, [setZoomFromPoint, zoom]);
  const fitGraph = useCallback(() => {
    setZoom(minZoom);
    requestAnimationFrame(() => {
      scrollRef.current?.scrollTo({ left: 0, top: 0, behavior: "smooth" });
    });
  }, [minZoom]);
  const resetZoom = useCallback(() => {
    setZoomFromPoint(Math.max(1, minZoom));
  }, [minZoom, setZoomFromPoint]);

  const syncChapterRail = useCallback(() => {
    const scroll = scrollRef.current;
    if (!scroll) return;

    zoneRegions.forEach((zone) => {
      const el = chapterEls.current.get(zone.name);
      if (!el) return;
      el.style.transform = `translate3d(${zone.x * zoom - scroll.scrollLeft}px, 0, 0)`;
      el.style.width = `${zone.width * zoom}px`;
    });
  }, [zoneRegions, zoom]);

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

  const springTick = useCallback(() => {
    let anyActive = false;

    for (const node of nodes) {
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

  const handlePointerDown = useCallback((
    e: React.PointerEvent<HTMLDivElement>,
    nodeId: string,
  ) => {
    e.preventDefault();
    setPressedNodeId(nodeId);
    (e.currentTarget as HTMLDivElement).setPointerCapture(e.pointerId);

    const scroll = scrollRef.current!;
    const rect   = scroll.getBoundingClientRect();
    const mx     = (e.clientX - rect.left + scroll.scrollLeft) / zoom;
    const my     = (e.clientY - rect.top  + scroll.scrollTop) / zoom;
    const pos    = posRef.current.get(nodeId)!;

    dragRef.current  = { id: nodeId, ox: mx - pos.x, oy: my - pos.y };
    didDragRef.current = false;

    velRef.current.set(nodeId, { vx: 0, vy: 0 });

    const el = nodeEls.current.get(nodeId);
    if (el) {
      el.style.cursor    = "grabbing";
      el.style.zIndex    = "20";
      el.style.boxShadow = "0 8px 28px rgba(20,15,10,0.14), 0 0 0 2px rgba(147,197,253,0.34)";
      el.style.transition = "none";
    }

    const onMove = (ev: PointerEvent) => {
      if (!dragRef.current) return;
      const r  = scroll.getBoundingClientRect();
      const x  = (ev.clientX - r.left + scroll.scrollLeft) / zoom - dragRef.current.ox;
      const y  = (ev.clientY - r.top  + scroll.scrollTop) / zoom - dragRef.current.oy;
      posRef.current.set(dragRef.current.id, { x, y });
      applyPos(dragRef.current.id, x, y);
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

  const handleNodeClick = useCallback((node: SkillNodeType) => {
    if (didDragRef.current) { didDragRef.current = false; return; }
    setSelectedNode(prev => prev?.id === node.id ? null : node);
  }, []);

  useEffect(() => { zoomRef.current = zoom; }, [zoom]);

  useEffect(() => {
    const scroll = scrollRef.current;
    if (!scroll) return;

    setScrollEl(scroll);
    const syncViewportSize = () => {
      setViewportSize({ width: scroll.clientWidth, height: scroll.clientHeight });
    };

    syncViewportSize();
    const observer = new ResizeObserver(syncViewportSize);
    observer.observe(scroll);
    window.addEventListener("resize", syncViewportSize);

    return () => {
      observer.disconnect();
      window.removeEventListener("resize", syncViewportSize);
    };
  }, []);

  useEffect(() => {
    const scroll = scrollRef.current;
    if (!scroll) return;

    syncChapterRail();
    scroll.addEventListener("scroll", syncChapterRail, { passive: true });
    return () => { scroll.removeEventListener("scroll", syncChapterRail); };
  }, [syncChapterRail]);

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
      setZoomFromPoint(zoomRef.current * cappedScale, { x: event.clientX, y: event.clientY });
    };

    scroll.addEventListener("wheel", onWheel, { passive: false });
    return () => { scroll.removeEventListener("wheel", onWheel); };
  }, [setZoomFromPoint]);

  useEffect(() => {
    setZoom((current) => clampZoom(current, minZoom));
  }, [minZoom]);

  useEffect(() => {
    const cur = nodes.find(n => n.status === "current");
    if (cur && scrollRef.current) {
      const el     = scrollRef.current;
      const target = Math.max(0, (cur.x + NODE_W / 2) * zoom - el.clientWidth / 2);
      el.scrollTo({ left: target, behavior: "instant" });
    }
  }, [nodes, zoom]);

  useEffect(() => () => { if (rafRef.current) cancelAnimationFrame(rafRef.current); }, []);

  // Floating card position (in scroll-container pixels = canvas coords × zoom)
  const selCardPos = useMemo(() => {
    if (!selectedNode) return null;
    const p = posRef.current.get(selectedNode.id) ?? { x: selectedNode.x, y: selectedNode.y };
    const nw = selectedNode.id === goalId ? GOAL_W : NODE_W;
    const CARD_W = 320;
    const rightEdge = p.x * zoom + nw * zoom + 18 + CARD_W + 8;
    const flip = rightEdge > canvasWidth * zoom;
    return {
      left: flip ? p.x * zoom - CARD_W - 18 : p.x * zoom + nw * zoom + 18,
      top: Math.max(8, p.y * zoom - 8),
      flip,
    };
  // selectedNode changes trigger recompute; posRef is a ref so access it imperatively
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedNode, zoom, goalId, canvasWidth]);

  return (
    <>
      <TopBar
        subject={subject}
        completedCount={completedCount}
        totalCount={regularNodes.length}
        onOpenJsonInput={handleOpenJsonInput}
      />

      {/* Chapter rail — Swiss-grid editorial style */}
      {zoneRegions.length > 0 && (
        <div
          aria-hidden="true"
          style={{
            position: "fixed",
            top: TOPBAR_H,
            left: 0,
            right: 0,
            height: CHAPTER_RAIL_H,
            background: "#FCFCFA",
            borderBottom: "1px solid #E6E5DF",
            zIndex: 100,
            overflow: "hidden",
          }}
        >
          {zoneRegions.map((zone, i) => {
            const vpWidth = zone.width * zoom;
            const hasCurrentNode = regularNodes.some(n => n.zone === zone.name && n.status === "current");
            const numSize = vpWidth < 220 ? 40 : vpWidth < 280 ? 48 : 56;
            const nameSize = vpWidth < 240 ? 13 : 15;
            const zoneDone = regularNodes.filter(n => n.zone === zone.name && n.status === "completed").length;
            const zoneTotal = regularNodes.filter(n => n.zone === zone.name).length;
            return (
              <div
                key={zone.name}
                ref={(el) => {
                  if (el) chapterEls.current.set(zone.name, el);
                  else chapterEls.current.delete(zone.name);
                }}
                style={{
                  position: "absolute",
                  left: 0,
                  width: vpWidth,
                  transform: `translate3d(${zone.x * zoom}px, 0, 0)`,
                  willChange: "transform",
                  top: 0,
                  height: CHAPTER_RAIL_H,
                  padding: "16px 18px",
                  overflow: "hidden",
                  borderLeft: i > 0 ? "1px solid #E6E5DF" : "none",
                }}
              >
                <div style={{ display: "flex", alignItems: "baseline", gap: 10 }}>
                  {/* Oversize chapter numeral */}
                  <span style={{
                    fontSize: numSize,
                    fontWeight: 700,
                    letterSpacing: "-0.04em",
                    color: hasCurrentNode ? "#2563EB" : "#B8B8AE",
                    lineHeight: 0.85,
                    fontVariantNumeric: "tabular-nums",
                    flexShrink: 0,
                  }}>
                    {String(i + 1).padStart(2, "0")}
                  </span>
                  <div style={{ minWidth: 0, flex: 1 }}>
                    <div style={{
                      fontSize: 9.5,
                      fontWeight: 700,
                      letterSpacing: "0.16em",
                      textTransform: "uppercase" as const,
                      color: "#8A8A82",
                      marginBottom: 3,
                    }}>
                      Chapter
                    </div>
                    <div style={{
                      fontSize: nameSize,
                      fontWeight: 650,
                      lineHeight: 1.15,
                      letterSpacing: "-0.01em",
                      color: "#0E0F12",
                      overflow: "hidden",
                      textOverflow: "ellipsis",
                      whiteSpace: "nowrap",
                    }}>
                      {zone.name}
                    </div>
                    {zoneTotal > 0 && (
                      <div style={{ fontSize: 11, color: "#8A8A82", marginTop: 4, fontVariantNumeric: "tabular-nums" }}>
                        {zoneDone}/{zoneTotal} concepts
                      </div>
                    )}
                  </div>
                </div>
                {/* Active chapter underline */}
                {hasCurrentNode && (
                  <div style={{
                    position: "absolute",
                    left: 0,
                    bottom: -1,
                    height: 2,
                    width: "100%",
                    background: "#93C5FD",
                  }} />
                )}
              </div>
            );
          })}
        </div>
      )}

      {jsonInputOpen && (
        <JsonInputPanel
          value={jsonDraft}
          error={jsonError}
          onChange={(value) => { setJsonDraft(value); setJsonError(null); }}
          onApply={handleApplyJson}
          onClose={() => setJsonInputOpen(false)}
        />
      )}

      <div
        ref={scrollRef}
        onClick={() => setSelectedNode(null)}
        style={{
          position: "fixed",
          inset: `${CANVAS_TOP}px 0 0 0`,
          overflow: "auto",
          background: "#FCFCFA",
          overscrollBehavior: "contain",
        }}
      >
        <div
          style={{
            position: "relative",
            width: canvasWidth * zoom,
            height: canvasHeight * zoom,
            minHeight: `calc(100vh - ${CANVAS_TOP}px)`,
          }}
        >
          {/* Scaled canvas */}
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
            {/* Zone backgrounds */}
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
                  borderLeft: `1px solid color-mix(in srgb, ${zone.color} 20%, #E6E5DF)`,
                  borderRight: `1px solid color-mix(in srgb, ${zone.color} 15%, #E6E5DF)`,
                  background: `color-mix(in srgb, ${zone.color} 5%, #FCFCFA)`,
                  pointerEvents: "none",
                  zIndex: 0,
                }}
              >
                <div
                  style={{
                    position: "absolute",
                    right: 18,
                    bottom: 18,
                    color: "#0E0F12",
                    fontSize: 46,
                    fontWeight: 800,
                    letterSpacing: 0,
                    opacity: 0.03,
                    textTransform: "uppercase",
                    whiteSpace: "nowrap",
                  }}
                >
                  {zone.name}
                </div>
              </div>
            ))}

            {/* Edge SVG layer */}
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

            {/* Regular nodes */}
            {regularNodes.map(node => (
              <SkillNode
                key={node.id}
                node={node}
                isSelected={selectedNode?.id === node.id || pressedNodeId === node.id}
                setRef={el => {
                  if (el) nodeEls.current.set(node.id, el);
                  else nodeEls.current.delete(node.id);
                }}
                onPointerDown={e => handlePointerDown(e, node.id)}
                onClick={handleNodeClick}
              />
            ))}

            {/* Goal node */}
            {goalNode && <SkillNode key={goalNode.id} node={goalNode} isGoal />}
          </div>

          {/* Floating selection card (outside scaled div, in scroll-container space) */}
          {selectedNode && selCardPos && (
            <FloatingCard
              node={selectedNode}
              allNodes={nodes}
              left={selCardPos.left}
              top={selCardPos.top}
              flip={selCardPos.flip}
              onClose={() => setSelectedNode(null)}
            />
          )}
        </div>
      </div>

      <MiniMap
        nodes={nodes}
        edges={edges}
        canvasWidth={canvasWidth}
        canvasHeight={canvasHeight}
        scrollEl={scrollEl}
        zoom={zoom}
      />

      {/* Zoom controls — bottom-left */}
      <div
        style={{
          position: "fixed",
          bottom: 16,
          left: 16,
          display: "inline-flex",
          height: 32,
          background: "#FFFFFF",
          border: "1px solid #E6E5DF",
          borderRadius: 7,
          overflow: "hidden",
          zIndex: 190,
          boxShadow: "0 1px 4px rgba(20,15,10,0.06)",
        }}
        aria-label="Graph zoom controls"
      >
        <button type="button" onClick={zoomOut} disabled={zoom <= minZoom + 0.005} style={zoomBtnStyle(zoom <= minZoom + 0.005)}>−</button>
        <button type="button" onClick={resetZoom} style={{ ...zoomBtnStyle(false), width: 50, fontFamily: "ui-monospace, monospace", letterSpacing: "0.02em" }}>{zoomPct}%</button>
        <button type="button" onClick={zoomIn} style={zoomBtnStyle(false)}>＋</button>
        <button type="button" onClick={fitGraph} style={{ ...zoomBtnStyle(false), width: 36, borderRight: "none" }}>Fit</button>
      </div>
    </>
  );
}

const STATUS_LABELS: Record<string, string> = {
  completed: "Completed",
  current:   "In progress",
  available: "Available",
  locked:    "Locked",
};

interface FloatingCardProps {
  node: SkillNodeType;
  allNodes: SkillNodeType[];
  left: number;
  top: number;
  flip: boolean;
  onClose: () => void;
}

function FloatingCard({ node, allNodes, left, top, flip, onClose }: FloatingCardProps) {
  const nodeMap = useMemo(() => new Map(allNodes.map(n => [n.id, n])), [allNodes]);
  const isCurrent = node.status === "current";
  const isDone = node.status === "completed";

  const dotColor = isCurrent ? "#93C5FD" : isDone ? "#15803D" : "#8A8A82";
  const statusLabelColor = isCurrent ? "#2563EB" : isDone ? "#15803D" : "#8A8A82";
  const canStart = node.status === "current" || node.status === "available";

  return (
    <div
      onClick={e => e.stopPropagation()}
      style={{
        position: "absolute",
        left,
        top,
        width: 320,
        background: "#FFFFFF",
        border: "1px solid #C9C7BD",
        borderRadius: 12,
        padding: 16,
        zIndex: 25,
        boxShadow: "0 18px 44px rgba(20,15,10,0.12), 0 2px 6px rgba(20,15,10,0.04)",
        pointerEvents: "auto",
      }}
    >
      {/* Arrow caret */}
      <div style={{
        position: "absolute",
        [flip ? "right" : "left"]: -7,
        top: 22,
        width: 12,
        height: 12,
        background: "#FFFFFF",
        borderLeft: flip ? "none" : "1px solid #C9C7BD",
        borderRight: flip ? "1px solid #C9C7BD" : "none",
        borderBottom: flip ? "none" : "1px solid #C9C7BD",
        borderTop: flip ? "1px solid #C9C7BD" : "none",
        transform: "rotate(45deg)",
      }} />

      {/* Header */}
      <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 2 }}>
        <span style={{ width: 5, height: 5, borderRadius: "50%", background: dotColor, flexShrink: 0 }} />
        <span style={{
          fontSize: 9.5,
          fontWeight: 700,
          letterSpacing: "0.12em",
          textTransform: "uppercase" as const,
          color: statusLabelColor,
        }}>
          {STATUS_LABELS[node.status]}
        </span>
        <span style={{ flex: 1 }} />
        <button
          onClick={onClose}
          style={{
            width: 20,
            height: 20,
            borderRadius: 4,
            border: "none",
            background: "transparent",
            cursor: "pointer",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            color: "#8A8A82",
            padding: 0,
          }}
        >
          <svg width="10" height="10" viewBox="0 0 10 10" fill="none">
            <path d="M1 1L9 9M9 1L1 9" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
          </svg>
        </button>
      </div>

      <h3 style={{
        margin: "8px 0 10px",
        fontSize: 19,
        fontWeight: 700,
        letterSpacing: "-0.015em",
        lineHeight: 1.2,
        color: "#0E0F12",
      }}>
        {node.name}
      </h3>

      {node.description && (
        <p style={{
          margin: "0 0 14px",
          fontSize: 12.5,
          lineHeight: 1.55,
          color: "#4D4E54",
        }}>
          {node.description}
        </p>
      )}

      {/* Meta grid */}
      <div style={{
        display: "grid",
        gridTemplateColumns: "auto 1fr",
        rowGap: 7,
        columnGap: 14,
        fontSize: 11.5,
        padding: "12px 0",
        borderTop: "1px solid #E6E5DF",
        borderBottom: "1px solid #E6E5DF",
        marginBottom: 14,
      }}>
        {typeof node.difficultyLevel === "number" && (
          <>
            <span style={{ color: "#8A8A82", fontWeight: 600, fontSize: 10, letterSpacing: "0.06em", textTransform: "uppercase" as const, alignSelf: "center" }}>Difficulty</span>
            <span style={{ color: "#0E0F12", fontWeight: 600 }}>L{node.difficultyLevel} / 10</span>
          </>
        )}
        {node.prereqs.length > 0 && (
          <>
            <span style={{ color: "#8A8A82", fontWeight: 600, fontSize: 10, letterSpacing: "0.06em", textTransform: "uppercase" as const, alignSelf: "center" }}>Depends on</span>
            <span style={{ color: "#0E0F12", fontWeight: 600 }}>
              {node.prereqs.length} concept{node.prereqs.length === 1 ? "" : "s"}
            </span>
          </>
        )}
        {node.zone && (
          <>
            <span style={{ color: "#8A8A82", fontWeight: 600, fontSize: 10, letterSpacing: "0.06em", textTransform: "uppercase" as const, alignSelf: "center" }}>Chapter</span>
            <span style={{ color: "#0E0F12", fontWeight: 600 }}>{node.zone}</span>
          </>
        )}
      </div>

      {/* Prerequisites */}
      {node.prereqs.length > 0 && (
        <div style={{ display: "flex", flexDirection: "column", gap: 4, marginBottom: 14 }}>
          {node.prereqs.map(pid => {
            const p = nodeMap.get(pid);
            if (!p) return null;
            return (
              <div key={pid} style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 11.5, color: "#4D4E54" }}>
                <div style={{
                  width: 12,
                  height: 12,
                  borderRadius: 3,
                  border: p.status === "completed" ? "none" : "1px solid #C9C7BD",
                  background: p.status === "completed" ? "#15803D" : "transparent",
                  flexShrink: 0,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}>
                  {p.status === "completed" && (
                    <svg width="7" height="5" viewBox="0 0 7 5" fill="none">
                      <path d="M1 2.5L2.5 4L6 1" stroke="#FFFFFF" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  )}
                </div>
                <span>{p.name}</span>
              </div>
            );
          })}
        </div>
      )}

      {/* CTA */}
      <button
        disabled={!canStart}
        style={{
          width: "100%",
          height: 36,
          borderRadius: 8,
          border: "none",
          background: canStart ? "#93C5FD" : "#F6F6F2",
          color: canStart ? "#0E0F12" : "#B8B8AE",
          fontWeight: 700,
          fontSize: 12.5,
          cursor: canStart ? "pointer" : "default",
          letterSpacing: "-0.005em",
        }}
      >
        {node.status === "current" ? "Continue lesson" : "Open lesson"}
      </button>
    </div>
  );
}

function zoomBtnStyle(disabled: boolean): React.CSSProperties {
  return {
    width: 36,
    height: 32,
    border: "none",
    borderRight: "1px solid #E6E5DF",
    background: "transparent",
    color: disabled ? "#C9C7BD" : "#4D4E54",
    cursor: disabled ? "default" : "pointer",
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    fontSize: 13,
    fontWeight: 600,
    lineHeight: 1,
  };
}
