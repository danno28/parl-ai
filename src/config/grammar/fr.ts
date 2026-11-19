import type { CefrLevel } from "../cefr";

/**
 * Reference grammar topics typical for each CEFR level, French (G-6).
 * This is guidance passed to the AI when it picks a lesson's grammar focus (G-2, G-3);
 * the AI still writes all grammar content and judges all answers (A-1).
 */
export const FRENCH_GRAMMAR_REFERENCE: Record<CefrLevel, readonly string[]> = {
  A1: [
    "Subject pronouns and être / avoir in the present",
    "Regular -er verbs in the present",
    "Definite and indefinite articles (le, la, les, un, une, des)",
    "Gender and number of nouns and adjectives",
    "Simple negation (ne … pas)",
    "Questions with est-ce que and intonation",
    "Possessive adjectives (mon, ma, mes …)",
    "Il y a",
    "Prepositions of place (à, dans, sur, sous, chez)",
    "Numbers, time and dates",
  ],
  A2: [
    "Partitive articles (du, de la, de l', des) and de after quantities and negation",
    "Passé composé with avoir",
    "Passé composé with être and agreement",
    "Futur proche (aller + infinitive)",
    "Reflexive verbs in the present",
    "Direct object pronouns (le, la, les)",
    "Indirect object pronouns (lui, leur)",
    "Je voudrais / polite conditional for requests",
    "Comparatives (plus … que, moins … que, aussi … que)",
    "Imperative",
    "Question words (où, quand, combien, pourquoi, comment)",
    "Pronoun y and en (basic uses)",
  ],
  B1: [
    "Imparfait vs. passé composé",
    "Futur simple",
    "Conditionnel présent",
    "Relative pronouns qui, que, où, dont",
    "Pronouns y and en (all common uses)",
    "Double object pronouns",
    "Subjonctif présent after il faut que and expressions of wish",
    "Plus-que-parfait",
    "Reported speech in the present",
    "Superlatives",
  ],
  B2: [
    "Subjonctif after emotion, doubt and conjunctions (bien que, pour que …)",
    "Conditionnel passé and hypothetical si-clauses",
    "Passive voice",
    "Reported speech in the past (concordance des temps)",
    "Gérondif and participe présent",
    "Compound relative pronouns (lequel, auquel, duquel)",
    "Connectors of cause, consequence, concession",
    "Futur antérieur",
  ],
  C1: [
    "Subjonctif passé and nuanced mood choice",
    "Nominalisation",
    "Mise en relief (c'est … qui / ce que … c'est)",
    "Register: formal vs. familiar structures",
    "Inversion in formal questions and after certain adverbs",
    "Participial and infinitive clauses",
  ],
  C2: [
    "Passé simple and literary tenses (recognition and use)",
    "Subjonctif imparfait (recognition)",
    "Stylistic inversion and emphasis",
    "Fine nuances of modal verbs and mood",
  ],
};
