import "server-only";
import { generateValidated } from "@/lib/ai";
import {
  GrammarExerciseFeedbackSchema,
  GrammarLessonSchema,
  type GrammarExerciseFeedback,
  type GrammarLesson,
} from "@/lib/schemas/lesson";
import { CEFR_DESCRIPTORS, type CefrLevel } from "@/config/cefr";
import { LESSON_SIZING, type LessonMinutes } from "@/config/lesson-length";
import { NATIVE_LANGUAGES, TARGET_LANGUAGES, type LanguagePair } from "@/config/languages";
import { render } from "@/prompts/render";
import {
  EVALUATE_GRAMMAR_SYSTEM,
  EVALUATE_GRAMMAR_USER,
  GRAMMAR_LESSON_SYSTEM,
  GRAMMAR_LESSON_USER,
} from "@/prompts/v1/grammar-lesson";

function teacherVars(languages: LanguagePair, level: CefrLevel) {
  const native = NATIVE_LANGUAGES[languages.native].name;
  return {
    targetLanguage: TARGET_LANGUAGES[languages.target].name,
    nativeLanguage: native,
    feedbackLanguage: native,
    level,
    levelDescriptor: CEFR_DESCRIPTORS[level],
  };
}

/** Stage 0 content (G-4), sized to the lesson length (L-3). Generated on first opening (G-7). */
export async function generateGrammarLesson(input: {
  languages: LanguagePair;
  level: CefrLevel;
  minutes: LessonMinutes;
  scenario: string;
  grammarFocus: string;
}): Promise<GrammarLesson> {
  const vars = teacherVars(input.languages, input.level);
  const [min, max] = LESSON_SIZING[input.minutes].grammarExercises;
  return generateValidated({
    task: "generateGrammarLesson",
    system: render(GRAMMAR_LESSON_SYSTEM, vars),
    messages: [
      {
        role: "user",
        content: render(GRAMMAR_LESSON_USER, {
          ...vars,
          grammarFocus: input.grammarFocus,
          scenario: input.scenario,
          exercisesMin: min,
          exercisesMax: max,
        }),
      },
    ],
    schema: GrammarLessonSchema,
  });
}

const normalize = (s: string) =>
  s
    .toLowerCase()
    .replace(/[’`]/g, "'")
    .replace(/[.!?,;:«»"„“”]/g, " ")
    .replace(/\s+/g, " ")
    .trim();

/** True if the answer matches the model answer or a listed variant (no AI call needed). */
export function matchesAcceptedAnswer(answer: string, accepted: string[]): boolean {
  const a = normalize(answer);
  return accepted.some((x) => normalize(x) === a);
}

/** Checks an answer that didn't match any listed variant, so near-misses and valid alternatives get a fair verdict. */
export async function evaluateGrammarAnswer(input: {
  languages: LanguagePair;
  level: CefrLevel;
  grammarFocus: string;
  exercise: GrammarLesson["exercises"][number];
  answer: string;
}): Promise<GrammarExerciseFeedback> {
  return generateValidated({
    task: "evaluateGrammarExercise",
    system: render(EVALUATE_GRAMMAR_SYSTEM, teacherVars(input.languages, input.level)),
    messages: [
      {
        role: "user",
        content: render(EVALUATE_GRAMMAR_USER, {
          grammarFocus: input.grammarFocus,
          kind: input.exercise.kind,
          instruction: input.exercise.instructionNative,
          prompt: input.exercise.promptTarget,
          answer: input.exercise.answer,
          acceptable: input.exercise.acceptableAnswers.join(" | ") || "(none)",
          learnerAnswer: input.answer,
        }),
      },
    ],
    schema: GrammarExerciseFeedbackSchema,
  });
}
