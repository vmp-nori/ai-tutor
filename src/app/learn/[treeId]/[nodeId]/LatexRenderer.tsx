"use client";

import ReactMarkdown from "react-markdown";
import remarkMath from "remark-math";
import rehypeKatex from "rehype-katex";
import "katex/dist/katex.min.css";

const REMARK_PLUGINS = [remarkMath];
const REHYPE_PLUGINS = [rehypeKatex];

interface Props {
  text: string;
  style?: React.CSSProperties;
}

const textStyle: React.CSSProperties = {
  fontSize: 14.5,
  lineHeight: 1.72,
  color: "var(--color-text-secondary)",
};

function hasMathDelimiter(text: string, startIndex: number, endIndex: number) {
  const before = text.slice(0, startIndex);
  const after = text.slice(endIndex);
  return before.lastIndexOf("$") > before.lastIndexOf("\n") && after.indexOf("$") !== -1;
}

function isMathLike(value: string) {
  return (
    /\bd[A-Z][A-Za-z0-9]*\/d[A-Za-z][A-Za-z0-9]*\b/.test(value) ||
    /[A-Za-z][A-Za-z0-9_]*\s*=/.test(value) ||
    /\\[a-zA-Z]+/.test(value)
  );
}

function normalizeMath(value: string) {
  return value
    .trim()
    .replace(/\$/g, "")
    .replace(/[→⇒]/g, "\\to")
    .replace(/\bd([A-Z][A-Za-z0-9]*)_d([A-Za-z][A-Za-z0-9]*)\b/g, "d$1/d$2")
    .replace(/\bd([A-Z][A-Za-z0-9]*)\/d([A-Za-z][A-Za-z0-9]*)\b/g, "\\frac{d$1}{d$2}")
    .replace(/\blim\s*\(\s*([A-Za-z])\s*\\to\s*([^)]+)\)/g, "\\lim_{$1 \\to $2}")
    .replace(/\[([^\]]+)\]\s*\/\s*([A-Za-z][A-Za-z0-9]*)/g, "\\frac{$1}{$2}")
    .replace(/\s+#\s*(.+)$/gm, (_, comment: string) => `\\quad \\text{${comment.trim()}}`)
    .replace(/\*/g, "\\cdot ");
}

function protectInlineMath(text: string) {
  const markdownWithNormalizedSpans = text
    .replace(/\$([^$\n]+)\$/g, (_, formula: string) => `$${normalizeMath(formula)}$`)
    .replace(/\$([^$\n]+)\$\s*=\s*lim\s*\(([^)]+)\)\s*([^.\n]+)/g, (_, left: string, limit: string, rest: string) => (
      `$$\n${normalizeMath(`${left} = lim(${limit}) ${rest}`)}\n$$`
    ));

  const markdownWithMathCode = markdownWithNormalizedSpans
    .replace(/```(?:\w+)?\n([\s\S]*?)```/g, (match, code: string) => (
      isMathLike(code) ? `\n$$\n${normalizeMath(code)}\n$$\n` : match
    ))
    .replace(/`([^`\n]+)`/g, (match, code: string) => (
      isMathLike(code) ? `$${normalizeMath(code)}$` : match
    ));

  const normalizedMath = markdownWithMathCode
    .replace(/\b(d[A-Z][A-Za-z0-9]*\/d[A-Za-z][A-Za-z0-9]*)\b/g, (match, formula: string, offset: number) => (
      hasMathDelimiter(markdownWithMathCode, offset, offset + formula.length) ? match : `$${formula}$`
    ))
    .replace(/\b([A-Za-z][A-Za-z0-9]*\s*=\s*[^.,;:\n]+(?:[+\-*/^]|\/)[^.,;:\n]*)/g, (match, formula: string, offset: number) => (
      hasMathDelimiter(markdownWithMathCode, offset, offset + formula.length) ? match : `$${normalizeMath(formula)}$`
    ));

  return normalizedMath.replace(/^\s*\$([^$\n]+)\$\s*$/gm, (_, formula: string) => (
    `$$\n${normalizeMath(formula)}\n$$`
  ));
}

export function LatexRenderer({ text, style }: Props) {
  if (!text) return null;

  const merged = style ? { ...textStyle, ...style } : textStyle;

  return (
    <div style={merged} className="lesson-prose">
      <ReactMarkdown
        remarkPlugins={REMARK_PLUGINS}
        rehypePlugins={REHYPE_PLUGINS}
      >
        {protectInlineMath(text)}
      </ReactMarkdown>
    </div>
  );
}
