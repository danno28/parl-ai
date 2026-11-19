import { z } from "zod";
import { AiRefusalError, isLLMConfigured } from "@/lib/ai";
import { finishGrammar, getLesson, saveGrammarContent } from "@/lib/data/lessons";
import { generateGrammarLesson } from "@/lib/lessons/grammar";
import { requireSession } from "@/lib/session";
import { DEFAULT_LANGUAGE_PAIR } from "@/config/languages";
import type { LessonMinutes } from "@/config/lesson-length";

/** Returns the lesson's grammar content, generating it on first request (G-7). */
export async function POST(_request: Request, ctx: RouteContext<"/api/lessons/[id]/grammar">) {
  const { session, unauthorized } = await requireSession();
  if (unauthorized) return unauthorized;
  const { id } = await ctx.params;
  const lesson = await getLesson(id, session.user.id);
  if (!lesson) return Response.json({ error: "NOT_FOUND" }, { status: 404 });
  if (!lesson.grammarFocus) return Response.json({ error: "NO_GRAMMAR_FOCUS" }, { status: 404 });
  if (lesson.grammarContent) return Response.json({ grammar: lesson.grammarContent });
  if (!isLLMConfigured()) return Response.json({ error: "LLM_NOT_CONFIGURED" }, { status: 503 });

  try {
    const grammar = await generateGrammarLesson({
      languages: DEFAULT_LANGUAGE_PAIR,
      level: lesson.level,
      minutes: ([5, 10, 15].includes(lesson.minutes) ? lesson.minutes : 10) as LessonMinutes,
      scenario: `${lesson.titleTarget} (${lesson.titleNative})`,
      grammarFocus: lesson.grammarFocus,
    });
    await saveGrammarContent(lesson.id, session.user.id, grammar);
    return Response.json({ grammar });
  } catch (error) {
    if (error instanceof AiRefusalError) return Response.json({ error: "REFUSED" }, { status: 422 });
    console.error("Grammar lesson generation failed", error);
    return Response.json({ error: "GENERATION_FAILED" }, { status: 502 });
  }
}

const Finish = z.object({ status: z.enum(["done", "skipped"]) });

/** Marks Stage 0 as done or skipped and moves the lesson on to vocabulary (G-1). */
export async function PATCH(request: Request, ctx: RouteContext<"/api/lessons/[id]/grammar">) {
  const { session, unauthorized } = await requireSession();
  if (unauthorized) return unauthorized;
  const { id } = await ctx.params;
  const parsed = Finish.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return Response.json({ error: "BAD_REQUEST" }, { status: 400 });
  if (!(await getLesson(id, session.user.id))) return Response.json({ error: "NOT_FOUND" }, { status: 404 });
  await finishGrammar(id, session.user.id, parsed.data.status);
  return Response.json({ ok: true });
}
