import "server-only";
import Anthropic from "@anthropic-ai/sdk";
import { betaZodOutputFormat } from "@anthropic-ai/sdk/helpers/beta/zod";
import type { z } from "zod";
import { modelFor, TASK_SETTINGS } from "../config";
import {
  AiOutputError,
  AiRefusalError,
  type GenerateObjectRequest,
  type GenerateRequest,
  type LLMProvider,
} from "../types";

/**
 * Server-side refusal fallback: if a model declines, the API re-runs the request on the
 * model Anthropic recommends for that refusal category, inside the same call.
 * Only some models accept it; others get no `fallbacks` parameter.
 */
const FALLBACK_BETA = "server-side-fallback-2026-07-01";
const MODELS_WITH_SERVER_FALLBACK = new Set([
  "claude-opus-5-5",
  "claude-opus-5",
  "claude-fable-5-2",
  "claude-fable-5-1",
  "claude-sonnet-5-5",
]);

function fallbackParams(model: string) {
  return MODELS_WITH_SERVER_FALLBACK.has(model)
    ? { betas: [FALLBACK_BETA], fallbacks: "default" as const }
    : {};
}

function checkStop(stopReason: string | null, stopDetails: { category?: string | null } | null) {
  if (stopReason === "refusal") throw new AiRefusalError(stopDetails?.category ?? null);
  if (stopReason === "max_tokens") throw new AiOutputError("Reply was cut off at max_tokens.");
}

export class ClaudeProvider implements LLMProvider {
  readonly id = "claude";
  // Credentials come from the environment (ANTHROPIC_API_KEY or an `ant auth login` profile).
  private client = new Anthropic();

  private base(req: GenerateRequest) {
    const model = modelFor(req.task);
    const settings = TASK_SETTINGS[req.task];
    return {
      model,
      max_tokens: req.maxTokens ?? settings.maxTokens,
      system: req.system,
      messages: req.messages,
      effort: settings.effort,
      ...fallbackParams(model),
    };
  }

  async generateObject<S extends z.ZodType>(req: GenerateObjectRequest<S>): Promise<z.infer<S>> {
    const { effort, ...params } = this.base(req);
    const message = await this.client.beta.messages.parse({
      ...params,
      output_config: { effort, format: betaZodOutputFormat(req.schema) },
    });
    checkStop(message.stop_reason, message.stop_details);
    if (message.parsed_output == null) {
      throw new AiOutputError("Reply did not match the expected schema.");
    }
    return message.parsed_output as z.infer<S>;
  }

  async generateText(req: GenerateRequest): Promise<string> {
    const { effort, ...params } = this.base(req);
    const message = await this.client.beta.messages.create({
      ...params,
      output_config: { effort },
    });
    checkStop(message.stop_reason, message.stop_details);
    return message.content
      .filter((block) => block.type === "text")
      .map((block) => block.text)
      .join("");
  }

  async *streamText(req: GenerateRequest): AsyncIterable<string> {
    const { effort, ...params } = this.base(req);
    const stream = this.client.beta.messages.stream({
      ...params,
      output_config: { effort },
    });
    for await (const event of stream) {
      if (event.type === "content_block_delta" && event.delta.type === "text_delta") {
        yield event.delta.text;
      }
    }
    const final = await stream.finalMessage();
    checkStop(final.stop_reason, final.stop_details);
  }
}
