import { pgTable, serial, varchar, text } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const contentTypesTable = pgTable("content_types", {
  id: serial("id").primaryKey(),
  slug: varchar("slug").notNull().unique(),
  name: varchar("name").notNull(),
  description: text("description").notNull(),
});

export const insertContentTypeSchema = createInsertSchema(
  contentTypesTable,
).omit({ id: true });
export type InsertContentType = z.infer<typeof insertContentTypeSchema>;
export type ContentType = typeof contentTypesTable.$inferSelect;
