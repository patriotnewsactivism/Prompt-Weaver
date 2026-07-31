import { pgTable, text, serial, timestamp, integer } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const iterationsTable = pgTable("iterations", {
  id: serial("id").primaryKey(),
  sessionId: integer("session_id").notNull(),
  iterationNumber: integer("iteration_number").notNull(),
  prompt: text("prompt").notNull(),
  reasoning: text("reasoning").notNull(),
  focusArea: text("focus_area"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const insertIterationSchema = createInsertSchema(iterationsTable).omit({
  id: true,
  createdAt: true,
});

export type InsertIteration = z.infer<typeof insertIterationSchema>;
export type Iteration = typeof iterationsTable.$inferSelect;
