"use client";

import { useEffect, useRef, useState } from "react";

type ThemeMode = "light" | "dark";
type Theme =
  | "light"
  | "paper"
  | "mist"
  | "sage"
  | "linen"
  | "parchment"
  | "dark"
  | "dark-mist"
  | "dark-blueprint"
  | "dark-sage"
  | "dark-clay"
  | "dark-archive";

interface ThemeOption {
  id: Theme;
  mode: ThemeMode;
  name: string;
  tone: string;
  swatches: [string, string, string, string];
}

const STORAGE_KEY = "pathwise-theme";
const THEME_EVENT = "pathwise-theme-change";
const DEFAULT_THEME_BY_MODE: Record<ThemeMode, Theme> = {
  light: "paper",
  dark: "dark",
};

const THEMES: ThemeOption[] = [
  {
    id: "light",
    mode: "light",
    name: "Classic",
    tone: "Bright white",
    swatches: ["oklch(98.8% 0.004 100)", "oklch(99.4% 0.003 100)", "oklch(90.6% 0.008 100)", "oklch(78.4% 0.097 249)"],
  },
  {
    id: "mist",
    mode: "light",
    name: "Blueprint",
    tone: "Clear blue",
    swatches: ["oklch(93.4% 0.022 236)", "oklch(96.6% 0.012 230)", "oklch(81.8% 0.040 240)", "oklch(53.2% 0.120 250)"],
  },
  {
    id: "paper",
    mode: "light",
    name: "Paper Graph",
    tone: "Moss ink",
    swatches: ["oklch(94.4% 0.018 88)", "oklch(97.2% 0.013 86)", "oklch(83.0% 0.035 92)", "oklch(50.8% 0.104 138)"],
  },
  {
    id: "sage",
    mode: "light",
    name: "Sage Field",
    tone: "Forest green",
    swatches: ["oklch(93.8% 0.026 137)", "oklch(96.2% 0.016 136)", "oklch(80.8% 0.048 132)", "oklch(45.4% 0.116 150)"],
  },
  {
    id: "linen",
    mode: "light",
    name: "Rose Linen",
    tone: "Blush clay",
    swatches: ["oklch(94.8% 0.024 18)", "oklch(96.8% 0.018 20)", "oklch(83.0% 0.046 16)", "oklch(58.8% 0.128 8)"],
  },
  {
    id: "parchment",
    mode: "light",
    name: "Archive Slate",
    tone: "Indigo notes",
    swatches: ["oklch(92.8% 0.018 96)", "oklch(95.4% 0.012 98)", "oklch(80.2% 0.026 105)", "oklch(46.8% 0.096 276)"],
  },
  {
    id: "dark",
    mode: "dark",
    name: "Night Graph",
    tone: "Soft blue",
    swatches: ["oklch(15.4% 0.014 255)", "oklch(20.5% 0.014 255)", "oklch(38.5% 0.017 255)", "oklch(76.3% 0.105 249)"],
  },
  {
    id: "dark-mist",
    mode: "dark",
    name: "Blue Hour",
    tone: "Clear blue",
    swatches: ["oklch(16.0% 0.028 254)", "oklch(21.8% 0.032 254)", "oklch(38.8% 0.055 250)", "oklch(73.5% 0.130 244)"],
  },
  {
    id: "dark-clay",
    mode: "dark",
    name: "Moss Study",
    tone: "Moss ink",
    swatches: ["oklch(16.2% 0.026 116)", "oklch(22.0% 0.030 116)", "oklch(38.0% 0.052 122)", "oklch(70.8% 0.118 135)"],
  },
  {
    id: "dark-sage",
    mode: "dark",
    name: "Forest Night",
    tone: "Green signal",
    swatches: ["oklch(15.8% 0.026 155)", "oklch(21.4% 0.030 155)", "oklch(37.6% 0.052 150)", "oklch(70.8% 0.122 150)"],
  },
  {
    id: "dark-blueprint",
    mode: "dark",
    name: "Rose Noir",
    tone: "Soft pink",
    swatches: ["oklch(16.0% 0.030 340)", "oklch(21.8% 0.034 340)", "oklch(38.4% 0.058 338)", "oklch(74.0% 0.130 345)"],
  },
  {
    id: "dark-archive",
    mode: "dark",
    name: "Archive Night",
    tone: "Violet ink",
    swatches: ["oklch(15.8% 0.026 278)", "oklch(21.2% 0.030 278)", "oklch(37.8% 0.052 276)", "oklch(72.0% 0.116 276)"],
  },
];

const THEME_IDS = new Set(THEMES.map((theme) => theme.id));

function isTheme(value: string | null): value is Theme {
  return value !== null && THEME_IDS.has(value as Theme);
}

function getThemeMode(theme: Theme): ThemeMode {
  return THEMES.find((item) => item.id === theme)?.mode ?? "light";
}

function getPreferredTheme(): Theme {
  if (typeof window === "undefined") return DEFAULT_THEME_BY_MODE.light;

  const stored = window.localStorage.getItem(STORAGE_KEY);
  if (isTheme(stored)) return stored;

  return window.matchMedia("(prefers-color-scheme: dark)").matches
    ? DEFAULT_THEME_BY_MODE.dark
    : DEFAULT_THEME_BY_MODE.light;
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

  function handleModeSelect(nextMode: ThemeMode) {
    if (nextMode === activeMode) return;
    handleSelect(DEFAULT_THEME_BY_MODE[nextMode]);
  }

  const activeMode = getThemeMode(theme);
  const visibleThemes = THEMES.filter((option) => option.mode === activeMode);

  return (
    <div ref={rootRef} style={{ position: "relative", flexShrink: 0 }}>
      <button
        type="button"
        aria-label="Open settings"
        aria-expanded={open}
        title="Settings"
        onClick={() => setOpen((value) => !value)}
        style={{
          width: 30,
          height: 30,
          border: "1px solid var(--color-border)",
          borderRadius: 6,
          background: open ? "var(--color-accent-subtle)" : "var(--color-node)",
          color: open ? "var(--color-text-accent)" : "var(--color-text-secondary)",
          cursor: "pointer",
          display: "inline-flex",
          alignItems: "center",
          justifyContent: "center",
          padding: 0,
          boxShadow: "var(--shadow-control)",
          transition: "background 150ms ease, color 150ms ease, border-color 150ms ease",
        }}
      >
        <SettingsIcon />
      </button>

      {open && (
        <div
          role="dialog"
          aria-label="Settings menu"
          style={{
            position: "absolute",
            right: 0,
            top: 38,
            width: 344,
            maxHeight: "min(560px, calc(100vh - 64px))",
            overflowY: "auto",
            background: "var(--color-panel)",
            border: "1px solid var(--color-border-mid)",
            borderRadius: 8,
            boxShadow: "var(--shadow-popover)",
            padding: 12,
            zIndex: 260,
          }}
        >
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 14 }}>
            <div>
              <div style={{ fontSize: 14, fontWeight: 750, color: "var(--color-text-primary)", lineHeight: 1.2 }}>
                Settings
              </div>
              <div style={{ marginTop: 3, fontSize: 11, color: "var(--color-text-muted)", lineHeight: 1.2 }}>
                Workspace preferences
              </div>
            </div>
            <button
              type="button"
              aria-label="Close settings"
              onClick={() => setOpen(false)}
              style={{
                width: 28,
                height: 28,
                border: "1px solid transparent",
                borderRadius: 6,
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

          <section
            aria-labelledby="settings-theme-title"
            style={{
              borderTop: "1px solid var(--color-border)",
              paddingTop: 12,
            }}
          >
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12, marginBottom: 10 }}>
              <div>
                <h2
                  id="settings-theme-title"
                  style={{
                    margin: 0,
                    fontSize: 12,
                    fontWeight: 750,
                    color: "var(--color-text-primary)",
                    lineHeight: 1.2,
                  }}
                >
                  Theme
                </h2>
                <div style={{ marginTop: 3, fontSize: 11, color: "var(--color-text-muted)", lineHeight: 1.25 }}>
                  Choose a mode, then a palette.
                </div>
              </div>
              <ModeSwitch mode={activeMode} onSelect={handleModeSelect} />
            </div>

            <div
              role="radiogroup"
              aria-label={`${activeMode === "light" ? "Light" : "Dark"} themes`}
              style={{
                display: "grid",
                gridTemplateColumns: "1fr 1fr",
                gap: 8,
              }}
            >
              {visibleThemes.map((option) => (
                <ThemeChoice
                  key={option.id}
                  option={option}
                  active={option.id === theme}
                  onSelect={() => handleSelect(option.id)}
                />
              ))}
            </div>
          </section>
        </div>
      )}
    </div>
  );
}

function ModeSwitch({
  mode,
  onSelect,
}: {
  mode: ThemeMode;
  onSelect: (mode: ThemeMode) => void;
}) {
  return (
    <div
      role="group"
      aria-label="Theme mode"
      style={{
        height: 30,
        border: "1px solid var(--color-border)",
        borderRadius: 6,
        background: "var(--color-node)",
        display: "inline-flex",
        alignItems: "center",
        padding: 2,
        gap: 2,
        boxShadow: "var(--shadow-control)",
        flexShrink: 0,
      }}
    >
      {(["light", "dark"] as const).map((item) => (
        <button
          key={item}
          type="button"
          aria-pressed={mode === item}
          onClick={() => onSelect(item)}
          style={{
            height: 24,
            minWidth: 54,
            border: "none",
            borderRadius: 4,
            background: mode === item ? "var(--color-button-primary)" : "transparent",
            color: mode === item ? "var(--color-button-primary-text)" : "var(--color-text-muted)",
            cursor: "pointer",
            display: "inline-flex",
            alignItems: "center",
            justifyContent: "center",
            gap: 5,
            padding: "0 8px",
            fontSize: 11,
            fontWeight: 700,
            transition: "background 150ms ease, color 150ms ease",
          }}
        >
          {item === "light" ? <SunIcon /> : <MoonIcon />}
          {item === "light" ? "Light" : "Dark"}
        </button>
      ))}
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

function SettingsIcon() {
  return (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path
        d="M12 15.2A3.2 3.2 0 1 0 12 8.8a3.2 3.2 0 0 0 0 6.4Z"
        stroke="currentColor"
        strokeWidth="1.8"
      />
      <path
        d="M19.4 15a1.6 1.6 0 0 0 .3 1.8l.1.1a1.9 1.9 0 0 1 0 2.7 1.9 1.9 0 0 1-2.7 0l-.1-.1a1.6 1.6 0 0 0-1.8-.3 1.6 1.6 0 0 0-1 1.5V21a1.9 1.9 0 0 1-3.8 0v-.2a1.6 1.6 0 0 0-1-1.5 1.6 1.6 0 0 0-1.8.3l-.1.1a1.9 1.9 0 0 1-2.7 0 1.9 1.9 0 0 1 0-2.7l.1-.1a1.6 1.6 0 0 0 .3-1.8 1.6 1.6 0 0 0-1.5-1H3a1.9 1.9 0 0 1 0-3.8h.2a1.6 1.6 0 0 0 1.5-1 1.6 1.6 0 0 0-.3-1.8l-.1-.1a1.9 1.9 0 0 1 0-2.7 1.9 1.9 0 0 1 2.7 0l.1.1a1.6 1.6 0 0 0 1.8.3h.1a1.6 1.6 0 0 0 1-1.5V3a1.9 1.9 0 0 1 3.8 0v.2a1.6 1.6 0 0 0 1 1.5h.1a1.6 1.6 0 0 0 1.8-.3l.1-.1a1.9 1.9 0 0 1 2.7 0 1.9 1.9 0 0 1 0 2.7l-.1.1a1.6 1.6 0 0 0-.3 1.8v.1a1.6 1.6 0 0 0 1.5 1h.2a1.9 1.9 0 0 1 0 3.8h-.2a1.6 1.6 0 0 0-1.5 1Z"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function SunIcon() {
  return (
    <svg width="12" height="12" viewBox="0 0 12 12" fill="none" aria-hidden="true">
      <circle cx="6" cy="6" r="2" stroke="currentColor" strokeWidth="1.2" />
      <path d="M6 1v1.1M6 9.9V11M1 6h1.1M9.9 6H11M2.5 2.5l.8.8M8.7 8.7l.8.8M9.5 2.5l-.8.8M3.3 8.7l-.8.8" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" />
    </svg>
  );
}

function MoonIcon() {
  return (
    <svg width="12" height="12" viewBox="0 0 12 12" fill="none" aria-hidden="true">
      <path
        d="M8.5 10A4.5 4.5 0 0 1 4.9 1.8a3.5 3.5 0 1 0 5.3 4.4A4.4 4.4 0 0 1 8.5 10Z"
        stroke="currentColor"
        strokeWidth="1.2"
        strokeLinejoin="round"
      />
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
