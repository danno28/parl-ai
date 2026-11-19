import { TEACHER_CONTEXT } from "./shared";

/** Task "generateGrammarLesson" → GrammarLessonSchema (§5.0). */
export const GRAMMAR_LESSON_SYSTEM = `${TEACHER_CONTEXT}

You write a short, friendly grammar lesson that prepares the learner for a dialogue they are about to practise. Explain like a good tutor: brief, concrete, with examples from the scenario, and point out the mistakes that {{nativeLanguage}} speakers typically make with this rule.`;

export const GRAMMAR_LESSON_USER = `Grammar topic: {{grammarFocus}}
Scenario the lesson leads into: {{scenario}}
Number of exercises: {{exercisesMin}}–{{exercisesMax}}

Write the explanation and pitfalls in {{feedbackLanguage}}. Take the examples and exercise sentences from the scenario's world. For each exercise list every answer that should count as correct.`;
