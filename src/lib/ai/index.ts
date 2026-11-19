import "server-only";
import type { z } from "zod";
import { ClaudeProvider } from "./providers/claude";
import { AiOutputError, type GenerateObjectRequest, type LLMProvider } from "./types";

export * from "./types";

/**
 * The active LLM provider, chosen by configuration (T-4):
 *   LLM_PROVIDER=claude   (default; the only implementation in v1)
 * To add a provider: implement LLMProvider in ./providers/<name>.ts and register it here.
 */
const providers: Record<string, () => LLMProvider> = {
  claude: () => new ClaudeProvider(),
};

let instance: LLMProvider | undefined;

export function getLLM(): LLMProvider {
  if (!instance) {
    const name = process.env.LLM_PROVIDER ?? "claude";
    const create = providers[name];
    if (!create) throw new Error(`Unknown LLM_PROVIDER "${name}".`);
    instance = create();
  }
  return instance;
}

/**
 * Whether the active provider has credentials. For Claude: an API key or auth token in the
 * environment. (An `ant auth login` profile also works but cannot be detected here.)
 */
export function isLLMConfigured(): boolean {
  const name = process.env.LLM_PROVIDER ?? "claude";
  if (name !== "claude") return true;
  return Boolean(process.env.ANTHROPIC_API_KEY || process.env.ANTHROPIC_AUTH_TOKEN);
}

/** Structured generation with one automatic retry on invalid or cut-off output (A-2). */
export async function generateValidated<S extends z.ZodType>(
  req: GenerateObjectRequest<S>,
): Promise<z.infer<S>> {
  const llm = getLLM();
  try {
    return await llm.generateObject(req);
  } catch (error) {
    if (error instanceof AiOutputError) return llm.generateObject(req);
    throw error;
  }
}
