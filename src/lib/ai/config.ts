import type { AiTask } from "./types";

/**
 * Per-task AI settings (T-5). The model can be overridden in the environment:
 *   AI_MODEL                      default model for every task
 *   AI_MODEL_GENERATE_LESSON      model for one task (task name in UPPER_SNAKE_CASE)
 * Effort trades depth for latency: lesson generation is done once and cached (A-5),
 * while per-turn feedback must come back in under ~4 s (A-6).
 */
export type Effort = "low" | "medium" | "high" | "xhigh" | "max";

export const DEFAULT_MODEL = "claude-opus-5-5";

type TaskSettings = { effort: Effort; maxTokens: number };

export const TASK_SETTINGS: Record<AiTask, TaskSettings> = {
  suggestScenarios: { effort: "low", maxTokens: 4000 },
  scenariosFromVocabulary: { effort: "medium", maxTokens: 8000 },
  // Medium keeps generation near the ~20 s target (A-6); raise to "high" if quality needs it.
  generateLesson: { effort: "medium", maxTokens: 16000 },
  generateGrammarLesson: { effort: "medium", maxTokens: 12000 },
  evaluateGrammarExercise: { effort: "low", maxTokens: 2000 },
  evaluateReading: { effort: "low", maxTokens: 2000 },
  evaluateSpeaking: { effort: "low", maxTokens: 3000 },
  adaptPartnerLine: { effort: "low", maxTokens: 1000 },
  conversationTurn: { effort: "low", maxTokens: 1000 },
  conversationSummary: { effort: "medium", maxTokens: 6000 },
};

const toEnvName = (task: AiTask) =>
  `AI_MODEL_${task.replace(/([a-z])([A-Z])/g, "$1_$2").toUpperCase()}`;

export function modelFor(task: AiTask): string {
  return process.env[toEnvName(task)] ?? process.env.AI_MODEL ?? DEFAULT_MODEL;
}
