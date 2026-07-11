import { type Request, type Response, type NextFunction } from "express";
import { eq } from "drizzle-orm";
import { db, platformAdminsTable } from "@workspace/db";

export async function isAdminUser(userId: string): Promise<boolean> {
  const [row] = await db
    .select()
    .from(platformAdminsTable)
    .where(eq(platformAdminsTable.userId, userId));
  return row != null;
}

export async function requireAdmin(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  if (!req.isAuthenticated()) {
    res.status(403).json({ error: "Not an admin" });
    return;
  }
  const admin = await isAdminUser(req.user.id);
  if (!admin) {
    res.status(403).json({ error: "Not an admin" });
    return;
  }
  next();
}
