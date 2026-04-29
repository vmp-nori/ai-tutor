"use client";

interface TopBarProps {
  subject: string;
  completedCount: number;
  totalCount: number;
  onOpenJsonInput?: () => void;
}

export function TopBar({ subject, completedCount, totalCount, onOpenJsonInput }: TopBarProps) {
  const pct = totalCount > 0 ? completedCount / totalCount : 0;
  const circumference = 2 * Math.PI * 4.5;
  const strokeDashoffset = circumference * (1 - pct);

  return (
    <header
      style={{
        position: "fixed",
        inset: "0 0 auto 0",
        height: 48,
        background: "var(--color-chrome)",
        borderBottom: "1px solid var(--color-border)",
        display: "flex",
        alignItems: "center",
        padding: "0 16px",
        gap: 10,
        zIndex: 200,
      }}
    >
      <span
        style={{
          fontSize: 13,
          fontWeight: 700,
          color: "var(--color-text-primary)",
          letterSpacing: "-0.02em",
        }}
      >
        Pathwise
      </span>

      <div
        style={{
          width: 1,
          height: 14,
          background: "var(--color-border)",
          flexShrink: 0,
        }}
      />

      <span
        style={{
          fontSize: 13,
          fontWeight: 500,
          color: "var(--color-text-secondary)",
          overflow: "hidden",
          textOverflow: "ellipsis",
          whiteSpace: "nowrap",
        }}
      >
        {subject}
      </span>

      <div style={{ marginLeft: "auto", display: "flex", alignItems: "center", gap: 8 }}>
        {onOpenJsonInput && (
          <button
            type="button"
            onClick={onOpenJsonInput}
            style={{
              height: 28,
              border: "1px solid var(--color-border)",
              borderRadius: 6,
              background: "var(--color-node)",
              color: "var(--color-text-primary)",
              cursor: "pointer",
              display: "inline-flex",
              alignItems: "center",
              gap: 6,
              padding: "0 10px",
              fontSize: 12,
              fontWeight: 650,
              whiteSpace: "nowrap",
            }}
          >
            <svg width="13" height="13" viewBox="0 0 13 13" fill="none" aria-hidden="true">
              <path
                d="M3.25 6.5H9.75M6.5 3.25V9.75"
                stroke="currentColor"
                strokeWidth="1.5"
                strokeLinecap="round"
              />
              <rect
                x="1.25"
                y="1.25"
                width="10.5"
                height="10.5"
                rx="2"
                stroke="currentColor"
                strokeWidth="1"
                opacity="0.45"
              />
            </svg>
            Input JSON
          </button>
        )}

        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 6,
            padding: "4px 10px 4px 8px",
            borderRadius: 99,
            background: "var(--color-accent-subtle)",
            fontSize: 11,
            fontWeight: 500,
            color: "var(--color-text-accent)",
            whiteSpace: "nowrap",
          }}
        >
          <svg width="12" height="12" viewBox="0 0 12 12" fill="none" aria-hidden="true">
            <circle
              cx="6" cy="6" r="4.5"
              stroke="currentColor" strokeWidth="2"
              strokeDasharray={circumference}
              strokeDashoffset={circumference * 0.67}
              strokeLinecap="round"
              transform="rotate(-90 6 6)"
              opacity="0.3"
            />
            <circle
              cx="6" cy="6" r="4.5"
              stroke="currentColor" strokeWidth="2"
              strokeDasharray={circumference}
              strokeDashoffset={strokeDashoffset}
              strokeLinecap="round"
              transform="rotate(-90 6 6)"
            />
          </svg>
          {completedCount} of {totalCount} complete
        </div>

        <div
          style={{
            width: 28,
            height: 28,
            borderRadius: "50%",
            background: "var(--color-border-mid)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontSize: 10,
            fontWeight: 700,
            color: "var(--color-text-secondary)",
            cursor: "pointer",
          }}
          title="Profile"
        >
          U
        </div>
      </div>
    </header>
  );
}
