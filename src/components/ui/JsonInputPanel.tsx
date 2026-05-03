"use client";

interface JsonInputPanelProps {
  value: string;
  error: string | null;
  onChange: (value: string) => void;
  onApply: () => void;
  onClose: () => void;
}

export function JsonInputPanel({
  value,
  error,
  onChange,
  onApply,
  onClose,
}: JsonInputPanelProps) {
  return (
    <section
      aria-label="Input graph JSON"
      style={{
        position: "fixed",
        top: 60,
        right: 16,
        width: 430,
        maxWidth: "calc(100vw - 32px)",
        background: "var(--color-panel)",
        border: "1px solid var(--color-border-mid)",
        borderRadius: 8,
        boxShadow: "var(--shadow-popover)",
        zIndex: 260,
        overflow: "hidden",
      }}
    >
      <div
        style={{
          padding: "12px 12px 10px",
          borderBottom: "1px solid var(--color-border)",
          display: "flex",
          justifyContent: "space-between",
          gap: 12,
          alignItems: "center",
          background: "var(--color-chrome)",
        }}
      >
        <div>
          <div style={{ color: "var(--color-text-primary)", fontSize: 13, fontWeight: 700 }}>
            Input graph JSON
          </div>
          <div style={{ color: "var(--color-text-muted)", fontSize: 11, marginTop: 2 }}>
            Supports subject, goal, nodes, prerequisite_ids, coordinates, difficulty_level, is_checkpoint, zone, zone_color.
          </div>
        </div>
        <button
          type="button"
          onClick={onClose}
          aria-label="Close JSON input"
          style={{
            width: 26,
            height: 26,
            border: "1px solid var(--color-border)",
            borderRadius: 5,
            background: "var(--color-node)",
            color: "var(--color-text-muted)",
            cursor: "pointer",
            fontSize: 16,
            lineHeight: 1,
          }}
        >
          x
        </button>
      </div>

      <div style={{ padding: 12 }}>
        <textarea
          value={value}
          onChange={(event) => onChange(event.target.value)}
          spellCheck={false}
          placeholder='{"subject":"Machine Learning Engineering","goal":"...","nodes":[{"id":"...","zone":"Foundations","zone_color":"#3c8f86"}]}'
          style={{
            width: "100%",
            height: 300,
            resize: "vertical",
            border: `1px solid ${error ? "var(--color-danger-border)" : "var(--color-border-mid)"}`,
            borderRadius: 6,
            background: "var(--color-canvas)",
            color: "var(--color-text-primary)",
            padding: 10,
            fontFamily: "ui-monospace, SFMono-Regular, Consolas, monospace",
            fontSize: 11.5,
            lineHeight: 1.45,
            outline: "none",
          }}
        />

        {error && (
          <div
            role="alert"
            style={{
              color: "var(--color-danger)",
              background: "var(--color-danger-soft)",
              border: "1px solid var(--color-danger-border)",
              borderRadius: 6,
              padding: "8px 9px",
              marginTop: 8,
              fontSize: 11.5,
              lineHeight: 1.4,
            }}
          >
            {error}
          </div>
        )}

        <div style={{ display: "flex", justifyContent: "flex-end", gap: 8, marginTop: 10 }}>
          <button
            type="button"
            onClick={onClose}
            style={{
              height: 30,
              border: "1px solid var(--color-border)",
              borderRadius: 6,
              background: "var(--color-node)",
              color: "var(--color-text-secondary)",
              cursor: "pointer",
              padding: "0 12px",
              fontSize: 12,
              fontWeight: 650,
            }}
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={onApply}
            style={{
              height: 30,
              border: "none",
              borderRadius: 6,
              background: "var(--color-accent)",
              color: "var(--color-text-on-accent)",
              cursor: "pointer",
              padding: "0 12px",
              fontSize: 12,
              fontWeight: 700,
            }}
          >
            Apply to graph
          </button>
        </div>
      </div>
    </section>
  );
}
