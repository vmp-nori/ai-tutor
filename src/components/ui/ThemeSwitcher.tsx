"use client";

import { useEffect, useRef, useState } from "react";

type Theme = "light" | "paper" | "mist" | "sage" | "linen" | "parchment" | "dark";

interface ThemeOption {
  id: Theme;
  name: string;
  tone: string;
  swatches: [string, string, string, string];
}

const STORAGE_KEY = "pathwise-theme";
const THEME_EVENT = "pathwise-theme-change";

const THEMES: ThemeOption[] = [
  {
    id: "light",
    name: "Classic",
    tone: "Bright white",
    swatches: ["oklch(98.8% 0.004 100)", "oklch(99.4% 0.003 100)", "oklch(90.6% 0.008 100)", "oklch(78.4% 0.097 249)"],
  },
  {
    id: "paper",
    name: "Paper Graph",
    tone: "Moss ink",
    swatches: ["oklch(94.4% 0.018 88)", "oklch(97.2% 0.013 86)", "oklch(83.0% 0.035 92)", "oklch(50.8% 0.104 138)"],
  },
  {
    id: "mist",
    name: "Blueprint",
    tone: "Clear blue",
    swatches: ["oklch(93.4% 0.022 236)", "oklch(96.6% 0.012 230)", "oklch(81.8% 0.040 240)", "oklch(53.2% 0.120 250)"],
  },
  {
    id: "sage",
    name: "Sage Field",
    tone: "Forest green",
    swatches: ["oklch(93.8% 0.026 137)", "oklch(96.2% 0.016 136)", "oklch(80.8% 0.048 132)", "oklch(45.4% 0.116 150)"],
  },
  {
    id: "linen",
    name: "Clay Linen",
    tone: "Terracotta",
    swatches: ["oklch(94.0% 0.022 67)", "oklch(96.2% 0.016 70)", "oklch(82.6% 0.042 58)", "oklch(56.8% 0.128 34)"],
  },
  {
    id: "parchment",
    name: "Archive Slate",
    tone: "Indigo notes",
    swatches: ["oklch(92.8% 0.018 96)", "oklch(95.4% 0.012 98)", "oklch(80.2% 0.026 105)", "oklch(46.8% 0.096 276)"],
  },
  {
    id: "dark",
    name: "Night Graph",
    tone: "Low light",
    swatches: ["oklch(15.4% 0.014 255)", "oklch(20.5% 0.014 255)", "oklch(38.5% 0.017 255)", "oklch(76.3% 0.105 249)"],
  },
];

function isTheme(value: string | null): value is Theme {
  return THEMES.some((theme) => theme.id === value);
}

function getPreferredTheme(): Theme {
  if (typeof window === "undefined") return "paper";

  const stored = window.localStorage.getItem(STORAGE_KEY);
  if (isTheme(stored)) return stored;

  return window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "paper";
}

function applyTheme(theme: Theme) {
  document.documentElement.dataset.theme = theme;
  window.dispatchEvent(new CustomEvent(THEME_EVENT, { detail: { theme } }));
}

export function ThemeSwitcher() {
  const [theme, setTheme] = useState<Theme>(getPreferredTheme);
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    applyTheme(theme);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (!open) return;

    function handlePointerDown(event: PointerEvent) {
      if (!rootRef.current?.contains(event.target as Node)) setOpen(false);
    }

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") setOpen(false);
    }

    document.addEventListener("pointerdown", handlePointerDown);
    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("pointerdown", handlePointerDown);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [open]);

  function handleSelect(nextTheme: Theme) {
    setTheme(nextTheme);
    window.localStorage.setItem(STORAGE_KEY, nextTheme);
    applyTheme(nextTheme);
  }

  const activeTheme = THEMES.find((item) => item.id === theme) ?? THEMES[1];

  return (
    <div ref={rootRef} style={{ position: "relative", flexShrink: 0 }}>
      <button
        type="button"
        aria-label="Settings"
        aria-expanded={open}
        title="Settings"
        onClick={() => setOpen((value) => !value)}
        style={{
          height: 30,
          border: "1px solid var(--color-border)",
          borderRadius: 6,
          background: "var(--color-node)",
          color: "var(--color-text-secondary)",
          cursor: "pointer",
          display: "inline-flex",
          alignItems: "center",
          gap: 7,
          padding: "0 9px",
          fontSize: 12,
          fontWeight: 650,
          whiteSpace: "nowrap",
          boxShadow: "var(--shadow-control)",
        }}
      >
        <GearIcon />
        <span>{activeTheme.name}</span>
      </button>

      {open && (
        <div
          role="dialog"
          aria-label="Settings panel"
          style={{
            position: "absolute",
            right: 0,
            top: 38,
            width: 316,
            background: "var(--color-panel)",
            border: "1px solid var(--color-border-mid)",
            borderRadius: 8,
            boxShadow: "var(--shadow-popover)",
            padding: 12,
            zIndex: 260,
          }}
        >
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 10 }}>
            <div>
              <div style={{ fontSize: 13, fontWeight: 750, color: "var(--color-text-primary)", lineHeight: 1.2 }}>
                Settings
              </div>
              <div style={{ marginTop: 2, fontSize: 11, color: "var(--color-text-muted)", lineHeight: 1.2 }}>
                Appearance
              </div>
            </div>
            <button
              type="button"
              aria-label="Close settings"
              onClick={() => setOpen(false)}
              style={{
                width: 26,
                height: 26,
                border: "none",
                borderRadius: 5,
                background: "transparent",
                color: "var(--color-text-muted)",
                cursor: "pointer",
                display: "inline-flex",
                alignItems: "center",
                justifyContent: "center",
                padding: 0,
              }}
            >
              <CloseIcon />
            </button>
          </div>

          <div
            role="radiogroup"
            aria-label="Theme"
            style={{
              display: "grid",
              gridTemplateColumns: "1fr 1fr",
              gap: 8,
            }}
          >
            {THEMES.map((option) => (
              <ThemeChoice
                key={option.id}
                option={option}
                active={option.id === theme}
                onSelect={() => handleSelect(option.id)}
              />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function ThemeChoice({
  option,
  active,
  onSelect,
}: {
  option: ThemeOption;
  active: boolean;
  onSelect: () => void;
}) {
  const previewBorder = active
    ? option.swatches[3]
    : `color-mix(in srgb, ${option.swatches[2]} 72%, var(--color-border))`;
  const previewBackground = active
    ? `color-mix(in srgb, ${option.swatches[0]} 72%, var(--color-panel))`
    : `color-mix(in srgb, ${option.swatches[0]} 34%, var(--color-node))`;

  return (
    <button
      type="button"
      role="radio"
      aria-checked={active}
      onClick={onSelect}
      style={{
        minHeight: 86,
        border: `1px solid ${previewBorder}`,
        borderRadius: 7,
        background: previewBackground,
        color: "var(--color-text-primary)",
        cursor: "pointer",
        display: "flex",
        flexDirection: "column",
        alignItems: "stretch",
        justifyContent: "space-between",
        gap: 9,
        padding: 9,
        textAlign: "left",
        boxShadow: active
          ? `0 0 0 3px color-mix(in srgb, ${option.swatches[3]} 22%, transparent), var(--shadow-node)`
          : "var(--shadow-node)",
        transition: "background 150ms ease, border-color 150ms ease, box-shadow 150ms ease",
      }}
    >
      <span style={{ display: "flex", flexDirection: "column", gap: 5 }}>
        <span style={{ display: "flex", gap: 4, height: 18 }}>
          {option.swatches.map((swatch, index) => (
            <span
              key={`${option.id}-${swatch}`}
              style={{
                flex: index === 0 ? "1 1 auto" : "0 0 18px",
                borderRadius: 4,
                background: swatch,
                border: "1px solid color-mix(in srgb, var(--color-border-mid) 70%, transparent)",
              }}
            />
          ))}
        </span>
        <span
          aria-hidden="true"
          style={{
            position: "relative",
            height: 11,
            borderRadius: 4,
            background: `linear-gradient(90deg, ${option.swatches[2]}, ${option.swatches[0]})`,
            overflow: "hidden",
          }}
        >
          {[18, 48, 76].map((left, index) => (
            <span
              key={`${option.id}-node-${left}`}
              style={{
                position: "absolute",
                left: `${left}%`,
                top: index === 1 ? 2 : 3,
                width: index === 1 ? 7 : 5,
                height: index === 1 ? 7 : 5,
                borderRadius: "50%",
                background: index === 1 ? option.swatches[3] : option.swatches[1],
                boxShadow: `0 0 0 1px ${option.swatches[3]}`,
              }}
            />
          ))}
        </span>
      </span>
      <span style={{ display: "flex", alignItems: "flex-end", justifyContent: "space-between", gap: 8 }}>
        <span style={{ minWidth: 0 }}>
          <span
            style={{
              display: "block",
              fontSize: 12,
              fontWeight: 700,
              color: "var(--color-text-primary)",
              lineHeight: 1.15,
              whiteSpace: "nowrap",
              overflow: "hidden",
              textOverflow: "ellipsis",
            }}
          >
            {option.name}
          </span>
          <span style={{ display: "block", marginTop: 2, fontSize: 10.5, color: "var(--color-text-muted)", lineHeight: 1 }}>
            {option.tone}
          </span>
        </span>
        {active && (
          <span
            aria-hidden="true"
            style={{
              width: 16,
              height: 16,
              borderRadius: "50%",
              background: "var(--color-button-primary)",
              color: "var(--color-button-primary-text)",
              display: "inline-flex",
              alignItems: "center",
              justifyContent: "center",
              flexShrink: 0,
            }}
          >
            <CheckIcon />
          </span>
        )}
      </span>
    </button>
  );
}

function GearIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 14 14" fill="none" aria-hidden="true">
      <path
        d="M5.8 1.4h2.4l.3 1.3c.3.1.6.2.9.4l1.1-.7 1.2 2.1-.9.8c.1.3.1.6.1.9s0 .6-.1.9l.9.8-1.2 2.1-1.1-.7c-.3.2-.6.3-.9.4l-.3 1.3H5.8l-.3-1.3c-.3-.1-.6-.2-.9-.4l-1.1.7-1.2-2.1.9-.8c-.1-.3-.1-.6-.1-.9s0-.6.1-.9l-.9-.8 1.2-2.1 1.1.7c.3-.2.6-.3.9-.4l.3-1.3Z"
        stroke="currentColor"
        strokeWidth="1.2"
        strokeLinejoin="round"
      />
      <circle cx="7" cy="7" r="1.8" stroke="currentColor" strokeWidth="1.2" />
    </svg>
  );
}

function CloseIcon() {
  return (
    <svg width="11" height="11" viewBox="0 0 11 11" fill="none" aria-hidden="true">
      <path d="M2 2L9 9M9 2L2 9" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  );
}

function CheckIcon() {
  return (
    <svg width="10" height="8" viewBox="0 0 10 8" fill="none" aria-hidden="true">
      <path d="M1 4L3.7 6.5L9 1" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

export { THEME_EVENT };
