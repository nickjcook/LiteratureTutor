import { Router, type IRouter } from "express";
import { desc, eq } from "drizzle-orm";
import {
  db,
  usersTable,
  platformAdminsTable,
  studentProfilesTable,
} from "@workspace/db";
import { AdminListUsersResponse } from "@workspace/api-zod";
import { requireAdmin } from "../../lib/adminAuth";

const router: IRouter = Router();

router.use(requireAdmin);

// Interim read-only user list. Role management (admin/advisor/member) arrives
// with the Clerk migration; until then admin rights are seeded directly in the
// platform_admins table and this endpoint only reports state.
router.get("/admin/users", async (_req, res): Promise<void> => {
  const rows = await db
    .select({
      id: usersTable.id,
      email: usersTable.email,
      firstName: usersTable.firstName,
      lastName: usersTable.lastName,
      createdAt: usersTable.createdAt,
      adminId: platformAdminsTable.id,
      yearLevel: studentProfilesTable.yearLevel,
      courseType: studentProfilesTable.courseType,
      school: studentProfilesTable.school,
    })
    .from(usersTable)
    .leftJoin(
      platformAdminsTable,
      eq(platformAdminsTable.userId, usersTable.id),
    )
    .leftJoin(
      studentProfilesTable,
      eq(studentProfilesTable.userId, usersTable.id),
    )
    .orderBy(desc(usersTable.createdAt));

  const shaped = rows.map((row) => ({
    id: row.id,
    email: row.email,
    firstName: row.firstName,
    lastName: row.lastName,
    createdAt: row.createdAt.toISOString(),
    isAdmin: row.adminId != null,
    yearLevel: row.yearLevel ?? null,
    courseType: row.courseType ?? null,
    school: row.school ?? null,
  }));

  res.json(AdminListUsersResponse.parse(shaped));
});

export default router;
