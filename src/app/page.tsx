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
  { id: "chemistry", x: 84, y: 166, label: "Chemistry", status: "done" },
  { id: "safety", x: 84, y: 286, label: "Safety basics", status: "current" },
  { id: "math", x: 84, y: 406, label: "Applied math", status: "done" },
  { id: "oxidizers", x: 234, y: 112, label: "Oxidizers", status: "done" },
  { id: "fuels", x: 234, y: 206, label: "Fuels" },
  { id: "binders", x: 234, y: 300, label: "Binders" },
  { id: "stoich", x: 234, y: 394, label: "Stoichiometry" },
  { id: "hazards", x: 234, y: 488, label: "Hazard classes" },
  { id: "particle", x: 390, y: 96, label: "Particle size" },
  { id: "mixing", x: 390, y: 178, label: "Mixing order" },
  { id: "color", x: 390, y: 260, label: "Color chemistry", status: "checkpoint" },
  { id: "thermal", x: 390, y: 342, label: "Thermal output" },
  { id: "stability", x: 390, y: 424, label: "Stability tests" },
  { id: "records", x: 390, y: 506, label: "Lab records" },
  { id: "grain", x: 548, y: 108, label: "Grain geometry" },
  { id: "burn", x: 548, y: 196, label: "Burn rate", status: "checkpoint" },
  { id: "effect", x: 548, y: 284, label: "Effect design" },
  { id: "containment", x: 548, y: 372, label: "Containment" },
  { id: "diagnostics", x: 548, y: 460, label: "Diagnostics" },
  { id: "stars", x: 706, y: 92, label: "Stars" },
  { id: "fountains", x: 706, y: 164, label: "Fountains" },
  { id: "rockets", x: 706, y: 236, label: "Rockets" },
  { id: "timing", x: 706, y: 308, label: "Timing systems" },
  { id: "failure", x: 706, y: 380, label: "Failure modes" },
  { id: "field", x: 706, y: 452, label: "Field testing" },
  { id: "display", x: 858, y: 158, label: "Display design" },
  { id: "compliance", x: 858, y: 262, label: "Compliance" },
  { id: "iteration", x: 858, y: 366, label: "Iteration loop" },
  { id: "launch", x: 858, y: 470, label: "Capstone", status: "goal" },
];

const MAP_EDGES = [
  ["chemistry", "oxidizers"],
  ["chemistry", "fuels"],
  ["safety", "hazards"],
  ["math", "stoich"],
  ["oxidizers", "particle"],
  ["fuels", "mixing"],
  ["fuels", "color"],
  ["binders", "mixing"],
  ["stoich", "thermal"],
  ["hazards", "stability"],
  ["hazards", "records"],
  ["particle", "grain"],
  ["mixing", "burn"],
  ["color", "effect"],
  ["thermal", "effect"],
  ["stability", "containment"],
  ["records", "diagnostics"],
  ["grain", "stars"],
  ["burn", "fountains"],
  ["burn", "rockets"],
  ["effect", "stars"],
  ["effect", "fountains"],
  ["containment", "timing"],
  ["diagnostics", "failure"],
  ["diagnostics", "field"],
  ["stars", "display"],
  ["fountains", "display"],
  ["rockets", "display"],
  ["timing", "compliance"],
  ["failure", "iteration"],
  ["field", "iteration"],
  ["display", "launch"],
  ["compliance", "launch"],
  ["iteration", "launch"],
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

const EMAIL_PROMPTS = [
  "tungtungtungsahur@gmail.com",
  "sonion@imcrine.com",
  "teatowel@coldwater.com",
  "saywallahi@bro.com",
  "kingnasir@dance.com",
  "asufratleader@truechad.com",
  "marlon@gotmogged.com",
  "myxpbarislow@mommy.com",
  "matchadrinker@clairo.com",
  "jerrylxadeeth@mpreg.com",
];

function getNextEmailPromptIndex(currentIndex: number) {
  if (EMAIL_PROMPTS.length < 2) return currentIndex;

  let nextIndex = currentIndex;
  while (nextIndex === currentIndex) {
    nextIndex = Math.floor(Math.random() * EMAIL_PROMPTS.length);
  }

  return nextIndex;
}

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

function useTypedEmailPrompt(enabled: boolean) {
  const [prompt, setPrompt] = useState(EMAIL_PROMPTS[0]);

  useEffect(() => {
    if (!enabled) {
      setPrompt("you@email.com");
      return;
    }

    const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
    if (reduceMotion.matches) {
      setPrompt(EMAIL_PROMPTS[0]);
      return;
    }

    let frame = window.setTimeout(() => undefined, 0);
    let emailIndex = 0;
    let charIndex = 0;
    let deleting = false;

    function tick() {
      const email = EMAIL_PROMPTS[emailIndex];
      const nextPrompt = email.slice(0, charIndex);
      setPrompt(nextPrompt || " ");

      if (!deleting && charIndex < email.length) {
        charIndex += 1;
        frame = window.setTimeout(tick, 48 + Math.random() * 42);
        return;
      }

      if (!deleting) {
        deleting = true;
        frame = window.setTimeout(tick, 1150);
        return;
      }

      if (charIndex > 0) {
        charIndex -= 1;
        frame = window.setTimeout(tick, 24 + Math.random() * 24);
        return;
      }

      deleting = false;
      emailIndex = getNextEmailPromptIndex(emailIndex);
      frame = window.setTimeout(tick, 260);
    }

    tick();

    return () => window.clearTimeout(frame);
  }, [enabled]);

  return prompt;
}

function useHeroScrollMotion() {
  const ref = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const target = el;

    const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
    let frame = 0;

    function setMotionVars({
      opacity,
      scale,
      tilt,
      x,
      y,
    }: {
      opacity: number;
      scale: number;
      tilt: number;
      x: number;
      y: number;
    }) {
      target.style.setProperty("--lp-scroll-x", `${x}px`);
      target.style.setProperty("--lp-scroll-y", `${y}px`);
      target.style.setProperty("--lp-scroll-tilt", `${tilt}deg`);
      target.style.setProperty("--lp-scroll-scale", `${scale}`);
      target.style.setProperty("--lp-scroll-opacity", `${opacity}`);
    }

    function update() {
      frame = 0;

      if (reduceMotion.matches) {
        setMotionVars({ opacity: 0.82, scale: 1.04, tilt: 0, x: 0, y: 0 });
        return;
      }

      const viewportHeight = Math.max(window.innerHeight, 1);
      const progress = Math.min(window.scrollY / viewportHeight, 1.35);

      setMotionVars({
        opacity: 0.82 - 0.24 * progress,
        scale: 1.04 + 0.04 * progress,
        tilt: 1.9 * progress,
        x: -46 * progress,
        y: 84 * progress,
      });
    }

    function requestUpdate() {
      if (frame) return;
      frame = window.requestAnimationFrame(update);
    }

    update();
    window.addEventListener("scroll", requestUpdate, { passive: true });
    window.addEventListener("resize", requestUpdate);
    reduceMotion.addEventListener("change", requestUpdate);

    return () => {
      if (frame) window.cancelAnimationFrame(frame);
      window.removeEventListener("scroll", requestUpdate);
      window.removeEventListener("resize", requestUpdate);
      reduceMotion.removeEventListener("change", requestUpdate);
    };
  }, []);

  return ref;
}

function splitLabel(label: string) {
  const words = label.split(" ");
  if (words.length === 1) return [label];
  return [words[0], words.slice(1).join(" ")];
}

function HeroGraphScene() {
  const motionRef = useHeroScrollMotion();

  return (
    <div className="lp-map-stage" ref={motionRef} aria-hidden="true">
      <div className="lp-product-shell">
        <div className="lp-product-topbar">
          <div className="lp-product-brand">
            <span />
            <strong>Pathwise</strong>
          </div>
          <div className="lp-product-topic">Pyrotechnics Engineering</div>
          <div className="lp-product-progress">
            <strong>9</strong> of 29 complete
            <span />
          </div>
        </div>

        <svg
          className="lp-map-svg"
          preserveAspectRatio="xMidYMid slice"
          viewBox="0 0 960 620"
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

          <g className="lp-map-world">
            <g className="lp-map-zones">
              <rect className="zone-a" x="18" y="70" width="176" height="486" rx="8" />
              <rect className="zone-b" x="206" y="70" width="166" height="486" rx="8" />
              <rect className="zone-c" x="384" y="70" width="176" height="486" rx="8" />
              <rect className="zone-d" x="572" y="70" width="168" height="486" rx="8" />
              <rect className="zone-e" x="752" y="70" width="186" height="486" rx="8" />
              <text x="38" y="102">01 Foundations</text>
              <text x="226" y="102">02 Materials</text>
              <text x="404" y="102">03 Formulation</text>
              <text x="592" y="102">04 Effects</text>
              <text x="772" y="102">05 Execution</text>
            </g>

            <g className="lp-map-edges">
              {MAP_EDGES.map(([from, to], index) => {
                const a = MAP_NODE_BY_ID.get(from);
                const b = MAP_NODE_BY_ID.get(to);
                if (!a || !b) return null;

                const c1x = a.x + (b.x - a.x) * 0.58;
                const c2x = a.x + (b.x - a.x) * 0.42;
                const path = `M ${a.x + 54} ${a.y} C ${c1x} ${a.y}, ${c2x} ${b.y}, ${b.x - 54} ${b.y}`;
                return (
                  <path
                    key={`${from}-${to}`}
                    className="lp-map-edge"
                    d={path}
                    markerEnd="url(#lp-arrow)"
                    style={{ animationDelay: `${index * 34}ms` }}
                  />
                );
              })}
            </g>

            <g className="lp-map-traces">
              {MAP_EDGES.slice(0, 18).map(([from, to], index) => {
                const a = MAP_NODE_BY_ID.get(from);
                const b = MAP_NODE_BY_ID.get(to);
                if (!a || !b) return null;

                const c1x = a.x + (b.x - a.x) * 0.58;
                const c2x = a.x + (b.x - a.x) * 0.42;
                return (
                  <path
                    key={`trace-${from}-${to}`}
                    className="lp-map-trace"
                    d={`M ${a.x + 54} ${a.y} C ${c1x} ${a.y}, ${c2x} ${b.y}, ${b.x - 54} ${b.y}`}
                    style={{ animationDelay: `${index * 420}ms` }}
                  />
                );
              })}
            </g>

            <g className="lp-map-nodes">
              {MAP_NODES.map((node, index) => (
                <g
                  key={node.id}
                  className={`lp-map-node is-${node.status ?? "default"}`}
                  style={{ animationDelay: `${180 + index * 28}ms` }}
                >
                  <rect x={node.x - 54} y={node.y - 25} width="108" height="50" rx="7" />
                  <circle cx={node.x - 39} cy={node.y - 10} r="3" />
                  <text x={node.x} y={node.y + 7}>
                    {splitLabel(node.label).map((line, lineIndex) => (
                      <tspan key={line} x={node.x} dy={lineIndex === 0 ? 0 : 13}>
                        {line}
                      </tspan>
                    ))}
                  </text>
                </g>
              ))}
            </g>
          </g>
        </svg>

        <div className="lp-map-legend">
          <span>29 nodes</span>
          <span>5 chapters</span>
          <span>Next: Burn rate</span>
        </div>
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
  const typedPrompt = useTypedEmailPrompt(!email && !isLoading);

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
          placeholder={typedPrompt}
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
          animation: lp-hero-rise 620ms cubic-bezier(0.16, 1, 0.3, 1) both;
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
          transition:
            background-color 180ms cubic-bezier(0.16, 1, 0.3, 1),
            transform 180ms cubic-bezier(0.16, 1, 0.3, 1);
        }

        .lp-link:hover {
          color: var(--lp-ink);
        }

        .lp-nav-button:hover {
          background: oklch(22% 0.024 238);
          transform: translateY(-1px);
        }

        .lp-nav-button:active {
          transform: translateY(0) scale(0.98);
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
          animation: lp-hero-rise 680ms cubic-bezier(0.16, 1, 0.3, 1) 120ms both;
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
          animation: lp-hero-rise 760ms cubic-bezier(0.16, 1, 0.3, 1) 220ms both;
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
          animation: lp-hero-rise 720ms cubic-bezier(0.16, 1, 0.3, 1) 340ms both;
          color: var(--lp-ink-soft);
          font-size: 19px;
          font-weight: 400;
          line-height: 1.55;
          margin: 0 auto 30px;
          max-width: 48ch;
          text-wrap: pretty;
        }

        .lp-hero-proof {
          animation: lp-hero-rise 700ms cubic-bezier(0.16, 1, 0.3, 1) 520ms both;
          border-top: 1px solid var(--lp-line);
          color: var(--lp-muted);
          font-size: 14px;
          line-height: 1.55;
          margin: 30px auto 0;
          max-width: 52ch;
          padding-top: 18px;
        }

        .lp-map-stage {
          animation: lp-graph-arrive 940ms cubic-bezier(0.16, 1, 0.3, 1) 80ms both;
          bottom: -124px;
          contain: paint;
          left: -150px;
          min-width: 0;
          opacity: var(--lp-scroll-opacity, 0.82);
          position: absolute;
          right: -150px;
          top: 16px;
          transform: translate3d(var(--lp-scroll-x, 0px), var(--lp-scroll-y, 0px), 0);
          transform-origin: center;
          will-change: transform, opacity;
          z-index: 0;
        }

        .lp-product-shell {
          background:
            linear-gradient(90deg, oklch(82% 0.035 184 / 0.36) 1px, transparent 1px),
            linear-gradient(0deg, oklch(82% 0.035 184 / 0.28) 1px, transparent 1px),
            oklch(98.1% 0.015 168 / 0.88);
          background-size: 36px 36px;
          border: 1px solid var(--lp-line);
          border-radius: 10px;
          box-shadow: 0 34px 92px oklch(28% 0.035 185 / 0.16);
          height: 100%;
          overflow: hidden;
          position: relative;
          transform:
            rotate(calc(-1.6deg + var(--lp-scroll-tilt, 0deg)))
            scale(var(--lp-scroll-scale, 1.04));
          transform-origin: center;
          will-change: transform;
        }

        .lp-product-shell::after {
          background:
            radial-gradient(ellipse at 50% 28%, transparent 0 26%, oklch(96.8% 0.014 168 / 0.44) 56%, oklch(96.8% 0.014 168 / 0.8) 100%),
            linear-gradient(180deg, transparent 0 52%, oklch(96.8% 0.014 168 / 0.72) 100%);
          content: "";
          inset: 0;
          pointer-events: none;
          position: absolute;
          z-index: 4;
        }

        .lp-product-topbar {
          align-items: center;
          background: oklch(98.8% 0.009 168 / 0.96);
          border-bottom: 1px solid var(--lp-line);
          display: flex;
          gap: 22px;
          height: 48px;
          left: 0;
          padding: 0 18px;
          position: absolute;
          right: 0;
          top: 0;
          z-index: 3;
        }

        .lp-product-brand,
        .lp-product-progress {
          align-items: center;
          display: flex;
        }

        .lp-product-brand {
          color: var(--lp-ink);
          font-size: 14px;
          font-weight: 800;
          gap: 10px;
        }

        .lp-product-brand span {
          background: var(--lp-ink);
          border-radius: 5px;
          height: 20px;
          width: 20px;
        }

        .lp-product-topic {
          border-left: 1px solid var(--lp-line);
          color: var(--lp-ink-soft);
          font-size: 13px;
          font-weight: 700;
          padding-left: 22px;
        }

        .lp-product-progress {
          color: var(--lp-muted);
          font-size: 12px;
          font-weight: 700;
          gap: 5px;
          margin-left: auto;
        }

        .lp-product-progress strong {
          color: var(--lp-ink);
          font-weight: 800;
        }

        .lp-product-progress span {
          animation: lp-progress-scan 3.6s cubic-bezier(0.16, 1, 0.3, 1) infinite;
          background: linear-gradient(90deg, var(--lp-line-strong) 0 60%, var(--lp-line) 60% 100%);
          background-size: 180% 100%;
          border-radius: 999px;
          height: 4px;
          margin-left: 8px;
          width: 90px;
        }

        .lp-map-svg {
          height: 100%;
          min-height: 0;
          overflow: visible;
          width: 100%;
        }

        .lp-map-world {
          animation: lp-map-drift 14s cubic-bezier(0.16, 1, 0.3, 1) infinite alternate;
          transform-box: fill-box;
          transform-origin: center;
          will-change: transform;
        }

        .lp-map-zones rect {
          fill: oklch(94% 0.021 168 / 0.46);
          stroke: var(--lp-line);
          stroke-width: 1;
        }

        .lp-map-zones .zone-b {
          fill: oklch(95% 0.025 212 / 0.46);
        }

        .lp-map-zones .zone-c {
          fill: oklch(95% 0.031 76 / 0.36);
        }

        .lp-map-zones .zone-d {
          fill: oklch(95% 0.029 288 / 0.38);
        }

        .lp-map-zones .zone-e {
          fill: oklch(94% 0.028 164 / 0.42);
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
          stroke-width: 1.4;
        }

        .lp-map-trace {
          animation: lp-trace 4.8s cubic-bezier(0.16, 1, 0.3, 1) infinite;
          fill: none;
          opacity: 0;
          stroke: var(--lp-blue);
          stroke-dasharray: 26 470;
          stroke-linecap: round;
          stroke-width: 2.6;
        }

        .lp-map-node {
          animation: lp-node-in 560ms cubic-bezier(0.16, 1, 0.3, 1) both;
          transform-box: fill-box;
          transform-origin: center;
        }

        .lp-map-node rect {
          animation: lp-node-light 6.8s cubic-bezier(0.16, 1, 0.3, 1) infinite alternate;
          fill: var(--lp-panel);
          stroke: var(--lp-line);
          stroke-width: 1.3;
          filter: drop-shadow(0 5px 10px oklch(32% 0.04 185 / 0.08));
        }

        .lp-map-node circle {
          fill: var(--lp-muted);
        }

        .lp-map-node text {
          fill: var(--lp-ink-soft);
          font-size: 11px;
          font-weight: 800;
          text-anchor: middle;
        }

        .lp-map-node.is-done rect {
          fill: oklch(94% 0.052 150);
          stroke: oklch(66% 0.14 150);
        }

        .lp-map-node.is-done circle {
          fill: oklch(49% 0.122 150);
        }

        .lp-map-node.is-current rect {
          fill: oklch(90% 0.071 164);
          stroke: var(--lp-green);
        }

        .lp-map-node.is-current {
          animation:
            lp-node-in 560ms cubic-bezier(0.16, 1, 0.3, 1) both,
            lp-current-pulse 3.8s cubic-bezier(0.16, 1, 0.3, 1) 1.2s infinite;
        }

        .lp-map-node.is-current circle {
          fill: var(--lp-green);
        }

        .lp-map-node.is-checkpoint rect {
          fill: oklch(94% 0.053 76);
          stroke: var(--lp-amber);
        }

        .lp-map-node.is-checkpoint circle {
          fill: var(--lp-amber);
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
          bottom: 64px;
          box-shadow: 0 18px 50px oklch(32% 0.04 185 / 0.13);
          color: oklch(97.8% 0.012 168);
          display: grid;
          gap: 1px;
          overflow: hidden;
          position: absolute;
          right: 86px;
          width: 188px;
          z-index: 5;
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

        @keyframes lp-hero-rise {
          from {
            opacity: 0;
            transform: translate3d(0, 18px, 0);
          }
          to {
            opacity: 1;
            transform: translate3d(0, 0, 0);
          }
        }

        @keyframes lp-graph-arrive {
          from {
            opacity: 0;
            transform: translate3d(0, 22px, 0) scale(0.985);
          }
          to {
            opacity: var(--lp-scroll-opacity, 0.82);
            transform: translate3d(var(--lp-scroll-x, 0px), var(--lp-scroll-y, 0px), 0);
          }
        }

        @keyframes lp-map-drift {
          from {
            transform: translate3d(-18px, 6px, 0) scale(1.012);
          }
          to {
            transform: translate3d(22px, -12px, 0) scale(1.035);
          }
        }

        @keyframes lp-trace {
          0% {
            opacity: 0;
            stroke-dashoffset: 520;
          }
          16% {
            opacity: 0.72;
          }
          72% {
            opacity: 0.72;
          }
          100% {
            opacity: 0;
            stroke-dashoffset: 0;
          }
        }

        @keyframes lp-current-pulse {
          0%,
          100% {
            filter: drop-shadow(0 0 0 oklch(67% 0.145 164 / 0));
          }
          45% {
            filter: drop-shadow(0 0 16px oklch(67% 0.145 164 / 0.35));
          }
        }

        @keyframes lp-node-light {
          from {
            filter: drop-shadow(0 5px 10px oklch(32% 0.04 185 / 0.06));
          }
          to {
            filter: drop-shadow(0 8px 14px oklch(32% 0.04 185 / 0.12));
          }
        }

        @keyframes lp-progress-scan {
          from {
            background-position: 100% 0;
          }
          to {
            background-position: 0 0;
          }
        }

        .lp-form {
          animation: lp-hero-rise 700ms cubic-bezier(0.16, 1, 0.3, 1) 440ms both;
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
          transition:
            border-color 170ms cubic-bezier(0.16, 1, 0.3, 1),
            box-shadow 170ms cubic-bezier(0.16, 1, 0.3, 1),
            transform 170ms cubic-bezier(0.16, 1, 0.3, 1);
          width: 100%;
        }

        .lp-input::placeholder {
          color: oklch(64% 0.018 212);
        }

        .lp-input:focus {
          border-color: var(--lp-line-strong);
          box-shadow: 0 0 0 3px oklch(67% 0.145 164 / 0.18);
          transform: translateY(-1px);
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
          transition:
            background-color 180ms cubic-bezier(0.16, 1, 0.3, 1),
            box-shadow 180ms cubic-bezier(0.16, 1, 0.3, 1),
            transform 180ms cubic-bezier(0.16, 1, 0.3, 1),
            opacity 180ms cubic-bezier(0.16, 1, 0.3, 1);
          white-space: nowrap;
        }

        .lp-submit:hover:not(:disabled) {
          background: oklch(22% 0.024 238);
          box-shadow: 0 10px 22px oklch(20% 0.02 238 / 0.14);
          transform: translateY(-1px);
        }

        .lp-submit:active:not(:disabled) {
          transform: translateY(0) scale(0.985);
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
            left: -240px;
            min-width: 760px;
            right: -240px;
            top: 18px;
            width: auto;
          }

          .lp-product-shell {
            transform:
              rotate(calc(-1.2deg + var(--lp-scroll-tilt, 0deg)))
              scale(var(--lp-scroll-scale, 1.02));
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
            opacity: calc(var(--lp-scroll-opacity, 0.82) * 0.68);
            right: -330px;
            top: 18px;
            transform-origin: top left;
          }

          .lp-product-topic,
          .lp-product-progress,
          .lp-map-legend {
            display: none;
          }

          .lp-product-topbar {
            height: 42px;
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
          .lp-nav,
          .lp-eyebrow,
          .lp-title,
          .lp-hero-text,
          .lp-hero-proof,
          .lp-form,
          .lp-map-stage,
          .lp-map-edge,
          .lp-map-trace,
          .lp-map-world,
          .lp-map-node,
          .lp-map-node.is-current,
          .lp-map-node rect,
          .lp-product-progress span,
          .lp-product-shell,
          .lp-spinner,
          .lp-reveal {
            animation: none;
            opacity: 1;
            stroke-dashoffset: 0;
            transform: none;
            transition: none;
          }

          .lp-map-stage {
            opacity: 0.82;
            transform: none;
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
