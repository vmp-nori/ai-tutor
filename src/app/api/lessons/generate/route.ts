import {
  BedrockRuntimeClient,
  ConverseCommand,
  type ConverseCommandOutput,
} from "@aws-sdk/client-bedrock-runtime";
import { NextRequest, NextResponse } from "next/server";
import { createClient, hasSupabaseConfig } from "@/lib/supabase/server";
import type { GeneratedLesson, LessonDiagram, LessonSection, TeachingPlan } from "@/lib/types";

export const runtime = "nodejs";

interface LessonRequest {
  treeId?: unknown;
  nodeId?: unknown;
}

interface StoredTree {
  id: string;
  subject: string;
  goal: string;
}

interface StoredNode {
  id: string;
  tree_id: string;
  name: string;
  description: string;
  teaching_brief?: string | null;
  teaching_plan?: unknown;
}

interface StoredPrerequisite {
  id: string;
  name: string;
  description: string;
}

const DEFAULT_MODEL = "us.anthropic.claude-haiku-4-5-20251001-v1:0";
const DEFAULT_REGION = "us-east-1";
const MAX_ID_LENGTH = 180;

const lessonJsonSchema = {
  type: "object",
  additionalProperties: false,
  properties: {
    title: { type: "string" },
    sections: {
      type: "array",
      items: {
        type: "object",
        additionalProperties: false,
        properties: {
          heading: { type: "string" },
          body: { type: "string" },
        },
        required: ["heading", "body"],
      },
    },
    worked_example: {
      type: "object",
      additionalProperties: false,
      properties: {
        heading: { type: "string" },
        body: { type: "string" },
      },
      required: ["heading", "body"],
    },
    misconceptions: {
      type: "array",
      items: { type: "string" },
    },
    try_this: { type: "string" },
    diagram: {
      type: "object",
      additionalProperties: false,
      properties: {
        title: { type: "string" },
        height: { type: "integer" },
        html: { type: "string" },
      },
      required: ["title", "height", "html"],
    },
  },
  required: ["title", "sections", "worked_example", "misconceptions", "try_this"],
};

const SYSTEM_PROMPT = `You are Pathwise's teaching agent.

Create one short, focused lesson for a single atomic concept inside a larger learning goal. Return only valid JSON matching the schema.

Rules:
- Teach only the requested concept, using the provided teaching plan and prerequisite context.
- Keep the lesson compact. Do not write a chapter or course module.
- Tie the explanation to the learner's final goal whenever it helps.
- Avoid the listed detours and over-advanced theory.
- Include 2 to 4 lesson sections.
- Include one concrete worked example.
- Include 2 to 4 common misconceptions.
- Include one small "try this" prompt, but do not quiz or grade the learner.
- Include diagram only if an interactive visual materially helps the concept.
- If including diagram, diagram.html must be a self-contained HTML body snippet using inline CSS, SVG or canvas, and vanilla JavaScript only.
- Diagram code must not use external scripts, external stylesheets, external images, fetch, XMLHttpRequest, WebSocket, EventSource, localStorage, sessionStorage, cookies, forms, iframes, object/embed tags, or links.
- Diagram code must fit in a constrained lesson pane and must work without network access.
- If no diagram is useful, omit the diagram key.
- Do not include markdown, code fences, comments, or text outside the JSON object.`;

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function isAwsServiceError(error: unknown): error is Error & {
  $metadata?: { httpStatusCode?: number };
} {
  return error instanceof Error && "$metadata" in error;
}

function trimString(value: unknown, maxLength: number) {
  if (typeof value !== "string") return "";
  return value.trim().slice(0, maxLength);
}

function stringArray(value: unknown, maxItems: number, maxLength: number) {
  if (!Array.isArray(value)) return [];
  return value
    .filter((item): item is string => typeof item === "string")
    .map((item) => item.trim().slice(0, maxLength))
    .filter(Boolean)
    .slice(0, maxItems);
}

function normalizeTeachingPlan(value: unknown, node: StoredNode): TeachingPlan {
  if (!isRecord(value)) {
    const fallback = node.teaching_brief?.trim() || node.description;
    return {
      objective: node.description,
      goalContext: fallback,
      focusPoints: [node.description],
      avoid: [],
    };
  }

  return {
    objective: trimString(value.objective, 600) || node.description,
    goalContext: trimString(value.goalContext ?? value.goal_context, 800) || node.teaching_brief?.trim() || node.description,
    focusPoints: stringArray(value.focusPoints ?? value.focus_points, 6, 240),
    avoid: stringArray(value.avoid, 5, 240),
    ...(trimString(value.interactiveHint ?? value.interactive_hint, 600)
      ? { interactiveHint: trimString(value.interactiveHint ?? value.interactive_hint, 600) }
      : {}),
  };
}

function getBedrockClient() {
  const region = process.env.AWS_BEDROCK_REGION?.trim() || process.env.AWS_REGION?.trim() || DEFAULT_REGION;
  const bearerToken = process.env.AWS_BEARER_TOKEN_BEDROCK?.trim();

  if (bearerToken) {
    return new BedrockRuntimeClient({
      region,
      token: { token: bearerToken },
    });
  }

  return new BedrockRuntimeClient({ region });
}

function buildLessonPrompt({
  tree,
  node,
  teachingPlan,
  prerequisites,
}: {
  tree: StoredTree;
  node: StoredNode;
  teachingPlan: TeachingPlan;
  prerequisites: StoredPrerequisite[];
}) {
  const prerequisiteText = prerequisites.length > 0
    ? prerequisites.map((item) => `- ${item.name}: ${item.description}`).join("\n")
    : "- None";

  return `Subject: ${tree.subject}
Final goal: ${tree.goal}

Concept to teach:
- Name: ${node.name}
- Description: ${node.description}

Prerequisites already introduced:
${prerequisiteText}

Teaching plan:
- Objective: ${teachingPlan.objective}
- Goal context: ${teachingPlan.goalContext}
- Focus points: ${teachingPlan.focusPoints.length > 0 ? teachingPlan.focusPoints.join("; ") : node.description}
- Avoid: ${teachingPlan.avoid.length > 0 ? teachingPlan.avoid.join("; ") : "No specific detours listed."}
- Interactive hint: ${teachingPlan.interactiveHint || "Only include a diagram if the concept is genuinely visual or interactive."}`;
}

function buildBedrockCommand(prompt: string) {
  const modelId = process.env.BEDROCK_MODEL_ID?.trim() || DEFAULT_MODEL;

  return new ConverseCommand({
    modelId,
    system: [{ text: SYSTEM_PROMPT }],
    messages: [
      {
        role: "user",
        content: [{ text: prompt }],
      },
    ],
    inferenceConfig: {
      maxTokens: 10000,
      temperature: 0.45,
    },
    outputConfig: {
      textFormat: {
        type: "json_schema",
        structure: {
          jsonSchema: {
            name: "pathwise_lesson",
            description: "A short Pathwise lesson for one concept.",
            schema: JSON.stringify(lessonJsonSchema),
          },
        },
      },
    },
  });
}

function responseText(value: ConverseCommandOutput) {
  const content = value.output?.message?.content ?? [];
  return content
    .map((item) => ("text" in item && typeof item.text === "string" ? item.text : ""))
    .join("")
    .trim();
}

function extractJson(text: string) {
  if (!text) return "";
  const start = text.indexOf("{");
  const end = text.lastIndexOf("}");
  return start >= 0 && end > start ? text.slice(start, end + 1) : text;
}

function lessonSection(value: unknown, fallbackHeading: string): LessonSection {
  if (!isRecord(value)) return { heading: fallbackHeading, body: "" };
  return {
    heading: trimString(value.heading, 140) || fallbackHeading,
    body: trimString(value.body, 1800),
  };
}

function lessonDiagram(value: unknown): LessonDiagram | undefined {
  if (!isRecord(value)) return undefined;
  const html = trimString(value.html, 14000);
  if (!html) return undefined;

  return {
    title: trimString(value.title, 140) || "Interactive diagram",
    height: Math.max(240, Math.min(680, typeof value.height === "number" ? value.height : 420)),
    html,
  };
}

function normalizeLesson(value: unknown, node: StoredNode): GeneratedLesson {
  if (!isRecord(value)) {
    throw new Error("Lesson response was not a JSON object");
  }

  const sections = Array.isArray(value.sections)
    ? value.sections.map((item, index) => lessonSection(item, `Part ${index + 1}`)).filter((item) => item.body)
    : [];

  return {
    title: trimString(value.title, 180) || node.name,
    sections: sections.length > 0
      ? sections
      : [{ heading: node.name, body: node.description }],
    workedExample: lessonSection(value.worked_example ?? value.workedExample, "Worked example"),
    misconceptions: stringArray(value.misconceptions, 4, 320),
    tryThis: trimString(value.try_this ?? value.tryThis, 800),
    ...(lessonDiagram(value.diagram) ? { diagram: lessonDiagram(value.diagram) } : {}),
  };
}

function isMissingNodeMetadataError(message: string) {
  return (
    message.includes("Could not find the 'teaching_brief' column of 'skill_nodes'") ||
    message.includes("Could not find the 'teaching_plan' column of 'skill_nodes'") ||
    message.includes("column skill_nodes.teaching_brief does not exist") ||
    message.includes("column skill_nodes.teaching_plan does not exist")
  );
}

function nodeIdCandidates(treeId: string, nodeId: string) {
  const prefix = `${treeId}_`;
  const candidates = [nodeId];

  if (nodeId.startsWith(prefix)) {
    candidates.push(nodeId.slice(prefix.length));
  } else {
    candidates.push(`${prefix}${nodeId}`);
  }

  return Array.from(new Set(candidates.filter(Boolean)));
}

function pickCandidateNode<T extends { id: string }>(nodes: T[] | null, candidates: string[]) {
  if (!nodes || nodes.length === 0) return null;
  return candidates.map((candidate) => nodes.find((node) => node.id === candidate)).find(Boolean) ?? null;
}

async function fetchStoredNode(
  supabase: Awaited<ReturnType<typeof createClient>>,
  treeId: string,
  nodeId: string,
) {
  const candidates = nodeIdCandidates(treeId, nodeId);
  const richResult = await supabase
    .from("skill_nodes")
    .select("id, tree_id, name, description, teaching_brief, teaching_plan")
    .eq("tree_id", treeId)
    .in("id", candidates);

  if (!richResult.error) {
    return { data: pickCandidateNode(richResult.data, candidates), error: null };
  }

  if (!isMissingNodeMetadataError(richResult.error.message)) {
    return richResult;
  }

  const legacyResult = await supabase
    .from("skill_nodes")
    .select("id, tree_id, name, description, teaching_brief")
    .eq("tree_id", treeId)
    .in("id", candidates);

  if (!legacyResult.error) {
    return { data: pickCandidateNode(legacyResult.data, candidates), error: null };
  }

  if (!isMissingNodeMetadataError(legacyResult.error.message)) {
    return legacyResult;
  }

  const baseResult = await supabase
    .from("skill_nodes")
    .select("id, tree_id, name, description")
    .eq("tree_id", treeId)
    .in("id", candidates);

  if (!baseResult.error) {
    return { data: pickCandidateNode(baseResult.data, candidates), error: null };
  }

  return baseResult;
}

export async function POST(req: NextRequest) {
  try {
    if (!hasSupabaseConfig()) {
      return NextResponse.json({ error: "Supabase is not configured" }, { status: 503 });
    }

    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = (await req.json()) as LessonRequest;
    const treeId = trimString(body.treeId, MAX_ID_LENGTH);
    const nodeId = trimString(body.nodeId, MAX_ID_LENGTH);

    if (!treeId || !nodeId) {
      return NextResponse.json({ error: "treeId and nodeId are required" }, { status: 400 });
    }

    const { data: tree, error: treeError } = await supabase
      .from("skill_trees")
      .select("id, subject, goal")
      .eq("id", treeId)
      .eq("user_id", user.id)
      .single();

    if (treeError || !tree) {
      return NextResponse.json({ error: "Learning path was not found" }, { status: 404 });
    }

    const { data: node, error: nodeError } = await fetchStoredNode(supabase, treeId, nodeId);
    if (nodeError || !node) {
      return NextResponse.json({ error: "Concept was not found" }, { status: 404 });
    }

    const { data: prerequisiteEdges } = await supabase
      .from("skill_edges")
      .select("from_node_id")
      .eq("tree_id", treeId)
      .eq("to_node_id", nodeId);

    const prerequisiteIds = (prerequisiteEdges ?? [])
      .map((edge) => edge.from_node_id)
      .filter((id): id is string => typeof id === "string");

    const { data: prerequisites } = prerequisiteIds.length > 0
      ? await supabase
          .from("skill_nodes")
          .select("id, name, description")
          .in("id", prerequisiteIds)
      : { data: [] };

    const teachingPlan = normalizeTeachingPlan((node as StoredNode).teaching_plan, node as StoredNode);
    const bedrockResponse = await getBedrockClient().send(
      buildBedrockCommand(buildLessonPrompt({
        tree: tree as StoredTree,
        node: node as StoredNode,
        teachingPlan,
        prerequisites: (prerequisites ?? []) as StoredPrerequisite[],
      })),
      { abortSignal: AbortSignal.timeout(45_000) },
    );

    const lessonText = responseText(bedrockResponse);
    const parsed = JSON.parse(extractJson(lessonText));
    const lesson = normalizeLesson(parsed, node as StoredNode);

    return NextResponse.json(lesson, {
      headers: {
        "Cache-Control": "no-store",
        "X-Content-Type-Options": "nosniff",
      },
    });
  } catch (error) {
    if (error instanceof DOMException && error.name === "TimeoutError") {
      return NextResponse.json({ error: "Request timed out" }, { status: 504 });
    }

    if (error instanceof SyntaxError) {
      console.error("Bedrock lesson response was not valid JSON", error);
      return NextResponse.json({ error: "Lesson response could not be parsed" }, { status: 502 });
    }

    if (isAwsServiceError(error)) {
      console.error("Bedrock lesson generation failed", error);
      const status = error.$metadata?.httpStatusCode;
      return NextResponse.json(
        { error: error.message || "Lesson generation service rejected the request" },
        { status: status && status >= 400 && status < 500 ? 502 : 503 },
      );
    }

    console.error("Lesson generation failed", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
