"use client";

import { useState } from "react";
import { SkillTreeLoader } from "@/components/skill-tree/SkillTreeLoader";
import { TopBar, type LearningPathNavItem } from "@/components/ui/TopBar";

function tryParseSubject(schema: string): string | null {
  try {
    const parsed = JSON.parse(schema) as { subject?: unknown };
    return typeof parsed.subject === "string" ? parsed.subject : null;
  } catch {
    return null;
  }
}

function Spinner() {
  return (
    <span
      style={{
        display: "inline-block",
        width: 13,
        height: 13,
        border: "2px solid var(--color-spinner-track)",
        borderTopColor: "var(--color-button-primary-text)",
        borderRadius: "50%",
        animation: "spin 0.7s linear infinite",
        flexShrink: 0,
      }}
      aria-hidden="true"
    />
  );
}

interface GeneratePageClientProps {
  learningPaths?: LearningPathNavItem[];
}

export function GeneratePageClient({ learningPaths = [] }: GeneratePageClientProps) {
  const [goal, setGoal] = useState("");
  const [schema, setSchema] = useState<string | null>(null);
  const [schemaTreeId, setSchemaTreeId] = useState<string | null>(null);
  const [schemaDraft, setSchemaDraft] = useState("");
  const [navPaths, setNavPaths] = useState(learningPaths);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setSchemaDraft("");

    try {
      const res = await fetch("/api/skill-tree/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ goal }),
      });

      if (!res.ok) {
        const data = (await res.json()) as { error?: string };
        throw new Error(data.error ?? "Generation failed");
      }

      if (!res.body) {
        throw new Error("Generation stream did not start");
      }

      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let nextSchema = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        nextSchema += decoder.decode(value, { stream: true });
        setSchemaDraft(nextSchema);
      }

      nextSchema += decoder.decode();
      JSON.parse(nextSchema);
      const saveRes = await fetch("/api/skill-tree/save", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ schema: nextSchema }),
      });

      if (!saveRes.ok) {
        const data = (await saveRes.json()) as { error?: string };
        throw new Error(data.error ?? "Generated path could not be saved");
      }

      const savedPath = (await saveRes.json()) as LearningPathNavItem;
      setNavPaths((current) => [
        savedPath,
        ...current.filter((path) => path.id !== savedPath.id),
      ]);
      setSchemaTreeId(savedPath.id);
      setSchema(nextSchema);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setLoading(false);
    }
  }

  if (schema !== null) {
    return (
      <SkillTreeLoader
        nodes={[]}
        edges={[]}
        subject={tryParseSubject(schema) ?? "Generated Learning Path"}
        initialSchema={schema}
        schemaTreeId={schemaTreeId ?? undefined}
        learningPaths={navPaths}
        onNewPath={() => {
          setSchema(null);
          setSchemaTreeId(null);
          setGoal("");
          setSchemaDraft("");
          setError(null);
        }}
      />
    );
  }

  return (
    <>
      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
        .gen-goal-input:focus { outline: none; }
        .gen-goal-bar:focus-within { border-color: var(--color-border-mid) !important; box-shadow: 0 0 0 4px var(--color-focus-ring); }
        .gen-btn:hover:not(:disabled) { background: var(--color-button-primary-hover) !important; }
        .gen-btn:disabled { opacity: 0.6; cursor: not-allowed; }
        @media (max-width: 680px) {
          .gen-title { font-size: 34px !important; }
          .gen-goal-bar { flex-direction: column !important; align-items: stretch !important; padding: 10px !important; border-radius: 14px !important; }
          .gen-goal-input { text-align: center !important; min-height: 46px !important; }
          .gen-btn { width: 100% !important; }
        }
      `}</style>

      <div style={{
        minHeight: "100vh",
        background: "var(--color-canvas)",
        fontFamily: "var(--font-sans)",
      }}>
        <TopBar
          subject="Generate a learning path"
          completedCount={0}
          totalCount={0}
          learningPaths={navPaths}
        />

        <main
          className="gen-hero"
          style={{
            minHeight: "100vh",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            padding: "96px 16px 72px",
          }}
        >
          <h1
            className="gen-title"
            style={{
              maxWidth: 720,
              margin: "0 0 34px",
              color: "var(--color-text-primary)",
              fontSize: 46,
              lineHeight: 1.12,
              fontWeight: 760,
              letterSpacing: 0,
              textAlign: "center",
            }}
          >
            what would you like to learn today
          </h1>

          <form onSubmit={handleSubmit} style={{ width: "min(100%, 620px)", display: "flex", flexDirection: "column", alignItems: "center", gap: 14 }}>
            <div
              className="gen-goal-bar"
              style={{
                width: "100%",
                minHeight: 58,
                background: "var(--color-chrome)",
                border: "1px solid transparent",
                borderRadius: 13,
                padding: "8px 8px 8px 20px",
                display: "flex",
                alignItems: "center",
                gap: 10,
                transition: "border-color 150ms, box-shadow 150ms",
              }}
            >
              <label htmlFor="goal" style={{ position: "absolute", width: 1, height: 1, overflow: "hidden", clip: "rect(0 0 0 0)" }}>
                End goal
              </label>
              <input
                id="goal"
                className="gen-goal-input"
                value={goal}
                onChange={(e) => setGoal(e.target.value)}
                placeholder="Enter your end goal"
                disabled={loading}
                required
                style={{
                  border: "none",
                  padding: 0,
                  fontSize: 15,
                  color: "var(--color-text-primary)",
                  background: "transparent",
                  width: "100%",
                  minWidth: 0,
                  fontFamily: "ui-monospace, SFMono-Regular, Consolas, monospace",
                }}
              />
              <button
                type="submit"
                className="gen-btn"
                disabled={loading}
                aria-busy={loading}
                style={{
                  minWidth: 116,
                  height: 42,
                  background: "var(--color-button-primary)",
                  color: "var(--color-button-primary-text)",
                  border: "none",
                  borderRadius: 10,
                  fontSize: 14,
                  fontWeight: 650,
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: 8,
                  transition: "background 150ms",
                  flexShrink: 0,
                }}
              >
                {loading && <Spinner />}
                {loading ? "Mapping" : "Generate"}
              </button>
            </div>

            {error && (
              <div
                role="alert"
                style={{
                  background: "var(--color-danger-soft)",
                  border: "1px solid var(--color-danger-border)",
                  borderRadius: 7,
                  padding: "10px 12px",
                  fontSize: 12.5,
                  color: "var(--color-danger)",
                  lineHeight: 1.5,
                  width: "100%",
                }}
              >
                {error}
              </div>
            )}

            {(loading || schemaDraft) && (
              <p
                aria-live="polite"
                style={{
                  margin: 0,
                  minHeight: 20,
                  color: "var(--color-text-muted)",
                  fontSize: 13,
                  lineHeight: 1.5,
                  textAlign: "center",
                }}
              >
                {loading ? "Mapping concepts and prerequisites..." : "Learning path ready."}
              </p>
            )}
          </form>
        </main>
      </div>
    </>
  );
}
