"use client";

import dynamic from "next/dynamic";
import type { SkillNode, SkillEdge } from "@/lib/types";
import type { LearningPathNavItem } from "@/components/ui/TopBar";

const SkillTreeCanvas = dynamic(
  () =>
    import("./SkillTreeCanvas").then((m) => m.SkillTreeCanvas),
  { ssr: false },
);

interface SkillTreeLoaderProps {
  nodes: SkillNode[];
  edges: SkillEdge[];
  subject: string;
  initialSchema?: string;
  learningPaths?: LearningPathNavItem[];
}

export function SkillTreeLoader(props: SkillTreeLoaderProps) {
  return <SkillTreeCanvas {...props} />;
}
