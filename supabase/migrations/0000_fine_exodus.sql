CREATE TYPE "public"."node_status" AS ENUM('locked', 'available', 'current', 'completed');--> statement-breakpoint
CREATE TABLE "skill_edges" (
	"tree_id" text NOT NULL,
	"from_node_id" text NOT NULL,
	"to_node_id" text NOT NULL,
	CONSTRAINT "skill_edges_from_node_id_to_node_id_pk" PRIMARY KEY("from_node_id","to_node_id")
);
--> statement-breakpoint
CREATE TABLE "skill_nodes" (
	"id" text PRIMARY KEY NOT NULL,
	"tree_id" text NOT NULL,
	"name" text NOT NULL,
	"description" text NOT NULL,
	"position_x" real DEFAULT 0 NOT NULL,
	"position_y" real DEFAULT 0 NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "skill_trees" (
	"id" text PRIMARY KEY NOT NULL,
	"user_id" text NOT NULL,
	"subject" text NOT NULL,
	"goal" text NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "user_node_progress" (
	"user_id" text NOT NULL,
	"node_id" text NOT NULL,
	"status" "node_status" DEFAULT 'locked' NOT NULL,
	"completed_at" timestamp,
	CONSTRAINT "user_node_progress_user_id_node_id_pk" PRIMARY KEY("user_id","node_id")
);
--> statement-breakpoint
CREATE TABLE "users" (
	"id" text PRIMARY KEY NOT NULL,
	"email" text NOT NULL,
	"name" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "users_email_unique" UNIQUE("email")
);
--> statement-breakpoint
ALTER TABLE "skill_edges" ADD CONSTRAINT "skill_edges_tree_id_skill_trees_id_fk" FOREIGN KEY ("tree_id") REFERENCES "public"."skill_trees"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "skill_edges" ADD CONSTRAINT "skill_edges_from_node_id_skill_nodes_id_fk" FOREIGN KEY ("from_node_id") REFERENCES "public"."skill_nodes"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "skill_edges" ADD CONSTRAINT "skill_edges_to_node_id_skill_nodes_id_fk" FOREIGN KEY ("to_node_id") REFERENCES "public"."skill_nodes"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "skill_nodes" ADD CONSTRAINT "skill_nodes_tree_id_skill_trees_id_fk" FOREIGN KEY ("tree_id") REFERENCES "public"."skill_trees"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "skill_trees" ADD CONSTRAINT "skill_trees_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user_node_progress" ADD CONSTRAINT "user_node_progress_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user_node_progress" ADD CONSTRAINT "user_node_progress_node_id_skill_nodes_id_fk" FOREIGN KEY ("node_id") REFERENCES "public"."skill_nodes"("id") ON DELETE cascade ON UPDATE no action;
--> statement-breakpoint
CREATE OR REPLACE FUNCTION "public"."sync_auth_user_to_profile"()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO "public"."users" ("id", "email", "name", "updated_at")
  VALUES (
    NEW.id::text,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'name', NEW.raw_user_meta_data->>'full_name'),
    now()
  )
  ON CONFLICT ("id") DO UPDATE SET
    "email" = EXCLUDED."email",
    "name" = COALESCE(EXCLUDED."name", "public"."users"."name"),
    "updated_at" = now();

  RETURN NEW;
END;
$$;
--> statement-breakpoint
CREATE TRIGGER "sync_auth_user_to_profile"
AFTER INSERT OR UPDATE ON "auth"."users"
FOR EACH ROW EXECUTE FUNCTION "public"."sync_auth_user_to_profile"();
