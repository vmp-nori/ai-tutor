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
  | "comparison_table";

export interface LessonDiagram {
  type: DiagramType;
  title: string;
  spec: Record<string, unknown>;
  sectionIndex?: number;
}

export interface GeneratedLesson {
  title: string;
  sections: LessonSection[];
  workedExample: LessonSection;
  misconceptions: string[];
  tryThis: string;
  diagrams?: LessonDiagram[];
}
