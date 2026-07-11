import { pgTable, serial, varchar, text } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const metalanguageTermsTable = pgTable("metalanguage_terms", {
  id: serial("id").primaryKey(),
  term: varchar("term").notNull(),
  definition: text("definition").notNull(),
  tab: varchar("tab").notNull(),
  example: text("example"),
});

export const insertMetalanguageTermSchema = createInsertSchema(
  metalanguageTermsTable,
).omit({ id: true });
export type InsertMetalanguageTerm = z.infer<
  typeof insertMetalanguageTermSchema
>;
export type MetalanguageTerm = typeof metalanguageTermsTable.$inferSelect;
