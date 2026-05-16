"use client";

import { isValidElement, useState } from "react";
import type { CSSProperties, ReactNode } from "react";
import katex from "katex";
import ReactMarkdown from "react-markdown";
import type { Components } from "react-markdown";
import remarkMath from "remark-math";
import rehypeKatex from "rehype-katex";
import type { PluggableList } from "unified";
import "katex/dist/katex.min.css";

const REMARK_PLUGINS: PluggableList = [remarkMath];
const REHYPE_PLUGINS: PluggableList = [
  [rehypeKatex, { strict: "ignore", throwOnError: false, errorColor: "#0F1411" }],
];

interface Props {
  text: string;
  style?: CSSProperties;
  inline?: boolean;
}

const textStyle: CSSProperties = {
  fontSize: "1rem",
  lineHeight: 1.68,
  color: "inherit",
  maxWidth: "100%",
};

const inlineTextStyle: CSSProperties = {
  color: "inherit",
};

const CODE_PLACEHOLDER = "\uE000CODE";
const FENCED_CODE_PATTERN = /```[^\n`]*\n?([\s\S]*?)```/g;

function protectFencedCode(text: string) {
  const codeBlocks: string[] = [];

  function protectCodeBlock(block: string) {
    const token = `${CODE_PLACEHOLDER}${codeBlocks.length}\uE001`;
    codeBlocks.push(block);
    return token;
  }

  const protectedText = text.replace(FENCED_CODE_PATTERN, (match) => {
    return protectCodeBlock(match);
  });

  return {
    protectedText,
    protectGeneratedCode: (code: string, language: string) => protectCodeBlock(`\`\`\`${language}\n${code}\n\`\`\``),
    restore: (value: string) => value.replace(
      new RegExp(`${CODE_PLACEHOLDER}(\\d+)\\uE001`, "g"),
      (_, index: string) => codeBlocks[Number(index)] ?? "",
    ),
  };
}

function hasMathDelimiter(text: string, startIndex: number, endIndex: number) {
  if (isInsideDisplayMath(text, startIndex)) return true;

  const before = text.slice(0, startIndex);
  const after = text.slice(endIndex);
  return before.lastIndexOf("$") > before.lastIndexOf("\n") && after.indexOf("$") !== -1;
}

function isInsideDisplayMath(text: string, index: number) {
  const displayDelimiterCount = text.slice(0, index).match(/\$\$/g)?.length ?? 0;
  return displayDelimiterCount % 2 === 1;
}

function isCodeLikeEquation(text: string, startIndex: number, endIndex: number) {
  const lineStart = text.lastIndexOf("\n", startIndex) + 1;
  const lineEndIndex = text.indexOf("\n", endIndex);
  const lineEnd = lineEndIndex === -1 ? text.length : lineEndIndex;
  const line = text.slice(lineStart, lineEnd);
  const nextChar = text[endIndex] ?? "";

  return (
    nextChar === "." ||
    nextChar === "(" ||
    /\b(import|from|const|let|var|return|def|class)\b/.test(line) ||
    /[A-Za-z_][\w]*\s*=\s*[A-Za-z_][\w]*\s*[.(]/.test(line) ||
    /[A-Za-z_][\w]*\.[A-Za-z_][\w]*/.test(line)
  );
}

function isCodeLike(value: string) {
  return (
    /\b(import|from|const|let|var|return|def|class|function|console|print)\b/.test(value) ||
    /[A-Za-z_][\w]*\.[A-Za-z_][\w]*/.test(value) ||
    /\b(np|torch|tf|nn|Math)\s*\./.test(value) ||
    /;/.test(value)
  );
}

function isBrokenCodeLine(value: string) {
  const trimmed = value.trim();
  if ((!trimmed.includes("$") && !hasRawLatexCommand(trimmed)) || !isCodeLike(trimmed)) return false;

  return (
    /^(import|from|const|let|var|return|def|class|print|console\.)\b/.test(trimmed) ||
    /^[A-Za-z_][\w]*\s*=/.test(trimmed)
  );
}

function hasRawLatexCommand(value: string) {
  return /\\+(?:quad|text|frac|sum|cdot|begin|end)\b/.test(value);
}

function codeFenceLanguage(value: string) {
  return /\b(import|from|def|print|np\.|torch\.|tf\.)\b/.test(value) ? "python" : "ts";
}

function cleanBrokenCodeLine(value: string) {
  return value
    .replace(/\b(np|torch|tf)\$([A-Za-z_])/g, "$1.$2")
    .replace(/\\+quad\s+\\*text\{([^{}]*)\}/g, "  # $1")
    .replace(/\\+quad\s+\\*text\(([^()]*)\)/g, "  # $1")
    .replace(/\\+text\{([^{}]*)\}/g, "# $1")
    .replace(/\\+,/g, " ")
    .replace(/\$/g, "")
    .trim();
}

function isMathLike(value: string) {
  return (
    /^[A-Za-z][A-Za-z0-9_]*$/.test(value.trim()) ||
    /^\([A-Za-z0-9_,\s]+\)$/.test(value.trim()) ||
    /^\[[0-9.,\s+-]+\]$/.test(value.trim()) ||
    /[@=+\-*/^]/.test(value) ||
    /\bd[A-Z][A-Za-z0-9]*\/d[A-Za-z][A-Za-z0-9]*\b/.test(value) ||
    (/[A-Za-z][A-Za-z0-9_]*\s*=/.test(value) && !isCodeLikeEquation(value, 0, value.length)) ||
    /\\[a-zA-Z]+/.test(value)
  );
}

function isMathLine(value: string) {
  const trimmed = value.trim();
  if ((!trimmed.includes("$") && !hasRawLatexCommand(trimmed)) || isCodeLike(trimmed)) return false;
  return /(?:=|@|\\+quad|\\+text|->|→|⇒|\[[^\]]+\])/.test(trimmed);
}

function isLatexEnvironmentLine(value: string) {
  const trimmed = value.trim();
  const environment = trimmed.match(/\\begin\{([a-zA-Z*]+)\}/)?.[1];
  return Boolean(environment && trimmed.includes(`\\end{${environment}}`));
}

function containsPartialLatexEnvironment(value: string) {
  return /\\(?:begin|end)$/.test(value.trim());
}

function escapeLatexText(value: string) {
  return value
    .replace(/\\/g, "\\textbackslash{}")
    .replace(/([{}$&#_^%])/g, "\\$1")
    .replace(/~/g, "\\textasciitilde{}");
}

function canRenderMath(value: string) {
  try {
    katex.renderToString(value, { strict: "ignore", throwOnError: true });
    return true;
  } catch {
    return false;
  }
}

function isProbablyProseMath(value: string) {
  const text = value
    .replace(/\\(?:text|mathrm)\{([^{}]*)\}/g, "$1")
    .replace(/\\[a-zA-Z]+(?:\{[^{}]*\})?/g, " ")
    .replace(/[_^=+\-*/()[\]{}.,;:0-9]/g, " ");
  const words = text.match(/\b[A-Za-z]{3,}\b/g) ?? [];

  return words.length >= 4 && /\b(?:the|and|with|when|where|that|this|default|training|model|models|learning|requires|works|well)\b/i.test(text);
}

function proseFromMath(value: string) {
  return value
    .replace(/\\eta\b/g, "η")
    .replace(/\\beta\b/g, "β")
    .replace(/\\alpha\b/g, "α")
    .replace(/\\gamma\b/g, "γ")
    .replace(/\\theta\b/g, "θ")
    .replace(/\\lambda\b/g, "λ")
    .replace(/\\epsilon\b/g, "ε")
    .replace(/\\(?:text|mathrm)\{([^{}]*)\}/g, "$1")
    .replace(/\\,/g, " ")
    .replace(/\\/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

function inlineMathOrText(formula: string) {
  return isProbablyProseMath(formula) ? proseFromMath(formula) : `$${safeMath(formula)}$`;
}

function displayMathOrText(formula: string) {
  return isProbablyProseMath(formula) ? proseFromMath(formula) : `\n$$\n${safeMath(formula)}\n$$\n`;
}

function safeMath(value: string) {
  const normalized = normalizeMath(value);
  if (!normalized) return "";
  if (canRenderMath(normalized)) return normalized;

  const fallback = `\\text{${escapeLatexText(value.replace(/\$/g, "").trim())}}`;
  return canRenderMath(fallback) ? fallback : "\\text{Unrenderable math}";
}

function normalizeMath(value: string) {
  return value
    .trim()
    .replace(/\\,/g, " ")
    .replace(/\\\s*([@()[\],])/g, "$1")
    .replace(/\$/g, "")
    .replace(/[→⇒]/g, "\\to")
    .replace(/->/g, "\\to")
    .replace(/\\text\(([^()]*)\)/g, (_, body: string) => `\\text{${body.replace(/[{}]/g, "")}}`)
    .replace(/\\quad\s+\\?text\((.*)\)$/g, (_, body: string) => `\\quad \\text{${body.replace(/[{}]/g, "")}}`)
    .replace(/\\text\{\{([^{}]+)\}\}/g, "\\text{$1}")
    .replace(/\bd([A-Z][A-Za-z0-9]*)_d([A-Za-z][A-Za-z0-9]*)\b/g, "d$1/d$2")
    .replace(/\bd([A-Z][A-Za-z0-9]*)\/d([A-Za-z][A-Za-z0-9]*)\b/g, "\\frac{d$1}{d$2}")
    .replace(/\blim\s*\(\s*([A-Za-z])\s*\\to\s*([^)]+)\)/g, "\\lim_{$1 \\to $2}")
    .replace(/\[([^\]]+)\]\s*\/\s*([A-Za-z][A-Za-z0-9]*)/g, "\\frac{$1}{$2}")
    .replace(/\s+#\s*(.+)$/gm, (_, comment: string) => `\\quad \\text{${escapeLatexText(comment.trim())}}`)
    .replace(/\*/g, "\\cdot ");
}

const MATH_TOKEN = String.raw`(?:\\[a-zA-Z]+|[A-Za-z0-9_]+(?:\^[A-Za-z0-9{}]+)?|\([^)]+\))`;
const INLINE_EQUATION_PATTERN = new RegExp(
  String.raw`\b([A-Za-z][A-Za-z0-9_]*\s*=\s*${MATH_TOKEN}(?:\s*[+\-*/]\s*${MATH_TOKEN})*)`,
  "g",
);

function textFromNode(node: ReactNode): string {
  if (typeof node === "string" || typeof node === "number") return String(node);
  if (Array.isArray(node)) return node.map(textFromNode).join("");
  if (isValidElement<{ children?: ReactNode }>(node)) return textFromNode(node.props.children);
  return "";
}

function CodeBlock({ children }: { children?: ReactNode }) {
  const [copied, setCopied] = useState(false);
  const codeText = textFromNode(children).replace(/\n$/, "");

  async function copyCode() {
    if (!codeText) return;

    await navigator.clipboard.writeText(codeText);
    setCopied(true);
    window.setTimeout(() => setCopied(false), 1400);
  }

  return (
    <div className="lesson-code-frame">
      <button type="button" className="lesson-code-copy" onClick={copyCode}>
        {copied ? "Copied" : "Copy"}
      </button>
      <pre>{children}</pre>
    </div>
  );
}

const BLOCK_COMPONENTS: Components = { pre: CodeBlock };
const INLINE_COMPONENTS: Components = {
  pre: CodeBlock,
  p({ children }) {
    return <>{children}</>;
  },
};

function normalizeMathLines(
  text: string,
  protectGeneratedCode: (code: string, language: string) => string,
) {
  let isDisplayMath = false;

  return text
    .split("\n")
    .map((line) => {
      if (line.trim() === "$$") {
        isDisplayMath = !isDisplayMath;
        return line;
      }

      if (isDisplayMath) return line;

      if (isBrokenCodeLine(line)) {
        return protectGeneratedCode(cleanBrokenCodeLine(line), codeFenceLanguage(line));
      }

      if (isLatexEnvironmentLine(line) || isMathLine(line)) {
        return `\n$$\n${safeMath(line)}\n$$\n`;
      }

      return line;
    })
    .join("\n");
}

function protectInlineMath(text: string) {
  const { protectedText, protectGeneratedCode, restore } = protectFencedCode(text.replace(/\\"/g, "\""));

  const normalizedDelimitedMath = protectedText
    .replace(/\\\$\\\$([\s\S]*?)\\\$\\\$/g, (_, formula: string) => displayMathOrText(formula))
    .replace(/\\\$([^$\n]+?)\\\$/g, (_, formula: string) => inlineMathOrText(formula))
    .replace(/\\\[([\s\S]*?)\\\]/g, (_, formula: string) => displayMathOrText(formula))
    .replace(/\$\$([\s\S]*?)\$\$/g, (_, formula: string) => displayMathOrText(formula));

  const markdownWithNormalizedSpans = normalizeMathLines(normalizedDelimitedMath, protectGeneratedCode)
    .replace(/\\\(([^()\n]+)\\\)/g, (_, formula: string) => `$${safeMath(formula)}$`)
    .replace(/\$([^$\n]+)\$/g, (_, formula: string) => inlineMathOrText(formula))
    .replace(/\$([^$\n]+)\$\s*=\s*lim\s*\(([^)]+)\)\s*([^.\n]+)/g, (_, left: string, limit: string, rest: string) => (
      `$$\n${safeMath(`${left} = lim(${limit}) ${rest}`)}\n$$`
    ))
    .replace(/`([^`\n]+)`/g, (match, code: string) => (
      isMathLike(code) && !isCodeLike(code) ? `$${safeMath(code)}$` : match
    ));

  const normalizedMath = markdownWithNormalizedSpans
    .replace(/\b(d[A-Z][A-Za-z0-9]*\/d[A-Za-z][A-Za-z0-9]*)\b/g, (match, formula: string, offset: number) => (
      hasMathDelimiter(markdownWithNormalizedSpans, offset, offset + formula.length) ? match : `$${formula}$`
    ))
    .replace(INLINE_EQUATION_PATTERN, (match, formula: string, offset: number) => (
      hasMathDelimiter(markdownWithNormalizedSpans, offset, offset + formula.length) ||
        isCodeLikeEquation(markdownWithNormalizedSpans, offset, offset + formula.length) ||
        containsPartialLatexEnvironment(formula)
        ? match
        : `$${safeMath(formula)}$`
    ));

  return restore(normalizedMath.replace(/^\s*\$([^$\n]+)\$\s*$/gm, (_, formula: string) => (
    displayMathOrText(formula)
  )));
}

export function LatexRenderer({ text, style, inline = false }: Props) {
  if (!text) return null;

  const baseStyle = inline ? inlineTextStyle : textStyle;
  const merged = style ? { ...baseStyle, ...style } : baseStyle;
  const Element = inline ? "span" : "div";
  const aiContext = JSON.stringify({
    type: "markdown_latex",
    source: text,
  });

  return (
    <Element
      style={merged}
      className={`lesson-prose${inline ? " lesson-prose-inline" : ""}`}
      data-ai-context={aiContext}
      data-ai-kind="text"
      data-ai-text={text}
    >
      <ReactMarkdown
        remarkPlugins={REMARK_PLUGINS}
        rehypePlugins={REHYPE_PLUGINS}
        components={inline ? INLINE_COMPONENTS : BLOCK_COMPONENTS}
      >
        {protectInlineMath(text)}
      </ReactMarkdown>
    </Element>
  );
}
