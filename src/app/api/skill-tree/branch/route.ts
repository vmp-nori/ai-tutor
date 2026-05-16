import {
  BedrockRuntimeClient,
  ConverseCommand,
  type ConverseCommandOutput,
} from "@aws-sdk/client-bedrock-runtime";
import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { NextRequest, NextResponse } from "next/server";
import {
  collectStringValues,
  detectNsfwCourseContent,
  detectNsfwGenerationRefusal,
  detectProhibitedCourseContent,
  detectProhibitedGenerationRefusal,
  NSFW_COURSE_ERROR,
  PROHIBITED_COURSE_ERROR,
} from "@/lib/contentSafety";
import { createClient, hasSupabaseConfig } from "@/lib/supabase/server";
import type { TeachingPlan } from "@/lib/types";

export const runtime = "nodejs";

type LessonPromptCategory = "math_and_logic" | "systems_and_economics" | "technical_and_code";

interface BranchRequest {
  treeId?: unknown;
  anchorNodeId?: unknown;
  prompt?: unknown;
  selectedText?: unknown;
  selectedContext?: unknown;
  trigger?: unknown;
}

interface StoredTree {
  id: string;
  subject: string;
  goal: string;
}

interface StoredNode {
  id: string;
  name: string;
  description: string;
  category?: LessonPromptCategory | null;
  teaching_brief?: string | null;
  position_x: number;
  position_y: number;
}

interface GeneratedBranchNode {
  id?: unknown;
  name?: unknown;
  description?: unknown;
  category?: unknown;
  teaching_brief?: unknown;
  teaching?: unknown;
  difficulty_level?: unknown;
  is_checkpoint?: unknown;
  zone?: unknown;
  zone_color?: unknown;
}

interface BranchNodeInsert {
  id: string;
  tree_id: string;
  name: string;
  description: string;
  category: LessonPromptCategory;
  teaching_brief: string;
  teaching_plan: TeachingPlan | null;
  difficulty_level: number;
  is_checkpoint: boolean;
  zone: string;
  zone_color: string;
  position_x: number;
  position_y: number;
  position_z: number;
  is_branch: boolean;
  branch_anchor_node_id: string;
  branch_group_id: string;
  branch_label: string;
}

type MinimalBranchNodeInsert = Pick<
  BranchNodeInsert,
  | "id"
  | "tree_id"
  | "name"
  | "description"
  | "position_x"
  | "position_y"
  | "is_branch"
  | "branch_anchor_node_id"
  | "branch_group_id"
  | "branch_label"
>;

const DEFAULT_MODEL = "arn:aws:bedrock:us-east-1:393459799930:inference-profile/global.anthropic.claude-sonnet-4-6";
const DEFAULT_REGION = "us-east-1";
const SYSTEM_PROMPT_PATH = join(process.cwd(), "prompts", "branchgeneration.txt");
const MAX_ID_LENGTH = 180;
const MAX_PROMPT_LENGTH = 700;
const MAX_SELECTED_TEXT_LENGTH = 5000;
const MAX_BRANCH_NODES = 10;
const CATEGORIES = new Set<LessonPromptCategory>([
  "math_and_logic",
  "systems_and_economics",
  "technical_and_code",
]);

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function trimString(value: unknown, maxLength: number) {
  if (typeof value !== "string") return "";
  return value.trim().slice(0, maxLength);
}

function cleanString(value: unknown, fallback: string, maxLength: number) {
  const trimmed = trimString(value, maxLength);
  return trimmed || fallback;
}

function cleanId(value: unknown, fallback: string) {
  return cleanString(value, fallback, 80)
    .toLowerCase()
    .replace(/[^a-z0-9_]+/g, "_")
    .replace(/^_+|_+$/g, "") || fallback;
}

function integer(value: unknown, fallback: number) {
  return typeof value === "number" && Number.isInteger(value) ? value : fallback;
}

function stringArray(value: unknown, maxItems: number, maxLength: number) {
  if (!Array.isArray(value)) return [];
  return value
    .filter((item): item is string => typeof item === "string")
    .map((item) => item.trim().slice(0, maxLength))
    .filter(Boolean)
    .slice(0, maxItems);
}

function category(value: unknown, fallback: LessonPromptCategory): LessonPromptCategory {
  return typeof value === "string" && CATEGORIES.has(value as LessonPromptCategory)
    ? value as LessonPromptCategory
    : fallback;
}

function cleanTeachingPlan(value: unknown, fallbackBrief: string, fallbackDescription: string): TeachingPlan | null {
  if (!isRecord(value)) {
    return {
      objective: fallbackDescription || fallbackBrief,
      goalContext: fallbackBrief || fallbackDescription,
      focusPoints: [fallbackDescription || fallbackBrief],
      avoid: [],
    };
  }

  const objective = cleanString(value.objective, fallbackDescription || fallbackBrief, 500);
  const goalContext = cleanString(value.goal_context ?? value.goalContext, fallbackBrief, 700);
  const focusPoints = stringArray(value.focus_points ?? value.focusPoints, 5, 220);
  const avoid = stringArray(value.avoid, 4, 220);
  const interactiveHint = trimString(value.interactive_hint ?? value.interactiveHint, 500);

  return {
    objective,
    goalContext,
    focusPoints,
    avoid,
    ...(interactiveHint ? { interactiveHint } : {}),
  };
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

function isMissingAnchorMetadataError(message: string) {
  return (
    message.includes("Could not find the 'category' column of 'skill_nodes'") ||
    message.includes("Could not find the 'teaching_brief' column of 'skill_nodes'") ||
    message.includes("column skill_nodes.category does not exist") ||
    message.includes("column skill_nodes.teaching_brief does not exist")
  );
}

function pickCandidateNode<T extends { id: string }>(nodes: T[] | null, candidates: string[]) {
  if (!nodes || nodes.length === 0) return null;
  return candidates.map((candidate) => nodes.find((node) => node.id === candidate)).find(Boolean) ?? null;
}

async function fetchAnchorNode({
  supabase,
  treeId,
  anchorNodeId,
}: {
  supabase: Awaited<ReturnType<typeof createClient>>;
  treeId: string;
  anchorNodeId: string;
}) {
  const candidates = nodeIdCandidates(treeId, anchorNodeId);
  const richResult = await supabase
    .from("skill_nodes")
    .select("id, name, description, category, teaching_brief, position_x, position_y")
    .eq("tree_id", treeId)
    .in("id", candidates);

  if (!richResult.error) {
    return { data: pickCandidateNode(richResult.data, candidates), error: null };
  }

  if (!isMissingAnchorMetadataError(richResult.error.message)) {
    return richResult;
  }

  const teachingBriefResult = await supabase
    .from("skill_nodes")
    .select("id, name, description, teaching_brief, position_x, position_y")
    .eq("tree_id", treeId)
    .in("id", candidates);

  if (!teachingBriefResult.error) {
    return { data: pickCandidateNode(teachingBriefResult.data, candidates), error: null };
  }

  if (!isMissingAnchorMetadataError(teachingBriefResult.error.message)) {
    return teachingBriefResult;
  }

  const baseResult = await supabase
    .from("skill_nodes")
    .select("id, name, description, position_x, position_y")
    .eq("tree_id", treeId)
    .in("id", candidates);

  if (!baseResult.error) {
    return { data: pickCandidateNode(baseResult.data, candidates), error: null };
  }

  return baseResult;
}

function getBedrockClient() {
  const region = process.env.AWS_BEDROCK_REGION?.trim() || process.env.AWS_REGION?.trim() || DEFAULT_REGION;
  const bearerToken = process.env.AWS_BEARER_TOKEN_BEDROCK?.trim();

  if (bearerToken) {
    return new BedrockRuntimeClient({ region, token: { token: bearerToken } });
  }

  return new BedrockRuntimeClient({ region });
}

function responseText(response: ConverseCommandOutput) {
  return response.output?.message?.content
    ?.map((item) => item.text ?? "")
    .join("")
    .trim() ?? "";
}

function extractJsonObject(text: string) {
  const fenced = text.match(/```(?:json)?\s*([\s\S]*?)```/i)?.[1];
  const candidate = fenced ?? text;
  const start = candidate.indexOf("{");
  const end = candidate.lastIndexOf("}");
  if (start < 0 || end <= start) throw new Error("Branch generator did not return JSON.");
  return JSON.parse(candidate.slice(start, end + 1)) as unknown;
}

function selectedContextText(value: unknown) {
  if (!value) return "";
  try {
    return JSON.stringify(value).slice(0, 3000);
  } catch {
    return "";
  }
}

function buildUserPrompt({
  tree,
  anchor,
  prompt,
  selectedText,
  selectedContext,
  trigger,
}: {
  tree: StoredTree;
  anchor: StoredNode;
  prompt: string;
  selectedText: string;
  selectedContext: unknown;
  trigger: string;
}) {
  return `Learning path subject: ${tree.subject}
Final goal: ${tree.goal}

Current lesson node:
- Name: ${anchor.name}
- Description: ${anchor.description}
- Category: ${anchor.category ?? "technical_and_code"}
- Teaching brief: ${anchor.teaching_brief ?? anchor.description}

Learner request: ${prompt}
Trigger: ${trigger || "chat"}

Selected text, if any:
${selectedText || "None"}

Structured lesson context, if any:
${selectedContextText(selectedContext) || "None"}

Create an optional branch that attaches to this current lesson node.`;
}

function isMissingBranchColumnError(message: string) {
  return (
    message.includes("Could not find the 'is_branch' column of 'skill_nodes'") ||
    message.includes("Could not find the 'branch_anchor_node_id' column of 'skill_nodes'") ||
    message.includes("Could not find the 'branch_group_id' column of 'skill_nodes'") ||
    message.includes("Could not find the 'branch_label' column of 'skill_nodes'") ||
    message.includes("column skill_nodes.is_branch does not exist") ||
    message.includes("column skill_nodes.branch_anchor_node_id does not exist") ||
    message.includes("column skill_nodes.branch_group_id does not exist") ||
    message.includes("column skill_nodes.branch_label does not exist")
  );
}

function isMissingOptionalNodeMetadataError(message: string) {
  const missingColumnPhrases = [
    "Could not find the 'category' column of 'skill_nodes'",
    "Could not find the 'teaching_brief' column of 'skill_nodes'",
    "Could not find the 'teaching_plan' column of 'skill_nodes'",
    "Could not find the 'difficulty_level' column of 'skill_nodes'",
    "Could not find the 'is_checkpoint' column of 'skill_nodes'",
    "Could not find the 'zone' column of 'skill_nodes'",
    "Could not find the 'zone_color' column of 'skill_nodes'",
    "Could not find the 'position_z' column of 'skill_nodes'",
    "column skill_nodes.category does not exist",
    "column skill_nodes.teaching_brief does not exist",
    "column skill_nodes.teaching_plan does not exist",
    "column skill_nodes.difficulty_level does not exist",
    "column skill_nodes.is_checkpoint does not exist",
    "column skill_nodes.zone does not exist",
    "column skill_nodes.zone_color does not exist",
    "column skill_nodes.position_z does not exist",
  ];

  return missingColumnPhrases.some((phrase) => message.includes(phrase));
}

function stripOptionalNodeMetadata(node: BranchNodeInsert): MinimalBranchNodeInsert {
  return {
    id: node.id,
    tree_id: node.tree_id,
    name: node.name,
    description: node.description,
    position_x: node.position_x,
    position_y: node.position_y,
    is_branch: node.is_branch,
    branch_anchor_node_id: node.branch_anchor_node_id,
    branch_group_id: node.branch_group_id,
    branch_label: node.branch_label,
  };
}

function isAwsServiceError(error: unknown): error is Error & {
  $metadata?: { httpStatusCode?: number };
} {
  return error instanceof Error && "$metadata" in error;
}

async function generateBranchNodes({
  tree,
  anchor,
  prompt,
  selectedText,
  selectedContext,
  trigger,
}: {
  tree: StoredTree;
  anchor: StoredNode;
  prompt: string;
  selectedText: string;
  selectedContext: unknown;
  trigger: string;
}) {
  const systemPrompt = (await readFile(SYSTEM_PROMPT_PATH, "utf8")).trim();
  if (!systemPrompt) throw new Error("Branch generation system prompt file is empty");

  const modelId = process.env.BEDROCK_MODEL_ID?.trim() || DEFAULT_MODEL;
  const response = await getBedrockClient().send(new ConverseCommand({
    modelId,
    system: [{ text: systemPrompt }],
    messages: [
      {
        role: "user",
        content: [{ text: buildUserPrompt({ tree, anchor, prompt, selectedText, selectedContext, trigger }) }],
      },
    ],
    inferenceConfig: {
      maxTokens: 5000,
      temperature: 0.35,
    },
  }), { abortSignal: AbortSignal.timeout(90_000) });

  const parsed = extractJsonObject(responseText(response));
  if (!isRecord(parsed) || !Array.isArray(parsed.nodes)) {
    throw new Error("Branch generator returned an invalid schema.");
  }

  return parsed;
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

    const body = (await req.json()) as BranchRequest;
    const treeId = trimString(body.treeId, MAX_ID_LENGTH);
    const anchorNodeId = trimString(body.anchorNodeId, MAX_ID_LENGTH);
    const prompt = trimString(body.prompt, MAX_PROMPT_LENGTH);
    const selectedText = trimString(body.selectedText, MAX_SELECTED_TEXT_LENGTH);
    const trigger = trimString(body.trigger, 80);

    if (!treeId || !anchorNodeId || !prompt) {
      return NextResponse.json({ error: "treeId, anchorNodeId, and prompt are required" }, { status: 400 });
    }

    const safetyText = [prompt, selectedText, selectedContextText(body.selectedContext)];
    const contentSafety = detectNsfwCourseContent(safetyText);
    if (contentSafety.isBlocked) {
      return NextResponse.json({ error: NSFW_COURSE_ERROR }, { status: 422 });
    }

    const prohibitedContent = detectProhibitedCourseContent(safetyText);
    if (prohibitedContent.isBlocked) {
      return NextResponse.json({ error: PROHIBITED_COURSE_ERROR }, { status: 422 });
    }

    const [{ data: tree, error: treeError }, { data: anchor, error: anchorError }] = await Promise.all([
      supabase
        .from("skill_trees")
        .select("id, subject, goal")
        .eq("id", treeId)
        .eq("user_id", user.id)
        .single(),
      fetchAnchorNode({ supabase, treeId, anchorNodeId }),
    ]);

    if (treeError || !tree) {
      return NextResponse.json({ error: "Learning path was not found" }, { status: 404 });
    }

    if (anchorError) {
      return NextResponse.json({ error: anchorError.message }, { status: 500 });
    }

    if (!anchor) {
      return NextResponse.json({ error: "Anchor concept was not found" }, { status: 404 });
    }
    const storedAnchor = anchor as StoredNode;

    const generated = await generateBranchNodes({
      tree: tree as StoredTree,
      anchor: storedAnchor,
      prompt,
      selectedText,
      selectedContext: body.selectedContext,
      trigger,
    });

    const generatedText = collectStringValues(generated).join(" ");
    if (detectNsfwCourseContent([generatedText]).isBlocked) {
      return NextResponse.json({ error: NSFW_COURSE_ERROR }, { status: 422 });
    }

    if (detectProhibitedCourseContent([generatedText]).isBlocked) {
      return NextResponse.json({ error: PROHIBITED_COURSE_ERROR }, { status: 422 });
    }

    if (detectNsfwGenerationRefusal(generatedText).isBlocked) {
      return NextResponse.json({ error: NSFW_COURSE_ERROR }, { status: 422 });
    }

    if (detectProhibitedGenerationRefusal(generatedText).isBlocked) {
      return NextResponse.json({ error: PROHIBITED_COURSE_ERROR }, { status: 422 });
    }

    const rawNodes = (generated.nodes as GeneratedBranchNode[]).slice(0, MAX_BRANCH_NODES);
    if (rawNodes.length === 0) {
      return NextResponse.json({ error: "No branch nodes were generated for that request." }, { status: 422 });
    }

    const branchGroupId = crypto.randomUUID();
    const groupPrefix = branchGroupId.slice(0, 8).replace(/-/g, "");
    const branchLabel = cleanString(generated.branch_label, prompt.replace(/^start\s+(?:a\s+)?branch\s*(?:on|about|for|explaining)?/i, ""), 80);
    const seenLocalIds = new Set<string>();
    const fallbackCategory = storedAnchor.category ?? "technical_and_code";

    const nodeInserts: BranchNodeInsert[] = rawNodes.map((node, index) => {
      let localId = cleanId(node.id, `branch_${index + 1}`);
      let suffix = 2;
      while (seenLocalIds.has(localId)) {
        localId = `${localId}_${suffix}`;
        suffix += 1;
      }
      seenLocalIds.add(localId);

      const id = `${treeId}_branch_${groupPrefix}_${localId}`.slice(0, MAX_ID_LENGTH);
      const description = cleanString(node.description, "Optional supporting concept.", 900);
      const teachingBrief = cleanString(node.teaching_brief, description, 1200);

      return {
        id,
        tree_id: treeId,
        name: cleanString(node.name, localId.replace(/_/g, " "), 160),
        description,
        category: category(node.category, fallbackCategory),
        teaching_brief: teachingBrief,
        teaching_plan: cleanTeachingPlan(node.teaching, teachingBrief, description),
        difficulty_level: Math.max(1, Math.min(10, integer(node.difficulty_level, 2))),
        is_checkpoint: node.is_checkpoint === true,
        zone: cleanString(node.zone, "Branch", 120),
        zone_color: cleanString(node.zone_color, "#1F8755", 80),
        position_x: storedAnchor.position_x + index + 1,
        position_y: storedAnchor.position_y - 10,
        position_z: index + 1,
        is_branch: true,
        branch_anchor_node_id: storedAnchor.id,
        branch_group_id: branchGroupId,
        branch_label: branchLabel,
      };
    });

    const edgeInserts = nodeInserts.map((node, index) => ({
      tree_id: treeId,
      from_node_id: index === 0 ? storedAnchor.id : nodeInserts[index - 1].id,
      to_node_id: node.id,
    }));

    const nodesResult = await supabase.from("skill_nodes").insert(nodeInserts);
    if (nodesResult.error) {
      if (isMissingBranchColumnError(nodesResult.error.message)) {
        return NextResponse.json(
          { error: "Branch columns are missing. Apply migration 0007_add_skill_tree_branches.sql first." },
          { status: 500 },
        );
      }

      if (!isMissingOptionalNodeMetadataError(nodesResult.error.message)) {
        return NextResponse.json({ error: nodesResult.error.message }, { status: 500 });
      }

      const minimalNodesResult = await supabase
        .from("skill_nodes")
        .insert(nodeInserts.map(stripOptionalNodeMetadata));

      if (minimalNodesResult.error) {
        if (isMissingBranchColumnError(minimalNodesResult.error.message)) {
          return NextResponse.json(
            { error: "Branch columns are missing. Apply migration 0007_add_skill_tree_branches.sql first." },
            { status: 500 },
          );
        }

        return NextResponse.json({ error: minimalNodesResult.error.message }, { status: 500 });
      }
    }

    const edgesResult = await supabase.from("skill_edges").insert(edgeInserts);
    if (edgesResult.error) {
      await supabase.from("skill_nodes").delete().in("id", nodeInserts.map((node) => node.id));
      return NextResponse.json({ error: edgesResult.error.message }, { status: 500 });
    }

    const progressResult = await supabase.from("user_node_progress").insert(
      nodeInserts.map((node) => ({
        user_id: user.id,
        node_id: node.id,
        status: "available",
      })),
    );
    if (progressResult.error) {
      await supabase.from("skill_nodes").delete().in("id", nodeInserts.map((node) => node.id));
      return NextResponse.json({ error: progressResult.error.message }, { status: 500 });
    }

    return NextResponse.json({
      treeId,
      branchGroupId,
      branchLabel,
      branchNodeIds: nodeInserts.map((node) => node.id),
      dashboardHref: `/dashboard?treeId=${encodeURIComponent(treeId)}`,
    });
  } catch (error) {
    if (error instanceof DOMException && error.name === "TimeoutError") {
      return NextResponse.json({ error: "Request timed out" }, { status: 504 });
    }

    if (isAwsServiceError(error)) {
      console.error("Bedrock branch generation failed", error);
      return NextResponse.json(
        { error: error.message || "Branch generation service rejected the request" },
        { status: 503 },
      );
    }

    console.error("Skill tree branch generation failed", error);
    return NextResponse.json({ error: error instanceof Error ? error.message : "Internal server error" }, { status: 500 });
  }
}
