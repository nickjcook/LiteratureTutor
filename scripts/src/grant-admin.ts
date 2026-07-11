import { eq } from "drizzle-orm";
import { db, usersTable, platformAdminsTable, pool } from "@workspace/db";

// Usage: pnpm --filter @workspace/scripts run grant-admin -- someone@example.com
// The user must have logged into the platform at least once (so their row
// exists in `users`) before they can be granted CMS admin access this way.

async function main() {
  const email = process.argv[2];
  if (!email) {
    console.error("Usage: pnpm --filter @workspace/scripts run grant-admin -- <email>");
    process.exitCode = 1;
    return;
  }

  const [user] = await db.select().from(usersTable).where(eq(usersTable.email, email));
  if (!user) {
    console.error(
      `No user found with email ${email}. They must log into the platform at least once first.`,
    );
    process.exitCode = 1;
    return;
  }

  const [existing] = await db
    .select()
    .from(platformAdminsTable)
    .where(eq(platformAdminsTable.userId, user.id));
  if (existing) {
    console.log(`${email} is already an admin.`);
    return;
  }

  await db.insert(platformAdminsTable).values({ userId: user.id });
  console.log(`Granted CMS admin access to ${email} (user id ${user.id}).`);
}

main()
  .catch((err) => {
    console.error(err);
    process.exitCode = 1;
  })
  .finally(async () => {
    await pool.end();
  });
