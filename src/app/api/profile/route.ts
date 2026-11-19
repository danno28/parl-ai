import { z } from "zod";
import { updateProfile } from "@/lib/data/user";
import { requireSession } from "@/lib/session";
import { CEFR_LEVELS } from "@/config/cefr";
import { LESSON_LENGTHS, type LessonMinutes } from "@/config/lesson-length";

const Body = z.object({
  level: z.enum(CEFR_LEVELS).optional(),
  defaultLessonMinutes: z
    .number()
    .refine((m): m is LessonMinutes => (LESSON_LENGTHS as readonly number[]).includes(m))
    .optional(),
});

/** Level (U-3) and default lesson length (U-9). */
export async function PATCH(request: Request) {
  const { session, unauthorized } = await requireSession();
  if (unauthorized) return unauthorized;
  const parsed = Body.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return Response.json({ error: "BAD_REQUEST" }, { status: 400 });
  await updateProfile(session.user.id, {
    level: parsed.data.level,
    defaultLessonMinutes: parsed.data.defaultLessonMinutes as LessonMinutes | undefined,
  });
  return Response.json({ ok: true });
}
