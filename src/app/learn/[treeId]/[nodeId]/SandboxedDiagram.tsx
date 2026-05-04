"use client";

import { useMemo } from "react";
import type { LessonDiagram } from "@/lib/types";

interface SandboxedDiagramProps {
  diagram: LessonDiagram;
}

const CSP = [
  "default-src 'none'",
  "script-src 'unsafe-inline'",
  "style-src 'unsafe-inline'",
  "img-src data: blob:",
  "connect-src 'none'",
  "font-src 'none'",
  "object-src 'none'",
  "frame-src 'none'",
  "base-uri 'none'",
  "form-action 'none'",
].join("; ");

function buildSrcDoc(html: string) {
  return `<!doctype html>
<html>
  <head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <meta http-equiv="Content-Security-Policy" content="${CSP}">
    <style>
      :root {
        color-scheme: light;
        font-family: Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", system-ui, sans-serif;
        background: transparent;
        color: oklch(18.4% 0.006 255);
      }
      * { box-sizing: border-box; }
      html, body {
        width: 100%;
        min-height: 100%;
        margin: 0;
        overflow: hidden;
        background: transparent;
      }
      body {
        padding: 0;
      }
      button, input, select {
        font: inherit;
      }
      svg, canvas {
        max-width: 100%;
      }
    </style>
  </head>
  <body>
    ${html}
  </body>
</html>`;
}

export function SandboxedDiagram({ diagram }: SandboxedDiagramProps) {
  const srcDoc = useMemo(() => buildSrcDoc(diagram.html), [diagram.html]);
  const height = Math.max(240, Math.min(680, diagram.height ?? 420));

  return (
    <section style={{ margin: "26px 0 30px" }}>
      <h2
        style={{
          margin: "0 0 10px",
          fontSize: 15,
          lineHeight: 1.3,
          fontWeight: 750,
          color: "var(--color-text-primary)",
          letterSpacing: 0,
        }}
      >
        {diagram.title}
      </h2>
      <iframe
        title={diagram.title}
        sandbox="allow-scripts"
        referrerPolicy="no-referrer"
        srcDoc={srcDoc}
        style={{
          width: "100%",
          height,
          display: "block",
          border: "1px solid var(--color-border)",
          borderRadius: 8,
          background: "var(--color-panel)",
          boxShadow: "var(--shadow-control)",
        }}
      />
    </section>
  );
}
