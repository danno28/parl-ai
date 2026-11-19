import "server-only";
import { AzureTTSProvider } from "./azure";
import type { TTSProvider } from "./types";

export * from "./types";

/** Active text-to-speech provider, chosen by TTS_PROVIDER (default "azure"). */
const providers: Record<string, () => TTSProvider> = {
  azure: () => new AzureTTSProvider(),
};

export function getTTS(): TTSProvider {
  const name = process.env.TTS_PROVIDER ?? "azure";
  const create = providers[name];
  if (!create) throw new Error(`Unknown TTS_PROVIDER "${name}".`);
  return create();
}
