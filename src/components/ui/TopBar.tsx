"use client";

import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

interface TopBarProps {
  subject: string;
  completedCount: number;
  totalCount: number;
  onOpenJsonInput?: () => void;
}

export function TopBar({ subject, completedCount, totalCount, onOpenJsonInput }: TopBarProps) {
  const pct = totalCount > 0 ? completedCount / totalCount : 0;
  const router = useRouter();

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
        height: 48,
        background: "#FFFFFF",
        borderBottom: "1px solid #E6E5DF",
        display: "flex",
        alignItems: "center",
        padding: "0 24px",
        gap: 16,
        zIndex: 200,
      }}
    >
      {/* Logo — dark square with white dot */}
      <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
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
        <span style={{
          fontSize: 14.5,
          fontWeight: 700,
          color: "#0E0F12",
          letterSpacing: "-0.02em",
        }}>
          Pathwise
        </span>
      </div>

      <div style={{ width: 1, height: 18, background: "#E6E5DF", flexShrink: 0 }} />

      <a
        href="/generate"
        style={{
          height: 30,
          border: "1px solid #E6E5DF",
          borderRadius: 6,
          background: "#FFFFFF",
          color: "#0E0F12",
          cursor: "pointer",
          display: "inline-flex",
          alignItems: "center",
          gap: 5,
          padding: "0 11px",
          fontSize: 12,
          fontWeight: 600,
          whiteSpace: "nowrap",
          textDecoration: "none",
          flexShrink: 0,
        }}
      >
        + New path
      </a>

      <div style={{ width: 1, height: 18, background: "#E6E5DF", flexShrink: 0 }} />

      <span style={{
        fontSize: 13,
        fontWeight: 500,
        color: "#4D4E54",
        overflow: "hidden",
        textOverflow: "ellipsis",
        whiteSpace: "nowrap",
      }}>
        {subject}
      </span>

      <div style={{ marginLeft: "auto", display: "flex", alignItems: "center", gap: 14 }}>
        {/* Progress: "X of N complete" + bar */}
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <span style={{ fontSize: 12, color: "#8A8A82", fontVariantNumeric: "tabular-nums" }}>
            <span style={{ color: "#0E0F12", fontWeight: 600 }}>{completedCount}</span>
            {" of "}{totalCount} complete
          </span>
          <div style={{
            width: 90,
            height: 4,
            background: "#E6E5DF",
            borderRadius: 999,
            overflow: "hidden",
          }}>
            <div style={{
              width: `${Math.max(totalCount > 0 ? 2 : 0, pct * 100)}%`,
              height: "100%",
              background: "#93C5FD",
              borderRadius: 999,
              transition: "width 400ms ease",
            }} />
          </div>
        </div>

        {onOpenJsonInput && (
          <button
            type="button"
            onClick={onOpenJsonInput}
            style={{
              height: 30,
              border: "1px solid #E6E5DF",
              borderRadius: 6,
              background: "#FFFFFF",
              color: "#0E0F12",
              cursor: "pointer",
              display: "inline-flex",
              alignItems: "center",
              gap: 5,
              padding: "0 11px",
              fontSize: 12,
              fontWeight: 600,
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

        {/* User avatar — dark circle */}
          <button
          type="button"
          onClick={handleSignOut}
          style={{
            height: 30,
            border: "none",
            borderRadius: 6,
            background: "#0E0F12",
            color: "#FCFCFA",
            fontSize: 12,
            fontWeight: 700,
            padding: "0 11px",
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
