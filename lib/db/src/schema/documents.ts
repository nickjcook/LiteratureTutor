import {
  pgTable,
  serial,
  varchar,
  integer,
  text,
  timestamp,
  primaryKey,
} from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";
import { contentTypesTable } from "./contentTypes";
import { textsTable } from "./texts";

export const documentsTable = pgTable("documents", {
  id: serial("id").primaryKey(),
  title: varchar("title").notNull(),
  slug: varchar("slug").notNull().unique(),
  contentTypeId: integer("content_type_id")
    .notNull()
    .references(() => contentTypesTable.id),
  // Markdown body with shortcodes: [[Text Title]] for the WA title convention,
  // :::term ... ::: for embedded curriculum-term boxes, :::model ... ::: for
  // model-sentence boxes. Rendered by DocumentRenderer on the frontend.
  body: text("body").notNull(),
  yearLevels: integer("year_levels").array().notNull().default([]),
  courseTypes: varchar("course_types").array().notNull().default([]),
  taskTypes: varchar("task_types").array().notNull().default([]),
  status: varchar("status").notNull().default("draft"),
  publishedAt: timestamp("published_at", { withTimezone: true }),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .notNull()
    .defaultNow()
    .$onUpdate(() => new Date()),
});

export const documentTextsTable = pgTable(
  "document_texts",
  {
    documentId: integer("document_id")
      .notNull()
      .references(() => documentsTable.id, { onDelete: "cascade" }),
    textId: integer("text_id")
      .notNull()
      .references(() => textsTable.id, { onDelete: "cascade" }),
  },
  (table) => [primaryKey({ columns: [table.documentId, table.textId] })],
);

export const insertDocumentSchema = createInsertSchema(documentsTable).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});
export type InsertDocument = z.infer<typeof insertDocumentSchema>;
export type Document = typeof documentsTable.$inferSelect;
export type DocumentText = typeof documentTextsTable.$inferSelect;
