/** Shared helpers for external providers (LLM, speech, TTS). */

export class ProviderNotConfiguredError extends Error {
  constructor(
    readonly kind: "llm" | "speech" | "tts" | "email",
    message: string,
  ) {
    super(message);
    this.name = "ProviderNotConfiguredError";
  }
}

export function requireEnv(name: string, kind: ProviderNotConfiguredError["kind"]): string {
  const value = process.env[name];
  if (!value) throw new ProviderNotConfiguredError(kind, `Missing environment variable ${name}.`);
  return value;
}
