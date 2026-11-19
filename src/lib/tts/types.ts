/** Text-to-speech (T-4). v1 implementation: Azure neural voices, cached per sentence. */

export type SpeechAudio = { data: ArrayBuffer; mimeType: string };

export type SynthesisRequest = {
  text: string;
  locale: string;
  /** Provider voice id; each provider picks a natural default per locale. */
  voice?: string;
  /** 1 = normal. The "slow" button uses about 0.7. */
  rate?: number;
};

export interface TTSProvider {
  readonly id: string;
  synthesize(req: SynthesisRequest): Promise<SpeechAudio>;
  /** Identifies one rendering (provider, voice, rate, format, text) for the cache. */
  cacheKey(req: SynthesisRequest): string;
}
