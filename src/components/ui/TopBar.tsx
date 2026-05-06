"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { ThemeSwitcher } from "@/components/ui/ThemeSwitcher";

export interface LearningPathNavItem {
  id: string;
  subject: string;
  href?: string;
}

interface TopBarProps {
  subject: string;
  completedCount: number;
  totalCount: number;
  onOpenJsonInput?: () => void;
  onNewPath?: () => void;
  onDeletePath?: (id: string) => void;
  learningPaths?: LearningPathNavItem[];
}

export function TopBar({ subject, completedCount, totalCount, onOpenJsonInput, onNewPath, onDeletePath, learningPaths = [] }: TopBarProps) {
  const pct = totalCount > 0 ? completedCount / totalCount : 0;
  const showProgress = totalCount > 0;
  const hasLearningPaths = learningPaths.length > 0;
  const router = useRouter();
  const [hoveredPathId, setHoveredPathId] = useState<string | null>(null);

  async function handleSignOut() {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push("/sign-in");
    router.refresh();
  }

  return (
    <header
      style={{
        position: "fixed",
        inset: "0 0 auto 0",
        height: 58,
        background: "var(--color-chrome)",
        borderBottom: "1px solid var(--color-border)",
        display: "flex",
        alignItems: "center",
        padding: "0 28px",
        gap: 18,
        zIndex: 200,
      }}
    >
      {/* Logo */}
      <a href="/" style={{ display: "flex", alignItems: "center", gap: 10, textDecoration: "none" }}>
        <div style={{
          width: 22,
          height: 22,
          borderRadius: 6,
          background: "var(--color-goal)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          flexShrink: 0,
        }}>
          <div style={{ width: 8, height: 8, background: "var(--color-text-inverted)", borderRadius: "50%" }} />
        </div>
        <span style={{
          fontSize: 18,
          fontWeight: 800,
          color: "var(--color-text-primary)",
          letterSpacing: 0,
        }}>
          Pathwise
        </span>
      </a>

      <div style={{ width: 1, height: 18, background: "var(--color-border)", flexShrink: 0 }} />

      {onNewPath ? (
        <button
          type="button"
          onClick={onNewPath}
          style={{
            height: 34,
            border: "1px solid var(--color-border)",
            borderRadius: 6,
            background: "var(--color-node)",
            color: "var(--color-text-primary)",
            cursor: "pointer",
            display: "inline-flex",
            alignItems: "center",
            gap: 5,
            padding: "0 13px",
            fontSize: 13,
            fontWeight: 700,
            whiteSpace: "nowrap",
            flexShrink: 0,
          }}
        >
          + New path
        </button>
      ) : (
        <a
          href="/generate"
          style={{
            height: 34,
            border: "1px solid var(--color-border)",
            borderRadius: 6,
            background: "var(--color-node)",
            color: "var(--color-text-primary)",
            cursor: "pointer",
            display: "inline-flex",
            alignItems: "center",
            gap: 5,
            padding: "0 13px",
            fontSize: 13,
            fontWeight: 700,
            whiteSpace: "nowrap",
            textDecoration: "none",
            flexShrink: 0,
          }}
        >
          + New path
        </a>
      )}

      <nav
        aria-label="Learning paths"
        style={{
          display: "flex",
          alignItems: "center",
          gap: 12,
          flex: "1 1 auto",
          minWidth: 0,
          overflowX: "auto",
          overflowY: "hidden",
          scrollbarWidth: "none",
        }}
      >
        {hasLearningPaths ? (
          learningPaths.map((path) => (
            <div
              key={path.id}
              onMouseEnter={() => setHoveredPathId(path.id)}
              onMouseLeave={() => setHoveredPathId(null)}
              style={{
                display: "flex",
                alignItems: "center",
                gap: 12,
                minWidth: 0,
                flexShrink: 0,
              }}
            >
              <div style={{ width: 1, height: 18, background: "var(--color-border)", flexShrink: 0 }} />
              <a href={path.href ?? `/dashboard?treeId=${encodeURIComponent(path.id)}`} style={{
                fontSize: 13,
                fontWeight: 650,
                color: "var(--color-text-secondary)",
                overflow: "hidden",
                textOverflow: "ellipsis",
                whiteSpace: "nowrap",
                maxWidth: 220,
                textDecoration: "none",
              }}>
                {path.subject}
              </a>
              {onDeletePath && (
                <button
                  type="button"
                  aria-label={`Delete "${path.subject}"`}
                  onClick={(e) => {
                    e.preventDefault();
                    onDeletePath(path.id);
                  }}
                  style={{
                    width: 18,
                    height: 18,
                    border: "none",
                    borderRadius: 4,
                    background: hoveredPathId === path.id ? "var(--color-border)" : "transparent",
                    color: "var(--color-text-muted)",
                    cursor: "pointer",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    flexShrink: 0,
                    opacity: hoveredPathId === path.id ? 1 : 0,
                    transition: "opacity 120ms ease, background 120ms ease",
                    padding: 0,
                  }}
                >
                  <svg width="10" height="10" viewBox="0 0 10 10" fill="none" aria-hidden="true">
                    <path d="M1.5 1.5L8.5 8.5M8.5 1.5L1.5 8.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
                  </svg>
                </button>
              )}
            </div>
          ))
        ) : (
          <div style={{ display: "flex", alignItems: "center", gap: 12, minWidth: 0 }}>
            <div style={{ width: 1, height: 18, background: "var(--color-border)", flexShrink: 0 }} />
            <span style={{
              fontSize: 13,
              fontWeight: 650,
              color: "var(--color-text-secondary)",
              overflow: "hidden",
              textOverflow: "ellipsis",
              whiteSpace: "nowrap",
            }}>
              {subject}
            </span>
          </div>
        )}
      </nav>

      <div style={{ marginLeft: "auto", display: "flex", alignItems: "center", gap: 14 }}>
        {showProgress && (
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <span style={{ fontSize: 12, color: "var(--color-text-muted)", fontVariantNumeric: "tabular-nums" }}>
              <span style={{ color: "var(--color-text-primary)", fontWeight: 750 }}>{completedCount}</span>
              {" of "}{totalCount} complete
            </span>
            <div style={{
              width: 96,
              height: 4,
              background: "color-mix(in srgb, var(--color-border) 70%, var(--color-panel))",
              borderRadius: 4,
              overflow: "hidden",
            }}>
              <div style={{
                width: `${Math.max(2, pct * 100)}%`,
                height: "100%",
                background: "var(--color-accent)",
                borderRadius: 4,
                transition: "width 400ms cubic-bezier(0.16, 1, 0.3, 1)",
              }} />
            </div>
          </div>
        )}

        {onOpenJsonInput && (
          <button
            type="button"
            onClick={onOpenJsonInput}
            style={{
              height: 34,
              border: "1px solid var(--color-border)",
              borderRadius: 6,
              background: "var(--color-node)",
              color: "var(--color-text-primary)",
              cursor: "pointer",
              display: "inline-flex",
              alignItems: "center",
              gap: 5,
              padding: "0 13px",
              fontSize: 13,
              fontWeight: 700,
              whiteSpace: "nowrap",
            }}
          >
            <svg width="11" height="11" viewBox="0 0 11 11" fill="none" aria-hidden="true">
              <path d="M2.75 5.5H8.25M5.5 2.75V8.25" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
              <rect x="1" y="1" width="9" height="9" rx="1.5" stroke="currentColor" strokeWidth="0.75" opacity="0.4" />
            </svg>
            JSON
          </button>
        )}

        <ThemeSwitcher />

        {/* Account action */}
          <button
          type="button"
          onClick={handleSignOut}
          style={{
            height: 34,
            border: "none",
            borderRadius: 8,
            background: "var(--color-button-primary)",
            color: "var(--color-button-primary-text)",
            fontSize: 13,
            fontWeight: 700,
            padding: "0 13px",
            cursor: "pointer",
            whiteSpace: "nowrap",
          }}
        >
          Sign out
        </button>
      </div>
    </header>
  );
}
