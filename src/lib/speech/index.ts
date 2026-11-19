import "server-only";
import { AzureSpeechProvider } from "./azure";
import type { SpeechProvider } from "./types";

export * from "./types";

/** Active speech provider, chosen by SPEECH_PROVIDER (default "azure"). */
const providers: Record<string, () => SpeechProvider> = {
  azure: () => new AzureSpeechProvider(),
};

export function getSpeech(): SpeechProvider {
  const name = process.env.SPEECH_PROVIDER ?? "azure";
  const create = providers[name];
  if (!create) throw new Error(`Unknown SPEECH_PROVIDER "${name}".`);
  return create();
}
