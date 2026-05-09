export type NodeStatus = "locked" | "available" | "current" | "completed";

export interface TeachingPlan {
  objective: string;
  goalContext: string;
  focusPoints: string[];
  avoid: string[];
  interactiveHint?: string;
}

export interface SkillNode {
  id: string;
  treeId: string;
  name: string;
  description: string;
  status: NodeStatus;
  x: number;
  y: number;
  prereqs: string[];
  teachingBrief?: string;
  teachingPlan?: TeachingPlan;
  difficultyLevel?: number;
  subTopics?: string[];
  isCheckpoint?: boolean;
  zone?: string;
  zoneColor?: string;
}

export interface SkillEdge {
  id: string;
  treeId: string;
  fromNodeId: string;
  toNodeId: string;
}

export interface SkillTree {
  id: string;
  userId: string;
  subject: string;
  goal: string;
  nodes: SkillNode[];
  edges: SkillEdge[];
  createdAt: Date;
  updatedAt: Date;
}

export interface LessonSection {
  heading: string;
  body: string;
}

export type DiagramType =
  | "function_plot"
  | "number_line"
  | "bar_chart"
  | "line_chart"
  | "step_sequence"
  | "comparison_table"
  | "parameterized_sim";

export interface LessonDiagram {
  type: DiagramType;
  title: string;
  spec: Record<string, unknown>;
}

export interface CoverSlide {
  kind: "cover";
  title: string;
  lede: string;
  meta: {
    estTime: string;
    difficulty: string;
  };
}

export interface ConceptSlide {
  kind: "concept";
  eyebrow: string;
  heading: string;
  lede?: string;
  body: string;
  diagram?: LessonDiagram;
}

export interface CompareSlide {
  kind: "compare";
  eyebrow: string;
  heading: string;
  lede?: string;
  left: {
    label: string;
    body: string;
  };
  right: {
    label: string;
    body: string;
  };
  summary?: string;
}

export interface WorkedExampleSlide {
  kind: "workedExample";
  eyebrow: string;
  heading: string;
  problem: string;
  solution: string;
  diagram?: LessonDiagram;
}

export interface MisconceptionsSlide {
  kind: "misconceptions";
  eyebrow: string;
  heading: string;
  items: Array<{
    wrong: string;
    right: string;
  }>;
}

export interface TryThisSlide {
  kind: "tryThis";
  eyebrow: string;
  heading: string;
  prompt: string;
  hint?: string;
}

export interface WrapUpSlide {
  kind: "wrapUp";
  eyebrow: string;
  heading: string;
  keyIdeas: string[];
  nextHook?: string;
}

export type LessonSlide =
  | CoverSlide
  | ConceptSlide
  | CompareSlide
  | WorkedExampleSlide
  | MisconceptionsSlide
  | TryThisSlide
  | WrapUpSlide;

export type LessonSlideKind = LessonSlide["kind"];

export interface GeneratedLesson {
  schemaVersion: 2;
  styleVersion: 1;
  title: string;
  slides: LessonSlide[];
}
