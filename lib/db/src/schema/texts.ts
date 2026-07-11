import { pgTable, serial, varchar, integer, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const textsTable = pgTable("texts", {
  id: serial("id").primaryKey(),
  title: varchar("title").notNull(),
  author: varchar("author").notNull(),
  yearLevels: integer("year_levels").array().notNull().default([]),
  courseTypes: varchar("course_types").array().notNull().default([]),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
});

export const insertTextSchema = createInsertSchema(textsTable).omit({
  id: true,
  createdAt: true,
});
export type InsertText = z.infer<typeof insertTextSchema>;
export type Text = typeof textsTable.$inferSelect;
