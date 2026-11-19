import type { z } from "zod";

/**
 * Provider-neutral LLM interface (T-4). Claude is the v1 implementation;
 * other providers (OpenAI, Gemini, Mistral …) are added as further implementations
 * of this interface without touching prompts, schemas or UI.
 */

/** Every AI call names its task, so model and effort can be configured per task (T-5). */
export type AiTask =
  | "suggestScenarios"
  | "scenariosFromVocabulary"
  | "generateLesson"
  | "generateGrammarLesson"
  | "evaluateGrammarExercise"
  | "evaluateReading"
  | "evaluateSpeaking"
  | "adaptPartnerLine"
  | "conversationTurn"
  | "conversationSummary";

export type ChatMessage = { role: "user" | "assistant"; content: string };

export type GenerateRequest = {
  task: AiTask;
  system: string;
  messages: ChatMessage[];
  /** Upper bound for the reply. Defaults per task (see config.ts). */
  maxTokens?: number;
};

export type GenerateObjectRequest<S extends z.ZodType> = GenerateRequest & { schema: S };

export interface LLMProvider {
  readonly id: string;
  /** Structured output, validated against the schema (A-2). */
  generateObject<S extends z.ZodType>(req: GenerateObjectRequest<S>): Promise<z.infer<S>>;
  /** Plain text reply. */
  generateText(req: GenerateRequest): Promise<string>;
  /** Plain text reply as it is generated, for conversation latency (A-6). */
  streamText(req: GenerateRequest): AsyncIterable<string>;
}

/** The model declined to answer. Show a neutral message; do not retry blindly. */
export class AiRefusalError extends Error {
  constructor(readonly category: string | null) {
    super(`The model declined the request${category ? ` (${category})` : ""}.`);
    this.name = "AiRefusalError";
  }
}

/** The reply was cut off or did not match the schema. Safe to retry once (A-2). */
export class AiOutputError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "AiOutputError";
  }
}
