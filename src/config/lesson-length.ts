/** Lesson length options and target amounts (§3.1, L-1 to L-4). */
export const LESSON_LENGTHS = [5, 10, 15] as const;
export type LessonMinutes = (typeof LESSON_LENGTHS)[number];
export const DEFAULT_LESSON_MINUTES: LessonMinutes = 10;

type Range = readonly [min: number, max: number];

export type LessonSizing = {
  grammarExercises: Range;
  vocabularyItems: Range;
  dialogueTurns: Range;
  userLines: Range;
  conversationExchanges: number;
};

/**
 * Length controls how much; the CEFR level controls how hard (L-3, L-4).
 * Vocabulary (v1.5): about two thirds of the items appear in the dialogue, the rest are
 * extra scenario words (V-5), so the list can be richer than the short dialogue.
 */
export const LESSON_SIZING: Record<LessonMinutes, LessonSizing> = {
  5: {
    grammarExercises: [2, 2],
    vocabularyItems: [12, 15],
    dialogueTurns: [4, 6],
    userLines: [2, 3],
    conversationExchanges: 3,
  },
  10: {
    grammarExercises: [3, 4],
    vocabularyItems: [20, 25],
    dialogueTurns: [8, 10],
    userLines: [4, 5],
    conversationExchanges: 6,
  },
  15: {
    grammarExercises: [5, 6],
    vocabularyItems: [28, 35],
    dialogueTurns: [12, 16],
    userLines: [6, 8],
    conversationExchanges: 10,
  },
};
