import { z } from "zod";
import { proposeGrammarFocus } from "@/lib/data/lessons";
import { updateProfile } from "@/lib/data/user";
import { requireSession } from "@/lib/session";
import { CEFR_LEVELS } from "@/config/cefr";
import { DEFAULT_LANGUAGE_PAIR } from "@/config/languages";
import { LESSON_LENGTHS, type LessonMinutes } from "@/config/lesson-length";

const Body = z.object({
  level: z.enum(CEFR_LEVELS).optional(),
  defaultLessonMinutes: z
    .number()
    .refine((m): m is LessonMinutes => (LESSON_LENGTHS as readonly number[]).includes(m))
    .optional(),
  grammarPreference: z.enum(["offer", "skip"]).optional(),
});

/**
 * Level (U-3), default lesson length (U-9) and grammar preference (U-8).
 * After a level change it returns the new default grammar focus for the home page.
 */
export async function PATCH(request: Request) {
  const { session, unauthorized } = await requireSession();
  if (unauthorized) return unauthorized;
  const parsed = Body.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return Response.json({ error: "BAD_REQUEST" }, { status: 400 });
  await updateProfile(session.user.id, {
    level: parsed.data.level,
    defaultLessonMinutes: parsed.data.defaultLessonMinutes as LessonMinutes | undefined,
    grammarPreference: parsed.data.grammarPreference,
  });
  const grammarFocus = parsed.data.level
    ? await proposeGrammarFocus(session.user.id, DEFAULT_LANGUAGE_PAIR, parsed.data.level)
    : undefined;
  return Response.json({ ok: true, grammarFocus });
}
