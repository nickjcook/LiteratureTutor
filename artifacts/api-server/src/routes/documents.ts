import { Router, type IRouter } from "express";
import { and, arrayContains, eq, ilike, inArray } from "drizzle-orm";
import {
  db,
  documentsTable,
  documentTextsTable,
  documentProgressTable,
} from "@workspace/db";
import {
  ListDocumentsQueryParams,
  ListDocumentsResponse,
  GetDocumentParams,
  GetDocumentResponse,
  MarkDocumentViewedParams,
  MarkDocumentViewedResponse,
  MarkDocumentCompletedParams,
  MarkDocumentCompletedResponse,
} from "@workspace/api-zod";
import { attachDocumentRelations, COPYRIGHT_NOTICE } from "../lib/documents";

const router: IRouter = Router();

router.get("/documents", async (req, res): Promise<void> => {
  const params = ListDocumentsQueryParams.safeParse(req.query);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }
  const { yearLevel, courseType, textId, contentTypeId, taskType, search } =
    params.data;

  const conditions = [eq(documentsTable.status, "published")];
  if (yearLevel != null) {
    conditions.push(arrayContains(documentsTable.yearLevels, [yearLevel]));
  }
  if (courseType != null) {
    conditions.push(arrayContains(documentsTable.courseTypes, [courseType]));
  }
  if (taskType != null) {
    conditions.push(arrayContains(documentsTable.taskTypes, [taskType]));
  }
  if (contentTypeId != null) {
    conditions.push(eq(documentsTable.contentTypeId, contentTypeId));
  }
  if (search != null && search.length > 0) {
    conditions.push(ilike(documentsTable.title, `%${search}%`));
  }
  if (textId != null) {
    const links = await db
      .select({ id: documentTextsTable.documentId })
      .from(documentTextsTable)
      .where(eq(documentTextsTable.textId, textId));
    const ids = links.map((l) => l.id);
    conditions.push(inArray(documentsTable.id, ids.length > 0 ? ids : [-1]));
  }

  const docs = await db
    .select()
    .from(documentsTable)
    .where(and(...conditions))
    .orderBy(documentsTable.title);

  const shaped = await attachDocumentRelations(docs);
  res.json(ListDocumentsResponse.parse(shaped));
});

router.get("/documents/:slug", async (req, res): Promise<void> => {
  const params = GetDocumentParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const [doc] = await db
    .select()
    .from(documentsTable)
    .where(
      and(
        eq(documentsTable.slug, params.data.slug),
        eq(documentsTable.status, "published"),
      ),
    );

  if (!doc) {
    res.status(404).json({ error: "Document not found" });
    return;
  }

  const [shaped] = await attachDocumentRelations([doc]);
  res.json(
    GetDocumentResponse.parse({
      ...shaped,
      body: doc.body,
      copyrightNotice: COPYRIGHT_NOTICE,
    }),
  );
});

router.post("/documents/:slug/progress", async (req, res): Promise<void> => {
  if (!req.isAuthenticated()) {
    res.status(401).json({ error: "Not authenticated" });
    return;
  }
  const params = MarkDocumentViewedParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const [doc] = await db
    .select()
    .from(documentsTable)
    .where(eq(documentsTable.slug, params.data.slug));
  if (!doc) {
    res.status(404).json({ error: "Document not found" });
    return;
  }

  const [progress] = await db
    .insert(documentProgressTable)
    .values({ userId: req.user.id, documentId: doc.id, viewedAt: new Date() })
    .onConflictDoUpdate({
      target: [documentProgressTable.userId, documentProgressTable.documentId],
      set: { viewedAt: new Date() },
    })
    .returning();

  res.json(MarkDocumentViewedResponse.parse(progress));
});

router.post("/documents/:slug/complete", async (req, res): Promise<void> => {
  if (!req.isAuthenticated()) {
    res.status(401).json({ error: "Not authenticated" });
    return;
  }
  const params = MarkDocumentCompletedParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const [doc] = await db
    .select()
    .from(documentsTable)
    .where(eq(documentsTable.slug, params.data.slug));
  if (!doc) {
    res.status(404).json({ error: "Document not found" });
    return;
  }

  const now = new Date();
  const [progress] = await db
    .insert(documentProgressTable)
    .values({
      userId: req.user.id,
      documentId: doc.id,
      viewedAt: now,
      completedAt: now,
    })
    .onConflictDoUpdate({
      target: [documentProgressTable.userId, documentProgressTable.documentId],
      set: { completedAt: now },
    })
    .returning();

  res.json(MarkDocumentCompletedResponse.parse(progress));
});

export default router;
