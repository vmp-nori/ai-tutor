"use client";

import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";

interface Point {
  x: number;
  y: number;
}

interface SelectionRect {
  x: number;
  y: number;
  width: number;
  height: number;
}

interface ScreenSelectionDetail {
  rect: SelectionRect;
  text: string;
}

interface CapturedSelection {
  rect: SelectionRect;
  text: string;
  nodes: Node[];
}

interface ChatMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
}

type StreamState = "idle" | "streaming" | "error";

const SCREEN_SELECTION_EVENT = "pathwise:screen-selection";
const MIN_SELECTION_SIZE = 8;
const CURSOR_HINT_OFFSET = 16;
const CURSOR_HINT_WIDTH = 270;
const CURSOR_HINT_HEIGHT = 42;
const AI_WINDOW_WIDTH = 460;
const AI_WINDOW_GAP = 12;
const AI_WINDOW_TOP = 72;
const AI_WINDOW_MOTION_MS = 560;

function normalizeRect(start: Point, end: Point): SelectionRect {
  const x = Math.min(start.x, end.x);
  const y = Math.min(start.y, end.y);

  return {
    x,
    y,
    width: Math.abs(end.x - start.x),
    height: Math.abs(end.y - start.y),
  };
}

function rectsIntersect(a: SelectionRect, b: DOMRect): boolean {
  return a.x < b.right && a.x + a.width > b.left && a.y < b.bottom && a.y + a.height > b.top;
}

function isIgnoredTextNode(node: Node): boolean {
  const parent = node.parentElement;

  if (!parent) return true;
  if (parent.closest("[data-screen-selection-ui]")) return true;

  const tag = parent.tagName.toLowerCase();
  return tag === "script" || tag === "style" || tag === "noscript";
}

function getRectForTextNodes(nodes: Node[]): SelectionRect | null {
  const rects: DOMRect[] = [];

  for (const node of nodes) {
    const range = document.createRange();
    range.selectNodeContents(node);
    rects.push(...Array.from(range.getClientRects()));
    range.detach();
  }

  if (rects.length === 0) return null;

  const left = Math.min(...rects.map((rect) => rect.left));
  const top = Math.min(...rects.map((rect) => rect.top));
  const right = Math.max(...rects.map((rect) => rect.right));
  const bottom = Math.max(...rects.map((rect) => rect.bottom));

  return {
    x: left,
    y: top,
    width: right - left,
    height: bottom - top,
  };
}

function getSelectionInsideRect(rect: SelectionRect): CapturedSelection {
  const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT);
  const selectedText: string[] = [];
  const nodes: Node[] = [];

  while (walker.nextNode()) {
    const node = walker.currentNode;
    const text = node.textContent?.replace(/\s+/g, " ").trim();

    if (!text || isIgnoredTextNode(node)) continue;

    const range = document.createRange();
    range.selectNodeContents(node);

    const intersects = Array.from(range.getClientRects()).some((clientRect) => rectsIntersect(rect, clientRect));
    range.detach();

    if (intersects) {
      selectedText.push(text);
      nodes.push(node);
    }
  }

  return {
    rect,
    text: selectedText.join("\n").slice(0, 6000),
    nodes,
  };
}

function messageId() {
  return globalThis.crypto?.randomUUID?.() ?? String(Date.now());
}

function getCursorHintPosition(cursorPoint: Point | null): Point {
  if (!cursorPoint || typeof window === "undefined") {
    return { x: 16, y: 16 };
  }

  return {
    x: Math.max(12, Math.min(cursorPoint.x + CURSOR_HINT_OFFSET, window.innerWidth - CURSOR_HINT_WIDTH - 12)),
    y: Math.max(12, Math.min(cursorPoint.y + CURSOR_HINT_OFFSET, window.innerHeight - CURSOR_HINT_HEIGHT - 12)),
  };
}

async function readErrorMessage(response: Response) {
  try {
    const data = await response.json();
    if (typeof data?.error === "string") return data.error;
  } catch {
  }

  return response.status === 401 ? "Sign in to ask about a selection." : "The answer could not be generated.";
}

export function ScreenSelectionOverlay() {
  const [isActive, setIsActive] = useState(false);
  const [dragStart, setDragStart] = useState<Point | null>(null);
  const [dragEnd, setDragEnd] = useState<Point | null>(null);
  const [selection, setSelection] = useState<ScreenSelectionDetail | null>(null);
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [prompt, setPrompt] = useState("");
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [streamState, setStreamState] = useState<StreamState>("idle");
  const [error, setError] = useState("");
  const [cursorPoint, setCursorPoint] = useState<Point | null>(null);
  const inputRef = useRef<HTMLTextAreaElement | null>(null);
  const selectionBoxRef = useRef<HTMLDivElement | null>(null);
  const abortRef = useRef<AbortController | null>(null);
  const selectedTextNodesRef = useRef<Node[]>([]);
  const isDraggingRef = useRef(false);

  const liveRect = useMemo(() => {
    if (!dragStart || !dragEnd) return null;
    return normalizeRect(dragStart, dragEnd);
  }, [dragEnd, dragStart]);

  const displayRect = liveRect ?? selection?.rect ?? null;
  const cursorHintPosition = getCursorHintPosition(cursorPoint);

  const resetDrag = useCallback(() => {
    isDraggingRef.current = false;
    setDragStart(null);
    setDragEnd(null);
  }, []);

  const closeChat = useCallback(() => {
    abortRef.current?.abort();
    abortRef.current = null;
    setIsActive(false);
    setIsChatOpen(false);
    setSelection(null);
    setPrompt("");
    setMessages([]);
    setStreamState("idle");
    setError("");
    selectedTextNodesRef.current = [];
    resetDrag();
  }, [resetDrag]);

  const realignSelectionRect = useCallback(() => {
    const nextRect = getRectForTextNodes(selectedTextNodesRef.current);
    if (!nextRect) return;

    if (selectionBoxRef.current) {
      selectionBoxRef.current.style.transform = `translate3d(${nextRect.x}px, ${nextRect.y}px, 0)`;
      selectionBoxRef.current.style.width = `${nextRect.width}px`;
      selectionBoxRef.current.style.height = `${nextRect.height}px`;
    }

    setSelection((current) => current ? { ...current, rect: nextRect } : current);
  }, []);

  useEffect(() => {
    function handlePointerMove(event: PointerEvent) {
      setCursorPoint({ x: event.clientX, y: event.clientY });
    }

    window.addEventListener("pointermove", handlePointerMove, { passive: true });

    return () => window.removeEventListener("pointermove", handlePointerMove);
  }, []);

  useEffect(() => {
    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        closeChat();
        return;
      }

      if (event.key !== "Alt") return;

      event.preventDefault();
      setIsActive(true);
      setError("");
    }

    function handleKeyUp(event: KeyboardEvent) {
      if (event.key !== "Alt") return;

      event.preventDefault();
      setIsActive(false);
      resetDrag();
    }

    function handleBlur() {
      setIsActive(false);
      resetDrag();
    }

    window.addEventListener("keydown", handleKeyDown);
    window.addEventListener("keyup", handleKeyUp);
    window.addEventListener("blur", handleBlur);

    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      window.removeEventListener("keyup", handleKeyUp);
      window.removeEventListener("blur", handleBlur);
    };
  }, [closeChat, resetDrag]);

  useEffect(() => {
    if (!isChatOpen) return;

    const focusTimer = window.setTimeout(() => inputRef.current?.focus(), 80);
    return () => window.clearTimeout(focusTimer);
  }, [isChatOpen]);

  useLayoutEffect(() => {
    document.body.classList.toggle("pw-selection-chat-open", isChatOpen);

    return () => document.body.classList.remove("pw-selection-chat-open");
  }, [isChatOpen]);

  useEffect(() => {
    if (!isChatOpen) return;

    let frame = 0;
    const startedAt = performance.now();

    function trackLayoutMotion(now: number) {
      realignSelectionRect();
      if (now - startedAt < AI_WINDOW_MOTION_MS + 80) {
        frame = window.requestAnimationFrame(trackLayoutMotion);
      }
    }

    frame = window.requestAnimationFrame(trackLayoutMotion);

    window.addEventListener("resize", realignSelectionRect);

    return () => {
      window.cancelAnimationFrame(frame);
      window.removeEventListener("resize", realignSelectionRect);
    };
  }, [isChatOpen, realignSelectionRect]);

  useEffect(() => {
    return () => abortRef.current?.abort();
  }, []);

  function handlePointerDown(event: React.PointerEvent<HTMLDivElement>) {
    if (event.button !== 0) return;

    event.preventDefault();
    event.currentTarget.setPointerCapture(event.pointerId);

    const point = { x: event.clientX, y: event.clientY };
    setCursorPoint(point);
    abortRef.current?.abort();
    abortRef.current = null;
    isDraggingRef.current = true;
    setSelection(null);
    selectedTextNodesRef.current = [];
    setIsChatOpen(false);
    setPrompt("");
    setMessages([]);
    setStreamState("idle");
    setError("");
    setDragStart(point);
    setDragEnd(point);
  }

  function handlePointerMove(event: React.PointerEvent<HTMLDivElement>) {
    setCursorPoint({ x: event.clientX, y: event.clientY });

    if (!isDraggingRef.current) return;

    event.preventDefault();
    setDragEnd({ x: event.clientX, y: event.clientY });
  }

  function handlePointerUp(event: React.PointerEvent<HTMLDivElement>) {
    if (!isDraggingRef.current || !dragStart) return;

    event.preventDefault();
    event.currentTarget.releasePointerCapture(event.pointerId);

    const rect = normalizeRect(dragStart, { x: event.clientX, y: event.clientY });
    resetDrag();

    if (rect.width < MIN_SELECTION_SIZE || rect.height < MIN_SELECTION_SIZE) {
      setSelection(null);
      return;
    }

    const capturedSelection = getSelectionInsideRect(rect);
    selectedTextNodesRef.current = capturedSelection.nodes;

    const detail: ScreenSelectionDetail = {
      rect: capturedSelection.rect,
      text: capturedSelection.text,
    };

    setSelection(detail);
    setIsActive(false);
    setIsChatOpen(true);
    window.dispatchEvent(new CustomEvent<ScreenSelectionDetail>(SCREEN_SELECTION_EVENT, { detail }));
  }

  async function askAboutSelection(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const question = prompt.trim();
    if (!question || !selection || streamState === "streaming") return;

    const assistantId = messageId();
    const controller = new AbortController();

    abortRef.current?.abort();
    abortRef.current = controller;
    setPrompt("");
    setError("");
    setStreamState("streaming");
    setMessages((current) => [
      ...current,
      { id: messageId(), role: "user", content: question },
      { id: assistantId, role: "assistant", content: "" },
    ]);

    try {
      const response = await fetch("/api/screen-selection/ask", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          prompt: question,
          selectedText: selection.text,
          rect: selection.rect,
        }),
        signal: controller.signal,
      });

      if (!response.ok || !response.body) {
        throw new Error(await readErrorMessage(response));
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder();

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const chunk = decoder.decode(value, { stream: true });
        setMessages((current) => current.map((message) => (
          message.id === assistantId
            ? { ...message, content: message.content + chunk }
            : message
        )));
      }

      setStreamState("idle");
    } catch (caught) {
      if (caught instanceof DOMException && caught.name === "AbortError") return;

      const message = caught instanceof Error ? caught.message : "The answer could not be generated.";
      setStreamState("error");
      setError(message);
      setMessages((current) => current.filter((item) => item.id !== assistantId));
    } finally {
      abortRef.current = null;
    }
  }

  if (!isActive && !isChatOpen && !displayRect) return null;

  return (
    <>
      {isActive && (
        <div
          data-screen-selection-ui
          onPointerDown={handlePointerDown}
          onPointerMove={handlePointerMove}
          onPointerUp={handlePointerUp}
          onPointerCancel={resetDrag}
          style={{
            position: "fixed",
            inset: 0,
            zIndex: 2147483645,
            cursor: "crosshair",
            background: "oklch(16.8% 0.018 238 / 0.28)",
          }}
        >
          <div
            aria-hidden="true"
            style={{
              position: "fixed",
              left: cursorHintPosition.x,
              top: cursorHintPosition.y,
              display: "flex",
              alignItems: "center",
              gap: 9,
              padding: "8px 10px 8px 8px",
              borderRadius: 8,
              border: "1px solid oklch(92.2% 0.025 168 / 0.34)",
              background: "oklch(16.8% 0.018 238 / 0.86)",
              color: "var(--brand-sage-100)",
              fontSize: 12,
              fontWeight: 700,
              letterSpacing: 0,
              pointerEvents: "none",
              boxShadow: "0 14px 38px oklch(16.8% 0.018 238 / 0.28)",
            }}
          >
            <span
              style={{
                width: 22,
                height: 22,
                borderRadius: 6,
                display: "inline-flex",
                alignItems: "center",
                justifyContent: "center",
                background: "var(--brand-ink)",
                overflow: "hidden",
              }}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src="/logo-mark.svg"
                alt=""
                width={22}
                height={22}
                style={{ display: "block", width: "100%", height: "100%", borderRadius: "inherit" }}
              />
            </span>
            Ask about any part of the screen
          </div>
        </div>
      )}

      {displayRect && (
        <div
          ref={selectionBoxRef}
          data-screen-selection-ui
          aria-hidden="true"
          style={{
            position: "fixed",
            left: 0,
            top: 0,
            width: displayRect.width,
            height: displayRect.height,
            transform: `translate3d(${displayRect.x}px, ${displayRect.y}px, 0)`,
            zIndex: 2147483646,
            border: "1.5px solid var(--brand-mint)",
            background: "rgba(94, 226, 168, 0.12)",
            boxShadow: "0 0 0 1px rgba(15, 20, 17, 0.34), 0 14px 40px rgba(15, 20, 17, 0.2)",
            pointerEvents: "none",
            willChange: "transform, width, height",
            transition: isChatOpen
              ? "background 220ms ease-out, border-color 220ms ease-out, box-shadow 220ms ease-out"
              : "none",
          }}
        />
      )}

      {isChatOpen && selection && (
        <>
          <style>{`
            :root {
              --pw-selection-ai-window-width: ${AI_WINDOW_WIDTH}px;
              --pw-selection-ai-window-gap: ${AI_WINDOW_GAP}px;
              --pw-selection-ai-reserved-width: calc(var(--pw-selection-ai-window-width) + (var(--pw-selection-ai-window-gap) * 2));
            }

            @keyframes pw-selection-panel-in {
              0% {
                opacity: 0;
                transform: translateX(54px) scale(0.965);
                box-shadow: 0 10px 30px oklch(16.8% 0.018 238 / 0.10), 0 0 0 1px oklch(96.8% 0.014 168 / 0.24);
              }
              72% {
                opacity: 1;
                transform: translateX(-4px) scale(1.004);
                box-shadow: 0 30px 86px oklch(16.8% 0.018 238 / 0.30), 0 0 0 1px oklch(96.8% 0.014 168 / 0.42);
              }
              100% {
                opacity: 1;
                transform: translateX(0) scale(1);
                box-shadow: 0 26px 80px oklch(16.8% 0.018 238 / 0.26), 0 0 0 1px oklch(96.8% 0.014 168 / 0.38);
              }
            }

            @media (min-width: 980px) {
              body.pw-selection-chat-open .lp-app {
                padding-right: var(--pw-selection-ai-reserved-width);
                transition: padding-right ${AI_WINDOW_MOTION_MS}ms cubic-bezier(0.16, 1, 0.3, 1);
              }
            }

            @media (prefers-reduced-motion: reduce) {
              [data-screen-selection-drawer] {
                animation: none !important;
              }

              body.pw-selection-chat-open .lp-app {
                transition: none !important;
              }
            }
          `}</style>
          <aside
            data-screen-selection-ui
            data-screen-selection-drawer
            aria-label="Ask AI about selection"
            style={{
              position: "fixed",
              top: AI_WINDOW_TOP,
              right: AI_WINDOW_GAP,
              bottom: AI_WINDOW_GAP,
              zIndex: 2147483647,
              width: `min(${AI_WINDOW_WIDTH}px, calc(100vw - ${AI_WINDOW_GAP * 2}px))`,
              display: "flex",
              flexDirection: "column",
              overflow: "hidden",
              border: "1px solid var(--brand-line-strong)",
              borderRadius: 18,
              background: "var(--brand-paper)",
              color: "var(--brand-ink)",
              boxShadow: "0 26px 80px oklch(16.8% 0.018 238 / 0.26), 0 0 0 1px oklch(96.8% 0.014 168 / 0.38)",
              animation: `pw-selection-panel-in ${AI_WINDOW_MOTION_MS}ms cubic-bezier(0.16, 1, 0.3, 1) both`,
            }}
          >
            <div
              style={{
                padding: "18px 18px 16px",
                display: "flex",
                alignItems: "center",
                gap: 12,
                borderBottom: "1px solid var(--brand-line)",
                background: "var(--brand-sage-50)",
              }}
            >
              <div
                aria-hidden="true"
                style={{
                  width: 34,
                  height: 34,
                  borderRadius: 8,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  background: "var(--brand-ink)",
                  overflow: "hidden",
                  flexShrink: 0,
                }}
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src="/logo-mark.svg"
                  alt=""
                  width={34}
                  height={34}
                  style={{ display: "block", width: "100%", height: "100%", borderRadius: "inherit" }}
                />
              </div>
              <div style={{ minWidth: 0, flex: 1 }}>
                <div style={{ fontSize: 17, fontWeight: 800, lineHeight: 1.12 }}>Ask about this selection</div>
                <div style={{ fontSize: 12, color: "var(--brand-ink-dim)", lineHeight: 1.4, marginTop: 3 }}>
                  Sonnet answers with the selected screen context.
                </div>
              </div>
              <button
                type="button"
                onClick={closeChat}
                aria-label="Close selection chat"
                style={{
                  width: 32,
                  height: 32,
                  borderRadius: 8,
                  border: "1px solid var(--brand-line-strong)",
                  background: "var(--brand-paper)",
                  color: "var(--brand-ink-mid)",
                  cursor: "pointer",
                  fontSize: 20,
                  lineHeight: 1,
                }}
              >
                ×
              </button>
            </div>

            <div
              style={{
                padding: "16px 18px",
                borderBottom: "1px solid var(--brand-line)",
                color: "var(--brand-ink-mid)",
                fontSize: 13,
                lineHeight: 1.5,
                background: "var(--brand-paper)",
              }}
            >
              <div style={{ fontSize: 10, fontWeight: 800, color: "var(--brand-ink-dim)", marginBottom: 7 }}>
                SELECTED CONTEXT
              </div>
              <div style={{ maxHeight: 112, overflow: "auto" }}>
                {selection.text || "No readable text was captured. You can still ask about what you selected."}
              </div>
            </div>

            <div
              style={{
                padding: 18,
                display: "flex",
                flexDirection: "column",
                gap: 12,
                overflowY: "auto",
                flex: 1,
                minHeight: 0,
              }}
            >
              {messages.length === 0 && (
                <div style={{ color: "var(--brand-ink-dim)", fontSize: 14, lineHeight: 1.55, maxWidth: 340 }}>
                  Ask what this means, why it matters, or how it connects to the current path.
                </div>
              )}
              {messages.map((message) => (
                <div
                  key={message.id}
                  style={{
                    alignSelf: message.role === "user" ? "flex-end" : "flex-start",
                    maxWidth: "92%",
                    padding: "10px 12px",
                    borderRadius: 8,
                    border: "1px solid",
                    borderColor: message.role === "user" ? "var(--brand-ink)" : "var(--brand-line)",
                    background: message.role === "user" ? "var(--brand-ink)" : "var(--brand-sage-50)",
                    color: message.role === "user" ? "var(--brand-sage-100)" : "var(--brand-ink)",
                    fontSize: 14,
                    lineHeight: 1.55,
                    whiteSpace: "pre-wrap",
                  }}
                >
                  {message.content || (streamState === "streaming" && message.role === "assistant" ? "Thinking..." : "")}
                </div>
              ))}
              {error && (
                <div style={{ color: "var(--brand-clay)", fontSize: 13, lineHeight: 1.45 }}>
                  {error}
                </div>
              )}
            </div>

            <form onSubmit={askAboutSelection} style={{ padding: 18, borderTop: "1px solid var(--brand-line)", background: "var(--brand-sage-50)" }}>
              <textarea
                ref={inputRef}
                value={prompt}
                onChange={(event) => setPrompt(event.target.value)}
                placeholder="Ask a question about the selection..."
                rows={4}
                disabled={streamState === "streaming"}
                style={{
                  width: "100%",
                  resize: "none",
                  borderRadius: 8,
                  border: "1px solid var(--brand-line-strong)",
                  background: "var(--brand-paper)",
                  color: "var(--brand-ink)",
                  padding: "11px 12px",
                  font: "inherit",
                  fontSize: 14,
                  lineHeight: 1.5,
                  outline: "none",
                  boxShadow: "0 1px 0 oklch(16.8% 0.018 238 / 0.04)",
                }}
              />
              <div style={{ display: "flex", gap: 8, alignItems: "center", marginTop: 10 }}>
                <button
                  type="submit"
                  disabled={!prompt.trim() || streamState === "streaming"}
                  style={{
                    height: 38,
                    padding: "0 15px",
                    borderRadius: 8,
                    border: "1px solid var(--brand-ink)",
                    background: streamState === "streaming" ? "var(--brand-sage-200)" : "var(--brand-ink)",
                    color: streamState === "streaming" ? "var(--brand-ink-dim)" : "var(--brand-sage-100)",
                    cursor: streamState === "streaming" ? "not-allowed" : "pointer",
                    fontSize: 13,
                    fontWeight: 800,
                  }}
                >
                  {streamState === "streaming" ? "Answering" : "Ask"}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setIsActive(true);
                    setIsChatOpen(false);
                    setSelection(null);
                    setMessages([]);
                    setError("");
                  }}
                  disabled={streamState === "streaming"}
                  style={{
                    height: 38,
                    padding: "0 13px",
                    borderRadius: 8,
                    border: "1px solid var(--brand-line-strong)",
                    background: "var(--brand-paper)",
                    color: "var(--brand-ink-mid)",
                    cursor: streamState === "streaming" ? "not-allowed" : "pointer",
                    fontSize: 13,
                    fontWeight: 700,
                  }}
                >
                  Reselect
                </button>
              </div>
            </form>
          </aside>
        </>
      )}
    </>
  );
}
