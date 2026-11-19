import "server-only";
import { ProviderNotConfiguredError, requireEnv } from "../providers";
import type { SpeechAudio, SynthesisRequest, TTSProvider } from "./types";

/**
 * Azure neural text-to-speech (T-4). Not implemented yet.
 * Needs AZURE_SPEECH_KEY and AZURE_SPEECH_REGION (same resource as speech assessment).
 */
export class AzureTTSProvider implements TTSProvider {
  readonly id = "azure";
  private key = requireEnv("AZURE_SPEECH_KEY", "tts");
  private region = requireEnv("AZURE_SPEECH_REGION", "tts");

  async synthesize(_req: SynthesisRequest): Promise<SpeechAudio> {
    throw new ProviderNotConfiguredError("tts", "Azure text-to-speech is not implemented yet.");
  }
}
