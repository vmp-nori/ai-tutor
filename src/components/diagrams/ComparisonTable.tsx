"use client";

interface Row {
  label: string;
  values: string[];
}

interface Spec {
  columns: string[];
  rows: Row[];
}

export function ComparisonTable({ spec }: { spec: Record<string, unknown> }) {
  const s = spec as Partial<Spec>;
  const columns = Array.isArray(s.columns) ? s.columns : [];
  const rows = Array.isArray(s.rows) ? s.rows : [];
  if (columns.length === 0 || rows.length === 0) return null;

  return (
    <div style={{ overflowX: "auto" }}>
      <table
        style={{
          width: "100%",
          borderCollapse: "collapse",
          fontSize: 13.5,
          lineHeight: 1.5,
        }}
      >
        <thead>
          <tr>
            {columns.map((col, i) => (
              <th
                key={i}
                style={{
                  padding: "10px 14px",
                  textAlign: i === 0 ? "left" : "center",
                  fontWeight: 720,
                  fontSize: 11,
                  letterSpacing: "0.08em",
                  textTransform: "uppercase",
                  color: "var(--color-text-muted)",
                  borderBottom: "1.5px solid var(--color-border)",
                  background: "var(--color-chrome)",
                }}
              >
                {col}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row, ri) => (
            <tr key={ri}>
              <td
                style={{
                  padding: "10px 14px",
                  fontWeight: 650,
                  color: "var(--color-text-primary)",
                  borderBottom: ri < rows.length - 1 ? "1px solid var(--color-border)" : "none",
                  background: "var(--color-panel)",
                  whiteSpace: "nowrap",
                }}
              >
                {row.label}
              </td>
              {row.values.map((val, vi) => (
                <td
                  key={vi}
                  style={{
                    padding: "10px 14px",
                    textAlign: "center",
                    color: "var(--color-text-secondary)",
                    borderBottom: ri < rows.length - 1 ? "1px solid var(--color-border)" : "none",
                    borderLeft: "1px solid var(--color-border)",
                  }}
                >
                  {val}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
