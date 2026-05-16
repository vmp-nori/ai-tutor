"use client";

import { useCallback, useEffect, useLayoutEffect, useRef, useState } from "react";
import { usePathname } from "next/navigation";
import { LatexRenderer } from "@/app/learn/[treeId]/[nodeId]/LatexRenderer";

// ─── Types ────────────────────────────────────────────────────────────────────

interface ChatMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
}

interface LessonContextItem {
  kind: string;
  label?: string;
  text?: string;
  data?: unknown;
}

interface LessonPageContext {
  selectedText: string;
  slide?: {
    number?: string;
    title?: string;
    kind?: string;
  };
  elements: LessonContextItem[];
}

type StreamState = "idle" | "streaming" | "error";

// Which dock panel is open (null = dock is collapsed)
type ActivePanel = "chat" | null;

// ─── Constants ────────────────────────────────────────────────────────────────

const DOCK_W = 42;          // collapsed dock reservation matches the icon width
const PANEL_W = 380;        // expanded panel width
const GAP = 12;             // gap from screen edges (matches lp-app padding)
const TOP_OFFSET = 72;      // below topbar
const ICON_SIZE = 42;
const MAX_CONTEXT_TEXT_LENGTH = 12000;
const MAX_CONTEXT_ITEMS = 36;

const EXAMPLE_PROMPTS = [
  { label: "Explain this further", prompt: "Explain this further." },
  { label: "Give me an example", prompt: "Give me a concrete example of this concept." },
  { label: "Quiz me", prompt: "Quiz me on what I've learned so far." },
  { label: "Why does this matter?", prompt: "Why does this matter for the lesson goal?" },
];

// ─── Helpers ─────────────────────────────────────────────────────────────────

function messageId() {
  return globalThis.crypto?.randomUUID?.() ?? String(Date.now());
}

async function readErrorMessage(response: Response) {
  try {
    const data = await response.json();
    if (typeof data?.error === "string") return data.error;
  } catch { /* ignore */ }
  return response.status === 401
    ? "Sign in to use the AI assistant."
    : "The answer could not be generated.";
}

// ─── Component ───────────────────────────────────────────────────────────────

export function AIChatSidebar() {
  const pathname = usePathname();
  const isLessonRoute = pathname?.startsWith("/learn/") ?? false;

  if (!isLessonRoute) return null;

  return <AIChatSidebarContent />;
}

function lessonRouteParts(pathname: string | null) {
  const parts = (pathname ?? "").split("/").filter(Boolean);
  if (parts[0] !== "learn" || !parts[1] || !parts[2]) return null;
  return {
    treeId: decodeURIComponent(parts[1]),
    nodeId: decodeURIComponent(parts[2]),
  };
}

function isBranchPrompt(value: string) {
  return /\b(?:start|create|make|generate|build|add)\s+(?:a\s+)?branch\b/i.test(value) ||
    /\bbranch\s+(?:on|about|for|explaining|to\s+explain)\b/i.test(value);
}

function readJsonAttribute(element: Element, attribute: string): unknown {
  const value = element.getAttribute(attribute);
  if (!value) return undefined;

  try {
    return JSON.parse(value);
  } catch {
    return value;
  }
}

function isLessonContextElement(element: HTMLElement) {
  return !element.closest("[data-screen-selection-ui], [data-ai-chat-ui]");
}

function readLessonPageContext(): LessonPageContext {
  const activeSlide = document.querySelector<HTMLElement>(".lp-slide--active");
  const contextRoot = activeSlide ?? document.querySelector<HTMLElement>(".lp-main") ?? document.body;
  const elements = Array.from(contextRoot.querySelectorAll<HTMLElement>("[data-ai-context]"))
    .filter(isLessonContextElement)
    .slice(0, MAX_CONTEXT_ITEMS)
    .map((element): LessonContextItem => ({
      kind: element.dataset.aiKind || "content",
      label: element.dataset.aiLabel,
      text: element.dataset.aiText || element.innerText?.replace(/\s+/g, " ").trim(),
      data: readJsonAttribute(element, "data-ai-context"),
    }))
    .filter((item) => item.text || item.data);

  const selectedText = elements
    .map((item) => item.text)
    .filter(Boolean)
    .join("\n")
    .slice(0, MAX_CONTEXT_TEXT_LENGTH);

  return {
    selectedText,
    slide: activeSlide ? {
      number: activeSlide.dataset.aiSlideNumber,
      title: activeSlide.dataset.aiSlideTitle,
      kind: activeSlide.dataset.aiSlideKind,
    } : undefined,
    elements,
  };
}

function AIChatSidebarContent() {
  const pathname = usePathname();
  const [activePanel, setActivePanel] = useState<ActivePanel>(null);
  const [prompt, setPrompt] = useState("");
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [streamState, setStreamState] = useState<StreamState>("idle");
  const [error, setError] = useState("");
  const inputRef = useRef<HTMLTextAreaElement | null>(null);
  const messagesEndRef = useRef<HTMLDivElement | null>(null);
  const abortRef = useRef<AbortController | null>(null);

  const isOpen = activePanel !== null;

  const toggleChat = useCallback(() => {
    setActivePanel((prev) => (prev === "chat" ? null : "chat"));
    setError("");
  }, []);

  const closePanel = useCallback(() => {
    abortRef.current?.abort();
    abortRef.current = null;
    setActivePanel(null);
    setError("");
  }, []);

  // Focus textarea when chat opens
  useEffect(() => {
    if (activePanel !== "chat") return;
    const t = window.setTimeout(() => inputRef.current?.focus(), 120);
    return () => window.clearTimeout(t);
  }, [activePanel]);

  // Scroll to bottom on new messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, streamState]);

  // Escape closes
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape" && isOpen) closePanel();
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [isOpen, closePanel]);

  useLayoutEffect(() => {
    document.body.classList.toggle("pw-ai-chat-open", isOpen);

    return () => document.body.classList.remove("pw-ai-chat-open");
  }, [isOpen]);

  // Cleanup on unmount
  useEffect(() => () => abortRef.current?.abort(), []);

  async function submitQuestion(question: string) {
    if (!question.trim() || streamState === "streaming") return;

    if (isBranchPrompt(question)) {
      await submitBranch(question, "intent");
      return;
    }

    const assistantId = messageId();
    const controller = new AbortController();
    abortRef.current?.abort();
    abortRef.current = controller;

    setPrompt("");
    setError("");
    setStreamState("streaming");
    setMessages((prev) => [
      ...prev,
      { id: messageId(), role: "user", content: question.trim() },
      { id: assistantId, role: "assistant", content: "" },
    ]);

    try {
      const lessonContext = readLessonPageContext();
      const response = await fetch("/api/screen-selection/ask", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          prompt: question.trim(),
          selectedText: lessonContext.selectedText,
          selectedContext: lessonContext,
          contextKind: "lesson",
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
        setMessages((prev) =>
          prev.map((m) => m.id === assistantId ? { ...m, content: m.content + chunk } : m),
        );
      }
      setStreamState("idle");
    } catch (caught) {
      if (caught instanceof DOMException && caught.name === "AbortError") return;
      const msg = caught instanceof Error ? caught.message : "The answer could not be generated.";
      setStreamState("error");
      setError(msg);
      setMessages((prev) => prev.filter((m) => m.id !== assistantId));
    } finally {
      abortRef.current = null;
    }
  }

  async function submitBranch(branchPrompt: string, trigger: "intent" | "button") {
    const request = branchPrompt.trim();
    const routeParts = lessonRouteParts(pathname);
    if (!request || streamState === "streaming") return;

    if (!routeParts) {
      setError("Open a lesson before starting a branch.");
      return;
    }

    const controller = new AbortController();
    abortRef.current?.abort();
    abortRef.current = controller;

    setPrompt("");
    setError("");
    setStreamState("streaming");
    setMessages((prev) => [
      ...prev,
      { id: messageId(), role: "user", content: request },
      { id: messageId(), role: "assistant", content: "Creating an optional branch..." },
    ]);

    try {
      const lessonContext = readLessonPageContext();
      const response = await fetch("/api/skill-tree/branch", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          treeId: routeParts.treeId,
          anchorNodeId: routeParts.nodeId,
          prompt: request,
          selectedText: lessonContext.selectedText,
          selectedContext: lessonContext,
          trigger,
        }),
        signal: controller.signal,
      });

      if (!response.ok) {
        throw new Error(await readErrorMessage(response));
      }

      const data = await response.json() as {
        branchLabel?: string;
        branchNodeIds?: string[];
        dashboardHref?: string;
      };
      const count = data.branchNodeIds?.length ?? 0;
      const href = data.dashboardHref ?? `/dashboard?treeId=${encodeURIComponent(routeParts.treeId)}`;
      setMessages((prev) => [
        ...prev.filter((message) => message.content !== "Creating an optional branch..."),
        {
          id: messageId(),
          role: "assistant",
          content: `Branch created${data.branchLabel ? `: ${data.branchLabel}` : ""}. ${count} optional concept${count === 1 ? "" : "s"} added.\n\n[View it on the graph](${href})`,
        },
      ]);
      setStreamState("idle");
    } catch (caught) {
      if (caught instanceof DOMException && caught.name === "AbortError") return;
      const msg = caught instanceof Error ? caught.message : "The branch could not be generated.";
      setStreamState("error");
      setError(msg);
      setMessages((prev) => prev.filter((message) => message.content !== "Creating an optional branch..."));
    } finally {
      abortRef.current = null;
    }
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      void submitQuestion(prompt);
    }
  }

  return (
    <>
      <style>{`
        :root {
          --pw-ai-sidebar-collapsed-width: ${DOCK_W}px;
          --pw-ai-sidebar-expanded-width: ${PANEL_W + GAP + ICON_SIZE}px;
          --pw-ai-sidebar-gap: ${GAP}px;
          --pw-ai-sidebar-reserved-collapsed: calc(var(--pw-ai-sidebar-collapsed-width) + (var(--pw-ai-sidebar-gap) * 2));
          --pw-ai-sidebar-reserved-expanded: calc(var(--pw-ai-sidebar-expanded-width) + (var(--pw-ai-sidebar-gap) * 2));
        }

        .pw-ai-dock-button {
          width: ${ICON_SIZE}px;
          height: ${ICON_SIZE}px;
          border-radius: 8px;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          flex-shrink: 0;
          transition: background 0.15s, border-color 0.15s, color 0.15s, box-shadow 0.15s;
        }

        .pw-ai-dock-button.is-expanded {
          width: ${ICON_SIZE}px;
          height: ${ICON_SIZE}px;
          justify-content: center;
          padding-right: 0;
          background: var(--color-panel);
        }

        .pw-ai-dock-button:focus-visible {
          outline: none;
          box-shadow: 0 0 0 3px color-mix(in srgb, var(--color-accent) 22%, transparent);
        }

        .pw-ai-dock-button:hover {
          border-color: var(--color-text-primary);
          color: var(--color-text-primary);
        }

        .pw-ai-chip:focus-visible,
        .pw-ai-input:focus-visible,
        .pw-ai-action:focus-visible {
          outline: none;
          box-shadow: 0 0 0 3px var(--color-focus-ring);
        }
      `}</style>
      {/* ── Dock container — always on screen, fixed right edge ── */}
      <div
        data-ai-chat-ui
        style={{
          position: "fixed",
          top: TOP_OFFSET,
          right: GAP,
          bottom: GAP,
          width: PANEL_W + GAP + ICON_SIZE,
          zIndex: 300,
          display: "flex",
          flexDirection: "row",
          justifyContent: "flex-end",
          pointerEvents: "none", // children opt-in
          overflow: "visible",
        }}
      >
        {/* ── Expanded panel (chat content) ── */}
        <div
          style={{
            width: isOpen ? PANEL_W : 0,
            flex: "none",
            minWidth: 0,
            overflow: "hidden",
            opacity: isOpen ? 1 : 0,
            transition: "opacity 200ms ease, width 260ms cubic-bezier(0.16, 1, 0.3, 1)",
            pointerEvents: isOpen ? "auto" : "none",
            display: "flex",
            flexDirection: "column",
            background: isOpen ? "var(--color-panel)" : "transparent",
            border: isOpen ? "1px solid var(--color-border)" : "1px solid transparent",
            borderRadius: 16,
            boxShadow: isOpen ? "0 14px 42px rgba(15,20,17,0.12)" : "none",
            marginRight: isOpen ? GAP : 0,
          }}
        >
          {activePanel === "chat" && (
            <div
              style={{
                flex: 1,
                display: "flex",
                flexDirection: "column",
                background: "var(--color-panel)",
                border: "none",
                borderRadius: 16,
                overflow: "hidden",
                boxShadow: "none",
                height: "100%",
              }}
            >
              {/* Chat header */}
              <div
                style={{
                  padding: "12px 14px",
                  display: "flex",
                  alignItems: "center",
                  gap: 10,
                  borderBottom: "1px solid var(--color-border)",
                  background: "var(--color-panel)",
                  flexShrink: 0,
                }}
              >
                <div style={{ minWidth: 0, flex: 1 }}>
                  <div style={{ fontSize: "0.8125rem", fontWeight: 700, color: "var(--color-text-primary)", letterSpacing: 0 }}>
                    Ask AI
                  </div>
                  <div style={{ fontSize: "0.6875rem", color: "var(--color-text-muted)", marginTop: 1, letterSpacing: "0.04em", textTransform: "uppercase" as const, fontWeight: 600 }}>
                    Ask anything about what you&apos;re learning
                  </div>
                </div>
              </div>

              {/* Example prompts */}
              {messages.length === 0 && (
                <div
                  style={{
                    padding: "11px 14px 13px",
                    borderBottom: "1px solid var(--color-border)",
                    background: "color-mix(in srgb, var(--color-panel) 72%, var(--color-canvas))",
                    flexShrink: 0,
                  }}
                >
                  <div style={{ fontSize: "0.8125rem", color: "var(--color-text-secondary)", marginBottom: 8, lineHeight: 1.45 }}>
                    Ask me anything, or try a prompt:
                  </div>
                  <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
                    {EXAMPLE_PROMPTS.map((opt) => (
                      <button
                        key={opt.label}
                        type="button"
                        className="pw-ai-chip"
                        onClick={() => void submitQuestion(opt.prompt)}
                        disabled={streamState === "streaming"}
                        style={{
                          padding: "4px 9px", borderRadius: 7,
                          border: "1px solid var(--color-border-mid)",
                          background: "var(--color-panel)",
                          color: "var(--color-text-secondary)",
                          cursor: streamState === "streaming" ? "not-allowed" : "pointer",
                          fontSize: "0.75rem", fontWeight: 600, lineHeight: 1.3,
                        }}
                      >
                        {opt.label}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Messages */}
              <div
                style={{
                  flex: 1, overflowY: "auto",
                  padding: "16px 14px 10px",
                  display: "flex", flexDirection: "column", gap: 10,
                  minHeight: 0,
                }}
              >
                {messages.length === 0 && (
                  <div
                    style={{
                      flex: 1, display: "flex", flexDirection: "column",
                      alignItems: "center", justifyContent: "center",
                      gap: 10, color: "var(--color-text-muted)",
                      textAlign: "center", padding: "36px 24px",
                    }}
                  >
                    <svg width="34" height="34" viewBox="0 0 40 40" fill="none" aria-hidden="true" style={{ opacity: 0.28 }}>
                      <path d="M20 4C11.163 4 4 10.82 4 19.25c0 3.7 1.3 7.12 3.47 9.87L6 36l7.27-2.72A16.4 16.4 0 0 0 20 34.5c8.837 0 16-6.82 16-15.25S28.837 4 20 4Z" stroke="currentColor" strokeWidth="2" strokeLinejoin="round" />
                      <circle cx="14" cy="19.25" r="2" fill="currentColor" />
                      <circle cx="20" cy="19.25" r="2" fill="currentColor" />
                      <circle cx="26" cy="19.25" r="2" fill="currentColor" />
                    </svg>
                    <div style={{ fontSize: "0.8125rem", fontWeight: 600, color: "var(--color-text-primary)" }}>No messages yet</div>
                    <div style={{ fontSize: "0.8125rem", lineHeight: 1.5 }}>Use the prompts above or type your question below.</div>
                  </div>
                )}

                {messages.map((msg) => (
                  <div
                    key={msg.id}
                    style={{
                      alignSelf: msg.role === "user" ? "flex-end" : "flex-start",
                      maxWidth: "88%",
                      padding: "9px 12px",
                      borderRadius: msg.role === "user" ? "11px 11px 3px 11px" : "11px 11px 11px 3px",
                      border: "1px solid",
                      borderColor: msg.role === "user" ? "var(--color-text-primary)" : "var(--color-border)",
                      background: msg.role === "user" ? "var(--color-text-primary)" : "var(--color-chrome)",
                      color: msg.role === "user" ? "var(--color-text-inverted)" : "var(--color-text-primary)",
                      fontSize: "0.8125rem", lineHeight: 1.55, whiteSpace: "pre-wrap",
                    }}
                  >
                    {msg.content
                      ? msg.role === "assistant"
                        ? <LatexRenderer text={msg.content} style={{ fontSize: "0.8125rem", lineHeight: 1.55 }} />
                        : msg.content
                      : (streamState === "streaming" && msg.role === "assistant"
                        ? <span style={{ opacity: 0.45 }}>Thinking…</span>
                        : "")}
                  </div>
                ))}

                {error && (
                  <div style={{ fontSize: "0.8125rem", color: "var(--color-danger)", lineHeight: 1.45, padding: "7px 11px", borderRadius: 7, background: "var(--color-danger-soft)", border: "1px solid var(--color-danger-border)" }}>
                    {error}
                  </div>
                )}
                <div ref={messagesEndRef} />
              </div>

              {/* Input */}
              <form
                onSubmit={(e) => { e.preventDefault(); void submitQuestion(prompt); }}
                style={{ padding: "12px 14px 14px", borderTop: "1px solid var(--color-border)", background: "var(--color-panel)", flexShrink: 0 }}
              >
                <textarea
                  ref={inputRef}
                  className="pw-ai-input"
                  value={prompt}
                  onChange={(e) => setPrompt(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder="Ask anything… (Enter to send)"
                  rows={3}
                  disabled={streamState === "streaming"}
                  style={{
                    width: "100%", resize: "none", borderRadius: 9,
                    border: "1px solid var(--color-border-mid)",
                    background: "var(--color-chrome)",
                    color: "var(--color-text-primary)",
                    padding: "9px 11px", font: "inherit", fontSize: "0.8125rem",
                    lineHeight: 1.5, outline: "none", boxSizing: "border-box",
                  }}
                />
                <div style={{ display: "flex", gap: 7, alignItems: "center", marginTop: 7 }}>
                  <button
                    type="submit"
                    className="pw-ai-action"
                    disabled={!prompt.trim() || streamState === "streaming"}
                    style={{
                      height: 34, padding: "0 14px", borderRadius: 7, border: "none",
                      background: !prompt.trim() || streamState === "streaming" ? "var(--color-node-locked)" : "var(--color-button-primary)",
                      color: !prompt.trim() || streamState === "streaming" ? "var(--color-text-subtle)" : "var(--color-button-primary-text)",
                      cursor: !prompt.trim() || streamState === "streaming" ? "not-allowed" : "pointer",
                      fontSize: "0.8125rem", fontWeight: 700,
                    }}
                  >
                    {streamState === "streaming" ? "Answering…" : "Send"}
                  </button>
                  <button
                    type="button"
                    className="pw-ai-action"
                    onClick={() => void submitBranch(prompt, "button")}
                    disabled={!prompt.trim() || streamState === "streaming"}
                    style={{
                      height: 34, padding: "0 12px", borderRadius: 7,
                      border: "1px solid var(--color-border-mid)",
                      background: !prompt.trim() || streamState === "streaming" ? "transparent" : "var(--color-panel)",
                      color: !prompt.trim() || streamState === "streaming" ? "var(--color-text-subtle)" : "var(--color-text-secondary)",
                      cursor: !prompt.trim() || streamState === "streaming" ? "not-allowed" : "pointer",
                      fontSize: "0.8125rem", fontWeight: 700,
                    }}
                  >
                    {streamState === "streaming" ? "Branching…" : "Branch"}
                  </button>
                  {messages.length > 0 && (
                    <button
                      type="button"
                      className="pw-ai-action"
                      onClick={() => { abortRef.current?.abort(); abortRef.current = null; setMessages([]); setStreamState("idle"); setError(""); }}
                      disabled={streamState === "streaming"}
                      style={{
                        height: 34, padding: "0 11px", borderRadius: 7,
                        border: "1px solid var(--color-border-mid)",
                        background: "transparent", color: "var(--color-text-muted)",
                        cursor: streamState === "streaming" ? "not-allowed" : "pointer",
                        fontSize: "0.8125rem", fontWeight: 600,
                      }}
                    >
                      Clear
                    </button>
                  )}
                </div>
              </form>
            </div>
          )}
        </div>

        {/* ── Floating icon button — future icons can stack here without a rail ── */}
        <div
          style={{
            width: ICON_SIZE,
            flexShrink: 0,
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            padding: 0,
            gap: 8,
            background: "transparent",
            border: "none",
            borderRadius: 0,
            pointerEvents: "auto",
            boxShadow: "none",
          }}
        >
          {/* Chat icon */}
          <button
            type="button"
            onClick={toggleChat}
            aria-label={activePanel === "chat" ? "Close AI chat" : "Open AI chat"}
            title="Ask AI"
            className={`pw-ai-dock-button${activePanel === "chat" ? " is-expanded" : ""}`}
            style={{
              border: activePanel === "chat"
                ? "1px solid var(--color-border-mid)"
                : "1px solid var(--color-border-mid)",
              borderLeftColor: activePanel === "chat"
                ? "var(--color-border-mid)"
                : "var(--color-border-mid)",
              background: activePanel === "chat"
                ? "var(--color-panel)"
                : "var(--color-chrome)",
              color: activePanel === "chat"
                ? "var(--color-text-secondary)"
                : "var(--color-text-secondary)",
              boxShadow: "0 14px 42px rgba(15,20,17,0.08)",
            }}
          >
            <svg width="16" height="16" viewBox="0 0 18 18" fill="none" aria-hidden="true">
              <path
                d="M9 2C5.134 2 2 4.91 2 8.5c0 1.48.52 2.85 1.39 3.95L2.5 15.5l3.27-1.09A7.17 7.17 0 0 0 9 15c3.866 0 7-2.91 7-6.5S12.866 2 9 2Z"
                stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round"
              />
              <circle cx="6.5" cy="8.5" r="1" fill="currentColor" />
              <circle cx="9" cy="8.5" r="1" fill="currentColor" />
              <circle cx="11.5" cy="8.5" r="1" fill="currentColor" />
            </svg>
          </button>

          {/* Future dock icons go here */}
        </div>
      </div>
    </>
  );
}
