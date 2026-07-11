import { eq } from "drizzle-orm";
import { db, documentsTable } from "@workspace/db";

function baseSlugify(title: string): string {
  const slug = title
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-+|-+$)/g, "");
  return slug.length > 0 ? slug : "document";
}

export async function generateUniqueDocumentSlug(
  title: string,
  excludeId?: number,
): Promise<string> {
  const base = baseSlugify(title);
  let candidate = base;
  let suffix = 2;

  for (;;) {
    const [existing] = await db
      .select({ id: documentsTable.id })
      .from(documentsTable)
      .where(eq(documentsTable.slug, candidate));

    if (!existing || existing.id === excludeId) {
      return candidate;
    }
    candidate = `${base}-${suffix}`;
    suffix += 1;
  }
}
