import { pgTable, text, serial } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

// Single-row settings table (always upsert row id=1)
export const appSettingsTable = pgTable("app_settings", {
  id: serial("id").primaryKey(),
  apiKey: text("api_key"),
  model: text("model").notNull().default("gemini-3-flash-preview"),
});

export const insertAppSettingsSchema = createInsertSchema(appSettingsTable).omit({
  id: true,
});

export type InsertAppSettings = z.infer<typeof insertAppSettingsSchema>;
export type AppSettings = typeof appSettingsTable.$inferSelect;
