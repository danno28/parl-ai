import { getSpeech, NoSpeechError } from "@/lib/speech";
import { evaluateReading, feedbackFromScores } from "@/lib/lessons/feedback";
import { ProviderNotConfiguredError } from "@/lib/providers";
import { requireSession } from "@/lib/session";
import { DEFAULT_LANGUAGE_PAIR, TARGET_LANGUAGES } from "@/config/languages";
import { CEFR_LEVELS, type CefrLevel } from "@/config/cefr";

/** 30 s of 16 kHz 16-bit mono WAV is about 960 KB; allow a little headroom. */
const MAX_BYTES = 1_100_000;

/**
 * Stage 2: score a recording against the line the user read aloud (R-3, R-4).
 * Body: multipart form with `audio` (16 kHz mono WAV), `referenceText`, optional `level`.
 * Recordings are processed in memory and never stored (P-5).
 */
export async function POST(request: Request) {
  const { unauthorized } = await requireSession();
  if (unauthorized) return unauthorized;

  const form = await request.formData().catch(() => null);
  const audio = form?.get("audio");
  const referenceText = form?.get("referenceText");
  const levelRaw = form?.get("level");
  if (!(audio instanceof Blob) || typeof referenceText !== "string" || !referenceText.trim()) {
    return Response.json({ error: "BAD_REQUEST" }, { status: 400 });
  }
  if (audio.size > MAX_BYTES) return Response.json({ error: "TOO_LONG" }, { status: 413 });
  const level: CefrLevel = CEFR_LEVELS.includes(levelRaw as CefrLevel) ? (levelRaw as CefrLevel) : "A2";

  const languages = DEFAULT_LANGUAGE_PAIR;
  try {
    const assessment = await getSpeech().assessPronunciation(
      { data: await audio.arrayBuffer(), mimeType: audio.type },
      referenceText,
      TARGET_LANGUAGES[languages.target].locale,
    );

    // The scores alone are useful; the LLM's tips are added when it is reachable.
    let feedback = feedbackFromScores(assessment);
    let feedbackSource: "ai" | "scores" = "scores";
    try {
      feedback = await evaluateReading({ languages, level, targetLine: referenceText, assessment });
      feedbackSource = "ai";
    } catch (error) {
      console.error("Reading feedback from the LLM failed; returning scores only.", error);
    }

    return Response.json({ assessment, feedback, feedbackSource });
  } catch (error) {
    if (error instanceof NoSpeechError) return Response.json({ error: "NO_SPEECH" }, { status: 422 });
    if (error instanceof ProviderNotConfiguredError) {
      return Response.json({ error: "SPEECH_NOT_CONFIGURED" }, { status: 503 });
    }
    console.error(error);
    return Response.json({ error: "ASSESSMENT_FAILED" }, { status: 502 });
  }
}
