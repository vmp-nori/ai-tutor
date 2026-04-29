import { NextRequest, NextResponse } from "next/server";

export interface GenerateRequest {
  subject: string;
  goal: string;
  userId?: string;
}

// POST /api/skill-tree/generate
// Accepts a subject + goal, returns a structured skill tree (nodes + edges)
export async function POST(req: NextRequest) {
  try {
    const body = (await req.json()) as GenerateRequest;
    const { subject, goal } = body;

    if (!subject || !goal) {
      return NextResponse.json(
        { error: "subject and goal are required" },
        { status: 400 },
      );
    }

    // TODO: call Anthropic API to generate the skill tree DAG
    // The prompt should instruct Claude to:
    // 1. Decompose the goal into atomic prerequisite concepts
    // 2. Arrange them into a valid DAG (no cycles)
    // 3. Return structured JSON: { nodes: SkillNode[], edges: SkillEdge[] }
    // 4. Assign initial layout positions (x, y) for each node

    return NextResponse.json(
      { error: "Skill tree generation not yet implemented" },
      { status: 501 },
    );
  } catch {
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
