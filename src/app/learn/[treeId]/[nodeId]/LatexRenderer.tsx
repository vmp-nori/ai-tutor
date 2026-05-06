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

export function LatexRenderer({ text, style }: Props) {
  if (!text) return null;

  const merged = style ? { ...textStyle, ...style } : textStyle;

  return (
    <div style={merged} className="lesson-prose">
      <ReactMarkdown
        remarkPlugins={REMARK_PLUGINS}
        rehypePlugins={REHYPE_PLUGINS}
      >
        {text}
      </ReactMarkdown>
    </div>
  );
}
