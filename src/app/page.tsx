"use client";

import {
  useEffect,
  useRef,
  useState,
  type FormEvent,
  type RefObject,
} from "react";

type WaitlistStatus = "idle" | "loading" | "success" | "error";

interface RevealResult {
  ref: RefObject<HTMLElement | null>;
  visible: boolean;
}

interface WaitlistFormProps {
  email: string;
  errorMsg: string;
  formId: string;
  formRef?: RefObject<HTMLFormElement | null>;
  status: WaitlistStatus;
  tone?: "light" | "dark";
  onEmailChange: (value: string) => void;
  onSubmit: (event: FormEvent<HTMLFormElement>) => void;
}

const MAP_NODES = [
  { id: "python", x: 78, y: 276, label: "Python core", status: "current" },
  { id: "algebra", x: 248, y: 150, label: "Linear algebra" },
  { id: "stats", x: 248, y: 286, label: "Statistics" },
  { id: "numpy", x: 248, y: 420, label: "NumPy" },
  { id: "training", x: 438, y: 244, label: "Model training", status: "checkpoint" },
  { id: "validation", x: 612, y: 152, label: "Validation" },
  { id: "networks", x: 612, y: 334, label: "Neural networks" },
  { id: "deploy", x: 784, y: 248, label: "Deploy models", status: "goal" },
];

const MAP_EDGES = [
  ["python", "algebra"],
  ["python", "stats"],
  ["python", "numpy"],
  ["algebra", "training"],
  ["stats", "training"],
  ["numpy", "training"],
  ["training", "validation"],
  ["training", "networks"],
  ["validation", "deploy"],
  ["networks", "deploy"],
];

const MAP_NODE_BY_ID = new Map(MAP_NODES.map((node) => [node.id, node]));

const SYSTEM_POINTS = [
  {
    kicker: "Prerequisites",
    title: "The hidden steps become visible.",
    body: "Advanced ideas stop arriving as surprises because every node shows what it depends on.",
  },
  {
    kicker: "Atomic concepts",
    title: "No vague modules to decode.",
    body: "Each step is small enough to learn, search, practice, and mark complete.",
  },
  {
    kicker: "Progression",
    title: "You know what opens next.",
    body: "The map gives you sequence, optional branches, and checkpoint moments where understanding compounds.",
  },
];

const FAILURE_MODES = [
  "A dozen tutorials, no order",
  "Prerequisites discovered too late",
  "Big goals broken into blurry modules",
  "Restarting because the path was wrong",
];

function useReveal(): RevealResult {
  const ref = useRef<HTMLElement | null>(null);
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
      { threshold: 0.12 },
    );

    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  return { ref, visible };
}

function splitLabel(label: string) {
  const words = label.split(" ");
  if (words.length === 1) return [label];
  return [words[0], words.slice(1).join(" ")];
}

function HeroGraphScene() {
  return (
    <div className="lp-map-stage" aria-hidden="true">
      <div className="lp-map-prompt">
        <span>Goal</span>
        <strong>Machine learning engineering</strong>
      </div>

      <svg
        className="lp-map-svg"
        preserveAspectRatio="xMidYMid slice"
        viewBox="0 0 900 560"
        role="img"
      >
        <defs>
          <marker
            id="lp-arrow"
            markerHeight="8"
            markerWidth="8"
            orient="auto"
            refX="7"
            refY="4"
          >
            <path d="M0 0 L8 4 L0 8 Z" fill="var(--lp-line-strong)" />
          </marker>
        </defs>

        <g className="lp-map-zones">
          <rect x="20" y="62" width="260" height="426" rx="8" />
          <rect x="320" y="62" width="208" height="426" rx="8" />
          <rect x="566" y="62" width="286" height="426" rx="8" />
          <text x="38" y="92">Foundations</text>
          <text x="338" y="92">Core model</text>
          <text x="584" y="92">Production</text>
        </g>

        <g className="lp-map-edges">
          {MAP_EDGES.map(([from, to], index) => {
            const a = MAP_NODE_BY_ID.get(from);
            const b = MAP_NODE_BY_ID.get(to);
            if (!a || !b) return null;

            const c1x = a.x + (b.x - a.x) * 0.52;
            const c2x = a.x + (b.x - a.x) * 0.48;
            return (
              <path
                key={`${from}-${to}`}
                className="lp-map-edge"
                d={`M ${a.x + 58} ${a.y} C ${c1x} ${a.y}, ${c2x} ${b.y}, ${b.x - 58} ${b.y}`}
                markerEnd="url(#lp-arrow)"
                style={{ animationDelay: `${index * 70}ms` }}
              />
            );
          })}
        </g>

        <g className="lp-map-nodes">
          {MAP_NODES.map((node, index) => (
            <g
              key={node.id}
              className={`lp-map-node is-${node.status ?? "default"}`}
              style={{ animationDelay: `${220 + index * 55}ms` }}
            >
              <rect x={node.x - 58} y={node.y - 28} width="116" height="56" rx="8" />
              <text x={node.x} y={node.y - 4}>
                {splitLabel(node.label).map((line, lineIndex) => (
                  <tspan key={line} x={node.x} dy={lineIndex === 0 ? 0 : 15}>
                    {line}
                  </tspan>
                ))}
              </text>
            </g>
          ))}
        </g>
      </svg>

      <div className="lp-map-legend">
        <span>23 nodes</span>
        <span>5 zones</span>
        <span>1 clear next step</span>
      </div>
    </div>
  );
}

function WaitlistForm({
  email,
  errorMsg,
  formId,
  formRef,
  status,
  tone = "light",
  onEmailChange,
  onSubmit,
}: WaitlistFormProps) {
  const isLoading = status === "loading";
  const isError = status === "error";
  const errorId = `${formId}-error`;

  if (status === "success") {
    return (
      <div className={`lp-success is-${tone}`} role="status">
        <span className="lp-success-mark" aria-hidden="true" />
        <div>
          <strong>You are on the list.</strong>
          <span>We will send access when the next testing group opens.</span>
        </div>
      </div>
    );
  }

  return (
    <form className={`lp-form is-${tone}`} onSubmit={onSubmit} ref={formRef}>
      <label className="lp-label" htmlFor={formId}>
        Join the early access list
      </label>
      <div className="lp-form-row">
        <input
          aria-describedby={isError ? errorId : undefined}
          aria-invalid={isError || undefined}
          className="lp-input"
          disabled={isLoading}
          id={formId}
          onChange={(event) => onEmailChange(event.target.value)}
          placeholder="you@email.com"
          required
          type="email"
          value={email}
        />
        <button className="lp-submit" disabled={isLoading} type="submit">
          {isLoading ? (
            <>
              <span className="lp-spinner" aria-hidden="true" />
              Joining
            </>
          ) : (
            "Join waitlist"
          )}
        </button>
      </div>
      {isError && (
        <p className="lp-error" id={errorId} role="alert">
          {errorMsg}
        </p>
      )}
    </form>
  );
}

export default function LandingPage() {
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<WaitlistStatus>("idle");
  const [errorMsg, setErrorMsg] = useState("");
  const heroFormRef = useRef<HTMLFormElement | null>(null);
  const problemReveal = useReveal();
  const systemReveal = useReveal();
  const closeReveal = useReveal();

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!email.trim()) return;

    setStatus("loading");
    setErrorMsg("");

    try {
      const response = await fetch("/api/waitlist", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      const data = await response.json().catch(() => ({}));

      if (!response.ok) {
        if (data.code === "duplicate") {
          setErrorMsg("That email is already on the list.");
        } else if (data.code === "invalid_email") {
          setErrorMsg("Enter a valid email address.");
        } else {
          setErrorMsg("Something went wrong on our end. Try again in a moment.");
        }
        setStatus("error");
        return;
      }

      setStatus("success");
    } catch {
      setErrorMsg("Connection failed. Check your internet and try again.");
      setStatus("error");
    }
  }

  function focusWaitlist() {
    const input = heroFormRef.current?.querySelector("input");
    heroFormRef.current?.scrollIntoView({ behavior: "smooth", block: "center" });
    input?.focus({ preventScroll: true });
  }

  return (
    <>
      <style>{`
        .lp-root {
          --lp-paper: oklch(96.8% 0.014 168);
          --lp-paper-deep: oklch(92.2% 0.025 168);
          --lp-ink: oklch(16.8% 0.018 238);
          --lp-ink-soft: oklch(36% 0.024 238);
          --lp-muted: oklch(53% 0.021 212);
          --lp-line: oklch(82% 0.035 184);
          --lp-line-strong: oklch(47% 0.112 174);
          --lp-green: oklch(67% 0.145 164);
          --lp-amber: oklch(78% 0.153 76);
          --lp-coral: oklch(66% 0.17 28);
          --lp-blue: oklch(61% 0.14 246);
          --lp-panel: oklch(98.8% 0.009 168);
          --lp-dark: oklch(17.5% 0.02 236);
          --lp-dark-line: oklch(31% 0.031 236);
          position: relative;
          min-height: 100vh;
          overflow-x: clip;
          background:
            linear-gradient(90deg, oklch(96.8% 0.014 168) 0 1px, transparent 1px 100%),
            linear-gradient(0deg, oklch(96.8% 0.014 168) 0 1px, transparent 1px 100%),
            var(--lp-paper);
          background-size: 56px 56px;
          color: var(--lp-ink);
          color-scheme: light;
          font-family: var(--font-display), ui-sans-serif, system-ui, sans-serif;
        }

        .lp-nav {
          align-items: center;
          background: oklch(96.8% 0.014 168 / 0.93);
          border-bottom: 1px solid var(--lp-line);
          display: flex;
          gap: 18px;
          height: 58px;
          left: 0;
          padding: 0 28px;
          position: fixed;
          right: 0;
          top: 0;
          z-index: 20;
        }

        .lp-wordmark {
          color: var(--lp-ink);
          font-size: 18px;
          font-weight: 800;
          letter-spacing: 0;
          line-height: 1;
          text-decoration: none;
        }

        .lp-status-chip {
          border: 1px solid var(--lp-line);
          border-radius: 4px;
          color: var(--lp-ink-soft);
          font-size: 12px;
          font-weight: 600;
          padding: 4px 8px;
        }

        .lp-nav-actions {
          align-items: center;
          display: flex;
          gap: 10px;
          margin-left: auto;
        }

        .lp-link,
        .lp-nav-button {
          align-items: center;
          border-radius: 6px;
          display: inline-flex;
          font-family: inherit;
          font-size: 13px;
          font-weight: 700;
          height: 34px;
          justify-content: center;
          letter-spacing: 0;
          text-decoration: none;
        }

        .lp-link {
          color: var(--lp-ink-soft);
          padding: 0 8px;
        }

        .lp-nav-button {
          background: var(--lp-ink);
          border: 0;
          color: oklch(97.8% 0.012 168);
          cursor: pointer;
          padding: 0 14px;
        }

        .lp-link:hover {
          color: var(--lp-ink);
        }

        .lp-nav-button:hover {
          background: oklch(22% 0.024 238);
        }

        .lp-hero {
          min-height: calc(100svh - 74px);
          overflow: hidden;
          padding: 132px 28px 54px;
          position: relative;
        }

        .lp-hero::before {
          background:
            radial-gradient(ellipse at 50% 24%, var(--lp-paper) 0 34%, oklch(96.8% 0.014 168 / 0.88) 48%, transparent 76%),
            linear-gradient(180deg, var(--lp-paper) 0 16%, transparent 70%);
          content: "";
          inset: 0;
          pointer-events: none;
          position: absolute;
          z-index: 1;
        }

        .lp-hero-inner {
          align-items: flex-start;
          display: flex;
          justify-content: center;
          margin: 0 auto;
          max-width: 1240px;
          min-height: 560px;
          position: relative;
          z-index: 2;
        }

        .lp-hero-copy {
          align-items: center;
          display: flex;
          flex-direction: column;
          max-width: 900px;
          padding: 32px 0 32px;
          text-align: center;
        }

        .lp-eyebrow {
          align-items: center;
          color: var(--lp-ink-soft);
          display: inline-flex;
          font-size: 14px;
          font-weight: 800;
          gap: 10px;
          letter-spacing: 0;
          margin: 0 auto 26px;
        }

        .lp-eyebrow::before {
          background: var(--lp-coral);
          content: "";
          height: 10px;
          width: 10px;
        }

        .lp-title {
          color: var(--lp-ink);
          font-size: 5.8rem;
          font-weight: 800;
          letter-spacing: 0;
          line-height: 0.94;
          margin: 0 auto 24px;
          max-width: 12ch;
          text-wrap: balance;
        }

        .lp-hero-text {
          color: var(--lp-ink-soft);
          font-size: 19px;
          font-weight: 400;
          line-height: 1.55;
          margin: 0 auto 30px;
          max-width: 48ch;
          text-wrap: pretty;
        }

        .lp-hero-proof {
          border-top: 1px solid var(--lp-line);
          color: var(--lp-muted);
          font-size: 14px;
          line-height: 1.55;
          margin: 30px auto 0;
          max-width: 52ch;
          padding-top: 18px;
        }

        .lp-map-stage {
          bottom: -118px;
          left: -132px;
          min-width: 0;
          opacity: 0.76;
          position: absolute;
          right: -132px;
          top: 18px;
          z-index: 0;
        }

        .lp-map-prompt {
          align-items: center;
          background: var(--lp-panel);
          border: 1px solid var(--lp-line);
          border-radius: 8px;
          box-shadow: 0 18px 50px oklch(32% 0.04 185 / 0.08);
          display: flex;
          gap: 14px;
          left: 88px;
          min-height: 48px;
          padding: 0 16px;
          position: absolute;
          top: 0;
          width: min(420px, 42vw);
          z-index: 3;
        }

        .lp-map-prompt span {
          color: var(--lp-muted);
          font-size: 12px;
          font-weight: 800;
        }

        .lp-map-prompt strong {
          color: var(--lp-ink);
          font-size: 15px;
          font-weight: 800;
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
        }

        .lp-map-svg {
          height: 100%;
          min-height: 0;
          overflow: visible;
          width: 100%;
        }

        .lp-map-zones rect {
          fill: oklch(94% 0.021 168 / 0.62);
          stroke: var(--lp-line);
          stroke-width: 1;
        }

        .lp-map-zones text {
          fill: var(--lp-muted);
          font-size: 12px;
          font-weight: 800;
        }

        .lp-map-edge {
          animation: lp-draw 900ms cubic-bezier(0.16, 1, 0.3, 1) both;
          fill: none;
          stroke: var(--lp-line-strong);
          stroke-dasharray: 520;
          stroke-dashoffset: 520;
          stroke-linecap: round;
          stroke-width: 2;
        }

        .lp-map-node {
          animation: lp-node-in 560ms cubic-bezier(0.16, 1, 0.3, 1) both;
          transform-box: fill-box;
          transform-origin: center;
        }

        .lp-map-node rect {
          fill: var(--lp-panel);
          stroke: var(--lp-line);
          stroke-width: 1.3;
        }

        .lp-map-node text {
          fill: var(--lp-ink-soft);
          font-size: 12px;
          font-weight: 800;
          text-anchor: middle;
        }

        .lp-map-node.is-current rect {
          fill: oklch(90% 0.071 164);
          stroke: var(--lp-green);
        }

        .lp-map-node.is-checkpoint rect {
          fill: oklch(94% 0.053 76);
          stroke: var(--lp-amber);
        }

        .lp-map-node.is-goal rect {
          fill: var(--lp-ink);
          stroke: var(--lp-ink);
        }

        .lp-map-node.is-goal text {
          fill: oklch(97.8% 0.012 168);
        }

        .lp-map-legend {
          background: var(--lp-ink);
          border-radius: 8px;
          bottom: 76px;
          box-shadow: 0 18px 50px oklch(32% 0.04 185 / 0.13);
          color: oklch(97.8% 0.012 168);
          display: grid;
          gap: 1px;
          overflow: hidden;
          position: absolute;
          right: 112px;
          width: 180px;
        }

        .lp-map-legend span {
          background: oklch(23% 0.025 238);
          font-size: 13px;
          font-weight: 800;
          padding: 12px 14px;
        }

        @keyframes lp-draw {
          to {
            stroke-dashoffset: 0;
          }
        }

        @keyframes lp-node-in {
          from {
            opacity: 0;
            transform: translateY(10px) scale(0.96);
          }
          to {
            opacity: 1;
            transform: translateY(0) scale(1);
          }
        }

        .lp-form {
          max-width: 560px;
        }

        .lp-hero-copy .lp-form {
          margin: 0 auto;
          text-align: left;
          width: min(100%, 560px);
        }

        .lp-label {
          color: var(--lp-muted);
          display: block;
          font-size: 13px;
          font-weight: 800;
          margin-bottom: 9px;
        }

        .lp-form-row {
          align-items: stretch;
          display: grid;
          gap: 10px;
          grid-template-columns: minmax(0, 1fr) auto;
        }

        .lp-input {
          background: oklch(98.8% 0.009 168);
          border: 1px solid var(--lp-line);
          border-radius: 8px;
          color: var(--lp-ink);
          font: inherit;
          font-size: 15px;
          font-weight: 600;
          height: 50px;
          min-width: 0;
          outline: none;
          padding: 0 16px;
          width: 100%;
        }

        .lp-input::placeholder {
          color: oklch(64% 0.018 212);
        }

        .lp-input:focus {
          border-color: var(--lp-line-strong);
          box-shadow: 0 0 0 3px oklch(67% 0.145 164 / 0.18);
        }

        .lp-input:disabled {
          cursor: not-allowed;
          opacity: 0.62;
        }

        .lp-input[aria-invalid="true"] {
          border-color: var(--lp-coral);
          box-shadow: 0 0 0 3px oklch(66% 0.17 28 / 0.16);
        }

        .lp-submit {
          align-items: center;
          background: var(--lp-ink);
          border: 0;
          border-radius: 8px;
          color: oklch(97.8% 0.012 168);
          cursor: pointer;
          display: inline-flex;
          font: inherit;
          font-size: 15px;
          font-weight: 800;
          gap: 9px;
          height: 50px;
          justify-content: center;
          padding: 0 20px;
          white-space: nowrap;
        }

        .lp-submit:hover:not(:disabled) {
          background: oklch(22% 0.024 238);
        }

        .lp-submit:disabled {
          cursor: not-allowed;
          opacity: 0.68;
        }

        .lp-error {
          color: var(--lp-coral);
          font-size: 13px;
          font-weight: 700;
          line-height: 1.4;
          margin: 9px 0 0;
        }

        .lp-spinner {
          animation: lp-spin 700ms linear infinite;
          border: 2px solid oklch(97.8% 0.012 168 / 0.35);
          border-radius: 50%;
          border-top-color: oklch(97.8% 0.012 168);
          height: 15px;
          width: 15px;
        }

        @keyframes lp-spin {
          to {
            transform: rotate(360deg);
          }
        }

        .lp-success {
          align-items: flex-start;
          color: var(--lp-ink);
          display: flex;
          gap: 12px;
          max-width: 520px;
        }

        .lp-success-mark {
          background: var(--lp-green);
          height: 14px;
          margin-top: 4px;
          width: 14px;
        }

        .lp-success strong {
          display: block;
          font-size: 17px;
          line-height: 1.35;
        }

        .lp-success span:last-child {
          color: var(--lp-muted);
          display: block;
          font-size: 14px;
          line-height: 1.5;
          margin-top: 3px;
        }

        .lp-success.is-dark {
          color: oklch(96% 0.01 168);
        }

        .lp-success.is-dark span:last-child {
          color: oklch(71% 0.02 220);
        }

        .lp-problem,
        .lp-system,
        .lp-close {
          position: relative;
          z-index: 3;
        }

        .lp-problem {
          background: oklch(18% 0.02 236);
          color: oklch(96% 0.01 168);
          display: grid;
          gap: 46px;
          grid-template-columns: minmax(0, 0.85fr) minmax(320px, 1fr);
          padding: 86px max(28px, calc((100vw - 1240px) / 2)) 96px;
        }

        .lp-section-label {
          color: var(--lp-green);
          font-size: 13px;
          font-weight: 800;
          margin: 0 0 22px;
        }

        .lp-problem h2,
        .lp-system h2,
        .lp-close h2 {
          font-size: 4.5rem;
          font-weight: 800;
          letter-spacing: 0;
          line-height: 0.94;
          margin: 0;
          text-wrap: balance;
        }

        .lp-problem-copy {
          color: oklch(75% 0.021 220);
          font-size: 19px;
          line-height: 1.65;
          margin: 26px 0 0;
          max-width: 54ch;
        }

        .lp-failure-list {
          align-self: end;
          border-top: 1px solid var(--lp-dark-line);
          display: grid;
        }

        .lp-failure-row {
          align-items: center;
          border-bottom: 1px solid var(--lp-dark-line);
          display: grid;
          gap: 22px;
          grid-template-columns: 72px 1fr;
          min-height: 78px;
        }

        .lp-failure-row span:first-child {
          color: var(--lp-amber);
          font-size: 28px;
          font-weight: 800;
        }

        .lp-failure-row span:last-child {
          color: oklch(91% 0.013 168);
          font-size: 20px;
          font-weight: 800;
          line-height: 1.25;
        }

        .lp-system {
          background: var(--lp-paper);
          display: grid;
          gap: 64px;
          grid-template-columns: minmax(280px, 0.78fr) minmax(0, 1fr);
          padding: 102px max(28px, calc((100vw - 1240px) / 2)) 112px;
        }

        .lp-system .lp-section-label {
          color: var(--lp-coral);
        }

        .lp-system-intro p {
          color: var(--lp-ink-soft);
          font-size: 19px;
          line-height: 1.65;
          margin: 26px 0 0;
          max-width: 38ch;
        }

        .lp-system-list {
          border-top: 1px solid var(--lp-line);
          display: grid;
        }

        .lp-system-row {
          border-bottom: 1px solid var(--lp-line);
          display: grid;
          gap: 26px;
          grid-template-columns: 140px 1fr;
          padding: 28px 0 30px;
        }

        .lp-system-row span {
          color: var(--lp-line-strong);
          font-size: 13px;
          font-weight: 800;
        }

        .lp-system-row h3 {
          color: var(--lp-ink);
          font-size: 26px;
          font-weight: 800;
          line-height: 1.08;
          margin: 0 0 10px;
          text-wrap: balance;
        }

        .lp-system-row p {
          color: var(--lp-muted);
          font-size: 16px;
          line-height: 1.6;
          margin: 0;
          max-width: 56ch;
        }

        .lp-close {
          background:
            linear-gradient(90deg, oklch(27% 0.025 236) 1px, transparent 1px),
            linear-gradient(0deg, oklch(27% 0.025 236) 1px, transparent 1px),
            var(--lp-dark);
          background-size: 48px 48px;
          color: oklch(96% 0.01 168);
          display: grid;
          gap: 42px;
          grid-template-columns: minmax(0, 0.95fr) minmax(320px, 0.68fr);
          overflow: hidden;
          padding: 96px max(28px, calc((100vw - 1240px) / 2));
        }

        .lp-close h2 {
          max-width: 10ch;
        }

        .lp-close p {
          color: oklch(73% 0.019 220);
          font-size: 19px;
          line-height: 1.65;
          margin: 28px 0 0;
          max-width: 46ch;
        }

        .lp-close .lp-label {
          color: oklch(73% 0.019 220);
        }

        .lp-form.is-dark .lp-input {
          background: oklch(23% 0.024 236);
          border-color: oklch(36% 0.033 236);
          color: oklch(96% 0.01 168);
        }

        .lp-form.is-dark .lp-input::placeholder {
          color: oklch(58% 0.018 220);
        }

        .lp-form.is-dark .lp-submit {
          background: var(--lp-green);
          color: var(--lp-dark);
        }

        .lp-form.is-dark .lp-submit:hover:not(:disabled) {
          background: oklch(72% 0.148 164);
        }

        .lp-form.is-dark .lp-error {
          color: oklch(76% 0.145 28);
        }

        .lp-footer {
          align-items: center;
          background: var(--lp-dark);
          border-top: 1px solid var(--lp-dark-line);
          color: oklch(57% 0.018 220);
          display: flex;
          flex-wrap: wrap;
          font-size: 13px;
          font-weight: 700;
          gap: 12px;
          justify-content: space-between;
          padding: 24px max(28px, calc((100vw - 1240px) / 2));
        }

        .lp-footer a {
          color: inherit;
          text-decoration: none;
        }

        .lp-footer a:hover {
          color: oklch(85% 0.018 168);
        }

        .lp-reveal {
          opacity: 0;
          transform: translateY(20px);
          transition:
            opacity 680ms cubic-bezier(0.16, 1, 0.3, 1),
            transform 680ms cubic-bezier(0.16, 1, 0.3, 1);
        }

        .lp-reveal.is-visible {
          opacity: 1;
          transform: translateY(0);
        }

        @media (max-width: 980px) {
          .lp-nav {
            padding: 0 18px;
          }

          .lp-status-chip {
            display: none;
          }

          .lp-hero {
            min-height: auto;
            padding: 104px 20px 44px;
          }

          .lp-hero::before {
            background:
              radial-gradient(ellipse at 50% 24%, var(--lp-paper) 0 32%, oklch(96.8% 0.014 168 / 0.86) 50%, transparent 78%),
              linear-gradient(180deg, var(--lp-paper) 0 18%, transparent 76%);
          }

          .lp-hero-inner {
            display: flex;
            justify-content: center;
            min-height: 760px;
          }

          .lp-hero-copy {
            margin: 0 auto;
            max-width: 650px;
          }

          .lp-title {
            font-size: 4.2rem;
          }

          .lp-hero-text {
            font-size: 18px;
          }

          .lp-map-stage {
            bottom: -118px;
            left: -220px;
            min-width: 760px;
            right: -220px;
            top: 18px;
            width: auto;
          }

          .lp-map-prompt {
            left: 128px;
            width: 360px;
          }

          .lp-problem,
          .lp-system,
          .lp-close {
            grid-template-columns: 1fr;
            padding-left: 24px;
            padding-right: 24px;
          }

          .lp-problem h2,
          .lp-system h2,
          .lp-close h2 {
            font-size: 3.35rem;
          }

          .lp-system-row {
            grid-template-columns: 112px 1fr;
          }
        }

        @media (max-width: 620px) {
          .lp-link {
            display: none;
          }

          .lp-nav-button {
            height: 32px;
            padding: 0 12px;
          }

          .lp-hero {
            padding-top: 92px;
          }

          .lp-hero-inner {
            min-height: 720px;
          }

          .lp-title {
            font-size: 2.3rem;
            line-height: 1;
            max-width: 10.5ch;
          }

          .lp-hero-text {
            font-size: 18px;
          }

          .lp-form-row {
            grid-template-columns: 1fr;
          }

          .lp-submit {
            width: 100%;
          }

          .lp-map-stage {
            bottom: -96px;
            left: -330px;
            opacity: 0.55;
            right: -330px;
            top: 18px;
            transform: none;
            transform-origin: top left;
          }

          .lp-map-prompt,
          .lp-map-legend {
            display: none;
          }

          .lp-problem,
          .lp-system,
          .lp-close {
            padding-bottom: 72px;
            padding-top: 72px;
          }

          .lp-problem h2,
          .lp-system h2,
          .lp-close h2 {
            font-size: 2.68rem;
          }

          .lp-problem-copy,
          .lp-system-intro p,
          .lp-close p {
            font-size: 17px;
          }

          .lp-failure-row {
            grid-template-columns: 52px 1fr;
          }

          .lp-failure-row span:first-child {
            font-size: 22px;
          }

          .lp-failure-row span:last-child {
            font-size: 17px;
          }

          .lp-system-row {
            gap: 8px;
            grid-template-columns: 1fr;
            padding: 24px 0 26px;
          }

          .lp-system-row h3 {
            font-size: 22px;
          }

          .lp-footer {
            align-items: flex-start;
            flex-direction: column;
          }
        }

        @media (prefers-reduced-motion: reduce) {
          .lp-map-edge,
          .lp-map-node,
          .lp-spinner,
          .lp-reveal {
            animation: none;
            opacity: 1;
            stroke-dashoffset: 0;
            transform: none;
            transition: none;
          }
        }
      `}</style>

      <main className="lp-root">
        <nav className="lp-nav" aria-label="Primary">
          <a className="lp-wordmark" href="/">
            Pathwise
          </a>
          <span className="lp-status-chip">Early access</span>
          <div className="lp-nav-actions">
            <a className="lp-link" href="/dashboard">
              Dashboard
            </a>
            <button className="lp-nav-button" onClick={focusWaitlist} type="button">
              Join
            </button>
          </div>
        </nav>

        <section className="lp-hero">
          <HeroGraphScene />
          <div className="lp-hero-inner">
            <div className="lp-hero-copy">
              <p className="lp-eyebrow">For learning anything without getting lost</p>
              <h1 className="lp-title">skillmaxxing, made easy.</h1>
              <p className="lp-hero-text">
                Tell Pathwise what you want to learn. It turns the goal into a
                prerequisite map, so the next concept is always obvious.
              </p>

              <WaitlistForm
                email={email}
                errorMsg={errorMsg}
                formId="hero-email"
                formRef={heroFormRef}
                status={status}
                onEmailChange={setEmail}
                onSubmit={handleSubmit}
              />

              <p className="lp-hero-proof">
                Built for learners with ambition, scattered tabs, and no patience
                for guessing the order of a subject.
              </p>
            </div>
          </div>
        </section>

        <section
          className={`lp-problem lp-reveal${problemReveal.visible ? " is-visible" : ""}`}
          ref={problemReveal.ref}
        >
          <div>
            <p className="lp-section-label">The real blocker</p>
            <h2>Most learning fails before lesson one.</h2>
            <p className="lp-problem-copy">
              The hard part is not motivation. It is order. People waste weeks
              collecting resources when what they needed was a map of dependencies.
            </p>
          </div>

          <div className="lp-failure-list">
            {FAILURE_MODES.map((item, index) => (
              <div className="lp-failure-row" key={item}>
                <span>{String(index + 1).padStart(2, "0")}</span>
                <span>{item}</span>
              </div>
            ))}
          </div>
        </section>

        <section
          className={`lp-system lp-reveal${systemReveal.visible ? " is-visible" : ""}`}
          ref={systemReveal.ref}
        >
          <div className="lp-system-intro">
            <p className="lp-section-label">What Pathwise gives you</p>
            <h2>A curriculum you can traverse.</h2>
            <p>
              Ask for the destination. Pathwise returns the structure underneath
              it, from foundational concepts to the goal node.
            </p>
          </div>

          <div className="lp-system-list">
            {SYSTEM_POINTS.map((point) => (
              <article className="lp-system-row" key={point.kicker}>
                <span>{point.kicker}</span>
                <div>
                  <h3>{point.title}</h3>
                  <p>{point.body}</p>
                </div>
              </article>
            ))}
          </div>
        </section>

        <section
          className={`lp-close lp-reveal${closeReveal.visible ? " is-visible" : ""}`}
          ref={closeReveal.ref}
        >
          <div>
            <p className="lp-section-label">Early access</p>
            <h2>Start with the map.</h2>
            <p>
              Access is limited while the product is in testing. Join the list
              and get a path when the next group opens.
            </p>
          </div>

          <WaitlistForm
            email={email}
            errorMsg={errorMsg}
            formId="close-email"
            status={status}
            tone="dark"
            onEmailChange={setEmail}
            onSubmit={handleSubmit}
          />
        </section>

        <footer className="lp-footer">
          <span>Pathwise</span>
          <a href="mailto:norinheng86@gmail.com">Contact</a>
        </footer>
      </main>
    </>
  );
}
