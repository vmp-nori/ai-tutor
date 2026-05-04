import { NextRequest, NextResponse } from "next/server";
import { createClient, hasSupabaseConfig } from "@/lib/supabase/server";

interface GeneratedNode {
  id?: unknown;
  name?: unknown;
  description?: unknown;
  teaching_brief?: unknown;
  difficulty_level?: unknown;
  is_checkpoint?: unknown;
  zone?: unknown;
  zone_color?: unknown;
  prerequisite_ids?: unknown;
  coordinates?: unknown;
}

interface SaveRequest {
  schema?: unknown;
}

type SupabaseClient = Awaited<ReturnType<typeof createClient>>;

interface NodeInsert {
  id: string;
  tree_id: string;
  name: string;
  description: string;
  teaching_brief: string;
  difficulty_level: number;
  is_checkpoint: boolean;
  zone: string;
  zone_color: string;
  position_x: number;
  position_y: number;
  position_z: number;
}

type LegacyNodeInsert = Pick<
  NodeInsert,
  "id" | "tree_id" | "name" | "description" | "position_x" | "position_y"
>;

interface EdgeInsert {
  tree_id: string;
  from_node_id: string;
  to_node_id: string;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function cleanString(value: unknown, fallback: string, maxLength = 500) {
  if (typeof value !== "string") return fallback;
  const trimmed = value.trim();
  return trimmed ? trimmed.slice(0, maxLength) : fallback;
}

function cleanId(value: unknown, fallback: string) {
  return cleanString(value, fallback, 100)
    .toLowerCase()
    .replace(/[^a-z0-9_]+/g, "_")
    .replace(/^_+|_+$/g, "") || fallback;
}

function uniqueLocalId(value: unknown, fallback: string, seenIds: Set<string>) {
  const baseId = cleanId(value, fallback);
  let candidate = baseId;
  let suffix = 2;

  while (seenIds.has(candidate)) {
    candidate = `${baseId}_${suffix}`;
    suffix += 1;
  }

  seenIds.add(candidate);
  return candidate;
}

function coordinate(value: unknown, key: string, fallback: number) {
  if (!isRecord(value)) return fallback;
  const raw = value[key];
  return typeof raw === "number" && Number.isFinite(raw) ? raw : fallback;
}

function integer(value: unknown, fallback: number) {
  return typeof value === "number" && Number.isInteger(value) ? value : fallback;
}

function prerequisiteIds(value: unknown) {
  return Array.isArray(value)
    ? value.filter((item): item is string => typeof item === "string")
    : [];
}

function isMissingSchemaCacheFunctionError(message: string) {
  return (
    message.includes("Could not find the function public.create_skill_tree_with_graph") &&
    message.includes("schema cache")
  );
}

function isMissingSkillNodesMetadataError(message: string) {
  const missingColumnPhrases = [
    "Could not find the 'difficulty_level' column of 'skill_nodes'",
    "Could not find the 'is_checkpoint' column of 'skill_nodes'",
    "Could not find the 'zone' column of 'skill_nodes'",
    "Could not find the 'zone_color' column of 'skill_nodes'",
    "Could not find the 'teaching_brief' column of 'skill_nodes'",
    "Could not find the 'position_z' column of 'skill_nodes'",
    "column skill_nodes.difficulty_level does not exist",
    "column skill_nodes.is_checkpoint does not exist",
    "column skill_nodes.zone does not exist",
    "column skill_nodes.zone_color does not exist",
    "column skill_nodes.teaching_brief does not exist",
    "column skill_nodes.position_z does not exist",
  ];

  return missingColumnPhrases.some((phrase) => message.includes(phrase));
}

function isRetryableSchemaMismatchError(message: string) {
  return isMissingSchemaCacheFunctionError(message) || isMissingSkillNodesMetadataError(message);
}

function stripNodeMetadata(node: NodeInsert): LegacyNodeInsert {
  return {
    id: node.id,
    tree_id: node.tree_id,
    name: node.name,
    description: node.description,
    position_x: node.position_x,
    position_y: node.position_y,
  };
}

async function saveSkillTreeWithDirectInserts({
  supabase,
  treeId,
  userId,
  subject,
  goal,
  nodeInserts,
  edgeInserts,
}: {
  supabase: SupabaseClient;
  treeId: string;
  userId: string;
  subject: string;
  goal: string;
  nodeInserts: Array<NodeInsert | LegacyNodeInsert>;
  edgeInserts: EdgeInsert[];
}) {
  const treeSummary = {
    id: treeId,
    subject,
    href: `/dashboard?treeId=${treeId}`,
  };

  const treeInsert = await supabase
    .from("skill_trees")
    .insert({ id: treeId, user_id: userId, subject, goal });

  if (treeInsert.error) return { data: null, error: treeInsert.error };

  const nodesInsert = await supabase.from("skill_nodes").insert(nodeInserts);
  if (nodesInsert.error) {
    await supabase.from("skill_trees").delete().eq("id", treeId);
    return { data: null, error: nodesInsert.error };
  }

  if (edgeInserts.length > 0) {
    const edgesInsert = await supabase.from("skill_edges").insert(edgeInserts);
    if (edgesInsert.error) {
      await supabase.from("skill_trees").delete().eq("id", treeId);
      return { data: null, error: edgesInsert.error };
    }
  }

  const firstCurrentNodeId = [...nodeInserts].sort((left, right) => {
    if (left.position_x !== right.position_x) return left.position_x - right.position_x;
    return left.id.localeCompare(right.id);
  })[0]?.id;

  const progressInserts = nodeInserts.map((node) => ({
    user_id: userId,
    node_id: node.id,
    status: node.id === firstCurrentNodeId ? "current" : "available",
  }));

  const progressInsert = await supabase.from("user_node_progress").insert(progressInserts);
  if (progressInsert.error) {
    await supabase.from("skill_trees").delete().eq("id", treeId);
    return { data: null, error: progressInsert.error };
  }

  return { data: treeSummary, error: null };
}

async function saveSkillTreeWithAdaptiveDirectInserts({
  supabase,
  treeId,
  userId,
  subject,
  goal,
  nodeInserts,
  edgeInserts,
}: {
  supabase: SupabaseClient;
  treeId: string;
  userId: string;
  subject: string;
  goal: string;
  nodeInserts: NodeInsert[];
  edgeInserts: EdgeInsert[];
}) {
  const richInsert = await saveSkillTreeWithDirectInserts({
    supabase,
    treeId,
    userId,
    subject,
    goal,
    nodeInserts,
    edgeInserts,
  });

  if (!richInsert.error || !isMissingSkillNodesMetadataError(richInsert.error.message)) {
    return richInsert;
  }

  return saveSkillTreeWithDirectInserts({
    supabase,
    treeId,
    userId,
    subject,
    goal,
    nodeInserts: nodeInserts.map(stripNodeMetadata),
    edgeInserts,
  });
}

export async function POST(req: NextRequest) {
  if (!hasSupabaseConfig()) {
    return NextResponse.json({ error: "Supabase is not configured" }, { status: 503 });
  }

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = (await req.json()) as SaveRequest;
  if (typeof body.schema !== "string") {
    return NextResponse.json({ error: "schema is required" }, { status: 400 });
  }

  let parsed: unknown;
  try {
    parsed = JSON.parse(body.schema);
  } catch {
    return NextResponse.json({ error: "schema must be valid JSON" }, { status: 400 });
  }

  if (!isRecord(parsed) || !Array.isArray(parsed.nodes) || parsed.nodes.length === 0) {
    return NextResponse.json({ error: "schema must include nodes" }, { status: 400 });
  }

  const treeId = crypto.randomUUID();
  const subject = cleanString(parsed.subject, "Generated Learning Path", 140);
  const goal = cleanString(parsed.goal, subject, 1000);
  const rawNodes = parsed.nodes as GeneratedNode[];
  const nodeIdMap = new Map<string, string>();
  const localIds: string[] = [];
  const seenLocalIds = new Set<string>();

  rawNodes.forEach((node, index) => {
    const localId = uniqueLocalId(node.id, `node_${index + 1}`, seenLocalIds);
    localIds.push(localId);
    nodeIdMap.set(localId, `${treeId}_${localId}`);
  });

  const nodeInserts: NodeInsert[] = rawNodes.map((node, index) => {
    const localId = localIds[index];
    return {
      id: nodeIdMap.get(localId)!,
      tree_id: treeId,
      name: cleanString(node.name, localId, 180),
      description: cleanString(node.description, "", 1200),
      teaching_brief: cleanString(node.teaching_brief, "", 1600),
      difficulty_level: Math.max(1, Math.min(10, integer(node.difficulty_level, 1))),
      is_checkpoint: node.is_checkpoint === true,
      zone: cleanString(node.zone, "Core", 120),
      zone_color: cleanString(node.zone_color, "#3B82F6", 80),
      position_x: coordinate(node.coordinates, "x", index * 20),
      position_y: coordinate(node.coordinates, "y", 0),
      position_z: coordinate(node.coordinates, "z", 0),
    };
  });

  const edgeInserts: EdgeInsert[] = rawNodes.flatMap((node, index) => {
    const toLocalId = localIds[index];
    const toNodeId = nodeIdMap.get(toLocalId);
    if (!toNodeId) return [];

    return prerequisiteIds(node.prerequisite_ids)
      .map((fromLocalId) => {
        const fromNodeId = nodeIdMap.get(cleanId(fromLocalId, fromLocalId));
        if (!fromNodeId) return null;
        return {
          tree_id: treeId,
          from_node_id: fromNodeId,
          to_node_id: toNodeId,
        };
      })
      .filter((edge): edge is { tree_id: string; from_node_id: string; to_node_id: string } => edge !== null);
  });

  const { data, error } = await supabase.rpc("create_skill_tree_with_graph", {
    p_tree_id: treeId,
    p_subject: subject,
    p_goal: goal,
    p_nodes: nodeInserts,
    p_edges: edgeInserts,
  });

  if (error) {
    if (!isRetryableSchemaMismatchError(error.message)) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    const fallback = await saveSkillTreeWithAdaptiveDirectInserts({
      supabase,
      treeId,
      userId: user.id,
      subject,
      goal,
      nodeInserts,
      edgeInserts,
    });

    if (fallback.error) {
      return NextResponse.json({ error: fallback.error.message }, { status: 500 });
    }

    return NextResponse.json(fallback.data);
  }

  return NextResponse.json(data);
}
