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
  AdminUpsertUserProfileParams,
  AdminUpsertUserProfileBody,
  AdminUpsertUserProfileResponse,
  AdminClearUserProfileParams,
  AdminClearUserProfileResponse,
  AdminImpersonateUserParams,
  AdminImpersonateUserResponse,
  AdminCreateUserBody,
  AdminCreateUserResponse,
  AdminSetUserPasswordParams,
  AdminSetUserPasswordBody,
  AdminSetUserPasswordResponse,
} from "@workspace/api-zod";
import { requireAdmin } from "../../lib/adminAuth";
import { getSessionId, getSession, updateSession } from "../../lib/auth";
import { hashPassword, generatePassword } from "../../lib/passwords";

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

// Create an account with local login credentials — the tester onboarding path.
// If no password is supplied, a temporary one is generated and returned once.
router.post("/admin/users", async (req, res): Promise<void> => {
  const body = AdminCreateUserBody.safeParse(req.body);
  if (!body.success) {
    res.status(400).json({ error: "Invalid request" });
    return;
  }
  const { email, firstName, lastName, password, isAdmin } = body.data;
  const normalizedEmail = email.trim().toLowerCase();

  const [existing] = await db
    .select({ id: usersTable.id })
    .from(usersTable)
    .where(sql`lower(${usersTable.email}) = ${normalizedEmail}`);
  if (existing) {
    res.status(400).json({ error: "That email is already in use" });
    return;
  }

  const temporaryPassword = password == null ? generatePassword() : null;
  const passwordHash = await hashPassword(password ?? temporaryPassword!);

  const [created] = await db
    .insert(usersTable)
    .values({
      email: normalizedEmail,
      firstName: firstName ?? null,
      lastName: lastName ?? null,
      passwordHash,
    })
    .returning();

  if (isAdmin) {
    await db
      .insert(platformAdminsTable)
      .values({ userId: created.id })
      .onConflictDoNothing();
  }

  const [row] = await selectUserSummaries().where(eq(usersTable.id, created.id));
  res.status(201).json(
    AdminCreateUserResponse.parse({
      user: shapeUser(row),
      temporaryPassword,
    }),
  );
});

// Set or reset a user's password. Generates one if none supplied. Resetting
// another user's password revokes their active sessions.
router.put("/admin/users/:id/password", async (req, res): Promise<void> => {
  const params = AdminSetUserPasswordParams.safeParse(req.params);
  const body = AdminSetUserPasswordBody.safeParse(req.body ?? {});
  if (!params.success || !body.success) {
    res.status(400).json({ error: "Invalid request" });
    return;
  }
  const { id } = params.data;

  const [user] = await db
    .select({ id: usersTable.id })
    .from(usersTable)
    .where(eq(usersTable.id, id));
  if (!user) {
    res.status(404).json({ error: "No such user" });
    return;
  }

  const temporaryPassword = body.data.password == null ? generatePassword() : null;
  await db
    .update(usersTable)
    .set({ passwordHash: await hashPassword(body.data.password ?? temporaryPassword!) })
    .where(eq(usersTable.id, id));

  const isSelf = req.isAuthenticated() && req.user.id === id;
  if (!isSelf) {
    await db
      .delete(sessionsTable)
      .where(sql`${sessionsTable.sess}->'user'->>'id' = ${id}`);
  }

  res.json(AdminSetUserPasswordResponse.parse({ temporaryPassword }));
});

// Admin can set any user's study profile — including their own, for testing
// different years/courses without re-running onboarding.
router.put("/admin/users/:id/profile", async (req, res): Promise<void> => {
  const params = AdminUpsertUserProfileParams.safeParse(req.params);
  const body = AdminUpsertUserProfileBody.safeParse(req.body);
  if (!params.success || !body.success) {
    res.status(400).json({ error: "Invalid request" });
    return;
  }
  const { id } = params.data;

  const [user] = await db
    .select({ id: usersTable.id })
    .from(usersTable)
    .where(eq(usersTable.id, id));
  if (!user) {
    res.status(404).json({ error: "No such user" });
    return;
  }

  await db
    .insert(studentProfilesTable)
    .values({ userId: id, ...body.data })
    .onConflictDoUpdate({
      target: studentProfilesTable.userId,
      set: { ...body.data, updatedAt: new Date() },
    });

  const [row] = await selectUserSummaries().where(eq(usersTable.id, id));
  res.json(AdminUpsertUserProfileResponse.parse(shapeUser(row)));
});

// Clearing the profile sends that user back through onboarding on next visit.
router.delete("/admin/users/:id/profile", async (req, res): Promise<void> => {
  const params = AdminClearUserProfileParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: "Invalid request" });
    return;
  }
  const { id } = params.data;

  const [user] = await db
    .select({ id: usersTable.id })
    .from(usersTable)
    .where(eq(usersTable.id, id));
  if (!user) {
    res.status(404).json({ error: "No such user" });
    return;
  }

  await db
    .delete(studentProfilesTable)
    .where(eq(studentProfilesTable.userId, id));

  const [row] = await selectUserSummaries().where(eq(usersTable.id, id));
  res.json(AdminClearUserProfileResponse.parse(shapeUser(row)));
});

// Swap this session's effective user to the target, remembering the admin so
// /auth/stop-impersonating can restore them. The whole API then behaves as the
// target user — profile, progress, the lot — which is the point.
router.post(
  "/admin/users/:id/impersonate",
  async (req, res): Promise<void> => {
    const params = AdminImpersonateUserParams.safeParse(req.params);
    if (!params.success) {
      res.status(400).json({ error: "Invalid request" });
      return;
    }
    const { id } = params.data;

    if (req.isAuthenticated() && req.user.id === id) {
      res.status(400).json({ error: "You can't impersonate yourself" });
      return;
    }

    const sid = getSessionId(req);
    const session = sid ? await getSession(sid) : null;
    if (!sid || !session) {
      res.status(400).json({ error: "Invalid request" });
      return;
    }
    if (session.impersonator) {
      res
        .status(400)
        .json({ error: "Already impersonating — stop impersonating first" });
      return;
    }

    const [target] = await db
      .select()
      .from(usersTable)
      .where(eq(usersTable.id, id));
    if (!target) {
      res.status(404).json({ error: "No such user" });
      return;
    }

    req.log.info(
      { adminId: session.user.id, targetId: target.id },
      "Impersonation started",
    );

    session.impersonator = session.user;
    session.user = {
      id: target.id,
      email: target.email,
      firstName: target.firstName,
      lastName: target.lastName,
      profileImageUrl: target.profileImageUrl,
    };
    await updateSession(sid, session);

    res.json(
      AdminImpersonateUserResponse.parse({
        user: session.user,
        impersonator: session.impersonator,
      }),
    );
  },
);

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
