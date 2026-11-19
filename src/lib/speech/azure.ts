import "server-only";
import { requireEnv } from "../providers";
import {
  NoSpeechError,
  type AudioInput,
  type PronunciationAssessment,
  type SpeechProvider,
  type Transcript,
  type WordAssessment,
} from "./types";

/**
 * Azure Speech, REST "speech to text for short audio" (max 30 s with pronunciation assessment).
 * Needs AZURE_SPEECH_KEY and AZURE_SPEECH_REGION (e.g. "westeurope").
 */

type AzureScores = {
  AccuracyScore?: number;
  FluencyScore?: number;
  CompletenessScore?: number;
  PronScore?: number;
  ErrorType?: string;
};
type AzureWord = AzureScores & { Word: string; PronunciationAssessment?: AzureScores };
type AzureNBest = AzureScores & {
  Display?: string;
  Confidence?: number;
  PronunciationAssessment?: AzureScores;
  Words?: AzureWord[];
};
type AzureResponse = {
  RecognitionStatus: string | number;
  DisplayText?: string;
  NBest?: AzureNBest[];
};

const WAV_CONTENT_TYPE = "audio/wav; codecs=audio/pcm; samplerate=16000";

const ERROR_TYPES: Record<string, WordAssessment["error"]> = {
  None: "none",
  Mispronunciation: "mispronunciation",
  Omission: "omission",
  Insertion: "insertion",
};

// The REST docs show scores flat on NBest/Words; the SDK JSON nests them under
// PronunciationAssessment. Read both so either shape works.
const scoresOf = (item: AzureNBest | AzureWord): AzureScores =>
  item.PronunciationAssessment ?? item;

const round = (n: number | undefined) => Math.round(n ?? 0);

export function parseAssessment(body: AzureResponse): PronunciationAssessment {
  const best = recognized(body);
  const s = scoresOf(best);
  return {
    transcript: best.Display ?? body.DisplayText ?? "",
    overall: round(s.PronScore),
    accuracy: round(s.AccuracyScore),
    fluency: round(s.FluencyScore),
    completeness: round(s.CompletenessScore),
    words: (best.Words ?? []).map((w) => {
      const ws = scoresOf(w);
      return {
        word: w.Word,
        accuracy: round(ws.AccuracyScore),
        error: ERROR_TYPES[ws.ErrorType ?? "None"] ?? "none",
      };
    }),
  };
}

function recognized(body: AzureResponse): AzureNBest {
  const ok = body.RecognitionStatus === "Success" || body.RecognitionStatus === 0;
  const best = body.NBest?.[0];
  if (!ok || !best) throw new NoSpeechError(String(body.RecognitionStatus));
  return best;
}

export class AzureSpeechProvider implements SpeechProvider {
  readonly id = "azure";
  private key = requireEnv("AZURE_SPEECH_KEY", "speech");
  private region = requireEnv("AZURE_SPEECH_REGION", "speech");

  private async recognize(
    audio: AudioInput,
    locale: string,
    pronunciationConfig?: object,
  ): Promise<AzureResponse> {
    const url = new URL(
      `https://${this.region}.stt.speech.microsoft.com/speech/recognition/conversation/cognitiveservices/v1`,
    );
    url.searchParams.set("language", locale);
    url.searchParams.set("format", "detailed");

    const headers: Record<string, string> = {
      "Ocp-Apim-Subscription-Key": this.key,
      "Content-Type": WAV_CONTENT_TYPE,
      Accept: "application/json",
    };
    if (pronunciationConfig) {
      headers["Pronunciation-Assessment"] = Buffer.from(
        JSON.stringify(pronunciationConfig),
        "utf8",
      ).toString("base64");
    }

    const response = await fetch(url, { method: "POST", headers, body: audio.data });
    if (!response.ok) {
      throw new Error(`Azure speech-to-text failed (${response.status}): ${await response.text()}`);
    }
    return (await response.json()) as AzureResponse;
  }

  async assessPronunciation(
    audio: AudioInput,
    referenceText: string,
    locale: string,
  ): Promise<PronunciationAssessment> {
    const body = await this.recognize(audio, locale, {
      ReferenceText: referenceText,
      GradingSystem: "HundredMark",
      Granularity: "Word",
      Dimension: "Comprehensive",
      EnableMiscue: "True",
    });
    return parseAssessment(body);
  }

  async transcribe(audio: AudioInput, locale: string): Promise<Transcript> {
    const best = recognized(await this.recognize(audio, locale));
    return { transcript: best.Display ?? "", confidence: best.Confidence ?? 0 };
  }
}
