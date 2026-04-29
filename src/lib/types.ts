export type NodeStatus = "locked" | "available" | "current" | "completed";

export interface SkillNode {
  id: string;
  treeId: string;
  name: string;
  description: string;
  status: NodeStatus;
  x: number;
  y: number;
  prereqs: string[];
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
