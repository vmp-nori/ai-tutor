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
  light: "light",
  dark: "dark",
};

const THEMES: ThemeOption[] = [
  {
    id: "light",
    mode: "light",
    name: "pathwise",
    tone: "Drafting paper",
    swatches: ["oklch(96.8% 0.014 168)", "oklch(98.8% 0.009 168)", "oklch(82% 0.035 184)", "oklch(67% 0.145 164)"],
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

interface ThemeSwitcherProps {
  onSignOut?: () => void;
  userEmail?: string;
}

type SettingsPage = "root" | "account";

export function ThemeSwitcher({ onSignOut, userEmail }: ThemeSwitcherProps = {}) {
  const [theme, setTheme] = useState<Theme>(getPreferredTheme);
  const [open, setOpen] = useState(false);
  const [page, setPage] = useState<SettingsPage>("root");
  const [themesExpanded, setThemesExpanded] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    applyTheme(theme);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (!open) return;

    function handlePointerDown(event: PointerEvent) {
      if (!rootRef.current?.contains(event.target as Node)) {
        setOpen(false);
        setPage("root");
        setThemesExpanded(false);
      }
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
          width: 34,
          height: 34,
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
          aria-label="Settings"
          style={{
            position: "absolute",
            right: 0,
            top: 38,
            width: 300,
            background: "var(--color-panel)",
            border: "1px solid var(--color-border-mid)",
            borderRadius: 10,
            boxShadow: "var(--shadow-popover)",
            overflow: "hidden",
            zIndex: 260,
          }}
        >
          {/* ── Header ── */}
          <div style={{
            display: "flex",
            alignItems: "center",
            gap: 8,
            padding: "10px 12px",
            borderBottom: "1px solid var(--color-border)",
          }}>
            {page === "account" && (
              <button
                type="button"
                aria-label="Back"
                onClick={() => setPage("root")}
                style={{
                  width: 26, height: 26, border: "none", borderRadius: 5,
                  background: "var(--color-node)", color: "var(--color-text-muted)",
                  cursor: "pointer", display: "inline-flex", alignItems: "center",
                  justifyContent: "center", padding: 0, flexShrink: 0,
                }}
              >
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M15 18l-6-6 6-6" />
                </svg>
              </button>
            )}
            <span style={{ fontSize: 13, fontWeight: 750, color: "var(--color-text-primary)", flex: 1 }}>
              {page === "root" ? "Settings" : "Account"}
            </span>
            <button
              type="button"
              aria-label="Close settings"
              onClick={() => { setOpen(false); setPage("root"); setThemesExpanded(false); }}
              style={{
                width: 26, height: 26, border: "none", borderRadius: 5,
                background: "transparent", color: "var(--color-text-muted)",
                cursor: "pointer", display: "inline-flex", alignItems: "center",
                justifyContent: "center", padding: 0,
              }}
            >
              <CloseIcon />
            </button>
          </div>

          {/* ── Root page ── */}
          {page === "root" && (
            <div>
              {/* Account row */}
              <button
                type="button"
                onClick={() => setPage("account")}
                style={{
                  width: "100%", display: "flex", alignItems: "center", gap: 12,
                  padding: "0 14px", height: 46, border: "none",
                  background: "transparent", color: "var(--color-text-primary)",
                  cursor: "pointer", textAlign: "left",
                  borderBottom: "1px solid var(--color-border)",
                  transition: "background 120ms ease",
                }}
                onMouseEnter={(e) => { e.currentTarget.style.background = "var(--color-node)"; }}
                onMouseLeave={(e) => { e.currentTarget.style.background = "transparent"; }}
              >
                <span style={{
                  width: 28, height: 28, borderRadius: 6, flexShrink: 0,
                  background: "var(--color-node)", border: "1px solid var(--color-border)",
                  display: "inline-flex", alignItems: "center", justifyContent: "center",
                  color: "var(--color-text-muted)",
                }}>
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <circle cx="12" cy="8" r="4" /><path d="M4 20c0-4 3.6-7 8-7s8 3 8 7" />
                  </svg>
                </span>
                <span style={{ flex: 1 }}>
                  <span style={{ display: "block", fontSize: 13, fontWeight: 600 }}>Account</span>
                  {userEmail && <span style={{ display: "block", fontSize: 11, color: "var(--color-text-muted)", marginTop: 1 }}>{userEmail}</span>}
                </span>
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" style={{ color: "var(--color-text-muted)", flexShrink: 0 }}>
                  <path d="M9 18l6-6-6-6" />
                </svg>
              </button>

              {/* Themes row */}
              <button
                type="button"
                aria-expanded={themesExpanded}
                onClick={() => setThemesExpanded((v) => !v)}
                style={{
                  width: "100%", display: "flex", alignItems: "center", gap: 12,
                  padding: "0 14px", height: 46, border: "none",
                  background: themesExpanded ? "var(--color-node)" : "transparent",
                  color: "var(--color-text-primary)",
                  cursor: "pointer", textAlign: "left",
                  borderBottom: themesExpanded ? "1px solid var(--color-border)" : "none",
                  transition: "background 120ms ease",
                }}
                onMouseEnter={(e) => { if (!themesExpanded) e.currentTarget.style.background = "var(--color-node)"; }}
                onMouseLeave={(e) => { if (!themesExpanded) e.currentTarget.style.background = "transparent"; }}
              >
                <span style={{
                  width: 28, height: 28, borderRadius: 6, flexShrink: 0,
                  background: "var(--color-node)", border: "1px solid var(--color-border)",
                  display: "inline-flex", alignItems: "center", justifyContent: "center",
                  color: "var(--color-text-muted)",
                }}>
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <circle cx="12" cy="12" r="4" /><path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M4.93 19.07l1.41-1.41M17.66 6.34l1.41-1.41" />
                  </svg>
                </span>
                <span style={{ flex: 1 }}>
                  <span style={{ display: "block", fontSize: 13, fontWeight: 600 }}>Themes</span>
                  <span style={{ display: "block", fontSize: 11, color: "var(--color-text-muted)", marginTop: 1 }}>
                    {THEMES.find((t) => t.id === theme)?.name ?? "—"}
                  </span>
                </span>
                <svg
                  width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"
                  style={{ color: "var(--color-text-muted)", flexShrink: 0, transform: themesExpanded ? "rotate(90deg)" : "none", transition: "transform 150ms ease" }}
                >
                  <path d="M9 18l6-6-6-6" />
                </svg>
              </button>

              {/* Themes dropdown */}
              {themesExpanded && (
                <div style={{ padding: "12px 14px 14px" }}>
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 12 }}>
                    <span style={{ fontSize: 11, fontWeight: 700, letterSpacing: "0.06em", textTransform: "uppercase", color: "var(--color-text-muted)" }}>
                      Mode
                    </span>
                    <ModeSwitch mode={activeMode} onSelect={handleModeSelect} />
                  </div>
                  <div role="radiogroup" aria-label="Themes" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 7 }}>
                    {visibleThemes.map((option) => (
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
          )}

          {/* ── Account page ── */}
          {page === "account" && (
            <div style={{ padding: "12px 14px 16px", display: "flex", flexDirection: "column", gap: 20 }}>
              <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                <span style={{ fontSize: 10, fontWeight: 700, letterSpacing: "0.08em", textTransform: "uppercase", color: "var(--color-text-muted)" }}>
                  Email
                </span>
                <div style={{
                  padding: "10px 12px",
                  background: "var(--color-node)",
                  border: "1px solid var(--color-border)",
                  borderRadius: 7,
                  fontSize: 13,
                  fontWeight: 500,
                  color: "var(--color-text-primary)",
                  wordBreak: "break-all",
                }}>
                  {userEmail ?? "—"}
                </div>
              </div>

              <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                <span style={{ fontSize: 10, fontWeight: 700, letterSpacing: "0.08em", textTransform: "uppercase", color: "var(--color-text-muted)" }}>
                  Session
                </span>
                {onSignOut && (
                  <button
                    type="button"
                    onClick={() => { onSignOut(); setOpen(false); setPage("root"); }}
                    style={{
                      width: "100%", height: 36, border: "1px solid var(--color-border)",
                      borderRadius: 7, background: "var(--color-node)",
                      color: "var(--color-text-primary)", fontSize: 13, fontWeight: 650,
                      cursor: "pointer", transition: "background 150ms ease",
                    }}
                    onMouseEnter={(e) => { e.currentTarget.style.background = "var(--color-border)"; }}
                    onMouseLeave={(e) => { e.currentTarget.style.background = "var(--color-node)"; }}
                  >
                    Sign out
                  </button>
                )}
              </div>
            </div>
          )}
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
