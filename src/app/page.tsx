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


const FAILURE_MODES = [
  "Enter a goal",
  "Understand the pathway",
  "Start learning",
  "Rinse and repeat",
];

const EMAIL_PROMPTS = [
  "tungtungtungsahur@gmail.com",
  "sonion@imcrine.com",
  "saywallahi@bro.com",
  "kingnasir@dance.com",
  "asufratleader@truechad.com",
  "marlon@gotmogged.com",
  "myxpbarislow@mommy.com",
  "matchadrinker@clairo.com",
  "jerrylxadeeth@mpreg.com",
];

const HERO_GOALS = [
  "become a machine learning engineer",
  "master pyrotechnics engineering",
  "understand nuclear physics",
  "build autonomous robots",
  "design quantum algorithms",
  "model climate systems",
  "engineer fusion reactors",
  "study computational neuroscience",
  "develop aerospace control systems",
  "build satellite communication systems",
  "design biomedical devices",
  "map the human genome",
  "create computer vision models",
  "engineer sustainable batteries",
  "build secure distributed systems",
  "design prosthetic limbs",
  "simulate fluid dynamics",
  "understand particle physics",
  "develop reinforcement learning agents",
  "build embedded systems",
  "study cryptographic protocols",
  "engineer lab automation",
  "model infectious disease spread",
  "design solar energy systems",
  "build neural interfaces",
  "master statistical mechanics",
  "create robotics perception stacks",
  "study materials science",
  "engineer rocket propulsion",
  "build database engines",
  "design medical imaging systems",
  "understand astrodynamics",
  "develop natural language models",
  "build high-performance compilers",
  "study molecular biology",
  "engineer desalination systems",
  "design chip architectures",
  "model financial risk systems",
  "build cybersecurity tooling",
  "study geospatial analytics",
  "engineer autonomous drones",
  "design control theory systems",
  "understand plasma physics",
  "build bioinformatics pipelines",
  "create generative AI systems",
  "study ocean engineering",
  "engineer precision agriculture",
  "design data center infrastructure",
  "build augmented reality systems",
  "master synthetic biology",
];

function getNextPromptIndex(currentIndex: number, total: number) {
  if (total < 2) return currentIndex;

  let nextIndex = currentIndex;
  while (nextIndex === currentIndex) {
    nextIndex = Math.floor(Math.random() * total);
  }

  return nextIndex;
}

function getRandomPromptIndex(total: number) {
  return Math.floor(Math.random() * total);
}

function getNextEmailPromptIndex(currentIndex: number) {
  return getNextPromptIndex(currentIndex, EMAIL_PROMPTS.length);
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

function useProblemScrollReveal(): RevealResult {
  const ref = useRef<HTMLElement | null>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const target = el;
    const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
    let frame = 0;

    function clamp(value: number) {
      return Math.min(Math.max(value, 0), 1);
    }

    function easeOutQuint(value: number) {
      return 1 - Math.pow(1 - value, 5);
    }

    function setProgressVars(progress: number) {
      const eased = easeOutQuint(progress);
      const rowProgress = [0.08, 0.28, 0.48, 0.68].map((start) =>
        easeOutQuint(clamp((progress - start) / 0.32)),
      );
      const labelProgress = easeOutQuint(clamp(progress / 0.38));
      const titleProgress = easeOutQuint(clamp((progress - 0.2) / 0.56));
      const titleLineProgress = [0.2, 0.34, 0.48].map((start) =>
        easeOutQuint(clamp((progress - start) / 0.38)),
      );
      const copyProgress = easeOutQuint(clamp((progress - 0.58) / 0.38));

      target.style.setProperty("--lp-problem-field-opacity", `${eased * 0.28}`);
      target.style.setProperty("--lp-problem-field-y", `${(1 - eased) * 44}px`);
      target.style.setProperty("--lp-problem-label-opacity", `${0.42 + labelProgress * 0.58}`);
      target.style.setProperty("--lp-problem-label-x", `${(1 - labelProgress) * 18}px`);
      target.style.setProperty("--lp-problem-title-y", `${(1 - titleProgress) * 14}px`);
      target.style.setProperty("--lp-problem-copy-opacity", `${copyProgress}`);
      target.style.setProperty("--lp-problem-copy-y", `${(1 - copyProgress) * 18}px`);
      target.style.setProperty("--lp-problem-scan-opacity", `${0.1 + eased * 0.26}`);
      target.style.setProperty("--lp-problem-scan-x", `${-18 + eased * 30}%`);
      target.style.setProperty("--lp-problem-scan-y", `${8 - eased * 14}%`);

      rowProgress.forEach((row, index) => {
        const number = index + 1;
        target.style.setProperty(`--lp-row-${number}-opacity`, `${row}`);
        target.style.setProperty(`--lp-row-${number}-x`, `${(1 - row) * -42}px`);
        target.style.setProperty(`--lp-row-${number}-scale`, `${0.94 + row * 0.06}`);
        target.style.setProperty(`--lp-row-${number}-number-y`, `${(1 - row) * 16}px`);
      });

      titleLineProgress.forEach((line, index) => {
        const number = index + 1;
        const offsets = [42, -32, 28];
        const skews = [0.7, -0.55, 0.45];
        target.style.setProperty(`--lp-title-line-${number}-opacity`, `${0.3 + line * 0.7}`);
        target.style.setProperty(`--lp-title-line-${number}-x`, `${(1 - line) * offsets[index]}px`);
        target.style.setProperty(`--lp-title-line-${number}-y`, `${(1 - line) * 8}px`);
        target.style.setProperty(`--lp-title-line-${number}-skew`, `${(1 - line) * skews[index]}deg`);
      });
    }

    function update() {
      frame = 0;

      if (reduceMotion.matches) {
        setProgressVars(1);
        setVisible(true);
        return;
      }

      const rect = target.getBoundingClientRect();
      const viewportHeight = Math.max(window.innerHeight, 1);
      const start = viewportHeight * 0.8;
      const end = viewportHeight * 0.18;
      const progress = clamp((start - rect.top) / (start - end));

      setProgressVars(progress);
      if (progress > 0) setVisible(true);
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

function useTypedHeroGoal(enabled: boolean) {
  const [goal, setGoal] = useState("");

  useEffect(() => {
    if (!enabled) {
      setGoal("");
      return;
    }

    const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
    if (reduceMotion.matches) {
      setGoal(HERO_GOALS[getRandomPromptIndex(HERO_GOALS.length)]);
      return;
    }

    let frame = window.setTimeout(() => undefined, 0);
    let goalIndex = getRandomPromptIndex(HERO_GOALS.length);
    let charIndex = 0;
    let deleting = false;

    function tick() {
      const text = HERO_GOALS[goalIndex];
      setGoal(text.slice(0, charIndex));

      if (!deleting && charIndex < text.length) {
        charIndex += 1;
        frame = window.setTimeout(tick, 38 + Math.random() * 28);
        return;
      }

      if (!deleting) {
        deleting = true;
        frame = window.setTimeout(tick, 1450);
        return;
      }

      if (charIndex > 0) {
        charIndex -= 1;
        frame = window.setTimeout(tick, 18 + Math.random() * 18);
        return;
      }

      deleting = false;
      goalIndex = getNextPromptIndex(goalIndex, HERO_GOALS.length);
      frame = window.setTimeout(tick, 240);
    }

    tick();

    return () => window.clearTimeout(frame);
  }, [enabled]);

  return goal;
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
  const problemReveal = useProblemScrollReveal();
  const closeReveal = useReveal();
  const [heroGoalActive, setHeroGoalActive] = useState(false);
  const heroGoal = useTypedHeroGoal(heroGoalActive);

  useEffect(() => {
    const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
    if (reduceMotion.matches) {
      setHeroGoalActive(true);
      return;
    }

    const frame = window.setTimeout(() => setHeroGoalActive(true), 1950);
    return () => window.clearTimeout(frame);
  }, []);

  useEffect(() => {
    function onMove(e: MouseEvent) {
      document.documentElement.style.setProperty("--lp-mx", `${e.clientX}px`);
      document.documentElement.style.setProperty("--lp-my", `${e.clientY}px`);
    }
    window.addEventListener("mousemove", onMove, { passive: true });
    return () => window.removeEventListener("mousemove", onMove);
  }, []);

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
          /* Brand hex tokens — matches pathwise Design System v1.0 */
          --lp-paper:      #E8F5EE;
          --lp-paper-deep: #D4E8DD;
          --lp-ink:        #0F1411;
          --lp-ink-soft:   #3D4A42;
          --lp-muted:      #5C7066;
          --lp-line:       #DCE8E0;
          --lp-line-strong:#94A89E;
          --lp-green:      #1F8755;
          --lp-amber:      oklch(78% 0.153 76);
          --lp-coral:      #C44536;
          --lp-blue:       oklch(61% 0.14 246);
          --lp-panel:      #FBFEFC;
          --lp-dark:       #0F1411;
          --lp-dark-line:  #1F2A23;
          --lp-mint:       #5EE2A8;
          position: relative;
          min-height: 100vh;
          overflow-x: clip;
          background:
            linear-gradient(rgba(15,20,17,0.04) 1px, transparent 1px),
            linear-gradient(90deg, rgba(15,20,17,0.04) 1px, transparent 1px),
            var(--lp-paper);
          background-size: 80px 80px;
          color: var(--lp-ink);
          color-scheme: light;
          font-family: var(--font-display), 'Bricolage Grotesque', ui-sans-serif, system-ui, sans-serif;
        }

        .lp-root::before {
          background: radial-gradient(
            circle 520px at var(--lp-mx, -9999px) var(--lp-my, -9999px),
            rgba(31,135,85,0.08) 0%,
            transparent 80%
          );
          content: "";
          inset: 0;
          pointer-events: none;
          position: fixed;
          z-index: 0;
        }

        .lp-nav {
          align-items: center;
          animation: lp-hero-rise 620ms cubic-bezier(0.16, 1, 0.3, 1) both;
          background: rgba(232,245,238,0.88);
          backdrop-filter: blur(14px);
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
          font-family: var(--font-display), 'Bricolage Grotesque', sans-serif;
          color: var(--lp-ink);
          font-size: 18px;
          font-weight: 800;
          letter-spacing: -0.02em;
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
          color: #E8F5EE;
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
          background: var(--lp-ink-soft);
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
            radial-gradient(ellipse at 50% 24%, rgba(232,245,238,0.82) 0 28%, rgba(232,245,238,0.54) 48%, transparent 76%),
            linear-gradient(180deg, rgba(232,245,238,0.76) 0 14%, transparent 68%);
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
          position: relative;
          isolation: isolate;
          text-align: center;
        }

        .lp-hero-copy::before {
          background:
            radial-gradient(ellipse at 50% 38%, rgba(232,245,238,0.68) 0 36%, rgba(232,245,238,0.44) 54%, transparent 76%);
          content: "";
          inset: -42px -74px -30px;
          pointer-events: none;
          position: absolute;
          z-index: -1;
        }

        .lp-eyebrow {
          align-items: center;
          animation: lp-eyebrow-track 820ms cubic-bezier(0.16, 1, 0.3, 1) 120ms both;
          color: var(--lp-ink-soft);
          display: inline-flex;
          font-size: 14px;
          font-weight: 800;
          gap: 10px;
          letter-spacing: 0;
          margin: 0 auto 26px;
        }

        .lp-eyebrow::before {
          animation: lp-eyebrow-mark 860ms cubic-bezier(0.16, 1, 0.3, 1) 260ms both;
          background: var(--lp-coral);
          content: "";
          height: 10px;
          transform-origin: left center;
          width: 10px;
        }

        .lp-title {
          color: var(--lp-ink);
          display: flex;
          flex-direction: column;
          font-size: 5.8rem;
          font-weight: 800;
          letter-spacing: 0;
          line-height: 0.94;
          margin: 0 auto 24px;
          max-width: 12ch;
          text-wrap: balance;
        }

        .lp-title span {
          display: block;
        }

        .lp-title span:first-child {
          animation: lp-title-left 1160ms cubic-bezier(0.16, 1, 0.3, 1) 620ms both;
        }

        .lp-title span:last-child {
          animation: lp-title-right 1160ms cubic-bezier(0.16, 1, 0.3, 1) 820ms both;
        }

        .lp-hero-text {
          animation: lp-hero-line-load 920ms cubic-bezier(0.16, 1, 0.3, 1) 1880ms both;
          color: var(--lp-ink-soft);
          font-size: 19px;
          font-weight: 400;
          line-height: 1.55;
          margin: 0 auto 30px;
          max-width: 48ch;
          text-wrap: pretty;
        }

        .lp-hero-goal {
          color: var(--lp-ink);
          display: inline-block;
          font-weight: 750;
          padding-bottom: 2px;
          position: relative;
          text-align: left;
          text-decoration: underline;
          text-decoration-color: var(--lp-green);
          text-decoration-thickness: 2px;
          text-underline-offset: 5px;
          white-space: nowrap;
        }

        .lp-hero-suffix {
          color: var(--lp-ink);
          display: inline-block;
          font-weight: 850;
          margin-left: 2px;
          padding: 0 2px;
        }

        .lp-hero-goal::after {
          animation: lp-caret-blink 920ms steps(1, end) infinite;
          background: var(--lp-coral);
          content: "";
          display: inline-block;
          height: 1em;
          margin-left: 3px;
          vertical-align: -0.14em;
          width: 2px;
        }

        .lp-hero-proof {
          animation: lp-hero-rise 820ms cubic-bezier(0.16, 1, 0.3, 1) 3950ms both;
          border-top: 1px solid var(--lp-line);
          color: var(--lp-muted);
          font-size: 14px;
          line-height: 1.55;
          margin: 30px auto 0;
          max-width: 52ch;
          padding-top: 18px;
        }

        .lp-hero-bg {
          inset: 0;
          overflow: hidden;
          pointer-events: none;
          position: absolute;
          z-index: 0;
        }

        .lp-hero-bg::before,
        .lp-hero-bg::after {
          border-radius: 50%;
          content: "";
          filter: blur(90px);
          position: absolute;
          will-change: transform;
        }

        .lp-hero-bg::before {
          animation: lp-blob-a 28s ease-in-out infinite alternate;
          background: rgba(94,226,168,0.18);
          height: 700px;
          left: 50%;
          top: -160px;
          transform: translateX(-50%);
          width: 1000px;
        }

        .lp-hero-bg::after {
          animation: lp-blob-b 34s ease-in-out 5s infinite alternate;
          background: rgba(31,135,85,0.10);
          height: 520px;
          right: -60px;
          top: 40px;
          width: 640px;
        }

        @keyframes lp-blob-a {
          from { transform: translateX(-50%) translate3d(-110px, 0px, 0) scale(0.94); }
          to   { transform: translateX(-50%) translate3d(110px, 70px, 0) scale(1.12); }
        }

        @keyframes lp-blob-b {
          from { transform: translate3d(0px, 0px, 0) scale(1); }
          to   { transform: translate3d(-90px, 90px, 0) scale(1.22); }
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

        @keyframes lp-eyebrow-track {
          0% {
            clip-path: inset(0 100% 0 0);
            opacity: 0;
            transform: translate3d(-22px, 0, 0);
          }

          100% {
            clip-path: inset(0 0 0 0);
            opacity: 1;
            transform: translate3d(0, 0, 0);
          }
        }

        @keyframes lp-eyebrow-mark {
          0% {
            transform: scaleX(0.16);
          }

          62% {
            transform: scaleX(2.4);
          }

          100% {
            transform: scaleX(1);
          }
        }

        @keyframes lp-title-left {
          0% {
            clip-path: inset(0 100% 0 0);
            opacity: 0;
            transform: translate3d(-54px, 10px, 0) scale(0.985);
          }

          72% {
            clip-path: inset(0 0 0 0);
            opacity: 1;
            transform: translate3d(4px, 0, 0) scale(1.004);
          }

          100% {
            clip-path: inset(0 0 0 0);
            opacity: 1;
            transform: translate3d(0, 0, 0) scale(1);
          }
        }

        @keyframes lp-title-right {
          0% {
            clip-path: inset(0 0 0 100%);
            opacity: 0;
            transform: translate3d(54px, 10px, 0) scale(0.985);
          }

          72% {
            clip-path: inset(0 0 0 0);
            opacity: 1;
            transform: translate3d(-4px, 0, 0) scale(1.004);
          }

          100% {
            clip-path: inset(0 0 0 0);
            opacity: 1;
            transform: translate3d(0, 0, 0) scale(1);
          }
        }

        @keyframes lp-hero-line-load {
          0% {
            clip-path: inset(0 100% 0 0);
            opacity: 0;
            transform: translate3d(-18px, 0, 0);
          }

          72% {
            clip-path: inset(0 0 0 0);
            opacity: 1;
            transform: translate3d(3px, 0, 0);
          }

          100% {
            clip-path: inset(0 0 0 0);
            opacity: 1;
            transform: translate3d(0, 0, 0);
          }
        }

        @keyframes lp-form-load {
          0% {
            clip-path: inset(0 0 0 100%);
            opacity: 0;
            transform: translate3d(34px, 0, 0) scale(0.99);
          }

          70% {
            clip-path: inset(0 0 0 0);
            opacity: 1;
            transform: translate3d(-3px, 0, 0) scale(1);
          }

          100% {
            clip-path: inset(0 0 0 0);
            opacity: 1;
            transform: translate3d(0, 0, 0) scale(1);
          }
        }

        @keyframes lp-caret-blink {
          0%,
          46% {
            opacity: 1;
          }

          47%,
          100% {
            opacity: 0;
          }
        }


        .lp-form {
          max-width: 560px;
        }

        .lp-hero-copy .lp-form {
          animation: lp-form-load 1060ms cubic-bezier(0.16, 1, 0.3, 1) 2920ms both;
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
          background: #FBFEFC;
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
          color: #94A89E;
        }

        .lp-input:focus {
          border-color: var(--lp-ink);
          box-shadow: 0 0 0 3px rgba(31,135,85,0.14);
          transform: translateY(-1px);
        }

        .lp-input:disabled {
          cursor: not-allowed;
          opacity: 0.62;
        }

        .lp-input[aria-invalid="true"] {
          border-color: var(--lp-coral);
          box-shadow: 0 0 0 3px rgba(196,69,54,0.14);
        }

        .lp-submit {
          align-items: center;
          background: var(--lp-ink);
          border: 0;
          border-radius: 8px;
          color: #E8F5EE;
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
          background: var(--lp-ink-soft);
          box-shadow: 0 10px 22px rgba(15,20,17,0.18);
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
          border: 2px solid rgba(232,245,238,0.35);
          border-radius: 50%;
          border-top-color: #E8F5EE;
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
          color: #EEF7F1;
        }

        .lp-success.is-dark span:last-child {
          color: #94A89E;
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
          gap: clamp(46px, 6vw, 94px);
          grid-template-columns: minmax(300px, 0.7fr) minmax(0, 1fr);
          isolation: isolate;
          margin-top: -88px;
          overflow: hidden;
          padding: 86px max(28px, calc((100vw - 1240px) / 2)) 96px;
        }

        .lp-problem::before {
          background:
            linear-gradient(90deg, transparent, rgba(31,135,85,0.18), transparent),
            linear-gradient(180deg, transparent, rgba(94,226,168,0.10), transparent);
          content: "";
          inset: -35% -15%;
          opacity: var(--lp-problem-scan-opacity, 0);
          pointer-events: none;
          position: absolute;
          transform: translate3d(var(--lp-problem-scan-x, -18%), var(--lp-problem-scan-y, 8%), 0) rotate(-8deg);
          z-index: 0;
        }

        .lp-problem::after {
          background:
            linear-gradient(90deg, transparent 0 28%, rgba(31,135,85,0.18) 48%, transparent 68%),
            repeating-linear-gradient(90deg, transparent 0 76px, rgba(31,42,35,0.72) 77px, transparent 78px);
          content: "";
          inset: 0;
          opacity: var(--lp-problem-field-opacity, 0);
          pointer-events: none;
          position: absolute;
          transform: translate3d(0, var(--lp-problem-field-y, 44px), 0);
          z-index: 0;
        }

        .lp-problem.is-visible::before {
          animation: lp-problem-scan-flow 8.5s cubic-bezier(0.16, 1, 0.3, 1) infinite alternate;
        }

        .lp-problem.is-visible::after {
          animation: lp-problem-field-flow 12s cubic-bezier(0.16, 1, 0.3, 1) 900ms infinite alternate;
        }

        .lp-problem-intro {
          align-self: center;
          order: 2;
          position: relative;
          z-index: 1;
        }

        .lp-problem.is-visible .lp-problem-intro {
          animation: lp-problem-intro-drift 9s cubic-bezier(0.16, 1, 0.3, 1) 1.1s infinite alternate;
        }

        .lp-section-label {
          color: var(--lp-green);
          font-size: 13px;
          font-weight: 800;
          margin: 0 0 22px;
        }

        .lp-problem .lp-section-label {
          opacity: var(--lp-problem-label-opacity, 0.42);
          transform: translate3d(var(--lp-problem-label-x, 18px), 0, 0);
          will-change: opacity, transform;
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

        .lp-problem h2 {
          transform: translate3d(0, var(--lp-problem-title-y, 14px), 0);
          will-change: opacity, transform;
        }

        .lp-problem h2 span {
          display: block;
          opacity: var(--lp-title-line-opacity, 0.3);
          transform:
            translate3d(var(--lp-title-line-x, 0), var(--lp-title-line-y, 8px), 0)
            skewX(var(--lp-title-line-skew, 0deg));
          transform-origin: left center;
          will-change: opacity, transform;
        }

        .lp-problem h2 span:nth-child(1) {
          --lp-title-line-opacity: var(--lp-title-line-1-opacity, 0.3);
          --lp-title-line-skew: var(--lp-title-line-1-skew, 0.7deg);
          --lp-title-line-x: var(--lp-title-line-1-x, 42px);
          --lp-title-line-y: var(--lp-title-line-1-y, 8px);
        }

        .lp-problem h2 span:nth-child(2) {
          --lp-title-line-opacity: var(--lp-title-line-2-opacity, 0.3);
          --lp-title-line-skew: var(--lp-title-line-2-skew, -0.55deg);
          --lp-title-line-x: var(--lp-title-line-2-x, -32px);
          --lp-title-line-y: var(--lp-title-line-2-y, 8px);
        }

        .lp-problem h2 span:nth-child(3) {
          --lp-title-line-opacity: var(--lp-title-line-3-opacity, 0.3);
          --lp-title-line-skew: var(--lp-title-line-3-skew, 0.45deg);
          --lp-title-line-x: var(--lp-title-line-3-x, 28px);
          --lp-title-line-y: var(--lp-title-line-3-y, 8px);
        }

        .lp-problem.is-visible h2 span {
          animation: lp-problem-title-signal 7.4s cubic-bezier(0.16, 1, 0.3, 1) 1.2s infinite alternate;
        }

        .lp-problem.is-visible h2 span:nth-child(2) {
          animation-delay: 1.8s;
        }

        .lp-problem.is-visible h2 span:nth-child(3) {
          animation-delay: 2.4s;
        }

        .lp-problem-copy {
          opacity: var(--lp-problem-copy-opacity, 0);
          transform: translate3d(0, var(--lp-problem-copy-y, 18px), 0);
          will-change: opacity, transform;
        }

        .lp-failure-list {
          align-self: end;
          border-top: 1px solid var(--lp-dark-line);
          display: grid;
          order: 1;
          position: relative;
          z-index: 1;
        }

        .lp-failure-row {
          align-items: center;
          border-bottom: 1px solid var(--lp-dark-line);
          display: grid;
          gap: 22px;
          grid-template-columns: 72px 1fr;
          min-height: 78px;
          opacity: var(--lp-row-opacity, 0);
          overflow: hidden;
          position: relative;
          transform: translate3d(var(--lp-row-x, -42px), 0, 0) scale(var(--lp-row-scale, 0.9));
          will-change: opacity, transform;
        }

        .lp-failure-row::after {
          background: radial-gradient(ellipse at center, rgba(94,226,168,0.16), transparent 68%);
          content: "";
          inset: -24px -36px;
          opacity: 0;
          pointer-events: none;
          position: absolute;
          transform: translateX(-115%) scaleX(0.55);
          z-index: 0;
        }

        .lp-problem.is-visible .lp-failure-row::after {
          animation: lp-failure-live-scan 5.8s cubic-bezier(0.16, 1, 0.3, 1) 1.4s infinite;
        }

        .lp-failure-row:nth-child(1) {
          --lp-row-opacity: var(--lp-row-1-opacity, 0);
          --lp-row-number-y: var(--lp-row-1-number-y, 16px);
          --lp-row-scale: var(--lp-row-1-scale, 0.9);
          --lp-row-x: var(--lp-row-1-x, -42px);
        }

        .lp-failure-row:nth-child(2) {
          --lp-row-opacity: var(--lp-row-2-opacity, 0);
          --lp-row-number-y: var(--lp-row-2-number-y, 16px);
          --lp-row-scale: var(--lp-row-2-scale, 0.9);
          --lp-row-x: var(--lp-row-2-x, -42px);
        }

        .lp-failure-row:nth-child(3) {
          --lp-row-opacity: var(--lp-row-3-opacity, 0);
          --lp-row-number-y: var(--lp-row-3-number-y, 16px);
          --lp-row-scale: var(--lp-row-3-scale, 0.9);
          --lp-row-x: var(--lp-row-3-x, -42px);
        }

        .lp-failure-row:nth-child(4) {
          --lp-row-opacity: var(--lp-row-4-opacity, 0);
          --lp-row-number-y: var(--lp-row-4-number-y, 16px);
          --lp-row-scale: var(--lp-row-4-scale, 0.9);
          --lp-row-x: var(--lp-row-4-x, -42px);
        }

        .lp-failure-row span:first-child {
          color: var(--lp-amber);
          font-size: 28px;
          font-weight: 800;
          position: relative;
          transform: translate3d(0, var(--lp-row-number-y, 16px), 0);
          transform-origin: left center;
          z-index: 1;
        }

        .lp-failure-row span:last-child {
          color: oklch(91% 0.013 168);
          font-size: 20px;
          font-weight: 800;
          line-height: 1.25;
          position: relative;
          z-index: 1;
        }

        .lp-problem.is-visible .lp-failure-row span:first-child {
          animation: lp-failure-number-live 4.8s cubic-bezier(0.16, 1, 0.3, 1) infinite alternate;
        }

        .lp-problem.is-visible .lp-failure-row span:last-child {
          animation: lp-failure-label-live 6.2s cubic-bezier(0.16, 1, 0.3, 1) infinite alternate;
        }

        .lp-problem.is-visible .lp-failure-row:nth-child(2) span,
        .lp-problem.is-visible .lp-failure-row:nth-child(2)::after {
          animation-delay: 520ms;
        }

        .lp-problem.is-visible .lp-failure-row:nth-child(3) span,
        .lp-problem.is-visible .lp-failure-row:nth-child(3)::after {
          animation-delay: 1040ms;
        }

        .lp-problem.is-visible .lp-failure-row:nth-child(4) span,
        .lp-problem.is-visible .lp-failure-row:nth-child(4)::after {
          animation-delay: 1560ms;
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
            radial-gradient(ellipse at 78% 28%, rgba(94,226,168,0.16), transparent 34%),
            radial-gradient(ellipse at 18% 72%, rgba(31,135,85,0.10), transparent 38%),
            linear-gradient(rgba(15,20,17,0.04) 1px, transparent 1px),
            linear-gradient(90deg, rgba(15,20,17,0.04) 1px, transparent 1px),
            var(--lp-paper);
          background-size: 80px 80px;
          color: var(--lp-ink);
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
          color: var(--lp-ink-soft);
          font-size: 19px;
          line-height: 1.65;
          margin: 28px 0 0;
          max-width: 46ch;
        }

        .lp-close .lp-label {
          color: var(--lp-muted);
        }

        .lp-form.is-dark .lp-input {
          background: #1F2A23;
          border-color: #3D4A42;
          color: #EEF7F1;
        }

        .lp-form.is-dark .lp-input::placeholder {
          color: #5C7066;
        }

        .lp-form.is-dark .lp-submit {
          background: var(--lp-mint);
          color: var(--lp-dark);
        }

        .lp-form.is-dark .lp-submit:hover:not(:disabled) {
          background: #7AEAC0;
          box-shadow: 0 10px 22px rgba(15,20,17,0.22);
        }

        .lp-form.is-dark .lp-error {
          color: #E8A29B;
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
          color: #B8C9BE;
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

        @keyframes lp-problem-scan-flow {
          from {
            background-position: 0 0, 0 0;
            filter: saturate(0.9);
          }
          to {
            background-position: 180px -80px, -90px 140px;
            filter: saturate(1.18);
          }
        }

        @keyframes lp-problem-field-flow {
          from {
            background-position: -220px 0, 0 0;
          }
          to {
            background-position: 260px 0, 78px 0;
          }
        }

        @keyframes lp-problem-intro-drift {
          from {
            transform: translate3d(0, 0, 0);
          }
          to {
            transform: translate3d(0, -7px, 0);
          }
        }

        @keyframes lp-problem-title-signal {
          from {
            color: #EEF7F1;
            text-shadow: 0 0 0 rgba(31,135,85,0);
          }
          to {
            color: #FBFEFC;
            text-shadow: 0 0 22px rgba(94,226,168,0.18);
          }
        }

        @keyframes lp-failure-live-scan {
          0%,
          56% {
            opacity: 0;
            transform: translateX(-115%) scaleX(0.55);
          }
          68% {
            opacity: 0.42;
          }
          82%,
          100% {
            opacity: 0;
            transform: translateX(115%) scaleX(0.55);
          }
        }

        @keyframes lp-failure-number-live {
          from {
            color: var(--lp-amber);
            text-shadow: 0 0 0 transparent;
            transform: translate3d(0, var(--lp-row-number-y, 0), 0) scale(1);
          }
          to {
            color: oklch(84% 0.16 76);
            text-shadow: 0 0 18px rgba(200,180,80,0.28);
            transform: translate3d(3px, var(--lp-row-number-y, 0), 0) scale(1.06);
          }
        }

        @keyframes lp-failure-label-live {
          from {
            color: #D4E8DD;
            transform: translate3d(0, 0, 0);
          }
          to {
            color: #EEF7F1;
            transform: translate3d(4px, 0, 0);
          }
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
              radial-gradient(ellipse at 50% 24%, rgba(232,245,238,0.84) 0 28%, rgba(232,245,238,0.56) 50%, transparent 78%),
              linear-gradient(180deg, rgba(232,245,238,0.76) 0 16%, transparent 74%);
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

          .lp-hero-goal {
            min-width: 0;
            white-space: normal;
          }

          .lp-hero-suffix {
            margin-left: 0;
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

          .lp-problem-intro {
            order: 1;
          }

          .lp-failure-list {
            align-self: stretch;
            order: 2;
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

          .lp-hero-goal {
            display: block;
            margin: 4px auto 0;
            text-align: center;
          }

          .lp-form-row {
            grid-template-columns: 1fr;
          }

          .lp-submit {
            width: 100%;
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
          .lp-hero-goal::after,
          .lp-hero-proof,
          .lp-form,
          .lp-hero-bg::before,
          .lp-hero-bg::after,
          .lp-spinner,
          .lp-problem::before,
          .lp-problem::after,
          .lp-problem-intro,
          .lp-problem .lp-section-label,
          .lp-problem h2,
          .lp-problem h2 span,
          .lp-problem-copy,
          .lp-failure-row,
          .lp-failure-row::after,
          .lp-failure-row span,
          .lp-reveal {
            animation: none;
            clip-path: none;
            opacity: 1;
            stroke-dashoffset: 0;
            transform: none;
            transition: none;
          }

          .lp-problem::before,
          .lp-problem::after,
          .lp-failure-row::after {
            opacity: 0;
          }
        }
      `}</style>

      <main className="lp-root">
        <nav className="lp-nav" aria-label="Primary">
          <a className="lp-wordmark" href="/" style={{ display: "inline-flex", alignItems: "center", gap: 10 }}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/logo-mark.svg" alt="" aria-hidden="true" width={28} height={28} style={{ borderRadius: 7, display: "block", flexShrink: 0 }} />
            pathwise
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
          <div className="lp-hero-bg" aria-hidden="true" />
          <div className="lp-hero-inner">
            <div className="lp-hero-copy">
              <p className="lp-eyebrow">Don&apos;t know where to start learning? Start here.</p>
              <h1 className="lp-title">
                <span>skillmaxxing,</span>
                <span>made easy.</span>
              </h1>
              <p className="lp-hero-text">
                Learn how to{" "}
                <span className="lp-hero-goal" aria-live="polite">
                  {heroGoal}
                </span>{" "}
                <span className="lp-hero-suffix">skill by skill.</span>
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
                Built for ambitious learners, learn only what you need, at your own pace.
              </p>
            </div>
          </div>
        </section>

        <section
          className={`lp-problem${problemReveal.visible ? " is-visible" : ""}`}
          ref={problemReveal.ref}
        >
          <div className="lp-problem-intro">
            <p className="lp-section-label">The real blocker</p>
            <h2>
              <span>Most learning</span>
              <span>fails before</span>
              <span>you even start.</span>
            </h2>
            <p className="lp-problem-copy">
              The hard part is not motivation. It is order. People waste weeks
              collecting resources when what they needed was a map of dependencies.
            </p>
          </div>

          <div className="lp-failure-list">
            {FAILURE_MODES.map((item, index) => (
              <div className="lp-failure-row" key={item}>
                <span>{index + 1}</span>
                <span>{item}</span>
              </div>
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
            onEmailChange={setEmail}
            onSubmit={handleSubmit}
          />
        </section>

        <footer className="lp-footer">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/logo-mark.svg" alt="" aria-hidden="true" width={22} height={22} style={{ borderRadius: 5, display: "block", opacity: 0.7 }} />
          <span>pathwise</span>
          <a href="mailto:norinheng86@gmail.com">Contact</a>
        </footer>
      </main>
    </>
  );
}
