import { count, eq, inArray } from "drizzle-orm";
import {
  db,
  documentsTable,
  documentTextsTable,
  documentVersionsTable,
  textsTable,
  contentTypesTable,
  type Document,
} from "@workspace/db";

const NEW_WINDOW_MS = 14 * 24 * 60 * 60 * 1000;

export const COPYRIGHT_NOTICE = `© Pamina Rich ${new Date().getFullYear()}. All rights reserved.`;

export interface DocumentSummaryShape {
  id: number;
  title: string;
  slug: string;
  contentType: { id: number; slug: string; name: string; description: string };
  yearLevels: number[];
  courseTypes: string[];
  taskTypes: string[];
  status: string;
  texts: { id: number; title: string }[];
  publishedAt: Date | null;
  updatedAt: Date;
  isNew: boolean;
}

// Joins content type + linked texts onto a batch of document rows and computes
// the "isNew" flag. Done as a couple of batched queries rather than a single
// SQL join because the aggregation (texts per document) is simplest in JS at
// this content volume.
export async function attachDocumentRelations(
  docs: Document[],
): Promise<DocumentSummaryShape[]> {
  if (docs.length === 0) return [];

  const contentTypeIds = [...new Set(docs.map((d) => d.contentTypeId))];
  const contentTypes = await db
    .select()
    .from(contentTypesTable)
    .where(inArray(contentTypesTable.id, contentTypeIds));
  const contentTypeById = new Map(contentTypes.map((c) => [c.id, c]));

  const docIds = docs.map((d) => d.id);
  const textLinks = await db
    .select({
      documentId: documentTextsTable.documentId,
      textId: textsTable.id,
      title: textsTable.title,
    })
    .from(documentTextsTable)
    .innerJoin(textsTable, eq(documentTextsTable.textId, textsTable.id))
    .where(inArray(documentTextsTable.documentId, docIds));

  const textsByDoc = new Map<number, { id: number; title: string }[]>();
  for (const link of textLinks) {
    const list = textsByDoc.get(link.documentId) ?? [];
    list.push({ id: link.textId, title: link.title });
    textsByDoc.set(link.documentId, list);
  }

  const now = Date.now();
  return docs.map((doc) => {
    const contentType = contentTypeById.get(doc.contentTypeId);
    if (!contentType) {
      throw new Error(`Document ${doc.id} references missing content type`);
    }
    return {
      id: doc.id,
      title: doc.title,
      slug: doc.slug,
      contentType,
      yearLevels: doc.yearLevels,
      courseTypes: doc.courseTypes,
      taskTypes: doc.taskTypes,
      status: doc.status,
      texts: textsByDoc.get(doc.id) ?? [],
      publishedAt: doc.publishedAt,
      updatedAt: doc.updatedAt,
      isNew:
        doc.publishedAt != null &&
        now - doc.publishedAt.getTime() < NEW_WINDOW_MS,
    };
  });
}

// Publishing always snapshots a version, so the CMS's version history stays
// a complete record of everything that has ever gone live for a document.
export async function publishDocument(documentId: number): Promise<Document> {
  const [doc] = await db
    .select()
    .from(documentsTable)
    .where(eq(documentsTable.id, documentId));
  if (!doc) {
    throw new Error(`Document ${documentId} not found`);
  }

  const [{ value: versionCount }] = await db
    .select({ value: count() })
    .from(documentVersionsTable)
    .where(eq(documentVersionsTable.documentId, documentId));

  await db.insert(documentVersionsTable).values({
    documentId,
    versionNumber: versionCount + 1,
    body: doc.body,
  });

  const [updated] = await db
    .update(documentsTable)
    .set({ status: "published", publishedAt: new Date() })
    .where(eq(documentsTable.id, documentId))
    .returning();

  return updated;
}

export async function replaceDocumentTexts(
  documentId: number,
  textIds: number[],
): Promise<void> {
  await db
    .delete(documentTextsTable)
    .where(eq(documentTextsTable.documentId, documentId));
  if (textIds.length > 0) {
    await db
      .insert(documentTextsTable)
      .values(textIds.map((textId) => ({ documentId, textId })));
  }
}
