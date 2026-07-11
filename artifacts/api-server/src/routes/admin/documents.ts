import { Router, type IRouter } from "express";
import { and, desc, eq, ilike } from "drizzle-orm";
import {
  db,
  documentsTable,
  documentVersionsTable,
} from "@workspace/db";
import {
  AdminListDocumentsQueryParams,
  AdminListDocumentsResponse,
  AdminCreateDocumentBody,
  AdminCreateDocumentResponse,
  AdminGetDocumentParams,
  AdminGetDocumentResponse,
  AdminUpdateDocumentParams,
  AdminUpdateDocumentBody,
  AdminUpdateDocumentResponse,
  AdminPublishDocumentParams,
  AdminPublishDocumentResponse,
  AdminListDocumentVersionsParams,
  AdminListDocumentVersionsResponse,
  AdminRestoreDocumentVersionParams,
  AdminRestoreDocumentVersionResponse,
} from "@workspace/api-zod";
import { requireAdmin } from "../../lib/adminAuth";
import {
  attachDocumentRelations,
  publishDocument,
  replaceDocumentTexts,
  COPYRIGHT_NOTICE,
} from "../../lib/documents";
import { generateUniqueDocumentSlug } from "../../lib/slug";

const router: IRouter = Router();

router.use(requireAdmin);

router.get("/admin/documents", async (req, res): Promise<void> => {
  const params = AdminListDocumentsQueryParams.safeParse(req.query);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }
  const { status, contentTypeId, search } = params.data;

  const conditions = [];
  if (status != null) conditions.push(eq(documentsTable.status, status));
  if (contentTypeId != null) {
    conditions.push(eq(documentsTable.contentTypeId, contentTypeId));
  }
  if (search != null && search.length > 0) {
    conditions.push(ilike(documentsTable.title, `%${search}%`));
  }

  const docs = await db
    .select()
    .from(documentsTable)
    .where(conditions.length > 0 ? and(...conditions) : undefined)
    .orderBy(desc(documentsTable.updatedAt));

  const shaped = await attachDocumentRelations(docs);
  res.json(AdminListDocumentsResponse.parse(shaped));
});

router.post("/admin/documents", async (req, res): Promise<void> => {
  const parsed = AdminCreateDocumentBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }
  const { textIds, status, ...rest } = parsed.data;
  const slug = await generateUniqueDocumentSlug(rest.title);

  const [doc] = await db
    .insert(documentsTable)
    .values({ ...rest, slug, status: "draft" })
    .returning();

  await replaceDocumentTexts(doc.id, textIds);

  const finalDoc = status === "published" ? await publishDocument(doc.id) : doc;
  const [shaped] = await attachDocumentRelations([finalDoc]);

  res.status(201).json(
    AdminCreateDocumentResponse.parse({
      ...shaped,
      body: finalDoc.body,
      copyrightNotice: COPYRIGHT_NOTICE,
    }),
  );
});

router.get("/admin/documents/:id", async (req, res): Promise<void> => {
  const params = AdminGetDocumentParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const [doc] = await db
    .select()
    .from(documentsTable)
    .where(eq(documentsTable.id, params.data.id));
  if (!doc) {
    res.status(404).json({ error: "Document not found" });
    return;
  }

  const [shaped] = await attachDocumentRelations([doc]);
  res.json(
    AdminGetDocumentResponse.parse({
      ...shaped,
      body: doc.body,
      copyrightNotice: COPYRIGHT_NOTICE,
    }),
  );
});

router.patch("/admin/documents/:id", async (req, res): Promise<void> => {
  const params = AdminUpdateDocumentParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }
  const parsed = AdminUpdateDocumentBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const [existing] = await db
    .select()
    .from(documentsTable)
    .where(eq(documentsTable.id, params.data.id));
  if (!existing) {
    res.status(404).json({ error: "Document not found" });
    return;
  }

  const { textIds, status, ...rest } = parsed.data;

  let slug = existing.slug;
  if (rest.title != null && rest.title !== existing.title) {
    slug = await generateUniqueDocumentSlug(rest.title, existing.id);
  }

  await db
    .update(documentsTable)
    .set({ ...rest, slug })
    .where(eq(documentsTable.id, params.data.id));

  if (textIds != null) {
    await replaceDocumentTexts(params.data.id, textIds);
  }

  const finalDoc =
    status === "published"
      ? await publishDocument(params.data.id)
      : (
          await db
            .select()
            .from(documentsTable)
            .where(eq(documentsTable.id, params.data.id))
        )[0];

  const [shaped] = await attachDocumentRelations([finalDoc]);
  res.json(
    AdminUpdateDocumentResponse.parse({
      ...shaped,
      body: finalDoc.body,
      copyrightNotice: COPYRIGHT_NOTICE,
    }),
  );
});

router.post("/admin/documents/:id/publish", async (req, res): Promise<void> => {
  const params = AdminPublishDocumentParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const [existing] = await db
    .select({ id: documentsTable.id })
    .from(documentsTable)
    .where(eq(documentsTable.id, params.data.id));
  if (!existing) {
    res.status(404).json({ error: "Document not found" });
    return;
  }

  const doc = await publishDocument(params.data.id);
  const [shaped] = await attachDocumentRelations([doc]);
  res.json(
    AdminPublishDocumentResponse.parse({
      ...shaped,
      body: doc.body,
      copyrightNotice: COPYRIGHT_NOTICE,
    }),
  );
});

router.get(
  "/admin/documents/:id/versions",
  async (req, res): Promise<void> => {
    const params = AdminListDocumentVersionsParams.safeParse(req.params);
    if (!params.success) {
      res.status(400).json({ error: params.error.message });
      return;
    }

    const versions = await db
      .select()
      .from(documentVersionsTable)
      .where(eq(documentVersionsTable.documentId, params.data.id))
      .orderBy(desc(documentVersionsTable.versionNumber));

    res.json(AdminListDocumentVersionsResponse.parse(versions));
  },
);

router.post(
  "/admin/documents/:id/versions/:versionId/restore",
  async (req, res): Promise<void> => {
    const params = AdminRestoreDocumentVersionParams.safeParse(req.params);
    if (!params.success) {
      res.status(400).json({ error: params.error.message });
      return;
    }

    const [version] = await db
      .select()
      .from(documentVersionsTable)
      .where(
        and(
          eq(documentVersionsTable.id, params.data.versionId),
          eq(documentVersionsTable.documentId, params.data.id),
        ),
      );
    if (!version) {
      res.status(404).json({ error: "Version not found" });
      return;
    }

    const [doc] = await db
      .update(documentsTable)
      .set({ body: version.body, status: "draft" })
      .where(eq(documentsTable.id, params.data.id))
      .returning();
    if (!doc) {
      res.status(404).json({ error: "Document not found" });
      return;
    }

    const [shaped] = await attachDocumentRelations([doc]);
    res.json(
      AdminRestoreDocumentVersionResponse.parse({
        ...shaped,
        body: doc.body,
        copyrightNotice: COPYRIGHT_NOTICE,
      }),
    );
  },
);

export default router;
