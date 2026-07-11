import { Router, type IRouter } from "express";
import { and, arrayContains } from "drizzle-orm";
import { db, textsTable } from "@workspace/db";
import { ListTextsQueryParams, ListTextsResponse } from "@workspace/api-zod";

const router: IRouter = Router();

router.get("/texts", async (req, res): Promise<void> => {
  const params = ListTextsQueryParams.safeParse(req.query);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const conditions = [];
  if (params.data.yearLevel != null) {
    conditions.push(arrayContains(textsTable.yearLevels, [params.data.yearLevel]));
  }
  if (params.data.courseType != null) {
    conditions.push(arrayContains(textsTable.courseTypes, [params.data.courseType]));
  }

  const texts = await db
    .select()
    .from(textsTable)
    .where(conditions.length > 0 ? and(...conditions) : undefined)
    .orderBy(textsTable.title);

  res.json(ListTextsResponse.parse(texts));
});

export default router;
