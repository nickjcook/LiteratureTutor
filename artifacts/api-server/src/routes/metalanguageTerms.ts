import { Router, type IRouter } from "express";
import { and, eq, ilike } from "drizzle-orm";
import { db, metalanguageTermsTable } from "@workspace/db";
import {
  ListMetalanguageTermsQueryParams,
  ListMetalanguageTermsResponse,
} from "@workspace/api-zod";

const router: IRouter = Router();

router.get("/metalanguage-terms", async (req, res): Promise<void> => {
  const params = ListMetalanguageTermsQueryParams.safeParse(req.query);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const conditions = [];
  if (params.data.tab != null) {
    conditions.push(eq(metalanguageTermsTable.tab, params.data.tab));
  }
  if (params.data.search != null && params.data.search.length > 0) {
    conditions.push(ilike(metalanguageTermsTable.term, `%${params.data.search}%`));
  }

  const terms = await db
    .select()
    .from(metalanguageTermsTable)
    .where(conditions.length > 0 ? and(...conditions) : undefined)
    .orderBy(metalanguageTermsTable.term);

  res.json(ListMetalanguageTermsResponse.parse(terms));
});

export default router;
