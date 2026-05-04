"use client";

import { useState, useEffect, useRef } from "react";

function useReveal() {
  const ref = useRef<HTMLElement>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setVisible(true);
          observer.disconnect();
        }
      },
      { threshold: 0.08 }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  return { ref, visible };
}

function SkillTreeDiagram() {
  const nodes = [
    { id: "goal", x: 320, y: 20, label: "Machine Learning", isGoal: true },
    { id: "n1", x: 160, y: 110, label: "Linear Algebra" },
    { id: "n2", x: 320, y: 110, label: "Statistics" },
    { id: "n3", x: 480, y: 110, label: "Python" },
    { id: "n4", x: 80, y: 200, label: "Vectors" },
    { id: "n5", x: 240, y: 200, label: "Probability" },
    { id: "n6", x: 400, y: 200, label: "NumPy" },
    { id: "n7", x: 560, y: 200, label: "Pandas" },
    { id: "n8", x: 160, y: 290, label: "Matrix Ops" },
    { id: "n9", x: 320, y: 290, label: "Distributions" },
    { id: "n10", x: 480, y: 290, label: "Data Wrangling" },
  ];

  const edges = [
    ["goal", "n1"], ["goal", "n2"], ["goal", "n3"],
    ["n1", "n4"], ["n1", "n5"], ["n2", "n5"],
    ["n3", "n6"], ["n3", "n7"],
    ["n4", "n8"], ["n1", "n8"],
    ["n5", "n9"], ["n2", "n9"],
    ["n6", "n10"], ["n7", "n10"],
  ];

  const nodeMap = Object.fromEntries(nodes.map(n => [n.id, n]));

  return (
    <svg
      viewBox="0 0 640 360"
      aria-label="Example skill tree for Machine Learning showing prerequisite concepts: goal node at top, branching down through Linear Algebra, Statistics, and Python, then to foundational concepts like Vectors, Probability, and Data Wrangling"
      className="lp-diagram"
    >
      <defs>
        <marker id="arrow" markerWidth="6" markerHeight="6" refX="5" refY="3" orient="auto">
          <path d="M0,0 L0,6 L6,3 z" fill="oklch(76% 0.030 258)" />
        </marker>
      </defs>
      {edges.map(([from, to], i) => {
        const a = nodeMap[from];
        const b = nodeMap[to];
        const dx = b.x - a.x;
        const dy = b.y - a.y;
        const len = Math.sqrt(dx * dx + dy * dy);
        const ux = dx / len;
        const uy = dy / len;
        const r = a.isGoal ? 22 : 18;
        const x1 = a.x + ux * r;
        const y1 = a.y + uy * r;
        const x2 = b.x - ux * 20;
        const y2 = b.y - uy * 20;
        return (
          <line
            key={i}
            x1={x1} y1={y1}
            x2={x2} y2={y2}
            stroke="oklch(84% 0.030 258)"
            strokeWidth="1.5"
            markerEnd="url(#arrow)"
          />
        );
      })}
      {nodes.map(node => (
        <g key={node.id}>
          <circle
            cx={node.x}
            cy={node.y}
            r={node.isGoal ? 22 : 18}
            fill={node.isGoal ? "oklch(42% 0.22 258)" : "oklch(99.4% 0.003 100)"}
            stroke={node.isGoal ? "transparent" : "oklch(84% 0.030 258)"}
            strokeWidth="1.5"
          />
          <text
            x={node.x}
            y={node.y}
            textAnchor="middle"
            dominantBaseline="middle"
            fontSize={node.isGoal ? "7.5" : "6.5"}
            fontWeight={node.isGoal ? "600" : "400"}
            fill={node.isGoal ? "oklch(98.8% 0.004 100)" : "oklch(48% 0.015 258)"}
            fontFamily="var(--font-sans)"
          >
            {node.label.split(" ").map((word, wi) => (
              <tspan key={wi} x={node.x} dy={wi === 0 ? (node.label.includes(" ") ? "-3.5" : "0") : "8"}>
                {word}
              </tspan>
            ))}
          </text>
        </g>
      ))}
    </svg>
  );
}

const HOW_IT_WORKS = [
  {
    n: "01",
    heading: "Name your goal",
    body: "Type anything: a skill, a role, a topic. Pathwise accepts natural language.",
  },
  {
    n: "02",
    heading: "Get your map",
    body: "The AI decomposes your goal into every prerequisite concept, ordered by dependency.",
  },
  {
    n: "03",
    heading: "Follow the path",
    body: "Start at the foundations. Each step tells you exactly what to learn and what it opens up next.",
  },
];

export default function LandingPage() {
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">("idle");
  const [errorMsg, setErrorMsg] = useState("");
  const heroFormRef = useRef<HTMLFormElement>(null);

  const howReveal = useReveal();
  const closeReveal = useReveal();

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!email.trim()) return;
    setStatus("loading");
    setErrorMsg("");

    try {
      const res = await fetch("/api/waitlist", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      const data = await res.json();
      if (!res.ok) {
        if (data.code === "duplicate") {
          setErrorMsg("That email is already on the list.");
        } else if (data.code === "invalid_email") {
          setErrorMsg("Enter a valid email address.");
        } else {
          setErrorMsg("Something went wrong on our end. Try again in a moment.");
        }
        setStatus("error");
      } else {
        setStatus("success");
      }
    } catch {
      setErrorMsg("Connection failed. Check your internet and try again.");
      setStatus("error");
    }
  }

  function scrollToForm() {
    heroFormRef.current?.querySelector("input")?.focus({ preventScroll: false });
    heroFormRef.current?.scrollIntoView({ behavior: "smooth", block: "center" });
  }

  return (
    <>
      <style>{`
        .lp-root {
          min-height: 100vh;
          background: oklch(98.8% 0.004 100);
          color: oklch(18.4% 0.006 255);
          color-scheme: light;
          font-family: "Inter", -apple-system, system-ui, sans-serif;
          font-kerning: normal;
          font-optical-sizing: auto;
        }

        /* Nav */
        .lp-nav {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          z-index: 10;
          padding: 0 clamp(24px, 5vw, 64px);
          height: 56px;
          display: flex;
          align-items: center;
          background: oklch(98.8% 0.004 100 / 0.88);
          backdrop-filter: blur(12px);
          border-bottom: 1px solid oklch(90.6% 0.008 100);
        }
        .lp-wordmark {
          font-size: 15px;
          font-weight: 700;
          letter-spacing: -0.04em;
          color: oklch(18.4% 0.006 255);
          text-decoration: none;
          font-family: var(--font-display), "Inter", system-ui, sans-serif;
        }
        .lp-nav-badge {
          margin-left: 10px;
          font-size: 10px;
          font-weight: 500;
          letter-spacing: 0.06em;
          text-transform: uppercase;
          color: oklch(42% 0.100 258);
          background: oklch(91% 0.022 249);
          padding: 2px 7px;
          border-radius: 20px;
        }
        .lp-nav-right { margin-left: auto; }
        .lp-nav-dashboard {
          font-size: 13px;
          font-weight: 500;
          color: oklch(39.6% 0.010 255);
          text-decoration: none;
          padding: 6px 14px;
          border: 1.5px solid oklch(90.6% 0.008 100);
          border-radius: 7px;
          transition: border-color 0.15s ease, color 0.15s ease;
        }
        .lp-nav-dashboard:hover {
          border-color: oklch(80.9% 0.012 100);
          color: oklch(18.4% 0.006 255);
        }

        /* Hero */
        .lp-hero {
          padding-top: 56px;
          min-height: 100vh;
          display: flex;
          align-items: center;
        }

        .lp-hero-text-col {
          padding: clamp(48px, 8vh, 120px) clamp(24px, 7vw, 96px);
          max-width: 760px;
          animation: lp-rise 0.8s cubic-bezier(0.16, 1, 0.3, 1) both;
        }

        @keyframes lp-rise {
          from { opacity: 0; transform: translateY(24px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        @media (prefers-reduced-motion: reduce) {
          .lp-hero-text-col,
          .lp-hero-diagram-col { animation: none; }
          .lp-reveal { opacity: 1 !important; transform: none !important; transition: none !important; }
        }

        .lp-headline {
          font-family: var(--font-display), "Inter", system-ui, sans-serif;
          font-size: clamp(80px, 12vw, 152px);
          font-weight: 800;
          line-height: 0.92;
          letter-spacing: -0.05em;
          color: oklch(18.4% 0.006 255);
          margin: 0 0 32px;
          text-wrap: balance;
        }

        .lp-tagline {
          font-size: clamp(17px, 1.6vw, 22px);
          font-weight: 300;
          line-height: 1.6;
          color: oklch(48% 0.012 255);
          margin: 0 0 52px;
          max-width: 36ch;
          text-wrap: pretty;
        }
        .lp-tagline strong {
          font-weight: 600;
          color: oklch(18.4% 0.006 255);
          letter-spacing: -0.01em;
        }

        /* Form */
        .lp-form-group {
          display: flex;
          flex-direction: column;
          gap: 8px;
          max-width: 440px;
        }
        .lp-label {
          font-size: 12px;
          font-weight: 500;
          color: oklch(61.2% 0.010 100);
          letter-spacing: 0.01em;
        }
        .lp-form {
          display: flex;
          gap: 10px;
          flex-wrap: wrap;
          align-items: flex-start;
        }
        .lp-input-wrap {
          flex: 1;
          min-width: 200px;
          display: flex;
          flex-direction: column;
          gap: 6px;
        }
        .lp-input {
          height: 46px;
          padding: 0 16px;
          border: 1.5px solid oklch(88% 0.010 255);
          border-radius: 8px;
          background: oklch(99.4% 0.003 100);
          color: oklch(18.4% 0.006 255);
          font-size: 14px;
          font-family: inherit;
          outline: none;
          transition: border-color 0.15s ease, box-shadow 0.15s ease;
          width: 100%;
        }
        .lp-input::placeholder { color: oklch(74.2% 0.011 100); }
        .lp-input:focus {
          border-color: oklch(62% 0.18 258 / 0.6);
          box-shadow: 0 0 0 3px oklch(62% 0.18 258 / 0.10);
        }
        .lp-input:disabled { opacity: 0.5; cursor: not-allowed; }
        .lp-input[aria-invalid="true"] {
          border-color: oklch(57.7% 0.209 25 / 0.6);
        }
        .lp-error {
          font-size: 12px;
          color: oklch(57.7% 0.209 25);
          line-height: 1.4;
        }
        .lp-btn {
          height: 46px;
          padding: 0 22px;
          border-radius: 8px;
          border: none;
          background: oklch(42% 0.22 258);
          color: oklch(98.8% 0.004 100);
          font-size: 14px;
          font-weight: 600;
          font-family: inherit;
          cursor: pointer;
          white-space: nowrap;
          display: flex;
          align-items: center;
          gap: 8px;
          transition: background 0.15s ease;
          flex-shrink: 0;
          letter-spacing: -0.01em;
        }
        .lp-btn:hover:not(:disabled) { background: oklch(36% 0.24 258); }
        .lp-btn:disabled { opacity: 0.6; cursor: not-allowed; }

        @media (max-width: 480px) {
          .lp-btn { width: 100%; justify-content: center; }
          .lp-input-wrap { min-width: 0; }
        }

        .lp-success {
          display: flex;
          flex-direction: column;
          gap: 4px;
          padding: 13px 0;
        }
        .lp-success-line {
          display: flex;
          align-items: center;
          gap: 10px;
          font-size: 14px;
          color: oklch(49.1% 0.122 150);
          font-weight: 500;
        }
        .lp-success-dot {
          width: 8px;
          height: 8px;
          border-radius: 50%;
          background: oklch(49.1% 0.122 150);
          flex-shrink: 0;
        }
        .lp-success-sub {
          font-size: 12px;
          color: oklch(61.2% 0.010 100);
          padding-left: 18px;
        }

        /* Spinner */
        .lp-spinner {
          width: 14px;
          height: 14px;
          border: 2px solid oklch(98.8% 0.004 100 / 0.3);
          border-top-color: oklch(98.8% 0.004 100);
          border-radius: 50%;
          animation: lp-spin 0.65s linear infinite;
          flex-shrink: 0;
        }
        @keyframes lp-spin {
          to { transform: rotate(360deg); }
        }

        /* How it works */
        .lp-how {
          border-top: 1px solid oklch(90.6% 0.008 100);
          padding: clamp(80px, 12vh, 140px) clamp(24px, 7vw, 96px);
        }
        .lp-how-label {
          font-size: 11px;
          font-weight: 500;
          letter-spacing: 0.14em;
          text-transform: uppercase;
          color: oklch(42% 0.22 258);
          margin-bottom: 72px;
        }
        .lp-how-steps {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: clamp(40px, 6vw, 80px);
          max-width: 960px;
        }
        @media (max-width: 640px) {
          .lp-how-steps { grid-template-columns: 1fr; gap: 56px; }
        }
        .lp-how-n {
          font-family: var(--font-display), "Inter", system-ui, sans-serif;
          font-size: clamp(64px, 7vw, 96px);
          font-weight: 800;
          letter-spacing: -0.05em;
          color: oklch(91% 0.022 258);
          margin: 0 0 20px;
          line-height: 1;
        }
        .lp-how-heading {
          font-size: 18px;
          font-weight: 600;
          letter-spacing: -0.02em;
          color: oklch(18.4% 0.006 255);
          margin: 0 0 10px;
          text-wrap: balance;
        }
        .lp-how-body {
          font-size: 16px;
          line-height: 1.65;
          color: oklch(52% 0.010 255);
          margin: 0;
          max-width: 34ch;
        }

        /* Reveal animation */
        .lp-reveal {
          opacity: 0;
          transform: translateY(20px);
          transition: opacity 0.7s cubic-bezier(0.16, 1, 0.3, 1), transform 0.7s cubic-bezier(0.16, 1, 0.3, 1);
        }
        .lp-reveal.is-visible {
          opacity: 1;
          transform: translateY(0);
        }

        /* Close section — ink dark */
        .lp-close {
          background: oklch(14% 0.008 255);
          padding: clamp(80px, 12vh, 140px) clamp(24px, 7vw, 96px);
        }
        .lp-close-inner { max-width: 540px; }
        .lp-close-heading {
          font-family: var(--font-display), "Inter", system-ui, sans-serif;
          font-size: clamp(48px, 6vw, 80px);
          font-weight: 800;
          letter-spacing: -0.05em;
          color: oklch(97% 0.004 100);
          margin: 0 0 20px;
          line-height: 0.95;
          text-wrap: balance;
        }
        .lp-close-sub {
          font-size: 17px;
          font-weight: 300;
          color: oklch(62% 0.010 255);
          margin: 0 0 44px;
          line-height: 1.7;
          max-width: 40ch;
          letter-spacing: 0.005em;
        }
        .lp-close-anchor {
          display: inline-flex;
          align-items: center;
          gap: 10px;
          font-size: 15px;
          font-weight: 600;
          color: oklch(97% 0.004 100);
          background: oklch(42% 0.22 258);
          border: none;
          padding: 13px 24px;
          border-radius: 8px;
          cursor: pointer;
          font-family: inherit;
          text-decoration: none;
          transition: background 0.15s ease;
          letter-spacing: -0.01em;
        }
        .lp-close-anchor:hover {
          background: oklch(36% 0.24 258);
        }
        .lp-close-anchor svg { flex-shrink: 0; }

        /* Close success state (inverted) */
        .lp-close .lp-success-line { color: oklch(65% 0.14 150); }
        .lp-close .lp-success-dot { background: oklch(65% 0.14 150); }
        .lp-close .lp-success-sub { color: oklch(55% 0.008 255); }

        /* Footer */
        .lp-footer {
          padding: 28px clamp(24px, 7vw, 96px);
          background: oklch(14% 0.008 255);
          border-top: 1px solid oklch(22% 0.010 255);
          display: flex;
          align-items: center;
          justify-content: space-between;
          flex-wrap: wrap;
          gap: 12px;
        }
        .lp-footer-name {
          font-size: 13px;
          font-weight: 600;
          color: oklch(40% 0.010 255);
          letter-spacing: -0.02em;
        }
        .lp-footer-links {
          display: flex;
          align-items: center;
          gap: 20px;
        }
        .lp-footer-link {
          font-size: 12px;
          color: oklch(40% 0.010 255);
          text-decoration: none;
          transition: color 0.15s ease;
        }
        .lp-footer-link:hover { color: oklch(65% 0.010 255); }
      `}</style>

      <div className="lp-root">
        {/* Nav */}
        <nav className="lp-nav">
          <a href="/" className="lp-wordmark">Pathwise</a>
          <span className="lp-nav-badge">Early access</span>
          <div className="lp-nav-right">
            <a href="/dashboard" className="lp-nav-dashboard">Dashboard</a>
          </div>
        </nav>

        {/* Hero — split layout */}
        <section className="lp-hero">
          <div className="lp-hero-text-col">
            <h1 className="lp-headline">Pathwise</h1>
            <p className="lp-tagline">
              Don&apos;t know where to start?<br />
              <strong>Start here.</strong> Learn everything.
            </p>

            {status === "success" ? (
              <div className="lp-success">
                <div className="lp-success-line">
                  <span className="lp-success-dot" />
                  You&apos;re on the list.
                </div>
                <p className="lp-success-sub">Check your inbox; a confirmation is on its way.</p>
              </div>
            ) : (
              <div className="lp-form-group">
                <label className="lp-label" htmlFor="hero-email">Email address</label>
                <form className="lp-form" onSubmit={handleSubmit} ref={heroFormRef}>
                  <div className="lp-input-wrap">
                    <input
                      id="hero-email"
                      className="lp-input"
                      type="email"
                      placeholder="you@email.com"
                      value={email}
                      onChange={e => setEmail(e.target.value)}
                      disabled={status === "loading"}
                      required
                      aria-invalid={status === "error" ? "true" : undefined}
                      aria-describedby={status === "error" ? "hero-email-error" : undefined}
                    />
                    {status === "error" && (
                      <span id="hero-email-error" className="lp-error" role="alert">{errorMsg}</span>
                    )}
                  </div>
                  <button
                    className="lp-btn"
                    type="submit"
                    disabled={status === "loading"}
                  >
                    {status === "loading" && <span className="lp-spinner" aria-hidden="true" />}
                    {status === "loading" ? "Joining..." : "Join waitlist"}
                  </button>
                </form>
              </div>
            )}
          </div>

        </section>

        {/* How it works */}
        <section
          className={`lp-how lp-reveal${howReveal.visible ? " is-visible" : ""}`}
          ref={howReveal.ref as React.RefObject<HTMLElement>}
        >
          <p className="lp-how-label">How it works</p>
          <div className="lp-how-steps">
            {HOW_IT_WORKS.map(step => (
              <div key={step.n}>
                <p className="lp-how-n">{step.n}</p>
                <h3 className="lp-how-heading">{step.heading}</h3>
                <p className="lp-how-body">{step.body}</p>
              </div>
            ))}
          </div>
        </section>

        {/* Close — ink dark */}
        <section
          className={`lp-close lp-reveal${closeReveal.visible ? " is-visible" : ""}`}
          ref={closeReveal.ref as React.RefObject<HTMLElement>}
        >
          <div className="lp-close-inner">
            <h2 className="lp-close-heading">Start here.</h2>
            <p className="lp-close-sub">
              Access is limited while we&apos;re in early testing. Join the list and you&apos;ll hear from us when a spot opens up.
            </p>
            {status === "success" ? (
              <div className="lp-success">
                <div className="lp-success-line">
                  <span className="lp-success-dot" />
                  You&apos;re on the list.
                </div>
                <p className="lp-success-sub">Check your inbox; a confirmation is on its way.</p>
              </div>
            ) : (
              <button className="lp-close-anchor" onClick={scrollToForm} type="button">
                Join the waitlist
                <svg width="14" height="14" viewBox="0 0 14 14" fill="none" aria-hidden="true">
                  <path d="M2 7h10M7 2l5 5-5 5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </button>
            )}
          </div>
        </section>

        {/* Footer */}
        <footer className="lp-footer">
          <span className="lp-footer-name">Pathwise</span>
          <div className="lp-footer-links">
            <a href="mailto:norinheng86@gmail.com" className="lp-footer-link">Contact</a>
            <span className="lp-footer-link">© 2026</span>
          </div>
        </footer>
      </div>
    </>
  );
}
