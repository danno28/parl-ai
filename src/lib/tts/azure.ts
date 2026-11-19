import "server-only";
import { requireEnv } from "../providers";
import type { SpeechAudio, SynthesisRequest, TTSProvider } from "./types";

/**
 * Azure neural text-to-speech over REST (T-4).
 * Needs AZURE_SPEECH_KEY and AZURE_SPEECH_REGION (same resource as speech assessment).
 * Voice per language: AZURE_TTS_VOICE_<LANG>, e.g. AZURE_TTS_VOICE_FR=fr-FR-HenriNeural.
 */
const DEFAULT_VOICES: Record<string, string> = {
  fr: "fr-FR-DeniseNeural",
};

const OUTPUT_FORMAT = "audio-24khz-48kbitrate-mono-mp3";

const escapeXml = (s: string) =>
  s.replace(/[<>&'"]/g, (c) => ({ "<": "&lt;", ">": "&gt;", "&": "&amp;", "'": "&apos;", '"': "&quot;" })[c]!);

export function voiceFor(locale: string, requested?: string): string {
  if (requested) return requested;
  const lang = locale.split("-")[0];
  const voice = process.env[`AZURE_TTS_VOICE_${lang.toUpperCase()}`] ?? DEFAULT_VOICES[lang];
  if (!voice) throw new Error(`No text-to-speech voice configured for ${locale}.`);
  return voice;
}

/** rate 1 = normal, 0.7 = 30 % slower. */
export function buildSsml(text: string, locale: string, voice: string, rate = 1): string {
  const percent = Math.round((rate - 1) * 100);
  const prosodyRate = `${percent >= 0 ? "+" : ""}${percent}%`;
  return (
    `<speak version="1.0" xmlns="http://www.w3.org/2001/10/synthesis" xml:lang="${locale}">` +
    `<voice name="${voice}"><prosody rate="${prosodyRate}">${escapeXml(text)}</prosody></voice>` +
    `</speak>`
  );
}

export class AzureTTSProvider implements TTSProvider {
  readonly id = "azure";
  private key = requireEnv("AZURE_SPEECH_KEY", "tts");
  private region = requireEnv("AZURE_SPEECH_REGION", "tts");

  async synthesize(req: SynthesisRequest): Promise<SpeechAudio> {
    const voice = voiceFor(req.locale, req.voice);
    const response = await fetch(
      `https://${this.region}.tts.speech.microsoft.com/cognitiveservices/v1`,
      {
        method: "POST",
        headers: {
          "Ocp-Apim-Subscription-Key": this.key,
          "Content-Type": "application/ssml+xml",
          "X-Microsoft-OutputFormat": OUTPUT_FORMAT,
          "User-Agent": "parl-ai",
        },
        body: buildSsml(req.text, req.locale, voice, req.rate),
      },
    );
    if (!response.ok) {
      throw new Error(`Azure text-to-speech failed (${response.status}): ${await response.text()}`);
    }
    return { data: await response.arrayBuffer(), mimeType: "audio/mpeg" };
  }

  cacheKey(req: SynthesisRequest): string {
    return [this.id, voiceFor(req.locale, req.voice), req.rate ?? 1, OUTPUT_FORMAT, req.text].join("|");
  }
}
