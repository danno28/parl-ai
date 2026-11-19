import "server-only";
import { generateValidated } from "@/lib/ai";
import {
  PronunciationFeedbackSchema,
  SpeakingFeedbackSchema,
  type PronunciationFeedback,
  type SpeakingFeedback,
} from "@/lib/schemas/lesson";
import type { PronunciationAssessment } from "@/lib/speech";
import { CEFR_DESCRIPTORS, type CefrLevel } from "@/config/cefr";
import { NATIVE_LANGUAGES, TARGET_LANGUAGES, type LanguagePair } from "@/config/languages";
import { render } from "@/prompts/render";
import {
  EVALUATE_READING_SYSTEM,
  EVALUATE_READING_USER,
  EVALUATE_SPEAKING_SYSTEM,
  EVALUATE_SPEAKING_USER,
} from "@/prompts/v1/evaluate";

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

/** Stage 2 feedback (R-4): the speech service's scores turned into tips by the LLM. */
export async function evaluateReading(input: {
  languages: LanguagePair;
  level: CefrLevel;
  targetLine: string;
  assessment: PronunciationAssessment;
}): Promise<PronunciationFeedback> {
  return generateValidated({
    task: "evaluateReading",
    system: render(EVALUATE_READING_SYSTEM, teacherVars(input.languages, input.level)),
    messages: [
      {
        role: "user",
        content: render(EVALUATE_READING_USER, {
          targetLine: input.targetLine,
          assessment: JSON.stringify(input.assessment),
        }),
      },
    ],
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

const normalizeWord = (w: string) =>
  w.toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "").replace(/[^a-z']/g, "");

/**
 * Stage 2 typed fallback (R-7): no microphone, so only spelling is checked,
 * word by word against the target line (accents are ignored for matching).
 */
export function feedbackFromTypedText(targetLine: string, typed: string): PronunciationFeedback {
  const target = targetLine.split(/\s+/).filter((w) => normalizeWord(w));
  const typedWords = new Set(typed.split(/\s+/).map(normalizeWord).filter(Boolean));
  const missing = target.filter((w) => !typedWords.has(normalizeWord(w)));
  const score = Math.round(((target.length - missing.length) / Math.max(1, target.length)) * 100);
  return {
    score,
    label: score >= 95 ? "excellent" : score >= 75 ? "good" : "try_again",
    problemWords: missing.map((w) => w.replace(/[^\p{L}']/gu, "")),
    tipsNative: missing.length ? [] : ["Alles richtig geschrieben."],
  };
}

/** Stage 3 (D-2, D-5, D-6, G-5): judges a free answer and adapts the partner's next line. */
export async function evaluateSpeaking(input: {
  languages: LanguagePair;
  level: CefrLevel;
  history: { speaker: string; text: string }[];
  cue: string;
  scriptedLine: string;
  grammarFocus: string;
  transcript: string;
  assessment: PronunciationAssessment | null;
  nextPartnerLine: string;
}): Promise<SpeakingFeedback> {
  return generateValidated({
    task: "evaluateSpeaking",
    system: render(EVALUATE_SPEAKING_SYSTEM, teacherVars(input.languages, input.level)),
    messages: [
      {
        role: "user",
        content: render(EVALUATE_SPEAKING_USER, {
          history: input.history.map((h) => `${h.speaker}: ${h.text}`).join("\n") || "(start)",
          cue: input.cue,
          scriptedLine: input.scriptedLine,
          grammarFocus: input.grammarFocus || "none",
          transcript: input.transcript,
          assessment: input.assessment ? JSON.stringify(input.assessment) : "",
          nextPartnerLine: input.nextPartnerLine,
        }),
      },
    ],
    schema: SpeakingFeedbackSchema,
  });
}
