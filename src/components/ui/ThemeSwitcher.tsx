"use client";

import { useEffect, useState } from "react";
import type { ReactNode } from "react";

type Theme = "light" | "dark";

const STORAGE_KEY = "pathwise-theme";
const THEME_EVENT = "pathwise-theme-change";

function isTheme(value: string | null): value is Theme {
  return value === "light" || value === "dark";
}

function applyTheme(theme: Theme) {
  document.documentElement.dataset.theme = theme;
  window.dispatchEvent(new CustomEvent(THEME_EVENT, { detail: { theme } }));
}

export function ThemeSwitcher() {
  const [theme, setTheme] = useState<Theme>(() => {
    if (typeof window === "undefined") return "light";
    const stored = window.localStorage.getItem(STORAGE_KEY);
    if (isTheme(stored)) return stored;
    return window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
  });

  useEffect(() => {
    applyTheme(theme);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function handleSelect(nextTheme: Theme) {
    setTheme(nextTheme);
    window.localStorage.setItem(STORAGE_KEY, nextTheme);
    applyTheme(nextTheme);
  }

  return (
    <div
      aria-label="Theme"
      role="group"
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
      <ThemeButton
        label="Light theme"
        active={theme === "light"}
        onClick={() => handleSelect("light")}
      >
        <svg width="14" height="14" viewBox="0 0 14 14" fill="none" aria-hidden="true">
          <circle cx="7" cy="7" r="2.5" stroke="currentColor" strokeWidth="1.25" />
          <path
            d="M7 1.2V2.5M7 11.5v1.3M1.2 7h1.3M11.5 7h1.3M2.9 2.9l.9.9M10.2 10.2l.9.9M11.1 2.9l-.9.9M3.8 10.2l-.9.9"
            stroke="currentColor"
            strokeWidth="1.25"
            strokeLinecap="round"
          />
        </svg>
      </ThemeButton>
      <ThemeButton
        label="Dark theme"
        active={theme === "dark"}
        onClick={() => handleSelect("dark")}
      >
        <svg width="14" height="14" viewBox="0 0 14 14" fill="none" aria-hidden="true">
          <path
            d="M9.9 11.7A5.3 5.3 0 0 1 5.7 2a4.1 4.1 0 1 0 6.3 5.2 5.2 5.2 0 0 1-2.1 4.5Z"
            stroke="currentColor"
            strokeWidth="1.25"
            strokeLinejoin="round"
          />
        </svg>
      </ThemeButton>
    </div>
  );
}

function ThemeButton({
  active,
  label,
  onClick,
  children,
}: {
  active: boolean;
  label: string;
  onClick: () => void;
  children: ReactNode;
}) {
  return (
    <button
      type="button"
      aria-label={label}
      aria-pressed={active}
      title={label}
      onClick={onClick}
      style={{
        width: 24,
        height: 24,
        border: "none",
        borderRadius: 4,
        background: active ? "var(--color-button-primary)" : "transparent",
        color: active ? "var(--color-button-primary-text)" : "var(--color-text-muted)",
        cursor: "pointer",
        display: "inline-flex",
        alignItems: "center",
        justifyContent: "center",
        padding: 0,
        transition: "background 150ms ease, color 150ms ease",
      }}
    >
      {children}
    </button>
  );
}

export { THEME_EVENT };
