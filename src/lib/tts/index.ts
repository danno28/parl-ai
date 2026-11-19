import "server-only";
import { createHash } from "node:crypto";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { AzureTTSProvider } from "./azure";
import type { SpeechAudio, SynthesisRequest, TTSProvider } from "./types";

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

/**
 * Synthesizes a sentence once and serves it from disk afterwards (T-4: cached per sentence).
 * Cache folder: TTS_CACHE_DIR (default ./.data/tts-cache). On hosts without a persistent
 * disk the cache simply starts empty after each deploy.
 */
export async function synthesizeCached(req: SynthesisRequest): Promise<SpeechAudio> {
  const tts = getTTS();
  const dir = process.env.TTS_CACHE_DIR ?? "./.data/tts-cache";
  const file = path.join(dir, `${createHash("sha256").update(tts.cacheKey(req)).digest("hex")}.mp3`);

  try {
    const cached = await readFile(file);
    return { data: cached.buffer.slice(cached.byteOffset, cached.byteOffset + cached.byteLength), mimeType: "audio/mpeg" };
  } catch {
    // Not cached yet.
  }

  const audio = await tts.synthesize(req);
  await mkdir(dir, { recursive: true });
  await writeFile(file, Buffer.from(audio.data));
  return audio;
}
