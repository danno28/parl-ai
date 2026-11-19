import "server-only";
import { eq } from "drizzle-orm";
import { redirect } from "next/navigation";
import { db, schema } from "@/db";
import { getSession } from "@/lib/session";
import type { CefrLevel } from "@/config/cefr";
import type { LessonMinutes } from "@/config/lesson-length";

/** The signed-in learner's profile (Data Access Layer: the only place pages read the session). */
export type CurrentUser = {
  id: string;
  email: string;
  level: CefrLevel;
  defaultLessonMinutes: LessonMinutes;
};

export async function getCurrentUser(): Promise<CurrentUser> {
  const session = await getSession();
  if (!session) redirect("/login");
  const [row] = await db
    .select()
    .from(schema.users)
    .where(eq(schema.users.id, session.user.id))
    .limit(1);
  if (!row) redirect("/login");
  return {
    id: row.id,
    email: row.email,
    level: row.cefrLevel,
    defaultLessonMinutes: ([5, 10, 15].includes(row.defaultLessonMinutes)
      ? row.defaultLessonMinutes
      : 10) as LessonMinutes,
  };
}

export async function updateProfile(
  userId: string,
  changes: { level?: CefrLevel; defaultLessonMinutes?: LessonMinutes },
): Promise<void> {
  await db
    .update(schema.users)
    .set({
      ...(changes.level ? { cefrLevel: changes.level } : {}),
      ...(changes.defaultLessonMinutes ? { defaultLessonMinutes: changes.defaultLessonMinutes } : {}),
    })
    .where(eq(schema.users.id, userId));
}
