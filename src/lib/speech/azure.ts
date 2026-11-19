import "server-only";
import { ProviderNotConfiguredError, requireEnv } from "../providers";
import type { AudioInput, PronunciationAssessment, SpeechProvider } from "./types";

/**
 * Azure Speech pronunciation assessment (decided in v1.0, §5.2).
 * Not implemented yet: this is the next step after project setup.
 * Needs AZURE_SPEECH_KEY and AZURE_SPEECH_REGION.
 */
export class AzureSpeechProvider implements SpeechProvider {
  readonly id = "azure";
  private key = requireEnv("AZURE_SPEECH_KEY", "speech");
  private region = requireEnv("AZURE_SPEECH_REGION", "speech");

  async assessPronunciation(
    _audio: AudioInput,
    _referenceText: string,
    _locale: string,
  ): Promise<PronunciationAssessment> {
    throw new ProviderNotConfiguredError("speech", "Azure pronunciation assessment is not implemented yet.");
  }

  async transcribe(_audio: AudioInput, _locale: string): Promise<PronunciationAssessment> {
    throw new ProviderNotConfiguredError("speech", "Azure transcription is not implemented yet.");
  }
}
