import { TEACHER_CONTEXT } from "./shared";

/** Task "suggestScenarios" → ScenarioSuggestionsSchema (S-1). */
export const SUGGEST_SCENARIOS_SYSTEM = `${TEACHER_CONTEXT}

You suggest everyday real-life scenarios to practise in short spoken dialogues.`;

export const SUGGEST_SCENARIOS_USER = `Suggest {{count}} scenarios that suit a {{level}} learner, spread across different everyday categories (shopping, health, travel, work, social, admin, home, leisure). Make them concrete and specific ("returning a jacket that doesn't fit", not "shopping").

Do not suggest any of these, which the learner has already done:
{{completed}}`;
