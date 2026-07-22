import { Router, type IRouter } from "express";
import { desc, eq, sql } from "drizzle-orm";
import {
  db,
  usersTable,
  platformAdminsTable,
  studentProfilesTable,
  sessionsTable,
} from "@workspace/db";
import {
  AdminListUsersResponse,
  AdminSetUserAdminParams,
  AdminSetUserAdminBody,
  AdminSetUserAdminResponse,
  AdminDeleteUserParams,
} from "@workspace/api-zod";
import { requireAdmin } from "../../lib/adminAuth";

const router: IRouter = Router();

router.use(requireAdmin);

const userSummarySelect = {
  id: usersTable.id,
  email: usersTable.email,
  firstName: usersTable.firstName,
  lastName: usersTable.lastName,
  createdAt: usersTable.createdAt,
  adminId: platformAdminsTable.id,
  yearLevel: studentProfilesTable.yearLevel,
  courseType: studentProfilesTable.courseType,
  school: studentProfilesTable.school,
};

type UserSummaryRow = {
  id: string;
  email: string | null;
  firstName: string | null;
  lastName: string | null;
  createdAt: Date;
  adminId: number | null;
  yearLevel: number | null;
  courseType: string | null;
  school: string | null;
};

function shapeUser(row: UserSummaryRow) {
  return {
    id: row.id,
    email: row.email,
    firstName: row.firstName,
    lastName: row.lastName,
    createdAt: row.createdAt.toISOString(),
    isAdmin: row.adminId != null,
    yearLevel: row.yearLevel ?? null,
    courseType: row.courseType ?? null,
    school: row.school ?? null,
  };
}

function selectUserSummaries() {
  return db
    .select(userSummarySelect)
    .from(usersTable)
    .leftJoin(
      platformAdminsTable,
      eq(platformAdminsTable.userId, usersTable.id),
    )
    .leftJoin(
      studentProfilesTable,
      eq(studentProfilesTable.userId, usersTable.id),
    );
}

// Interim user maintenance on the Replit Auth model. Accounts are created by
// the user's first Replit login (they cannot be pre-provisioned here); admins
// can then grant/revoke admin access or delete an account. Richer roles
// (admin/advisor/member) arrive with the Clerk migration.
router.get("/admin/users", async (_req, res): Promise<void> => {
  const rows = await selectUserSummaries().orderBy(desc(usersTable.createdAt));
  res.json(AdminListUsersResponse.parse(rows.map(shapeUser)));
});

router.put("/admin/users/:id/admin", async (req, res): Promise<void> => {
  const params = AdminSetUserAdminParams.safeParse(req.params);
  const body = AdminSetUserAdminBody.safeParse(req.body);
  if (!params.success || !body.success) {
    res.status(400).json({ error: "Invalid request" });
    return;
  }
  const { id } = params.data;

  // Self-lockout guard: an admin must not revoke (or redundantly re-grant)
  // their own access — another admin has to do it.
  if (req.isAuthenticated() && req.user.id === id) {
    res
      .status(400)
      .json({ error: "You can't change your own admin access" });
    return;
  }

  const [user] = await db
    .select({ id: usersTable.id })
    .from(usersTable)
    .where(eq(usersTable.id, id));
  if (!user) {
    res.status(404).json({ error: "No such user" });
    return;
  }

  if (body.data.isAdmin) {
    await db
      .insert(platformAdminsTable)
      .values({ userId: id })
      .onConflictDoNothing();
  } else {
    await db
      .delete(platformAdminsTable)
      .where(eq(platformAdminsTable.userId, id));
  }

  const [row] = await selectUserSummaries().where(eq(usersTable.id, id));
  res.json(AdminSetUserAdminResponse.parse(shapeUser(row)));
});

router.delete("/admin/users/:id", async (req, res): Promise<void> => {
  const params = AdminDeleteUserParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: "Invalid request" });
    return;
  }
  const { id } = params.data;

  if (req.isAuthenticated() && req.user.id === id) {
    res.status(400).json({ error: "You can't delete your own account" });
    return;
  }

  const [user] = await db
    .select({ id: usersTable.id })
    .from(usersTable)
    .where(eq(usersTable.id, id));
  if (!user) {
    res.status(404).json({ error: "No such user" });
    return;
  }

  // FK cascades remove the profile, admin grant and progress records. Their
  // active sessions must go too, or the deleted account lingers as a ghost
  // login until the session expires.
  await db.delete(usersTable).where(eq(usersTable.id, id));
  await db
    .delete(sessionsTable)
    .where(sql`${sessionsTable.sess}->'user'->>'id' = ${id}`);

  res.status(204).end();
});

export default router;
