ALTER TABLE "public"."skill_nodes"
ADD COLUMN IF NOT EXISTS "is_branch" boolean DEFAULT false NOT NULL,
ADD COLUMN IF NOT EXISTS "branch_anchor_node_id" text,
ADD COLUMN IF NOT EXISTS "branch_group_id" text,
ADD COLUMN IF NOT EXISTS "branch_label" text;

DO $$
BEGIN
  ALTER TABLE "public"."skill_nodes"
  ADD CONSTRAINT "skill_nodes_branch_anchor_node_id_fkey"
  FOREIGN KEY ("branch_anchor_node_id")
  REFERENCES "public"."skill_nodes"("id")
  ON DELETE CASCADE;
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

CREATE INDEX IF NOT EXISTS "skill_nodes_branch_anchor_node_id_idx"
ON "public"."skill_nodes" ("branch_anchor_node_id");

CREATE INDEX IF NOT EXISTS "skill_nodes_branch_group_id_idx"
ON "public"."skill_nodes" ("branch_group_id");

NOTIFY pgrst, 'reload schema';
