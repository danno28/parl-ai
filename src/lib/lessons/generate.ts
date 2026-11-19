import "server-only";
import { generateValidated } from "@/lib/ai";
import { LessonContentSchema, type LessonContent } from "@/lib/schemas/lesson";
import { CEFR_DESCRIPTORS, type CefrLevel } from "@/config/cefr";
import { LESSON_SIZING, type LessonMinutes } from "@/config/lesson-length";
import { NATIVE_LANGUAGES, TARGET_LANGUAGES, type LanguagePair } from "@/config/languages";
import { render } from "@/prompts/render";
import { GENERATE_LESSON_SYSTEM, GENERATE_LESSON_USER } from "@/prompts/v1/generate-lesson";

export type GenerateLessonInput = {
  languages: LanguagePair;
  level: CefrLevel;
  minutes: LessonMinutes;
  scenario: string;
  grammarFocus: string;
  userRole?: string;
  register?: "formal" | "informal" | "auto";
};

/** Generates a lesson's vocabulary and dialogue in one call; the result is stored and reused (A-5). */
export async function generateLesson(input: GenerateLessonInput): Promise<LessonContent> {
  const target = TARGET_LANGUAGES[input.languages.target].name;
  const native = NATIVE_LANGUAGES[input.languages.native].name;
  const size = LESSON_SIZING[input.minutes];

  const system = render(GENERATE_LESSON_SYSTEM, {
    targetLanguage: target,
    nativeLanguage: native,
    feedbackLanguage: native,
    level: input.level,
    levelDescriptor: CEFR_DESCRIPTORS[input.level],
  });

  const user = render(GENERATE_LESSON_USER, {
    scenario: input.scenario,
    userRole: input.userRole ?? "the natural role for a visitor or customer in this scenario",
    register: input.register ?? "auto",
    grammarFocus: input.grammarFocus,
    minutes: input.minutes,
    vocabMin: size.vocabularyItems[0],
    vocabMax: size.vocabularyItems[1],
    turnsMin: size.dialogueTurns[0],
    turnsMax: size.dialogueTurns[1],
    userLinesMin: size.userLines[0],
    userLinesMax: size.userLines[1],
    feedbackLanguage: native,
  });

  return generateValidated({
    task: "generateLesson",
    system,
    messages: [{ role: "user", content: user }],
    schema: LessonContentSchema,
  });
}
