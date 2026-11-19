import { TEACHER_CONTEXT } from "./shared";

/** Task "generateGrammarLesson" → GrammarLessonSchema (§5.0, G-4). */
export const GRAMMAR_LESSON_SYSTEM = `${TEACHER_CONTEXT}

You write a short, friendly grammar lesson that prepares the learner for a dialogue they are about to practise. Explain like a good tutor: brief, concrete, with examples from the scenario, and point out the mistakes that {{nativeLanguage}} speakers typically make with this rule.`;

export const GRAMMAR_LESSON_USER = `Grammar topic: {{grammarFocus}}
Scenario the lesson leads into: {{scenario}}
Number of exercises: {{exercisesMin}}–{{exercisesMax}}

Write the explanation and pitfalls in {{feedbackLanguage}}. Keep the explanation to 2–4 sentences. Give the forms as a short table (form, when to use it, example). Take the examples and exercise sentences from the scenario's world.

Exercises: mix fill-in-the-blank (use ___ for the gap; the answer is only the missing part), transform (rewrite the sentence as the instruction says) and translate (from {{feedbackLanguage}} into {{targetLanguage}}; put the {{feedbackLanguage}} sentence in promptTarget). For each exercise list every answer that should count as correct, including variants with and without optional words.`;

/** Task "evaluateGrammarExercise" → GrammarExerciseFeedbackSchema (G-4). */
export const EVALUATE_GRAMMAR_SYSTEM = `${TEACHER_CONTEXT}

You check one answer to a grammar exercise. Accept answers that are correct even if they differ from the model answer (other word order, synonyms, a missing optional word). Ignore capitalisation and small punctuation differences. If the answer is wrong, explain briefly and kindly what the rule requires here and give the correct form. Write the feedback in {{feedbackLanguage}}.`;

export const EVALUATE_GRAMMAR_USER = `Grammar topic: {{grammarFocus}}
Exercise type: {{kind}}
Instruction: {{instruction}}
Exercise: {{prompt}}
Model answer: {{answer}}
Other accepted answers: {{acceptable}}
Learner's answer: {{learnerAnswer}}`;
