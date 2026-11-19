import "server-only";
import { generateValidated } from "@/lib/ai";
import { PronunciationFeedbackSchema, type PronunciationFeedback } from "@/lib/schemas/lesson";
import type { PronunciationAssessment } from "@/lib/speech";
import { CEFR_DESCRIPTORS, type CefrLevel } from "@/config/cefr";
import { NATIVE_LANGUAGES, TARGET_LANGUAGES, type LanguagePair } from "@/config/languages";
import { render } from "@/prompts/render";
import { EVALUATE_READING_SYSTEM, EVALUATE_READING_USER } from "@/prompts/v1/evaluate";

/** Stage 2 feedback (R-4): the speech service's scores turned into tips by the LLM. */
export async function evaluateReading(input: {
  languages: LanguagePair;
  level: CefrLevel;
  targetLine: string;
  assessment: PronunciationAssessment;
}): Promise<PronunciationFeedback> {
  const native = NATIVE_LANGUAGES[input.languages.native].name;
  const system = render(EVALUATE_READING_SYSTEM, {
    targetLanguage: TARGET_LANGUAGES[input.languages.target].name,
    nativeLanguage: native,
    feedbackLanguage: native,
    level: input.level,
    levelDescriptor: CEFR_DESCRIPTORS[input.level],
  });
  const user = render(EVALUATE_READING_USER, {
    targetLine: input.targetLine,
    assessment: JSON.stringify(input.assessment),
  });
  return generateValidated({
    task: "evaluateReading",
    system,
    messages: [{ role: "user", content: user }],
    schema: PronunciationFeedbackSchema,
  });
}

/** Used when the LLM is unavailable: the raw scores still give useful feedback. */
export function feedbackFromScores(a: PronunciationAssessment): PronunciationFeedback {
  return {
    score: a.overall,
    label: a.overall >= 85 ? "excellent" : a.overall >= 65 ? "good" : "try_again",
    problemWords: a.words.filter((w) => w.error !== "none" || w.accuracy < 70).map((w) => w.word),
    tipsNative: [],
  };
}
