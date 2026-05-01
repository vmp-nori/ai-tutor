ALTER TABLE "public"."users" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "public"."skill_trees" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "public"."skill_nodes" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "public"."skill_edges" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "public"."user_node_progress" ENABLE ROW LEVEL SECURITY;

CREATE POLICY "users_select_own_profile" ON "public"."users"
FOR SELECT TO authenticated
USING (id = auth.uid()::text);

CREATE POLICY "users_update_own_profile" ON "public"."users"
FOR UPDATE TO authenticated
USING (id = auth.uid()::text)
WITH CHECK (id = auth.uid()::text);

CREATE POLICY "skill_trees_select_own" ON "public"."skill_trees"
FOR SELECT TO authenticated
USING (user_id = auth.uid()::text);

CREATE POLICY "skill_trees_insert_own" ON "public"."skill_trees"
FOR INSERT TO authenticated
WITH CHECK (user_id = auth.uid()::text);

CREATE POLICY "skill_trees_update_own" ON "public"."skill_trees"
FOR UPDATE TO authenticated
USING (user_id = auth.uid()::text)
WITH CHECK (user_id = auth.uid()::text);

CREATE POLICY "skill_trees_delete_own" ON "public"."skill_trees"
FOR DELETE TO authenticated
USING (user_id = auth.uid()::text);

CREATE POLICY "skill_nodes_select_own_tree" ON "public"."skill_nodes"
FOR SELECT TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM "public"."skill_trees"
    WHERE "skill_trees"."id" = "skill_nodes"."tree_id"
      AND "skill_trees"."user_id" = auth.uid()::text
  )
);

CREATE POLICY "skill_nodes_insert_own_tree" ON "public"."skill_nodes"
FOR INSERT TO authenticated
WITH CHECK (
  EXISTS (
    SELECT 1 FROM "public"."skill_trees"
    WHERE "skill_trees"."id" = "skill_nodes"."tree_id"
      AND "skill_trees"."user_id" = auth.uid()::text
  )
);

CREATE POLICY "skill_nodes_update_own_tree" ON "public"."skill_nodes"
FOR UPDATE TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM "public"."skill_trees"
    WHERE "skill_trees"."id" = "skill_nodes"."tree_id"
      AND "skill_trees"."user_id" = auth.uid()::text
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM "public"."skill_trees"
    WHERE "skill_trees"."id" = "skill_nodes"."tree_id"
      AND "skill_trees"."user_id" = auth.uid()::text
  )
);

CREATE POLICY "skill_nodes_delete_own_tree" ON "public"."skill_nodes"
FOR DELETE TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM "public"."skill_trees"
    WHERE "skill_trees"."id" = "skill_nodes"."tree_id"
      AND "skill_trees"."user_id" = auth.uid()::text
  )
);

CREATE POLICY "skill_edges_select_own_tree" ON "public"."skill_edges"
FOR SELECT TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM "public"."skill_trees"
    WHERE "skill_trees"."id" = "skill_edges"."tree_id"
      AND "skill_trees"."user_id" = auth.uid()::text
  )
);

CREATE POLICY "skill_edges_insert_own_tree" ON "public"."skill_edges"
FOR INSERT TO authenticated
WITH CHECK (
  EXISTS (
    SELECT 1 FROM "public"."skill_trees"
    WHERE "skill_trees"."id" = "skill_edges"."tree_id"
      AND "skill_trees"."user_id" = auth.uid()::text
  )
);

CREATE POLICY "skill_edges_delete_own_tree" ON "public"."skill_edges"
FOR DELETE TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM "public"."skill_trees"
    WHERE "skill_trees"."id" = "skill_edges"."tree_id"
      AND "skill_trees"."user_id" = auth.uid()::text
  )
);

CREATE POLICY "progress_select_own" ON "public"."user_node_progress"
FOR SELECT TO authenticated
USING (user_id = auth.uid()::text);

CREATE POLICY "progress_insert_own" ON "public"."user_node_progress"
FOR INSERT TO authenticated
WITH CHECK (user_id = auth.uid()::text);

CREATE POLICY "progress_update_own" ON "public"."user_node_progress"
FOR UPDATE TO authenticated
USING (user_id = auth.uid()::text)
WITH CHECK (user_id = auth.uid()::text);

CREATE POLICY "progress_delete_own" ON "public"."user_node_progress"
FOR DELETE TO authenticated
USING (user_id = auth.uid()::text);
