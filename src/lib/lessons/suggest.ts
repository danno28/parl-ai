import "server-only";
import { generateValidated } from "@/lib/ai";
import { ScenarioSuggestionsSchema, type ScenarioSuggestion } from "@/lib/schemas/lesson";
import { CEFR_DESCRIPTORS, type CefrLevel } from "@/config/cefr";
import { NATIVE_LANGUAGES, TARGET_LANGUAGES, type LanguagePair } from "@/config/languages";
import { render } from "@/prompts/render";
import { SUGGEST_SCENARIOS_SYSTEM, SUGGEST_SCENARIOS_USER } from "@/prompts/v1/suggest-scenarios";

export const SUGGESTION_COUNT = 6;

/** AI scenario suggestions for the learner's level, skipping scenes already practised (S-1). */
export async function suggestScenarios(input: {
  languages: LanguagePair;
  level: CefrLevel;
  alreadyDone: string[];
}): Promise<ScenarioSuggestion[]> {
  const native = NATIVE_LANGUAGES[input.languages.native].name;
  const result = await generateValidated({
    task: "suggestScenarios",
    system: render(SUGGEST_SCENARIOS_SYSTEM, {
      targetLanguage: TARGET_LANGUAGES[input.languages.target].name,
      nativeLanguage: native,
      feedbackLanguage: native,
      level: input.level,
      levelDescriptor: CEFR_DESCRIPTORS[input.level],
    }),
    messages: [
      {
        role: "user",
        content: render(SUGGEST_SCENARIOS_USER, {
          count: SUGGESTION_COUNT,
          level: input.level,
          completed: input.alreadyDone.length ? input.alreadyDone.map((t) => `- ${t}`).join("\n") : "(none yet)",
        }),
      },
    ],
    schema: ScenarioSuggestionsSchema,
  });
  return result.suggestions.slice(0, SUGGESTION_COUNT);
}
