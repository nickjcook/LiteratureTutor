import { Router, type IRouter } from "express";
import { GetAdminStatusResponse } from "@workspace/api-zod";
import { isAdminUser } from "../../lib/adminAuth";

const router: IRouter = Router();

router.get("/admin/status", async (req, res): Promise<void> => {
  if (!req.isAuthenticated()) {
    res.status(401).json({ error: "Not authenticated" });
    return;
  }
  const isAdmin = await isAdminUser(req.user.id);
  res.json(GetAdminStatusResponse.parse({ isAdmin }));
});

export default router;
