import { eq } from "drizzle-orm";
import { db, schema } from "@/db";
import { AiRefusalError, isLLMConfigured } from "@/lib/ai";
import { storeSuggestions } from "@/lib/data/user";
import { suggestScenarios } from "@/lib/lessons/suggest";
import { requireSession } from "@/lib/session";
import { DEFAULT_LANGUAGE_PAIR } from "@/config/languages";

/**
 * New AI scenario suggestions for the learner's level (S-1), stored on the profile so the
 * home page shows them without another AI call. Called when none are stored yet, after a
 * level change, and from "Andere Vorschläge".
 */
export async function POST() {
  const { session, unauthorized } = await requireSession();
  if (unauthorized) return unauthorized;
  if (!isLLMConfigured()) return Response.json({ error: "LLM_NOT_CONFIGURED" }, { status: 503 });

  const [user] = await db.select().from(schema.users).where(eq(schema.users.id, session.user.id)).limit(1);
  if (!user) return Response.json({ error: "UNAUTHORIZED" }, { status: 401 });

  const done = await db
    .selectDistinct({ title: schema.scenarios.titleNative })
    .from(schema.lessons)
    .innerJoin(schema.scenarios, eq(schema.lessons.scenarioId, schema.scenarios.id))
    .where(eq(schema.lessons.userId, user.id));

  try {
    const suggestions = await suggestScenarios({
      languages: DEFAULT_LANGUAGE_PAIR,
      level: user.cefrLevel,
      alreadyDone: done.map((d) => d.title),
    });
    await storeSuggestions(user.id, user.cefrLevel, suggestions);
    return Response.json({ suggestions, level: user.cefrLevel });
  } catch (error) {
    if (error instanceof AiRefusalError) return Response.json({ error: "REFUSED" }, { status: 422 });
    console.error("Scenario suggestions failed", error);
    return Response.json({ error: "SUGGESTIONS_FAILED" }, { status: 502 });
  }
}
