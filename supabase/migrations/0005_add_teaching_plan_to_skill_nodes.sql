ALTER TABLE "public"."skill_nodes"
ADD COLUMN IF NOT EXISTS "teaching_plan" jsonb;

DROP FUNCTION IF EXISTS "public"."create_skill_tree_with_graph"(text, text, text, jsonb, jsonb);

CREATE FUNCTION "public"."create_skill_tree_with_graph"(
  "p_tree_id" text,
  "p_subject" text,
  "p_goal" text,
  "p_nodes" jsonb,
  "p_edges" jsonb
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY INVOKER
SET search_path = public
AS $$
DECLARE
  v_user_id text := auth.uid()::text;
BEGIN
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'Unauthorized';
  END IF;

  INSERT INTO "public"."skill_trees" ("id", "user_id", "subject", "goal")
  VALUES (p_tree_id, v_user_id, p_subject, p_goal);

  INSERT INTO "public"."skill_nodes" (
    "id",
    "tree_id",
    "name",
    "description",
    "position_x",
    "position_y",
    "position_z",
    "difficulty_level",
    "is_checkpoint",
    "zone",
    "zone_color",
    "teaching_brief",
    "teaching_plan"
  )
  SELECT
    node_record.id,
    p_tree_id,
    node_record.name,
    node_record.description,
    node_record.position_x,
    node_record.position_y,
    node_record.position_z,
    node_record.difficulty_level,
    COALESCE(node_record.is_checkpoint, false),
    node_record.zone,
    node_record.zone_color,
    node_record.teaching_brief,
    node_record.teaching_plan
  FROM jsonb_to_recordset(p_nodes) AS node_record(
    id text,
    name text,
    description text,
    position_x real,
    position_y real,
    position_z real,
    difficulty_level integer,
    is_checkpoint boolean,
    zone text,
    zone_color text,
    teaching_brief text,
    teaching_plan jsonb
  );

  INSERT INTO "public"."skill_edges" ("tree_id", "from_node_id", "to_node_id")
  SELECT p_tree_id, edge_record.from_node_id, edge_record.to_node_id
  FROM jsonb_to_recordset(p_edges) AS edge_record(
    from_node_id text,
    to_node_id text
  );

  INSERT INTO "public"."user_node_progress" ("user_id", "node_id", "status")
  SELECT
    v_user_id,
    ranked_nodes.id,
    CASE
      WHEN ranked_nodes.row_number = 1 THEN 'current'::public.node_status
      ELSE 'available'::public.node_status
    END
  FROM (
    SELECT
      node_record.id,
      row_number() OVER (ORDER BY node_record.position_x ASC, node_record.id ASC)
    FROM jsonb_to_recordset(p_nodes) AS node_record(
      id text,
      position_x real
    )
  ) AS ranked_nodes;

  RETURN jsonb_build_object(
    'id', p_tree_id,
    'subject', p_subject,
    'href', '/dashboard?treeId=' || p_tree_id
  );
END;
$$;

REVOKE EXECUTE ON FUNCTION "public"."create_skill_tree_with_graph"(text, text, text, jsonb, jsonb) FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION "public"."create_skill_tree_with_graph"(text, text, text, jsonb, jsonb) FROM anon;
GRANT EXECUTE ON FUNCTION "public"."create_skill_tree_with_graph"(text, text, text, jsonb, jsonb) TO authenticated;

NOTIFY pgrst, 'reload schema';
