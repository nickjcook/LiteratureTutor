import { pgTable, serial, varchar, integer, timestamp, unique } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";
import { usersTable } from "./auth";
import { documentsTable } from "./documents";

export const documentProgressTable = pgTable(
  "document_progress",
  {
    id: serial("id").primaryKey(),
    userId: varchar("user_id")
      .notNull()
      .references(() => usersTable.id, { onDelete: "cascade" }),
    documentId: integer("document_id")
      .notNull()
      .references(() => documentsTable.id, { onDelete: "cascade" }),
    viewedAt: timestamp("viewed_at", { withTimezone: true }),
    completedAt: timestamp("completed_at", { withTimezone: true }),
  },
  (table) => [unique().on(table.userId, table.documentId)],
);

export const insertDocumentProgressSchema = createInsertSchema(
  documentProgressTable,
).omit({ id: true });
export type InsertDocumentProgress = z.infer<
  typeof insertDocumentProgressSchema
>;
export type DocumentProgress = typeof documentProgressTable.$inferSelect;
