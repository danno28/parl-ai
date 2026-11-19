/**
 * Speech-to-text and pronunciation assessment (T-4, §5.2).
 * v1 implementation: Azure Speech "Pronunciation Assessment".
 * The LLM then turns these scores into human feedback; it never hears the audio itself.
 */

/** Recordings are sent as 16 kHz, 16-bit, mono WAV (what Azure's short-audio API expects). */
export type AudioInput = { data: ArrayBuffer; mimeType: string };

export type WordAssessment = {
  word: string;
  /** 0–100 */
  accuracy: number;
  error: "none" | "mispronunciation" | "omission" | "insertion";
};

export type PronunciationAssessment = {
  transcript: string;
  /** All scores 0–100. */
  overall: number;
  accuracy: number;
  fluency: number;
  completeness: number;
  words: WordAssessment[];
};

export type Transcript = { transcript: string; confidence: number };

/** Nothing intelligible was heard (silence, noise). Ask the user to try again. */
export class NoSpeechError extends Error {
  constructor(readonly status: string) {
    super(`No speech recognized (${status}).`);
    this.name = "NoSpeechError";
  }
}

export interface SpeechProvider {
  readonly id: string;
  /** Stage 2: score the recording against the line the user was asked to read. */
  assessPronunciation(
    audio: AudioInput,
    referenceText: string,
    locale: string,
  ): Promise<PronunciationAssessment>;
  /** Stages 3–4: free speech, no reference text. */
  transcribe(audio: AudioInput, locale: string): Promise<Transcript>;
}
