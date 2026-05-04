import { notFound, redirect } from "next/navigation";
import { createClient, hasSupabaseConfig } from "@/lib/supabase/server";
import { LessonPageClient } from "./LessonPageClient";

export const dynamic = "force-dynamic";

interface LessonPageProps {
  params: Promise<{
    treeId: string;
    nodeId: string;
  }>;
}

interface StoredNode {
  id: string;
  name: string;
  description: string;
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
    .select("id, name, description, teaching_brief, teaching_plan")
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
    .select("id, name, description, teaching_brief")
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
    .select("id, name, description")
    .eq("tree_id", treeId)
    .in("id", candidates);

  if (!baseResult.error) {
    return { data: pickCandidateNode(baseResult.data, candidates), error: null };
  }

  return baseResult;
}

export default async function LessonPage({ params }: LessonPageProps) {
  const { treeId, nodeId } = await params;
  const callbackUrl = `/learn/${encodeURIComponent(treeId)}/${encodeURIComponent(nodeId)}`;

  if (!hasSupabaseConfig()) {
    redirect(`/sign-in?callbackUrl=${encodeURIComponent(callbackUrl)}`);
  }

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    redirect(`/sign-in?callbackUrl=${encodeURIComponent(callbackUrl)}`);
  }

  const [{ data: tree }, { data: node }] = await Promise.all([
    supabase
      .from("skill_trees")
      .select("id, subject, goal")
      .eq("id", treeId)
      .eq("user_id", user.id)
      .single(),
    fetchStoredNode(supabase, treeId, nodeId),
  ]);

  if (!tree || !node) {
    notFound();
  }

  const storedNode = node as StoredNode;

  return (
    <LessonPageClient
      treeId={treeId}
      nodeId={storedNode.id}
      subject={tree.subject}
      goal={tree.goal}
      nodeName={storedNode.name}
      nodeDescription={storedNode.description}
      dashboardHref={`/dashboard?treeId=${encodeURIComponent(treeId)}`}
    />
  );
}
