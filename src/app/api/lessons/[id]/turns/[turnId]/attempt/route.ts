import { isLLMConfigured } from "@/lib/ai";
import { getLesson, saveAttempt } from "@/lib/data/lessons";
import {
  evaluateReading,
  evaluateSpeaking,
  feedbackFromScores,
  feedbackFromTypedText,
} from "@/lib/lessons/feedback";
import { getSpeech, NoSpeechError, type PronunciationAssessment } from "@/lib/speech";
import { ProviderNotConfiguredError } from "@/lib/providers";
import { requireSession } from "@/lib/session";
import type { SpeakingFeedback } from "@/lib/schemas/lesson";
import { DEFAULT_LANGUAGE_PAIR, TARGET_LANGUAGES } from "@/config/languages";

const MAX_AUDIO_BYTES = 1_100_000; // ~30 s of 16 kHz mono WAV
const HINT_PENALTY = 10; // points per hint used (D-4)

/**
 * One attempt at one of the learner's lines.
 * Multipart form: stage ("reading" | "speaking"), and either `audio` (16 kHz mono WAV) or `text`
 * (typed fallback, R-7). Speaking also takes `hintsUsed` and `partnerLine` (the partner line as
 * actually shown, which may have been adapted). Recordings are never stored (P-5).
 */
export async function POST(request: Request, ctx: RouteContext<"/api/lessons/[id]/turns/[turnId]/attempt">) {
  const { session, unauthorized } = await requireSession();
  if (unauthorized) return unauthorized;
  const { id, turnId } = await ctx.params;

  const lesson = await getLesson(id, session.user.id);
  const turnIndex = lesson?.turns.findIndex((t) => t.id === turnId) ?? -1;
  const turn = lesson?.turns[turnIndex];
  if (!lesson || !turn || turn.speaker !== "user") {
    return Response.json({ error: "NOT_FOUND" }, { status: 404 });
  }

  const form = await request.formData().catch(() => null);
  const stage = form?.get("stage");
  const audio = form?.get("audio");
  const text = form?.get("text");
  const hintsUsed = Math.min(3, Math.max(0, Number(form?.get("hintsUsed") ?? 0) || 0));
  const partnerLine = form?.get("partnerLine");
  if ((stage !== "reading" && stage !== "speaking") || (!(audio instanceof Blob) && typeof text !== "string")) {
    return Response.json({ error: "BAD_REQUEST" }, { status: 400 });
  }
  if (audio instanceof Blob && audio.size > MAX_AUDIO_BYTES) {
    return Response.json({ error: "TOO_LONG" }, { status: 413 });
  }

  const languages = DEFAULT_LANGUAGE_PAIR;
  const locale = TARGET_LANGUAGES[languages.target].locale;
  const inputKind = audio instanceof Blob ? "voice" : "text";

  try {
    if (stage === "reading") {
      let assessment: PronunciationAssessment | null = null;
      let feedback;
      if (audio instanceof Blob) {
        assessment = await getSpeech().assessPronunciation(
          { data: await audio.arrayBuffer(), mimeType: audio.type },
          turn.textTarget,
          locale,
        );
        feedback = feedbackFromScores(assessment);
        if (isLLMConfigured()) {
          try {
            feedback = await evaluateReading({ languages, level: lesson.level, targetLine: turn.textTarget, assessment });
          } catch (error) {
            console.error("Reading feedback from the LLM failed; using scores only.", error);
          }
        }
      } else {
        feedback = feedbackFromTypedText(turn.textTarget, String(text));
      }
      await saveAttempt({
        userId: session.user.id,
        lessonId: lesson.id,
        turnId: turn.id,
        stage: "reading",
        transcript: assessment?.transcript ?? String(text ?? ""),
        scores: assessment
          ? { overall: feedback.score, accuracy: assessment.accuracy, fluency: assessment.fluency, completeness: assessment.completeness }
          : { overall: feedback.score },
        hintsUsed: 0,
        feedback,
        input: inputKind,
      });
      return Response.json({ feedback, transcript: assessment?.transcript ?? null });
    }

    // Stage 3: free answer from memory.
    const transcript =
      audio instanceof Blob
        ? (await getSpeech().transcribe({ data: await audio.arrayBuffer(), mimeType: audio.type }, locale)).transcript
        : String(text).trim();
    if (!transcript) return Response.json({ error: "NO_SPEECH" }, { status: 422 });

    const nextPartner = lesson.turns.slice(turnIndex + 1).find((t) => t.speaker === "partner" ) ;
    const nextIsImmediate = lesson.turns[turnIndex + 1]?.speaker === "partner";
    const history = lesson.turns.slice(0, turnIndex).map((t, i, all) => ({
      speaker: t.speaker === "partner" ? lesson.partnerName || "Partner" : "Learner",
      text:
        i === all.length - 1 && t.speaker === "partner" && typeof partnerLine === "string" && partnerLine
          ? partnerLine
          : t.textTarget,
    }));

    let feedback: SpeakingFeedback;
    if (isLLMConfigured()) {
      feedback = await evaluateSpeaking({
        languages,
        level: lesson.level,
        history,
        cue: turn.cueNative,
        scriptedLine: turn.textTarget,
        grammarFocus: lesson.grammarFocus ?? "",
        transcript,
        assessment: null,
        nextPartnerLine: nextIsImmediate && nextPartner ? nextPartner.textTarget : "",
      });
    } else {
      // Without the AI, meaning can't be judged: compare with the script as a rough guide.
      const rough = feedbackFromTypedText(turn.textTarget, transcript);
      feedback = {
        acceptable: rough.score >= 70,
        score: rough.score,
        correctedTarget: turn.textTarget,
        feedbackNative: "Ohne KI-Bewertung: Vergleich mit dem Skript.",
        grammarFocusUsedCorrectly: "not_used",
        nextPartnerLineTarget: nextIsImmediate && nextPartner ? nextPartner.textTarget : "",
        nextPartnerLineNative: nextIsImmediate && nextPartner ? nextPartner.textNative : "",
      };
    }

    const overall = Math.max(0, Math.round(feedback.score) - hintsUsed * HINT_PENALTY);
    await saveAttempt({
      userId: session.user.id,
      lessonId: lesson.id,
      turnId: turn.id,
      stage: "speaking",
      transcript,
      scores: { overall, raw: Math.round(feedback.score) },
      hintsUsed,
      feedback,
      input: inputKind,
    });
    return Response.json({ feedback, transcript, overall, hintsUsed });
  } catch (error) {
    if (error instanceof NoSpeechError) return Response.json({ error: "NO_SPEECH" }, { status: 422 });
    if (error instanceof ProviderNotConfiguredError) {
      return Response.json({ error: "SPEECH_NOT_CONFIGURED" }, { status: 503 });
    }
    console.error("Attempt failed", error);
    return Response.json({ error: "ATTEMPT_FAILED" }, { status: 502 });
  }
}
