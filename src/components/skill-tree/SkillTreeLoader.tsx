"use client";

import dynamic from "next/dynamic";
import type { SkillNode, SkillEdge } from "@/lib/types";

const SkillTreeCanvas = dynamic(
  () =>
    import("./SkillTreeCanvas").then((m) => m.SkillTreeCanvas),
  { ssr: false },
);

interface SkillTreeLoaderProps {
  nodes: SkillNode[];
  edges: SkillEdge[];
  subject: string;
}

export function SkillTreeLoader(props: SkillTreeLoaderProps) {
  return <SkillTreeCanvas {...props} />;
}
