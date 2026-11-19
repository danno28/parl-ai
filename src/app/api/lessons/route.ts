import { eq } from "drizzle-orm";
import { z } from "zod";
import { db, schema } from "@/db";
import { AiRefusalError, isLLMConfigured } from "@/lib/ai";
import { modelFor } from "@/lib/ai/config";
import { chooseGrammarFocus, saveLesson } from "@/lib/data/lessons";
import { generateLesson } from "@/lib/lessons/generate";
import { SAMPLE_LESSON } from "@/lib/lessons/sample-lesson";
import { PROMPT_VERSION } from "@/prompts/render";
import { requireSession } from "@/lib/session";
import { DEFAULT_LANGUAGE_PAIR } from "@/config/languages";
import { LESSON_LENGTHS, type LessonMinutes } from "@/config/lesson-length";

const Body = z.object({
  scenario: z.string().trim().min(2).max(200),
  source: z.enum(["suggested", "custom"]),
  minutes: z.number().refine((m): m is LessonMinutes => (LESSON_LENGTHS as readonly number[]).includes(m)),
  /** Development only: store the hand-written sample lesson instead of calling the AI. */
  sample: z.boolean().optional(),
});

/** Creates a lesson for the signed-in learner: generate once with the AI, store, return its id. */
export async function POST(request: Request) {
  const { session, unauthorized } = await requireSession();
  if (unauthorized) return unauthorized;

  const parsed = Body.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return Response.json({ error: "BAD_REQUEST" }, { status: 400 });
  const { scenario, source, sample } = parsed.data;
  const minutes = parsed.data.minutes as LessonMinutes;

  const [user] = await db.select().from(schema.users).where(eq(schema.users.id, session.user.id)).limit(1);
  if (!user) return Response.json({ error: "UNAUTHORIZED" }, { status: 401 });
  const languages = DEFAULT_LANGUAGE_PAIR;
  const level = user.cefrLevel;

  if (sample) {
    if (process.env.NODE_ENV !== "development") return Response.json({ error: "NOT_FOUND" }, { status: 404 });
    const id = await saveLesson({
      userId: user.id,
      languages,
      level: "A2",
      minutes: 5,
      scenarioSource: "suggested",
      grammarTopicId: null,
      content: SAMPLE_LESSON,
      promptVersion: "sample",
      modelId: "sample",
    });
    return Response.json({ id });
  }

  if (!isLLMConfigured()) return Response.json({ error: "LLM_NOT_CONFIGURED" }, { status: 503 });

  try {
    const grammar = await chooseGrammarFocus(user.id, languages, level);
    const content = await generateLesson({ languages, level, minutes, scenario, grammarFocus: grammar.title });
    if (!content.dialogue.some((t) => t.speaker === "user")) {
      return Response.json({ error: "GENERATION_FAILED" }, { status: 502 });
    }
    const id = await saveLesson({
      userId: user.id,
      languages,
      level,
      minutes,
      scenarioSource: source,
      grammarTopicId: grammar.id,
      content,
      promptVersion: PROMPT_VERSION,
      modelId: modelFor("generateLesson"),
    });
    return Response.json({ id });
  } catch (error) {
    if (error instanceof AiRefusalError) return Response.json({ error: "REFUSED" }, { status: 422 });
    console.error("Lesson generation failed", error);
    return Response.json({ error: "GENERATION_FAILED" }, { status: 502 });
  }
}
