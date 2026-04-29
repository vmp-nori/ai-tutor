import {
  pgTable,
  text,
  timestamp,
  real,
  pgEnum,
  primaryKey,
} from "drizzle-orm/pg-core";

export const nodeStatusEnum = pgEnum("node_status", [
  "locked",
  "available",
  "current",
  "completed",
]);

export const users = pgTable("users", {
  id: text("id").primaryKey(),
  email: text("email").notNull().unique(),
  name: text("name"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const skillTrees = pgTable("skill_trees", {
  id: text("id").primaryKey(),
  userId: text("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  subject: text("subject").notNull(),
  goal: text("goal").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const skillNodes = pgTable("skill_nodes", {
  id: text("id").primaryKey(),
  treeId: text("tree_id")
    .notNull()
    .references(() => skillTrees.id, { onDelete: "cascade" }),
  name: text("name").notNull(),
  description: text("description").notNull(),
  positionX: real("position_x").notNull().default(0),
  positionY: real("position_y").notNull().default(0),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const skillEdges = pgTable(
  "skill_edges",
  {
    treeId: text("tree_id")
      .notNull()
      .references(() => skillTrees.id, { onDelete: "cascade" }),
    fromNodeId: text("from_node_id")
      .notNull()
      .references(() => skillNodes.id, { onDelete: "cascade" }),
    toNodeId: text("to_node_id")
      .notNull()
      .references(() => skillNodes.id, { onDelete: "cascade" }),
  },
  (t) => [primaryKey({ columns: [t.fromNodeId, t.toNodeId] })],
);

export const userNodeProgress = pgTable(
  "user_node_progress",
  {
    userId: text("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    nodeId: text("node_id")
      .notNull()
      .references(() => skillNodes.id, { onDelete: "cascade" }),
    status: nodeStatusEnum("status").notNull().default("locked"),
    completedAt: timestamp("completed_at"),
  },
  (t) => [primaryKey({ columns: [t.userId, t.nodeId] })],
);

export type User = typeof users.$inferSelect;
export type SkillTreeRow = typeof skillTrees.$inferSelect;
export type SkillNodeRow = typeof skillNodes.$inferSelect;
export type SkillEdgeRow = typeof skillEdges.$inferSelect;
export type UserNodeProgress = typeof userNodeProgress.$inferSelect;
