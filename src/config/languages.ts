import type { CefrLevel } from "./cefr";
import { FRENCH_GRAMMAR_REFERENCE } from "./grammar/fr";

/**
 * Languages the app can teach (target) and teach from (native).
 * v1: French from German. Everything else in the code takes the pair as a parameter (§9).
 */
export const TARGET_LANGUAGES = {
  fr: {
    name: "French",
    locale: "fr-FR",
    grammarReference: FRENCH_GRAMMAR_REFERENCE,
  },
} as const satisfies Record<
  string,
  { name: string; locale: string; grammarReference: Record<CefrLevel, readonly string[]> }
>;

export const NATIVE_LANGUAGES = {
  de: { name: "German", locale: "de-DE" },
} as const satisfies Record<string, { name: string; locale: string }>;

export type TargetLanguage = keyof typeof TARGET_LANGUAGES;
export type NativeLanguage = keyof typeof NATIVE_LANGUAGES;

export type LanguagePair = { target: TargetLanguage; native: NativeLanguage };
export const DEFAULT_LANGUAGE_PAIR: LanguagePair = { target: "fr", native: "de" };
