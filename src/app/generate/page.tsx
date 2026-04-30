"use client";

import { useState } from "react";
import { SkillTreeLoader } from "@/components/skill-tree/SkillTreeLoader";

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
        width: 14,
        height: 14,
        border: "2px solid rgba(255,255,255,0.35)",
        borderTopColor: "#ffffff",
        borderRadius: "50%",
        animation: "spin 0.7s linear infinite",
        flexShrink: 0,
      }}
      aria-hidden="true"
    />
  );
}

export default function GeneratePage() {
  const [subject, setSubject] = useState("");
  const [goal, setGoal] = useState("");
  const [schema, setSchema] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/skill-tree/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ subject, goal }),
      });
      const data = (await res.json()) as { schema?: string; error?: string };
      if (!res.ok) throw new Error(data.error ?? "Generation failed");
      setSchema(data.schema ?? null);
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
        subject={tryParseSubject(schema) ?? subject}
        initialSchema={schema}
      />
    );
  }

  return (
    <>
      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
        .gen-input:focus { outline: none; border-color: #93C5FD !important; box-shadow: 0 0 0 3px rgba(147,197,253,0.25); }
        .gen-btn:hover:not(:disabled) { background: #1D4ED8 !important; }
        .gen-btn:disabled { opacity: 0.6; cursor: not-allowed; }
      `}</style>

      <div style={{
        minHeight: "100vh",
        background: "#FCFCFA",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        padding: "24px 16px",
        fontFamily: '"Inter", system-ui, sans-serif',
      }}>
        {/* Header */}
        <a
          href="/dashboard"
          style={{
            display: "flex",
            alignItems: "center",
            gap: 10,
            marginBottom: 40,
            textDecoration: "none",
          }}
        >
          <div style={{
            width: 22,
            height: 22,
            borderRadius: 6,
            background: "#0E0F12",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            flexShrink: 0,
          }}>
            <div style={{ width: 8, height: 8, background: "#FCFCFA", borderRadius: "50%" }} />
          </div>
          <span style={{ fontSize: 14.5, fontWeight: 700, color: "#0E0F12", letterSpacing: "-0.02em" }}>
            Pathwise
          </span>
        </a>

        {/* Card */}
        <div style={{
          width: "100%",
          maxWidth: 480,
          background: "#FFFFFF",
          border: "1px solid #E6E5DF",
          borderRadius: 12,
          padding: "32px 28px",
          boxShadow: "0 2px 12px rgba(20,15,10,0.07)",
        }}>
          <h1 style={{
            fontSize: 20,
            fontWeight: 700,
            color: "#0E0F12",
            letterSpacing: "-0.025em",
            margin: "0 0 6px",
          }}>
            Generate a learning path
          </h1>
          <p style={{ fontSize: 13, color: "#8A8A82", margin: "0 0 28px", lineHeight: 1.5 }}>
            Describe what you want to master and we&apos;ll build a step-by-step knowledge graph.
          </p>

          <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: 18 }}>
            <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
              <label htmlFor="subject" style={{ fontSize: 12, fontWeight: 600, color: "#4D4E54" }}>
                Subject
              </label>
              <input
                id="subject"
                className="gen-input"
                type="text"
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                placeholder="e.g. Machine Learning Engineering"
                disabled={loading}
                required
                style={{
                  height: 38,
                  border: "1px solid #E6E5DF",
                  borderRadius: 7,
                  padding: "0 12px",
                  fontSize: 13,
                  color: "#0E0F12",
                  background: "#FFFFFF",
                  width: "100%",
                  boxSizing: "border-box",
                  transition: "border-color 150ms, box-shadow 150ms",
                }}
              />
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
              <label htmlFor="goal" style={{ fontSize: 12, fontWeight: 600, color: "#4D4E54" }}>
                End goal
              </label>
              <textarea
                id="goal"
                className="gen-input"
                value={goal}
                onChange={(e) => setGoal(e.target.value)}
                placeholder="e.g. Deploy a production LLM fine-tuning pipeline on AWS"
                disabled={loading}
                required
                rows={4}
                style={{
                  border: "1px solid #E6E5DF",
                  borderRadius: 7,
                  padding: "10px 12px",
                  fontSize: 13,
                  color: "#0E0F12",
                  background: "#FFFFFF",
                  width: "100%",
                  boxSizing: "border-box",
                  resize: "vertical",
                  lineHeight: 1.5,
                  fontFamily: "inherit",
                  transition: "border-color 150ms, box-shadow 150ms",
                }}
              />
            </div>

            {error && (
              <div
                role="alert"
                style={{
                  background: "#FEF2F2",
                  border: "1px solid #FECACA",
                  borderRadius: 7,
                  padding: "10px 12px",
                  fontSize: 12.5,
                  color: "#DC2626",
                  lineHeight: 1.5,
                }}
              >
                {error}
              </div>
            )}

            <button
              type="submit"
              className="gen-btn"
              disabled={loading}
              aria-busy={loading}
              style={{
                height: 44,
                background: "#2563EB",
                color: "#FFFFFF",
                border: "none",
                borderRadius: 8,
                fontSize: 13.5,
                fontWeight: 600,
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: 8,
                width: "100%",
                transition: "background 150ms",
                marginTop: 2,
              }}
            >
              {loading && <Spinner />}
              {loading ? "Generating…" : "Generate path"}
            </button>
          </form>
        </div>

        <p style={{ marginTop: 20, fontSize: 12, color: "#C9C7BD" }}>
          Powered by Gemini · Takes 10–30 seconds
        </p>
      </div>
    </>
  );
}
