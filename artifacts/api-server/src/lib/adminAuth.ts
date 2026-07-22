import { type Request, type Response, type NextFunction } from "express";
import { eq } from "drizzle-orm";
import { db, platformAdminsTable, usersTable } from "@workspace/db";

// Bootstrap/lockout-recovery allow-list: comma-separated emails in the
// ADMIN_EMAILS secret. NOT a password bypass — these users still authenticate
// normally through Replit Auth; matching only grants the admin *role*. Covers
// the first admin on a fresh deploy and recovery if the admin table is lost.
function bootstrapAdminEmails(): string[] {
  return (process.env.ADMIN_EMAILS ?? "")
    .split(",")
    .map((email) => email.trim().toLowerCase())
    .filter((email) => email.length > 0);
}

/** Persist the admin grant for a bootstrap-listed user (called on login). */
export async function ensureBootstrapAdmin(user: {
  id: string;
  email: string | null;
}): Promise<void> {
  if (!user.email) return;
  if (!bootstrapAdminEmails().includes(user.email.toLowerCase())) return;
  await db
    .insert(platformAdminsTable)
    .values({ userId: user.id })
    .onConflictDoNothing();
}

export async function isAdminUser(userId: string): Promise<boolean> {
  const [row] = await db
    .select()
    .from(platformAdminsTable)
    .where(eq(platformAdminsTable.userId, userId));
  if (row != null) return true;

  // Live fallback so a bootstrap admin can never be locked out mid-session,
  // even if their platform_admins row was deleted.
  const emails = bootstrapAdminEmails();
  if (emails.length === 0) return false;
  const [user] = await db
    .select({ email: usersTable.email })
    .from(usersTable)
    .where(eq(usersTable.id, userId));
  return user?.email != null && emails.includes(user.email.toLowerCase());
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
