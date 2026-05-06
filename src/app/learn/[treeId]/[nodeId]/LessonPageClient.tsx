"use client";

import { useCallback, useEffect, useState } from "react";
import type { GeneratedLesson } from "@/lib/types";
import { DiagramRenderer } from "@/components/diagrams/DiagramRenderer";
import { LatexRenderer } from "./LatexRenderer";

interface LessonPageClientProps {
  treeId: string;
  nodeId: string;
  subject: string;
  goal: string;
  nodeName: string;
  nodeDescription: string;
  dashboardHref: string;
}

interface CompletionResult {
  completed: boolean;
  dashboardHref: string;
  nextNode: null | {
    id: string;
    name: string;
    href: string;
  };
}

type LoadState = "idle" | "loading" | "ready" | "error";

function LessonSkeleton() {
  return (
    <div aria-hidden="true" style={{ display: "grid", gap: 16 }}>
      <div className="lesson-skeleton" style={{ width: "58%", height: 22 }} />
      <div className="lesson-skeleton" style={{ width: "100%", height: 82 }} />
      <div className="lesson-skeleton" style={{ width: "92%", height: 82 }} />
      <div className="lesson-skeleton" style={{ width: "100%", height: 260 }} />
      <div className="lesson-skeleton" style={{ width: "86%", height: 70 }} />
    </div>
  );
}

export function LessonPageClient({
  treeId,
  nodeId,
  subject,
  goal,
  nodeName,
  nodeDescription,
  dashboardHref,
}: LessonPageClientProps) {
  const [lesson, setLesson] = useState<GeneratedLesson | null>(null);
  const [loadState, setLoadState] = useState<LoadState>("idle");
  const [error, setError] = useState<string | null>(null);
  const [completeState, setCompleteState] = useState<"idle" | "saving" | "done" | "error">("idle");
  const [completeError, setCompleteError] = useState<string | null>(null);
  const [completion, setCompletion] = useState<CompletionResult | null>(null);

  const generateLesson = useCallback(async () => {
    setLoadState("loading");
    setError(null);
    setLesson(null);

    try {
      const res = await fetch("/api/lessons/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ treeId, nodeId }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(typeof data.error === "string" ? data.error : "Lesson could not be generated");
      }

      setLesson(data as GeneratedLesson);
      setLoadState("ready");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Lesson could not be generated");
      setLoadState("error");
    }
  }, [nodeId, treeId]);

  useEffect(() => {
    void generateLesson();
  }, [generateLesson]);

  async function handleComplete() {
    setCompleteState("saving");
    setCompleteError(null);

    try {
      const res = await fetch("/api/progress/complete", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ treeId, nodeId }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(typeof data.error === "string" ? data.error : "Progress could not be saved");
      }

      setCompletion(data as CompletionResult);
      setCompleteState("done");
    } catch (err) {
      setCompleteError(err instanceof Error ? err.message : "Progress could not be saved");
      setCompleteState("error");
    }
  }

  return (
    <>
      <style>{`
        .lesson-action:hover:not(:disabled) { background: var(--color-button-primary-hover) !important; }
        .lesson-nav-btn:hover { border-color: var(--color-border-mid) !important; color: var(--color-text-primary) !important; }
        .lesson-prose > * { margin: 0; }
        .lesson-prose p { margin-bottom: 0.75em; }
        .lesson-prose p:last-child { margin-bottom: 0; }
        .lesson-prose strong { font-weight: 720; color: var(--color-text-primary); }
        .lesson-prose em { font-style: italic; }
        .lesson-prose code { font-family: var(--font-mono); font-size: 13px; background: var(--color-panel); border: 1px solid var(--color-border); border-radius: 4px; padding: 1px 5px; }
        .lesson-prose pre { background: var(--color-panel); border: 1.5px solid var(--color-border); border-radius: 8px; padding: 14px 16px; overflow-x: auto; margin: 12px 0; }
        .lesson-prose pre code { background: none; border: none; padding: 0; font-size: 13px; }
        .lesson-prose ul, .lesson-prose ol { padding-left: 20px; margin: 8px 0; display: flex; flex-direction: column; gap: 4px; }
        .lesson-prose li { line-height: 1.65; }
        .lesson-prose h1,.lesson-prose h2,.lesson-prose h3,.lesson-prose h4 { color: var(--color-text-primary); font-weight: 760; margin: 14px 0 6px; line-height: 1.25; }
        .lesson-prose blockquote { border-left: 3px solid var(--color-border-mid); padding-left: 14px; color: var(--color-text-muted); margin: 10px 0; }
        .lesson-skeleton {
          border-radius: 7px;
          background: linear-gradient(90deg, var(--color-chrome), var(--color-panel), var(--color-chrome));
          background-size: 220% 100%;
          animation: lesson-shimmer 1.2s ease-in-out infinite;
        }
        @keyframes lesson-shimmer {
          0% { background-position: 120% 0; }
          100% { background-position: -120% 0; }
        }
        @media (max-width: 860px) {
          .lesson-shell { grid-template-columns: 1fr !important; }
          .lesson-aside { position: static !important; top: auto !important; }
          .lesson-header { padding: 0 16px !important; }
          .lesson-main { padding: 76px 20px 48px !important; }
        }
      `}</style>

      <div style={{ minHeight: "100vh", background: "var(--color-canvas)", color: "var(--color-text-primary)" }}>
        <header
          className="lesson-header"
          style={{
            position: "fixed",
            inset: "0 0 auto 0",
            height: 48,
            background: "var(--color-chrome)",
            borderBottom: "1.5px solid var(--color-border)",
            display: "flex",
            alignItems: "center",
            padding: "0 24px",
            gap: 14,
            zIndex: 200,
          }}
        >
          <a href="/" style={{ display: "flex", alignItems: "center", gap: 10, textDecoration: "none", flexShrink: 0 }}>
            <span
              aria-hidden="true"
              style={{
                width: 22,
                height: 22,
                borderRadius: 6,
                background: "var(--color-goal)",
                display: "inline-flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <span style={{ width: 8, height: 8, background: "var(--color-text-inverted)", borderRadius: "50%" }} />
            </span>
            <span style={{ fontSize: 14.5, fontWeight: 750, color: "var(--color-text-primary)", letterSpacing: 0 }}>
              Pathwise
            </span>
          </a>

          <div style={{ width: 1, height: 18, background: "var(--color-border)", flexShrink: 0 }} />

          <div style={{ minWidth: 0, flex: 1 }}>
            <div
              style={{
                fontSize: 13,
                lineHeight: 1.2,
                fontWeight: 650,
                overflow: "hidden",
                textOverflow: "ellipsis",
                whiteSpace: "nowrap",
              }}
            >
              {nodeName}
            </div>
            <div
              style={{
                fontSize: 11,
                color: "var(--color-text-muted)",
                overflow: "hidden",
                textOverflow: "ellipsis",
                whiteSpace: "nowrap",
              }}
            >
              {subject}
            </div>
          </div>

          <a
            className="lesson-nav-btn"
            href={dashboardHref}
            style={{
              height: 30,
              border: "1.5px solid var(--color-border)",
              borderRadius: 6,
              background: "var(--color-node)",
              color: "var(--color-text-secondary)",
              textDecoration: "none",
              display: "inline-flex",
              alignItems: "center",
              justifyContent: "center",
              padding: "0 11px",
              fontSize: 12,
              fontWeight: 650,
              whiteSpace: "nowrap",
            }}
          >
            Back to graph
          </a>
        </header>

        <main
          className="lesson-main"
          style={{
            padding: "88px 40px 80px",
          }}
        >
          <div
            className="lesson-shell"
            style={{
              display: "grid",
              gridTemplateColumns: "300px minmax(0, 1fr)",
              gap: 56,
              alignItems: "start",
            }}
          >
            <aside
              className="lesson-aside"
              style={{
                position: "sticky",
                top: 72,
              }}
            >
              {/* Concept block */}
              <div style={{ marginBottom: 32 }}>
                <div
                  style={{
                    fontSize: 10,
                    fontWeight: 750,
                    color: "var(--color-text-muted)",
                    letterSpacing: "0.12em",
                    textTransform: "uppercase",
                    marginBottom: 10,
                  }}
                >
                  Concept
                </div>
                <h1
                  style={{
                    margin: "0 0 10px",
                    fontSize: 24,
                    lineHeight: 1.12,
                    fontWeight: 780,
                    letterSpacing: 0,
                    color: "var(--color-text-primary)",
                  }}
                >
                  {nodeName}
                </h1>
                <p
                  style={{
                    margin: 0,
                    fontSize: 13,
                    lineHeight: 1.6,
                    color: "var(--color-text-secondary)",
                  }}
                >
                  {nodeDescription}
                </p>
              </div>

              {/* Goal block */}
              <div
                style={{
                  marginBottom: 32,
                  paddingTop: 20,
                  borderTop: "1.5px solid var(--color-border)",
                }}
              >
                <div
                  style={{
                    fontSize: 10,
                    fontWeight: 750,
                    color: "var(--color-text-muted)",
                    letterSpacing: "0.12em",
                    textTransform: "uppercase",
                    marginBottom: 8,
                  }}
                >
                  End goal
                </div>
                <p
                  style={{
                    margin: 0,
                    fontSize: 12.5,
                    lineHeight: 1.55,
                    color: "var(--color-text-secondary)",
                  }}
                >
                  {goal}
                </p>
              </div>

              {/* Actions block */}
              <button
                type="button"
                className="lesson-action"
                onClick={handleComplete}
                disabled={completeState === "saving" || completeState === "done"}
                style={{
                  width: "100%",
                  height: 38,
                  border: "none",
                  borderRadius: 8,
                  background: completeState === "done" ? "var(--color-success)" : "var(--color-button-primary)",
                  color: "var(--color-button-primary-text)",
                  fontSize: 13,
                  fontWeight: 750,
                  cursor: completeState === "saving" || completeState === "done" ? "default" : "pointer",
                  opacity: completeState === "saving" ? 0.7 : 1,
                }}
              >
                {completeState === "saving" ? "Saving" : completeState === "done" ? "Complete" : "Mark complete"}
              </button>

              {completeError && (
                <p role="alert" style={{ margin: "10px 0 0", fontSize: 12, lineHeight: 1.45, color: "var(--color-danger)" }}>
                  {completeError}
                </p>
              )}

              {completion && (
                <div
                  role="status"
                  style={{
                    marginTop: 12,
                    display: "grid",
                    gap: 8,
                  }}
                >
                  <a
                    className="lesson-nav-btn"
                    href={completion.dashboardHref}
                    style={{
                      height: 36,
                      border: "1.5px solid var(--color-border)",
                      borderRadius: 7,
                      background: "var(--color-node)",
                      color: "var(--color-text-secondary)",
                      textDecoration: "none",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      fontSize: 12.5,
                      fontWeight: 650,
                    }}
                  >
                    Return to graph
                  </a>
                  {completion.nextNode && (
                    <a
                      className="lesson-nav-btn"
                      href={completion.nextNode.href}
                      style={{
                        height: 36,
                        border: "1.5px solid var(--color-border)",
                        borderRadius: 7,
                        background: "var(--color-node)",
                        color: "var(--color-text-secondary)",
                        textDecoration: "none",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        fontSize: 12.5,
                        fontWeight: 650,
                        padding: "0 12px",
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                        whiteSpace: "nowrap",
                      }}
                    >
                      Next: {completion.nextNode.name}
                    </a>
                  )}
                </div>
              )}
            </aside>

            <article style={{ minWidth: 0 }}>
              {loadState === "loading" || loadState === "idle" ? (
                <LessonSkeleton />
              ) : loadState === "error" ? (
                <div
                  role="alert"
                  style={{
                    border: "1px solid var(--color-danger-border)",
                    background: "var(--color-danger-soft)",
                    borderRadius: 8,
                    padding: 18,
                    color: "var(--color-danger)",
                  }}
                >
                  <div style={{ fontSize: 15, fontWeight: 750, marginBottom: 8 }}>Lesson could not load</div>
                  <p style={{ margin: "0 0 14px", fontSize: 13, lineHeight: 1.55 }}>{error}</p>
                  <button
                    type="button"
                    onClick={generateLesson}
                    style={{
                      height: 32,
                      border: "1px solid var(--color-danger-border)",
                      borderRadius: 7,
                      background: "transparent",
                      color: "var(--color-danger)",
                      fontSize: 12.5,
                      fontWeight: 700,
                      cursor: "pointer",
                      padding: "0 11px",
                    }}
                  >
                    Retry
                  </button>
                </div>
              ) : lesson ? (
                <>
                  <h2
                    style={{
                      margin: "0 0 36px",
                      fontSize: 32,
                      lineHeight: 1.12,
                      fontWeight: 790,
                      letterSpacing: 0,
                      color: "var(--color-text-primary)",
                      maxWidth: "18ch",
                    }}
                  >
                    {lesson.title}
                  </h2>

                  {lesson.sections.map((section, i) => (
                    <section key={section.heading} style={{ marginBottom: 32, maxWidth: "unset" }}>
                      <h3
                        style={{
                          margin: "0 0 8px",
                          fontSize: 15,
                          lineHeight: 1.3,
                          fontWeight: 760,
                          color: "var(--color-text-primary)",
                          letterSpacing: 0,
                        }}
                      >
                        {section.heading}
                      </h3>
                      <LatexRenderer text={section.body} />
                      {lesson.diagrams?.filter((d) => d.sectionIndex === i).map((d, j) => (
                        <DiagramRenderer key={j} diagram={d} />
                      ))}
                    </section>
                  ))}

                  {lesson.diagrams?.filter((d) => d.sectionIndex == null).map((d, i) => (
                    <DiagramRenderer key={i} diagram={d} />
                  ))}

                  {/* Worked example — visually distinct from prose sections */}
                  <section
                    style={{
                      marginBottom: 40,
                      maxWidth: "unset",
                      background: "var(--color-panel)",
                      borderRadius: 10,
                      padding: "20px 24px",
                    }}
                  >
                    <div
                      style={{
                        fontSize: 10,
                        fontWeight: 750,
                        color: "var(--color-text-muted)",
                        letterSpacing: "0.12em",
                        textTransform: "uppercase",
                        marginBottom: 8,
                      }}
                    >
                      Worked example
                    </div>
                    <h3
                      style={{
                        margin: "0 0 10px",
                        fontSize: 15,
                        lineHeight: 1.3,
                        fontWeight: 760,
                        color: "var(--color-text-primary)",
                        letterSpacing: 0,
                      }}
                    >
                      {lesson.workedExample.heading}
                    </h3>
                      <LatexRenderer text={lesson.workedExample.body} />
                  </section>

                  {lesson.misconceptions.length > 0 && (
                    <section style={{ marginBottom: 40, maxWidth: "unset" }}>
                      <h3
                        style={{
                          margin: "0 0 14px",
                          fontSize: 15,
                          lineHeight: 1.3,
                          fontWeight: 760,
                          color: "var(--color-text-primary)",
                          letterSpacing: 0,
                        }}
                      >
                        Watch for
                      </h3>
                      <ol style={{ margin: 0, paddingLeft: 0, listStyle: "none", display: "grid", gap: 10 }}>
                        {lesson.misconceptions.map((item, i) => (
                          <li
                            key={item}
                            style={{
                              display: "grid",
                              gridTemplateColumns: "24px 1fr",
                              gap: 10,
                              fontSize: 14,
                              lineHeight: 1.6,
                              color: "var(--color-text-secondary)",
                            }}
                          >
                            <span
                              style={{
                                fontSize: 11,
                                fontWeight: 750,
                                color: "var(--color-text-muted)",
                                paddingTop: 3,
                                fontVariantNumeric: "tabular-nums",
                              }}
                            >
                              {String(i + 1).padStart(2, "0")}
                            </span>
                            <div><LatexRenderer text={item} /></div>
                          </li>
                        ))}
                      </ol>
                    </section>
                  )}

                  {lesson.tryThis && (
                    <section
                      style={{
                        maxWidth: "unset",
                        borderTop: "1.5px solid var(--color-border)",
                        paddingTop: 28,
                      }}
                    >
                      <div
                        style={{
                          fontSize: 10,
                          fontWeight: 750,
                          color: "var(--color-text-muted)",
                          letterSpacing: "0.12em",
                          textTransform: "uppercase",
                          marginBottom: 8,
                        }}
                      >
                        Try this
                      </div>
                      <LatexRenderer text={lesson.tryThis} />
                    </section>
                  )}
                </>
              ) : null}
            </article>
          </div>
        </main>
      </div>
    </>
  );
}
