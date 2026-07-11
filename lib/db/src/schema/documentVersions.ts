import { pgTable, serial, integer, text, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";
import { documentsTable } from "./documents";

// Written on every publish so the CMS can show and restore prior versions
// without ever losing content (spec requirement: version control on documents).
export const documentVersionsTable = pgTable("document_versions", {
  id: serial("id").primaryKey(),
  documentId: integer("document_id")
    .notNull()
    .references(() => documentsTable.id, { onDelete: "cascade" }),
  versionNumber: integer("version_number").notNull(),
  body: text("body").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
});

export const insertDocumentVersionSchema = createInsertSchema(
  documentVersionsTable,
).omit({ id: true, createdAt: true });
export type InsertDocumentVersion = z.infer<
  typeof insertDocumentVersionSchema
>;
export type DocumentVersion = typeof documentVersionsTable.$inferSelect;
