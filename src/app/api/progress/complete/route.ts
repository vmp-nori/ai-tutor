import { NextRequest, NextResponse } from "next/server";
import { createClient, hasSupabaseConfig } from "@/lib/supabase/server";
import type { NodeStatus } from "@/lib/types";

interface CompleteRequest {
  treeId?: unknown;
  nodeId?: unknown;
}

interface StoredNode {
  id: string;
  name: string;
  position_x: number;
}

interface StoredProgress {
  node_id: string;
  status: NodeStatus;
}

const MAX_ID_LENGTH = 180;

function trimString(value: unknown, maxLength: number) {
  if (typeof value !== "string") return "";
  return value.trim().slice(0, maxLength);
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

export async function POST(req: NextRequest) {
  if (!hasSupabaseConfig()) {
    return NextResponse.json({ error: "Supabase is not configured" }, { status: 503 });
  }

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = (await req.json()) as CompleteRequest;
  const treeId = trimString(body.treeId, MAX_ID_LENGTH);
  const nodeId = trimString(body.nodeId, MAX_ID_LENGTH);

  if (!treeId || !nodeId) {
    return NextResponse.json({ error: "treeId and nodeId are required" }, { status: 400 });
  }

  const candidateNodeIds = nodeIdCandidates(treeId, nodeId);
  const { data: tree, error: treeError } = await supabase
    .from("skill_trees")
    .select("id, subject")
    .eq("id", treeId)
    .eq("user_id", user.id)
    .single();

  if (treeError || !tree) {
    return NextResponse.json({ error: "Learning path was not found" }, { status: 404 });
  }

  const { data: nodes, error: nodesError } = await supabase
    .from("skill_nodes")
    .select("id, name, position_x")
    .eq("tree_id", treeId)
    .order("position_x", { ascending: true })
    .order("id", { ascending: true });

  if (nodesError || !nodes || nodes.length === 0) {
    return NextResponse.json({ error: "Learning path concepts were not found" }, { status: 404 });
  }

  const orderedNodes = nodes as StoredNode[];
  const targetNode = candidateNodeIds
    .map((candidate) => orderedNodes.find((node) => node.id === candidate))
    .find(Boolean);
  if (!targetNode) {
    return NextResponse.json({ error: "Concept was not found" }, { status: 404 });
  }

  const nodeIds = orderedNodes.map((node) => node.id);
  const { data: progress } = await supabase
    .from("user_node_progress")
    .select("node_id, status")
    .eq("user_id", user.id)
    .in("node_id", nodeIds);

  const completedIds = new Set(
    ((progress ?? []) as StoredProgress[])
      .filter((item) => item.status === "completed")
      .map((item) => item.node_id),
  );
  completedIds.add(targetNode.id);

  const nextNode = orderedNodes.find((node) => !completedIds.has(node.id));
  const now = new Date().toISOString();

  const completeResult = await supabase
    .from("user_node_progress")
    .update({ status: "completed", completed_at: now })
    .eq("user_id", user.id)
    .eq("node_id", targetNode.id);

  if (completeResult.error) {
    return NextResponse.json({ error: completeResult.error.message }, { status: 500 });
  }

  const incompleteIds = orderedNodes
    .filter((node) => !completedIds.has(node.id))
    .map((node) => node.id);

  if (incompleteIds.length > 0) {
    const availableResult = await supabase
      .from("user_node_progress")
      .update({ status: "available", completed_at: null })
      .eq("user_id", user.id)
      .in("node_id", incompleteIds);

    if (availableResult.error) {
      return NextResponse.json({ error: availableResult.error.message }, { status: 500 });
    }
  }

  if (nextNode) {
    const currentResult = await supabase
      .from("user_node_progress")
      .update({ status: "current", completed_at: null })
      .eq("user_id", user.id)
      .eq("node_id", nextNode.id);

    if (currentResult.error) {
      return NextResponse.json({ error: currentResult.error.message }, { status: 500 });
    }
  }

  return NextResponse.json({
    treeId,
    nodeId: targetNode.id,
    completed: true,
    dashboardHref: `/dashboard?treeId=${encodeURIComponent(treeId)}`,
    nextNode: nextNode
      ? {
          id: nextNode.id,
          name: nextNode.name,
          href: `/learn/${encodeURIComponent(treeId)}/${encodeURIComponent(nextNode.id)}`,
        }
      : null,
  });
}
