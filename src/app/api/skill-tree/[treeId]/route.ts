import { NextRequest, NextResponse } from "next/server";
import { createClient, hasSupabaseConfig } from "@/lib/supabase/server";

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ treeId: string }> },
) {
  if (!hasSupabaseConfig()) {
    return NextResponse.json({ error: "Supabase is not configured" }, { status: 503 });
  }

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { treeId } = await params;

  const { error } = await supabase
    .from("skill_trees")
    .delete()
    .eq("id", treeId)
    .eq("user_id", user.id);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}
