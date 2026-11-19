import { z } from "zod";
import { isLLMConfigured } from "@/lib/ai";
import { getLesson, saveGrammarAttempt } from "@/lib/data/lessons";
import { evaluateGrammarAnswer, matchesAcceptedAnswer } from "@/lib/lessons/grammar";
import type { GrammarExerciseFeedback } from "@/lib/schemas/lesson";
import { requireSession } from "@/lib/session";
import { DEFAULT_LANGUAGE_PAIR } from "@/config/languages";

const Body = z.object({
  index: z.number().int().min(0),
  answer: z.string().trim().min(1).max(500),
});

/**
 * Checks one grammar exercise answer (G-4). A listed answer is accepted instantly; anything
 * else is judged by the AI, so valid alternatives count and mistakes get an explanation.
 */
export async function POST(request: Request, ctx: RouteContext<"/api/lessons/[id]/grammar/check">) {
  const { session, unauthorized } = await requireSession();
  if (unauthorized) return unauthorized;
  const { id } = await ctx.params;
  const parsed = Body.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return Response.json({ error: "BAD_REQUEST" }, { status: 400 });

  const lesson = await getLesson(id, session.user.id);
  const exercise = lesson?.grammarContent?.exercises[parsed.data.index];
  if (!lesson || !exercise) return Response.json({ error: "NOT_FOUND" }, { status: 404 });

  const { answer, index } = parsed.data;
  let feedback: GrammarExerciseFeedback;
  if (matchesAcceptedAnswer(answer, [exercise.answer, ...exercise.acceptableAnswers])) {
    feedback = { correct: true, feedbackNative: "" };
  } else if (isLLMConfigured()) {
    try {
      feedback = await evaluateGrammarAnswer({
        languages: DEFAULT_LANGUAGE_PAIR,
        level: lesson.level,
        grammarFocus: lesson.grammarFocus ?? "",
        exercise,
        answer,
      });
    } catch (error) {
      console.error("Grammar answer check failed", error);
      return Response.json({ error: "CHECK_FAILED" }, { status: 502 });
    }
  } else {
    feedback = { correct: false, feedbackNative: "" };
  }

  await saveGrammarAttempt({
    userId: session.user.id,
    lessonId: lesson.id,
    exerciseIndex: index,
    answer,
    correct: feedback.correct,
    feedback,
  });
  return Response.json({ feedback, answer: exercise.answer });
}
