import { Router, type IRouter } from "express";
import { db, contentTypesTable } from "@workspace/db";
import { ListContentTypesResponse } from "@workspace/api-zod";

const router: IRouter = Router();

router.get("/content-types", async (_req, res): Promise<void> => {
  const contentTypes = await db
    .select()
    .from(contentTypesTable)
    .orderBy(contentTypesTable.name);

  res.json(ListContentTypesResponse.parse(contentTypes));
});

export default router;
