import { TEACHER_CONTEXT } from "./shared";

/** Task "generateLesson" → LessonContentSchema (§4, §5.1–5.3, §3.1). */
export const GENERATE_LESSON_SYSTEM = `${TEACHER_CONTEXT}

You write one lesson: a vocabulary list and a dialogue for a real-life scenario. The learner will first study the vocabulary, then read their lines of the dialogue aloud, then reproduce them from memory using only a short cue. So the dialogue is the heart of the lesson: it should feel like a real exchange with a real person, not a textbook.`;

export const GENERATE_LESSON_USER = `Scenario: {{scenario}}
Learner's role: {{userRole}}
Register: {{register}}
Grammar focus: {{grammarFocus}}
Lesson length: {{minutes}} minutes

Write the lesson with these amounts:
- {{vocabMin}}–{{vocabMax}} vocabulary items
- {{turnsMin}}–{{turnsMax}} dialogue turns in total, of which {{userLinesMin}}–{{userLinesMax}} are the learner's lines

Requirements:
- Every vocabulary item appears in the dialogue, and the dialogue uses no important word that is missing from the list.
- Nouns always include their article. Where the article does not show gender (l', les), set the gender field.
- Prefer useful chunks and set phrases over isolated words, especially at A1–A2.
- Use the grammar focus naturally in at least 2–3 of the learner's lines.
- The partner speaks first. Give the partner a first name and a role that fits the scenario.
- For each learner line: a short cue in {{feedbackLanguage}} that describes what to say without giving away the wording (e.g. "Order two croissants."), and exactly 3 hints that reveal progressively more: key words, then the first few words, then the full line.
- If the register is "auto", choose what is natural for the scenario.`;
