/**
 * CEFR levels and short descriptors passed to every prompt (U-3, A-3).
 * The descriptors are language-neutral; language-specific grammar lives in ./grammar/<lang>.ts.
 */
export const CEFR_LEVELS = ["A1", "A2", "B1", "B2", "C1", "C2"] as const;
export type CefrLevel = (typeof CEFR_LEVELS)[number];

export const CEFR_DESCRIPTORS: Record<CefrLevel, string> = {
  A1: "Absolute beginner. Very short, simple sentences (3–8 words). Present tense only, plus fixed polite formulas. The most frequent everyday words. One idea per sentence.",
  A2: "Elementary. Short sentences (5–12 words). Present tense, near future and simple past for common verbs. Frequent everyday vocabulary and set phrases for routine situations.",
  B1: "Intermediate. Sentences up to about 18 words with simple subordinate clauses. All common tenses including past tenses contrasted. Can express opinions and reasons simply.",
  B2: "Upper intermediate. Natural, varied sentences with subordinate clauses and connectors. Subjunctive in common uses, conditional, passive. Some idioms. Can argue and nuance.",
  C1: "Advanced. Fluent, idiomatic, register-aware language. Complex sentences, a wide vocabulary including less frequent words and idioms. Implicit meaning and nuance.",
  C2: "Mastery. Native-like precision, idiom and register, including subtle stylistic choices and rare vocabulary.",
};
