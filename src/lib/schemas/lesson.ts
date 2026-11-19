import { z } from "zod";

/**
 * Structured AI output formats (A-2). The LLM must return exactly these shapes;
 * they are validated on arrival and generation is retried once if invalid.
 * Field names are language-neutral ("target" = language being learned, "native" = user's language).
 */

export const ScenarioSuggestionSchema = z.object({
  titleTarget: z.string().describe("Short scenario title in the target language"),
  titleNative: z.string().describe("Same title in the native language"),
  category: z.enum(["shopping", "health", "travel", "work", "social", "admin", "home", "leisure"]),
  description: z.string().describe("One sentence in the native language"),
});

export const ScenarioSuggestionsSchema = z.object({
  suggestions: z.array(ScenarioSuggestionSchema),
});

export const VocabularyItemSchema = z.object({
  termTarget: z
    .string()
    .describe("Target-language term; nouns always include the article, e.g. 'la baguette'"),
  termNative: z.string().describe("Translation in the native language"),
  partOfSpeech: z.enum(["noun", "verb", "adjective", "adverb", "phrase", "other"]),
  gender: z
    .enum(["m", "f", "none"])
    .describe("Grammatical gender; set for nouns whose article hides it (l', les), else 'none'"),
  example: z.string().describe("Example sentence in the target language, taken from the dialogue"),
  note: z.string().describe("Short note (irregular plural, false friend …) or empty string"),
});

export const DialogueTurnSchema = z.object({
  speaker: z.enum(["partner", "user"]),
  textTarget: z.string().describe("The line in the target language"),
  textNative: z.string().describe("Translation in the native language"),
  cueNative: z
    .string()
    .describe("For user turns: a short situational cue in the native language for Stage 3; else empty"),
  hints: z
    .array(z.string())
    .describe(
      "For user turns: exactly 3 progressive hints: key words, then the first few words, then the full line. Empty for partner turns",
    ),
});

export const LessonContentSchema = z.object({
  scenarioTitleTarget: z.string(),
  scenarioTitleNative: z.string(),
  partnerName: z.string().describe("First name of the conversation partner"),
  partnerRole: z.string().describe("Partner's role in the target language, e.g. 'boulangère'"),
  userRole: z.string().describe("User's role in the native language, e.g. 'Kundin'"),
  register: z.enum(["formal", "informal"]),
  vocabulary: z.array(VocabularyItemSchema),
  dialogue: z.array(DialogueTurnSchema),
});

export const GrammarExerciseSchema = z.object({
  kind: z.enum(["fill_blank", "transform", "translate"]),
  promptTarget: z.string().describe("Exercise sentence; use ___ for a blank"),
  instructionNative: z.string(),
  answer: z.string(),
  acceptableAnswers: z.array(z.string()),
});

export const GrammarLessonSchema = z.object({
  title: z.string(),
  ruleExample: z.string().describe("One short model sentence in the target language showing the rule"),
  explanationNative: z.string().describe("2–4 sentences in the native language"),
  forms: z.array(
    z.object({ form: z.string(), whenNative: z.string(), example: z.string() }),
  ),
  pitfallsNative: z.array(z.string()).describe("Typical mistakes for speakers of the native language"),
  examples: z.array(z.object({ target: z.string(), native: z.string() })),
  exercises: z.array(GrammarExerciseSchema),
});

export const PronunciationFeedbackSchema = z.object({
  score: z.number().describe("Overall 0–100"),
  label: z.enum(["excellent", "good", "try_again"]),
  problemWords: z.array(z.string()).describe("Words from the target line that need work"),
  tipsNative: z.array(z.string()).describe("1–2 concrete, actionable tips in the feedback language"),
});

export const SpeakingFeedbackSchema = z.object({
  acceptable: z.boolean().describe("Meaning fits the situation, even if worded differently"),
  score: z.number().describe("Overall 0–100 before hint penalty"),
  correctedTarget: z.string().describe("Corrected version of what the user said; same as input if correct"),
  feedbackNative: z.string().describe("1–3 sentences in the feedback language"),
  grammarFocusUsedCorrectly: z.enum(["yes", "no", "not_used"]),
});

export type ScenarioSuggestion = z.infer<typeof ScenarioSuggestionSchema>;
export type VocabularyItem = z.infer<typeof VocabularyItemSchema>;
export type DialogueTurn = z.infer<typeof DialogueTurnSchema>;
export type LessonContent = z.infer<typeof LessonContentSchema>;
export type GrammarLesson = z.infer<typeof GrammarLessonSchema>;
export type PronunciationFeedback = z.infer<typeof PronunciationFeedbackSchema>;
export type SpeakingFeedback = z.infer<typeof SpeakingFeedbackSchema>;
